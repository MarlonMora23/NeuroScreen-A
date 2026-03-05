from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.auth_service import AuthService
from app.extensions import limiter
from app.audit import log_action

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json() or {}
    email = data.get("email", "").lower()
    try:
        result = AuthService.login(data)
        log_action(
            action="login",
            resource="user",
            details={"email": email},
            status="success"
        )
        return jsonify(result), 200
    except ValueError as e:
        log_action(
            action="login",
            resource="user",
            details={"email": email, "reason": "invalid_credentials"},
            status="failed"
        )
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        current_app.logger.exception(e)
        log_action(
            action="login",
            resource="user",
            details={"email": email},
            status="failed"
        )
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    try:
        from app.utils.security import get_current_user
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        user = get_current_user()
        AuthService.logout(token)
        log_action(
            action="logout",
            resource="user",
            details={"email": user.email if user else None},
            status="success"
        )
        return jsonify({"message": "Session closed successfully"}), 200
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/auth/me", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def me():
    from app.utils.security import get_current_user
    try:
        user = get_current_user()
        return jsonify({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }), 200
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500