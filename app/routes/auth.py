from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    try:
        result = AuthService.login(email, password)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401
