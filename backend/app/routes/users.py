from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.user_service import UserService
from app.utils.security import get_current_user
from app.extensions import limiter
from app.audit import log_action

users_bp = Blueprint("users", __name__)

@users_bp.route("/users", methods=["POST"])
@limiter.limit("100 per hour")
@jwt_required()
def create_user():
    data = request.get_json() or {}

    try:
        current_user = get_current_user()
        user = UserService.create_user(data, current_user)
        log_action(
            action="create",
            resource="user",
            details={"user_id": user.get("id"), "email": user.get("email"), "role": user.get("role")},
            status="success"
        )
        return jsonify(user), 201
    except PermissionError as e:
        log_action(
            action="create",
            resource="user",
            details={"email": data.get("email")},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@users_bp.route("/users", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def list_users():
    try:
        current_user = get_current_user()
        users = UserService.list_users(current_user)
        log_action(
            action="list",
            resource="user",
            details={"count": len(users) if isinstance(users, list) else 0},
            status="success"
        )
        return jsonify(users), 200
    except PermissionError as e:
        log_action(
            action="list",
            resource="user",
            details={},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@users_bp.route("/users/<uuid:user_id>", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def get_user(user_id):
    try:
        current_user = get_current_user()
        user = UserService.get_user(user_id, current_user)
        log_action(
            action="view",
            resource="user",
            details={"user_id": str(user_id), "email": user.get("email")},
            status="success"
        )
        return jsonify(user), 200
    except PermissionError as e:
        log_action(
            action="view",
            resource="user",
            details={"user_id": str(user_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500

    
@users_bp.route("/users/<uuid:user_id>", methods=["PUT"])
@limiter.limit("50 per hour")
@jwt_required()
def update_user(user_id):
    data = request.get_json() or {}

    try:
        current_user = get_current_user()
        user = UserService.update_user(user_id, data, current_user)
        log_action(
            action="update",
            resource="user",
            details={"user_id": str(user_id), "email": user.get("email"), "fields_updated": list(data.keys())},
            status="success"
        )
        return jsonify(user), 200
    except PermissionError as e:
        log_action(
            action="update",
            resource="user",
            details={"user_id": str(user_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@users_bp.route("/users/<uuid:user_id>", methods=["DELETE"])
@limiter.limit("50 per hour")
@jwt_required()
def delete_user(user_id):
    try:
        current_user = get_current_user()
        user = UserService.delete_user(user_id, current_user)
        log_action(
            action="delete",
            resource="user",
            details={"user_id": str(user_id), "email": user.get("email")},
            status="success"
        )
        return jsonify({"message": f"User {user['id']} deleted"}), 200
    except PermissionError as e:
        log_action(
            action="delete",
            resource="user",
            details={"user_id": str(user_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500
