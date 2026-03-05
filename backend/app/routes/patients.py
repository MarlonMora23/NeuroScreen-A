from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.security import get_current_user
from app.services.patient_service import PatientService
from app.extensions import limiter
from app.audit import log_action

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("/patients", methods=["POST"])
@limiter.limit("100 per hour")
@jwt_required()
def create_patient():
    data = request.get_json() or {}

    try:
        current_user = get_current_user()
        patient = PatientService.create_patient(data, current_user)
        log_action(
            action="create",
            resource="patient",
            details={
                "patient_id": patient.get("id"),
                "name": f"{patient.get('first_name')} {patient.get('last_name')}"
            },
            status="success"
        )
        return jsonify(patient), 201
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        log_action(
            action="create",
            resource="patient",
            details={"name": f"{data.get('first_name')} {data.get('last_name')}"},
            status="failed"
        )
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@patients_bp.route("/patients", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def list_patients():
    try:
        current_user = get_current_user()

        def str_to_bool(value):
            if value is None:
                return None
            return value.lower() in ("true", "1", "yes")

        filters = {
            "identification_number": request.args.get("identification_number"),
            "first_name": request.args.get("first_name"),
            "last_name": request.args.get("last_name"),
            "has_eeg_records": str_to_bool(request.args.get("has_eeg_records")),
            "has_pending_eeg": str_to_bool(request.args.get("has_pending_eeg")),
        }
        patients = PatientService.list_patients(filters, current_user)
        return jsonify(patients), 200
    
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@patients_bp.route("/patients/<uuid:patient_id>", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def get_patient(patient_id):
    try:
        current_user = get_current_user()
        patient = PatientService.get_patient(patient_id, current_user)
        return jsonify(patient), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@patients_bp.route("/patients/<uuid:patient_id>", methods=["PUT"])
@limiter.limit("50 per hour")
@jwt_required()
def update_patient(patient_id):
    data = request.get_json() or {}

    try:
        current_user = get_current_user()
        patient = PatientService.update_patient(
            patient_id, data, current_user
        )
        log_action(
            action="update",
            resource="patient",
            details={
                "patient_id": str(patient_id),
                "fields_updated": list(data.keys())
            },
            status="success"
        )
        return jsonify(patient), 200
    except PermissionError as e:
        log_action(
            action="update",
            resource="patient",
            details={"patient_id": str(patient_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        log_action(
            action="update",
            resource="patient",
            details={"patient_id": str(patient_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@patients_bp.route("/patients/<uuid:patient_id>", methods=["DELETE"])
@limiter.limit("50 per hour")
@jwt_required()
def delete_patient(patient_id):
    try:
        current_user = get_current_user()
        patient = PatientService.delete_patient(
            patient_id, current_user
        )
        log_action(
            action="delete",
            resource="patient",
            details={
                "patient_id": str(patient_id),
                "name": f"{patient.get('first_name')} {patient.get('last_name')}"
            },
            status="success"
        )
        return jsonify({"message": f"Patient {patient['id']} deleted"}), 200
    except PermissionError as e:
        log_action(
            action="delete",
            resource="patient",
            details={"patient_id": str(patient_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500
