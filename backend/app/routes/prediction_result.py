from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.utils.security import get_current_user
from app.services.prediction_result_service import PredictionResultService
from app.extensions import limiter
from app.audit.decorators import audit

predictions_bp = Blueprint("predictions", __name__)


@predictions_bp.route("/eeg-records/<uuid:eeg_record_id>/prediction", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="view", resource="prediction")
def get_prediction_by_eeg(eeg_record_id):
    """
    Returns the prediction result associated with a specific EEG.
    Returns 404 if the EEG does not exist, is not processed, or failed.
    """
    current_user = get_current_user()
    prediction = PredictionResultService.get_by_eeg_record(
        eeg_record_id, current_user
    )

    details = {
        "prediction_id": prediction.get("id"),
        "eeg_record_id": str(eeg_record_id)
    }
    return jsonify(prediction), 200, details


@predictions_bp.route("/patients/<uuid:patient_id>/predictions", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="list", resource="prediction")
def list_predictions_by_patient(patient_id):
    """
    Complete history of a patient's predictions.
    The user only sees their own patients' predictions; the administrator sees all predictions.
    """
    current_user = get_current_user()
    predictions = PredictionResultService.list_by_patient(
        patient_id, current_user
    )

    details = {
        "patient_id": str(patient_id),
        "count": len(predictions) if isinstance(predictions, list) else 0
    }
    return jsonify(predictions), 200, details


@predictions_bp.route("/predictions", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="list_all", resource="prediction")
def list_all_predictions():
    """
    Complete history of all predictions.
    The user only sees their own predictions; the administrator sees all predictions.
    """
    current_user = get_current_user()
    predictions = PredictionResultService.list_all(current_user)

    details = {"count": len(predictions) if isinstance(predictions, list) else 0}
    return jsonify(predictions), 200, details


@predictions_bp.route("/predictions/<uuid:prediction_id>", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
@audit(action="view", resource="prediction")
def get_prediction(prediction_id):
    """
    Details of a specific prediction by its id.
    """
    current_user = get_current_user()
    prediction = PredictionResultService.get_by_id(prediction_id, current_user)

    details = {"prediction_id": str(prediction_id)}
    return jsonify(prediction), 200, details


@predictions_bp.route("/predictions/<uuid:prediction_id>", methods=["DELETE"])
@limiter.limit("50 per hour")
@jwt_required()
@audit(action="delete", resource="prediction")
def delete_prediction(prediction_id):
    """
    ADMIN only: delete a prediction (soft delete).
    """
    current_user = get_current_user()
    prediction = PredictionResultService.delete_prediction(prediction_id, current_user)

    details = {"prediction_id": str(prediction_id)}
    return jsonify(prediction), 200, details