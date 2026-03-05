from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required
from app.services.eeg_record_service import EegRecordService
from app.utils.security import get_current_user
from app.tasks.eeg_tasks import process_eeg_record
from app.extensions import limiter
from app.audit import log_action

eeg_records_bp = Blueprint("eeg_records", __name__)

@eeg_records_bp.route("/eeg-records/upload", methods=["POST"])
@limiter.limit("10 per minute")
@jwt_required()
def upload_eeg():
    try:
        current_user = get_current_user()

        if "file" not in request.files:
            return jsonify({"error": "No file part in the request"}), 400

        file = request.files["file"]
        patient_id = request.form.get("patient_id")

        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400

        record = EegRecordService.create_eeg_record(file, patient_id, current_user)

        # Enqueue background task passing the record ID
        process_eeg_record.delay(record["id"]) # type: ignore

        log_action(
            action="create",
            resource="eeg_record",
            details={
                "eeg_id": record["id"],
                "patient_id": str(patient_id),
                "filename": file.filename
            },
            status="success"
        )

        return jsonify(record), 202

    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        log_action(
            action="create",
            resource="eeg_record",
            details={"patient_id": str(patient_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500

@eeg_records_bp.route("/eeg-records", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def list_eeg_records():
    try:
        current_user = get_current_user()
        filters = {
            "patient_id": request.args.get("patient_id"),
            "status": request.args.get("status"),
        }
        records = EegRecordService.list_eeg_records(filters, current_user)
        return jsonify(records), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500

@eeg_records_bp.route("/eeg-records/<uuid:eeg_id>", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def get_eeg_record(eeg_id):
    try:
        current_user = get_current_user()
        record = EegRecordService.get_eeg_record(eeg_id, current_user)
        return jsonify(record), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500

@eeg_records_bp.route("/patients/<uuid:patient_id>/eeg-records", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def list_by_patient(patient_id):
    try:
        current_user = get_current_user()
        records = EegRecordService.list_by_patient(patient_id, current_user)
        return jsonify(records), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500
    
@eeg_records_bp.route("/eeg-records/<uuid:eeg_id>/status", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def get_eeg_status(eeg_id):
    try:
        current_user = get_current_user()
        record = EegRecordService.get_eeg_record(eeg_id, current_user)
        return jsonify({"status": record.get("status")}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500
    
@eeg_records_bp.route("/eeg-records/<uuid:eeg_id>", methods=["DELETE"])
@limiter.limit("50 per hour")
@jwt_required()
def delete_eeg_record(eeg_id):
    try:
        current_user = get_current_user()
        result = EegRecordService.delete_eeg_record(eeg_id, current_user)
        log_action(
            action="delete",
            resource="eeg_record",
            details={
                "eeg_id": str(eeg_id),
                "patient_id": str(result.get("patient_id"))
            },
            status="success"
        )
        return jsonify({"message": f"EEG record {result['id']} deleted"}), 200
    except PermissionError as e:
        log_action(
            action="delete",
            resource="eeg_record",
            details={"eeg_id": str(eeg_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500
