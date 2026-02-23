from flask import Flask
from flask_cors import CORS
from .config import Config, TestingConfig
from .extensions import db, migrate, jwt
from app.models.user import User
from app.celery_app import create_celery
from app.utils.security import register_jwt_callbacks


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

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

    # Config JWT serializer
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return str(user)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return db.session.get(User, int(identity))
    
    register_jwt_callbacks(app)
    
    celery = create_celery(app)
    app.celery = celery

    from app import models
    from app.routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app