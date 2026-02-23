import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = 1800 # 30 minutes

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")
    
    # CORS Configuration
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8080,http://localhost:80").split(",")
    ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS]  # Remove whitespace
    
    # CORS configuration details
    CORS_ALLOW_HEADERS = ["Content-Type", "Authorization"]
    CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_MAX_AGE = 3600


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "J51FofOwnlOVwcBuzZrBWXBgCEnQNk1Xs6kLRh0jTeg"
    CELERY_TASK_ALWAYS_EAGER = True   
    CELERY_TASK_EAGER_PROPAGATES = True
    CELERY_BROKER_URL = "memory://"
    CELERY_RESULT_BACKEND = "cache+memory://"
    WTF_CSRF_ENABLED = False