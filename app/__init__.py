from flask import Flask
from .config import Config
from .extensions import db, migrate
from .api import api_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.register_blueprint(api_bp, url_prefix="/api")

    db.init_app(app)
    migrate.init_app(app, db)

    from app import models

    return app
