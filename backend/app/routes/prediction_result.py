from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import jwt_required
from app.utils.security import get_current_user
from app.services.prediction_result_service import PredictionResultService
from app.extensions import limiter
from app.audit import log_action

predictions_bp = Blueprint("predictions", __name__)


@predictions_bp.route("/eeg-records/<uuid:eeg_record_id>/prediction", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def get_prediction_by_eeg(eeg_record_id):
    """
    Returns the prediction result associated with a specific EEG.
    Returns 404 if the EEG does not exist, is not processed, or failed.
    """
    try:
        current_user = get_current_user()
        prediction = PredictionResultService.get_by_eeg_record(
            eeg_record_id, current_user
        )
        log_action(
            action="view",
            resource="prediction",
            details={"prediction_id": prediction.get("id"), "eeg_record_id": str(eeg_record_id)},
            status="success"
        )
        return jsonify(prediction), 200
    except PermissionError as e:
        log_action(
            action="view",
            resource="prediction",
            details={"eeg_record_id": str(eeg_record_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@predictions_bp.route("/patients/<uuid:patient_id>/predictions", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def list_predictions_by_patient(patient_id):
    """
    Complete history of a patient's predictions. 
    The user only sees their own patients' predictions; the administrator sees all predictions.
    """
    try:
        current_user = get_current_user()
        predictions = PredictionResultService.list_by_patient(
            patient_id, current_user
        )
        log_action(
            action="list",
            resource="prediction",
            details={"patient_id": str(patient_id), "count": len(predictions) if isinstance(predictions, list) else 0},
            status="success"
        )
        return jsonify(predictions), 200
    except PermissionError as e:
        log_action(
            action="list",
            resource="prediction",
            details={"patient_id": str(patient_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@predictions_bp.route("/predictions", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def list_all_predictions():
    """
    ADMIN only. Global view of all system predictions.
    """
    try:
        current_user = get_current_user()
        predictions = PredictionResultService.list_all(current_user)
        log_action(
            action="list_all",
            resource="prediction",
            details={"count": len(predictions) if isinstance(predictions, list) else 0},
            status="success"
        )
        return jsonify(predictions), 200
    except PermissionError as e:
        log_action(
            action="list_all",
            resource="prediction",
            details={},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@predictions_bp.route("/predictions/<uuid:prediction_id>", methods=["GET"])
@limiter.limit("100 per minute")
@jwt_required()
def get_prediction(prediction_id):
    """
    Details of a specific prediction by its id.
    """
    try:
        current_user = get_current_user()
        prediction = PredictionResultService.get_by_id(prediction_id, current_user)
        log_action(
            action="view",
            resource="prediction",
            details={"prediction_id": str(prediction_id)},
            status="success"
        )
        return jsonify(prediction), 200
    except PermissionError as e:
        log_action(
            action="view",
            resource="prediction",
            details={"prediction_id": str(prediction_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500


@predictions_bp.route("/predictions/<uuid:prediction_id>", methods=["DELETE"])
@limiter.limit("50 per hour")
@jwt_required()
def delete_prediction(prediction_id):
    """
    ADMIN only: delete a prediction (soft delete).
    """
    try:
        current_user = get_current_user()
        prediction = PredictionResultService.delete_prediction(prediction_id, current_user)
        log_action(
            action="delete",
            resource="prediction",
            details={"prediction_id": str(prediction_id)},
            status="success"
        )
        return jsonify({"message": f"Prediction {prediction['id']} deleted"}), 200
    except PermissionError as e:
        log_action(
            action="delete",
            resource="prediction",
            details={"prediction_id": str(prediction_id)},
            status="failed"
        )
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": "Internal server error"}), 500