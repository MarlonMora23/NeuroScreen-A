from flask import Blueprint

api_bp = Blueprint("routes_api", __name__)

from .users import users_bp
from .auth import auth_bp
from .patients import patients_bp

api_bp.register_blueprint(users_bp)
api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(patients_bp)
