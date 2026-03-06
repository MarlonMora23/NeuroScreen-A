from app.extensions import db
from uuid import UUID
from app.models.prediction_result import PredictionResult
from app.models.eeg_record import EegRecord, EegStatus
from app.models.patient import Patient
from app.models.user import User, UserRole
from sqlalchemy.orm import joinedload

class PredictionResultService:

    @staticmethod
    def get_by_eeg_record(eeg_record_id: str, current_user: User) -> dict:
        try:
            eeg_uuid = UUID(str(eeg_record_id))
        except Exception:
            raise ValueError("EEG record not found")
        eeg = db.session.get(EegRecord, eeg_uuid)
        if not eeg or eeg.is_deleted:
            raise ValueError("EEG record not found")

        if (
            current_user.role != UserRole.ADMIN
            and eeg.uploader_id != current_user.id
        ):
            raise PermissionError("Not allowed to access this record")

        # Verify that the EEG has been processed successfully before trying to get the prediction
        if eeg.status == EegStatus.PENDING or eeg.status == EegStatus.PROCESSING:
            raise ValueError("EEG record has not been processed yet")

        if eeg.status == EegStatus.FAILED:
            raise ValueError("EEG processing failed — no prediction available")

        prediction = (
            PredictionResultService._base_prediction_query()
            .filter(PredictionResult.eeg_record_id == eeg_uuid)
            .first()
        )

        if not prediction:
            raise ValueError("Prediction result not found")

        return PredictionResultService._to_dict(prediction)


    @staticmethod
    def list_all(current_user: User) -> list:
        query = (
            PredictionResultService._base_prediction_query()
        )

        query = PredictionResultService._apply_access_filter(query, current_user)

        predictions = query.order_by(PredictionResult.created_at.desc()).all()

        return [PredictionResultService._to_dict(p) for p in predictions]
    
    @staticmethod
    def list_by_patient(patient_id: str, current_user: User) -> list:
        try:
            patient_uuid = UUID(str(patient_id))
        except Exception:
            raise ValueError("Patient not found")

        patient = db.session.get(Patient, patient_uuid)

        if not patient or patient.is_deleted:
            raise ValueError("Patient not found")

        if (
            current_user.role != UserRole.ADMIN
            and patient.created_by != current_user.id
        ):
            raise PermissionError("Not allowed to access this patient's predictions")

        query = (
            PredictionResultService._base_prediction_query()
            .filter(
                EegRecord.patient_id == patient_uuid
            )
        )

        query = PredictionResultService._apply_access_filter(query, current_user)

        predictions = query.order_by(PredictionResult.created_at.desc()).all()

        return [PredictionResultService._to_dict(p) for p in predictions]
    
    @staticmethod
    def get_by_id(prediction_id: str, current_user: User) -> dict:
        try:
            pred_uuid = UUID(str(prediction_id))
        except Exception:
            raise ValueError("Prediction not found")

        query = PredictionResultService._base_prediction_query()
        query = PredictionResultService._apply_access_filter(query, current_user)

        prediction = query.filter(PredictionResult.id == pred_uuid).first()

        if not prediction or prediction.is_deleted:
            raise ValueError("Prediction not found")

        eeg = prediction.eeg_record

        if not eeg or eeg.is_deleted:
            raise ValueError("Associated EEG record not found")

        return PredictionResultService._to_dict(prediction)

    @staticmethod
    def delete_prediction(prediction_id: str, current_user: User) -> dict:
        try:
            pred_uuid = UUID(str(prediction_id))
        except Exception:
            raise ValueError("Prediction not found")

        prediction = (
            PredictionResultService._base_prediction_query()
            .filter(PredictionResult.id == pred_uuid)
            .first()
        )

        if not prediction or prediction.is_deleted:
            raise ValueError("Prediction not found")

        # Only ADMIN can delete predictions
        if current_user.role != UserRole.ADMIN:
            raise PermissionError("Only ADMIN can delete predictions")

        prediction.soft_delete()
        db.session.commit()

        return PredictionResultService._to_dict(prediction)

    @staticmethod
    def _to_dict(prediction: PredictionResult) -> dict:
        eeg: EegRecord = prediction.eeg_record
        patient: Patient | None = eeg.patient if eeg else None

        return {
            "id": str(prediction.id),
            "eeg_record_id": str(prediction.eeg_record_id),
            "patient_identification_number": (
                patient.identification_number if patient else None
            ),
            "file_name": eeg.file_name if eeg else None,
            "result": prediction.result.value,
            "confidence": float(prediction.confidence),
            "raw_probability": (
                float(prediction.raw_probability)
                if prediction.raw_probability is not None else None
            ),
            "model_version": prediction.model_version,
            "created_at": prediction.created_at.isoformat(),
        }

    @staticmethod
    def _base_prediction_query():
        return (
            db.session.query(PredictionResult)
            .join(PredictionResult.eeg_record)
            .filter(
                PredictionResult.is_deleted == False,
                EegRecord.is_deleted == False
            )
            .options(
                joinedload(PredictionResult.eeg_record)
                .joinedload(EegRecord.patient)
            )
        )
    
    @staticmethod
    def _apply_access_filter(query, current_user: User):
        if current_user.role != UserRole.ADMIN:
            query = query.filter(EegRecord.uploader_id == current_user.id)
        return query