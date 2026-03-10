from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.user_service import UserService
from app.utils.security import get_current_user
from app.extensions import limiter
from app.audit.decorators import audit

users_bp = Blueprint("users", __name__)

@users_bp.route("/users", methods=["POST"])
@limiter.limit("100 per hour")
@jwt_required()
@audit(action="create", resource="user")
def create_user():
    data = request.get_json() or {}
    current_user = get_current_user()
    user = UserService.create_user(data, current_user)
    
    details = {
        "user_id": user.get("id"),
        "email": user.get("email"),
        "role": user.get("role")
    }
    return jsonify(user), 201, details


@users_bp.route("/users", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="list", resource="user")
def list_users():
    current_user = get_current_user()
    users = UserService.list_users(current_user)
    
    details = {"count": len(users) if isinstance(users, list) else 0}
    return jsonify(users), 200, details


@users_bp.route("/users/<uuid:user_id>", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="view", resource="user")
def get_user(user_id):
    current_user = get_current_user()
    user = UserService.get_user(user_id, current_user)
    
    details = {
        "user_id": str(user_id),
        "email": user.get("email")
    }
    return jsonify(user), 200, details

    
@users_bp.route("/users/<uuid:user_id>", methods=["PUT"])
@limiter.limit("50 per hour")
@jwt_required()
@audit(action="update", resource="user")
def update_user(user_id):
    data = request.get_json() or {}
    current_user = get_current_user()
    user = UserService.update_user(user_id, data, current_user)
    
    details = {
        "user_id": str(user_id),
        "email": user.get("email"),
        "fields_updated": list(data.keys())
    }
    return jsonify(user), 200, details


@users_bp.route("/users/<uuid:user_id>", methods=["DELETE"])
@limiter.limit("50 per hour")
@jwt_required()
@audit(action="delete", resource="user")
def delete_user(user_id):
    current_user = get_current_user()
    user = UserService.delete_user(user_id, current_user)
    
    details = {
        "user_id": str(user_id),
        "email": user.get("email")
    }
    return jsonify({"message": f"User {user['id']} deleted"}), 200, details
