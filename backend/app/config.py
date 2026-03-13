import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

    BROKER_URL = os.getenv("CELERY_BROKER_URL")
    RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")

    # CORS Configuration
    ALLOWED_ORIGINS = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    ]
    
    # CORS configuration details
    CORS_ALLOW_HEADERS = ["Content-Type", "Authorization"]
    CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_MAX_AGE = 3600

    EEG_UPLOAD_FOLDER = os.getenv("EEG_UPLOAD_FOLDER", "uploads/eeg")
    EEG_MAX_FILE_SIZE_BYTES: int = int(os.getenv("EEG_MAX_FILE_SIZE_MB", 200)) * 1024 * 1024  # Convert MB to Bytes
    SAVE_EEG_FILES = os.getenv("SAVE_EEG_FILES", "false").lower() == "true"


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-secret-key-not-for-production"
    CELERY_TASK_ALWAYS_EAGER = True   
    CELERY_TASK_EAGER_PROPAGATES = True
    BROKER_URL = "memory://"           
    RESULT_BACKEND = "cache+memory://"  
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False
    # Save EEG files during testing for validation
    SAVE_EEG_FILES = True