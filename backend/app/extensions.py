import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, get_jwt_identity
from celery import Celery
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
celery = Celery()

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return {"message": "Invalid token"}, 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return {"message": "Missing token"}, 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {"message": "Token expired"}, 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return {"message": "Token revoked"}, 401

def get_user_or_ip():
    try:
        identity = get_jwt_identity()
        return identity if identity else get_remote_address()
    except Exception:
        return get_remote_address()
    
limiter = Limiter(
    key_func=get_user_or_ip,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv("REDIS_URL"),
)