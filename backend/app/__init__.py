from flask import Flask, jsonify, g, request
from flask_cors import CORS
from flask_limiter.errors import RateLimitExceeded
from .config import Config, TestingConfig
from .extensions import db, migrate, jwt, limiter
from app.models.user import User
from app.celery_app import create_celery
from app.utils.security import register_jwt_callbacks
from app.audit.logging_config import add_console_handlers, get_technical_logger, get_audit_logger
from app.audit.audit import log_tech


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Inicializar loggers (agregar consola en testing o debug)
    if app.debug or isinstance(config_class, type) and config_class is TestingConfig:
        add_console_handlers(debug=True)
    
    technical_logger = get_technical_logger()
    audit_logger = get_audit_logger()
    
    log_tech.info("Iniciando aplicación NeuroScreen")

    # Enable CORS with secure configuration
    CORS(app, 
         resources={r"/api/*": {
             "origins": app.config["ALLOWED_ORIGINS"],
             "allow_headers": app.config["CORS_ALLOW_HEADERS"],
             "methods": app.config["CORS_ALLOW_METHODS"],
             "supports_credentials": app.config["CORS_SUPPORTS_CREDENTIALS"],
             "max_age": app.config["CORS_MAX_AGE"]
         }})

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    # Config JWT serializer
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return str(user)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        try:
            from uuid import UUID
            user_id = UUID(identity)
        except Exception:
            user_id = identity
        return db.session.get(User, user_id)
    
    # Middleware para registrar información del usuario en g (global)
    @app.before_request
    def before_request():
        # Almacenar info del usuario en g para uso en loggers
        try:
            from flask_jwt_extended import get_jwt_identity
            user_id = get_jwt_identity()
            if user_id:
                g.user_id = user_id
                # Intentar obtener email del usuario para auditoría
                user = db.session.get(User, user_id)
                if user:
                    g.user_email = user.email
        except Exception:
            pass
    
    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit(e):
        return jsonify({
            "error": "Too many requests",
            "message": "Rate limit exceeded. Please try again later."
        }), 429
    
    register_jwt_callbacks(app)
    
    celery = create_celery(app)
    app.celery = celery # type: ignore

    from app import models
    from app.routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app


# Exportar loggers para uso en toda la aplicación
__all__ = [
    "create_app",
    "get_technical_logger",
    "get_audit_logger",
    "log_tech",
]