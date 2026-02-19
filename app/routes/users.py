from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.user_service import UserService
from app.extensions import db
from app.models.user import User

users_bp = Blueprint("users", __name__)

def get_current_user():
    user_id = get_jwt_identity()
    if not user_id:
        return None

    return db.session.get(User, int(user_id))

@users_bp.route("/users", methods=["POST"])
@jwt_required()
def create_user():
    data = request.get_json() or {}

    try:
        user = UserService.create_user(data, get_current_user())
        return jsonify(user), 201
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@users_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    try:
        users = UserService.list_users(get_current_user())
        return jsonify(users), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@users_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    try:
        user = UserService.get_user(user_id, get_current_user())
        return jsonify(user), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

    
@users_bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    data = request.get_json() or {}

    try:
        user = UserService.update_user(user_id, data, get_current_user())
        return jsonify(user), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@users_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    try:
        user = UserService.delete_user(user_id, get_current_user())
        return jsonify({"message": f"User {user['id']} deleted"}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    


