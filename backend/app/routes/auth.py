from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.auth_service import AuthService
from app.extensions import limiter
from app.audit.decorators import audit
from app.utils.security import get_current_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
@audit(action="login", resource="user")
def login():
    data = request.get_json() or {}
    email = data.get("email", "").lower()
    result = AuthService.login(data)
    
    details = {"email": email}
    return jsonify(result), 200, details


@auth_bp.route("/auth/logout", methods=["POST"])
@jwt_required()
@audit(action="logout", resource="user")
def logout():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_current_user()
    AuthService.logout(token)
    
    details = {"email": user.email if user else None}
    return jsonify({"message": "Session closed successfully"}), 200, details


@auth_bp.route("/auth/me", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="view", resource="user")
def me():
    user = get_current_user()
    
    details = {"email": user.email if user else None}
    return jsonify({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }), 200, details

@auth_bp.route("/auth/refresh", methods=["POST"])
@jwt_required()
@audit(action="refresh_session", resource="user")
def refresh_session():
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_current_user()

    AuthService.refresh_session(token)

    details = {"email": user.email if user else None}

    return jsonify({"message": "Session refreshed"}), 200, details

@auth_bp.route("/auth/validate", methods=["GET"])
@jwt_required()
@audit(action="validate_session", resource="user")
def validate_session():

    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_current_user()

    valid = AuthService.validate_session(token)

    if not valid:
        raise ValueError("Session expired or invalid")

    details = {"email": user.email if user else None}

    return jsonify({"valid": True}), 200, details

@auth_bp.route("/auth/users/<uuid:user_id>/invalidate-session", methods=["POST"])
@jwt_required()
@audit(action="invalidate_session", resource="user")
def invalidate_user_session(user_id):
    
    admin = get_current_user()

    if admin.role.value != "admin":
        raise PermissionError("Admin privileges required")

    AuthService._invalidate_existing_session(user_id)

    details = {
        "admin_email": admin.email,
        "target_user_id": str(user_id)
    }

    return jsonify({"message": "User session invalidated"}), 200, details