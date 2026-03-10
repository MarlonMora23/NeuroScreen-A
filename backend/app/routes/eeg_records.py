from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services.eeg_record_service import EegRecordService
from app.utils.security import get_current_user
from app.tasks.eeg_tasks import process_eeg_record
from app.extensions import limiter
from app.audit.decorators import audit
from app.exceptions import ValidationError

eeg_records_bp = Blueprint("eeg_records", __name__)

@eeg_records_bp.route("/eeg-records/upload", methods=["POST"])
@limiter.limit("10 per minute")
@jwt_required()
@audit(action="create", resource="eeg_record")
def upload_eeg():
    current_user = get_current_user()

    if "file" not in request.files:
        raise ValidationError("No file part in the request")

    file = request.files["file"]
    patient_id = request.form.get("patient_id")

    if not patient_id:
        raise ValidationError("patient_id is required")

    record = EegRecordService.create_eeg_record(file, patient_id, current_user)

    # Enqueue background task passing the record ID
    process_eeg_record.delay(record["id"]) # type: ignore

    details = {
        "eeg_id": record["id"],
        "patient_id": str(patient_id),
        "filename": file.filename
    }
    return jsonify(record), 202, details


@eeg_records_bp.route("/eeg-records", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="list", resource="eeg_record")
def list_eeg_records():
    current_user = get_current_user()
    filters = {
        "patient_id": request.args.get("patient_id"),
        "status": request.args.get("status"),
    }
    records = EegRecordService.list_eeg_records(filters, current_user)

    details = {"filters": filters}
    return jsonify(records), 200, details


@eeg_records_bp.route("/eeg-records/<uuid:eeg_id>", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="get", resource="eeg_record")
def get_eeg_record(eeg_id):
    current_user = get_current_user()
    record = EegRecordService.get_eeg_record(eeg_id, current_user)

    details = {"eeg_id": str(eeg_id)}
    return jsonify(record), 200, details


@eeg_records_bp.route("/patients/<uuid:patient_id>/eeg-records", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="list", resource="eeg_record")
def list_by_patient(patient_id):
    current_user = get_current_user()
    records = EegRecordService.list_by_patient(patient_id, current_user)

    details = {"patient_id": str(patient_id)}
    return jsonify(records), 200, details


@eeg_records_bp.route("/eeg-records/<uuid:eeg_id>/status", methods=["GET"])
@limiter.limit("120 per minute")
@jwt_required()
@audit(action="get", resource="eeg_record")
def get_eeg_status(eeg_id):
    current_user = get_current_user()
    result = EegRecordService.get_eeg_status(eeg_id, current_user)
    details = {"eeg_id": str(eeg_id)}

    return jsonify(result), 200, details


@eeg_records_bp.route("/eeg-records/<uuid:eeg_record_id>/visualizations", methods=["GET"])
@limiter.limit("60 per minute")
@jwt_required()
@audit(action="get", resource="eeg_visualizations")
def get_eeg_visualizations(eeg_record_id: str):
    """
    Retorna las visualizaciones generadas para un EEG record.
    Soporta filtrado por tipo para evitar payloads grandes.

    Query params:
      - types: comma-separated list of "waveforms,topomap,channel_importance"
      - channels: comma-separated list of channel names (solo aplica a waveforms)
    """
    current_user = get_current_user()
    types = request.args.get("types", "waveforms,topomap,channel_importance")
    channels = request.args.get("channels")
    response_data = EegRecordService.get_eeg_visualizations(eeg_record_id, types, channels, current_user)

    details = {
        "eeg_record_id": str(eeg_record_id),
        "types": types,
        "channels": channels
    }
    return jsonify(response_data), 200, details


@eeg_records_bp.route("/eeg-records/<uuid:eeg_id>", methods=["DELETE"])
@limiter.limit("50 per hour")
@jwt_required()
@audit(action="delete", resource="eeg_record")
def delete_eeg_record(eeg_id):
    current_user = get_current_user()
    result = EegRecordService.delete_eeg_record(eeg_id, current_user)

    details = {
        "eeg_id": str(eeg_id),
        "patient_id": str(result.get("patient_id"))
    }
    return jsonify({"message": f"EEG record {result['id']} deleted"}), 200, details
