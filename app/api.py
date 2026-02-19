# from flask import Blueprint, request, jsonify
# from werkzeug.security import generate_password_hash
# from datetime import datetime

# from app.extensions import db
# from app.models.user import User, UserRole 
# from app.models.patient import Patient

# api_bp = Blueprint("api", __name__, url_prefix="/api")


# def user_to_dict(user: User):       
#     return {
#         "id": user.id,
#         "email": user.email,
#         "first_name": user.first_name,
#         "last_name": user.last_name,
#         "role": user.role.value,
#         "created_at": user.created_at.isoformat() if user.created_at else None,
#     }


# def patient_to_dict(patient: Patient):      
#     return {
#         "id": patient.id,
#         "identification_number": patient.identification_number,
#         "first_name": patient.first_name,
#         "last_name": patient.last_name,
#         "birth_date": patient.birth_date.isoformat() if patient.birth_date else None,
#         "created_by": patient.created_by,
#         "created_at": patient.created_at.isoformat() if patient.created_at else None,
#     }


# @api_bp.route("/users", methods=["POST"])
# def create_user():
#     data = request.get_json() or {}

#     required_fields = ["email", "password", "first_name", "last_name"]
#     missing = [f for f in required_fields if f not in data]
#     if missing:
#         return jsonify({"error": f"Faltan campos: {', '.join(missing)}"}), 400

#     email = data["email"].strip().lower()
#     if User.query.filter_by(email=email).first():
#         return jsonify({"error": "El email ya está registrado"}), 400

#     password_hash = generate_password_hash(data["password"])
#     role_str = data.get("role", "user").upper()
#     if role_str not in ("ADMIN", "USER"):
#         return jsonify({"error": "Role inválido (usa 'admin' o 'user')"}), 400
#     role = UserRole[role_str]

#     user = User(
#         email=email,
#         password_hash=password_hash,
#         first_name=data["first_name"].strip(),
#         last_name=data["last_name"].strip(),
#         role=role,
#     )
#     db.session.add(user)
#     db.session.commit()

#     return jsonify(user_to_dict(user)), 201


# @api_bp.route("/patients", methods=["POST"])
# def create_patient():
#     data = request.get_json() or {}

#     required_fields = ["identification_number", "first_name", "last_name", "created_by"]
#     missing = [f for f in required_fields if f not in data]
#     if missing:
#         return jsonify({"error": f"Faltan campos: {', '.join(missing)}"}), 400

#     # Verificar que el usuario creador existe
#     creator = User.query.get(data["created_by"])        
#     if not creator:
#         return jsonify({"error": "created_by no corresponde a un usuario válido"}), 400

#     # Birth_date opcional, formato YYYY-MM-DD
#     birth_date = None
#     if "birth_date" in data and data["birth_date"]:
#         try:
#             birth_date = datetime.strptime(data["birth_date"], "%Y-%m-%d").date()
#         except ValueError:
#             return jsonify({"error": "birth_date debe tener formato YYYY-MM-DD"}), 400

#     if Patient.query.filter_by(identification_number=data["identification_number"]).first():
#         return jsonify({"error": "identification_number ya existe"}), 400

#     patient = Patient(
#         identification_number=data["identification_number"].strip(),
#         first_name=data["first_name"].strip(),
#         last_name=data["last_name"].strip(),
#         birth_date=birth_date,
#         created_by=creator.id,
#     )
#     db.session.add(patient)
#     db.session.commit()

#     return jsonify(patient_to_dict(patient)), 201