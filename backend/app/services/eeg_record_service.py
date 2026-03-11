import os
import uuid
from uuid import UUID
from app.extensions import db
from app.models.eeg_record import FILE_TYPE, EegRecord, EegStatus
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.exceptions import NotFoundError, ValidationError, PermissionError
from app.config import Config

ALLOWED_EXTENSIONS = {FILE_TYPE.PARQUET: ".parquet"}

class EegRecordService:

    @staticmethod
    def create_eeg_record(file, patient_id: str, current_user: User) -> dict:
        try:
            patient_uuid = UUID(str(patient_id))
        except Exception:
            raise ValidationError("patient_id must be a valid UUID")
        patient = db.session.get(Patient, patient_uuid)
        if not patient or patient.is_deleted:
            raise ValidationError("Patient does not exist")

        if (
            current_user.role != UserRole.ADMIN
            and patient.created_by != current_user.id
        ):
            raise PermissionError("Not allowed to upload EEG for this patient")

        # Validate name and extension
        try:
            original_filename = file.filename
        except Exception:
            raise ValidationError("No file provided")
       
        ext = os.path.splitext(original_filename)[1].lower()
        allowed_exts = list(ALLOWED_EXTENSIONS.values())
        if ext not in allowed_exts:
            raise ValidationError(f"File type not allowed. Allowed: {', '.join(allowed_exts)}")

        # Determine EegFileType from the extension
        file_type = next(
            (ft for ft, e in ALLOWED_EXTENSIONS.items() if e == ext),
            None
        )

        # Validate file size (read a chunk to determine if it's empty or too large)
        file.seek(0, 2)  # Go to end of file
        file_size = file.tell()
        file.seek(0)     # Go back to start

        if file_size == 0:
            raise ValidationError("File is empty")
        if file_size > Config.EEG_MAX_FILE_SIZE_BYTES:
            raise ValidationError(f"File exceeds maximum allowed size of {Config.EEG_MAX_FILE_SIZE_BYTES // (1024*1024)} MB")

        # Generate a unique name to avoid collisions and not expose the original name
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        save_path = os.path.join(Config.EEG_UPLOAD_FOLDER, unique_filename)
        os.makedirs(Config.EEG_UPLOAD_FOLDER, exist_ok=True)
        file.save(save_path)

        record = EegRecord(
            patient_id=patient_id,
            uploader_id=current_user.id,
            file_name=original_filename,   # original name to show to users
            file_path=save_path,           # internal route, never exposed to users
            file_type=file_type,
            file_size_bytes=file_size,
            status=EegStatus.PENDING,
        )

        db.session.add(record)
        db.session.commit()

        return EegRecordService._to_dict(record)

    @staticmethod
    def list_eeg_records(filters: dict, current_user: User) -> list:
        query = EegRecord.query.filter_by(is_deleted=False)

        if current_user.role != UserRole.ADMIN:
            query = query.filter_by(uploader_id=current_user.id)

        if filters.get("patient_id"):
            try:
                patient_id = UUID(str(filters["patient_id"]))
            except (ValueError, TypeError):
                raise ValidationError("patient_id must be a valid UUID")
            query = query.filter_by(patient_id=patient_id)

        if filters.get("status"):
            try:
                status = EegStatus(filters["status"])
            except ValueError:
                valid = [s.value for s in EegStatus]
                raise ValidationError(f"Invalid status. Valid values: {', '.join(valid)}")
            query = query.filter_by(status=status)

        records = query.order_by(EegRecord.created_at.desc()).all()
        return [EegRecordService._to_dict(r) for r in records]
    
    @staticmethod
    def get_eeg_record(eeg_id: str, current_user: User) -> dict:
        try:
            eeg_uuid = UUID(str(eeg_id))
        except Exception:
            raise NotFoundError("EEG record not found")
        eeg = db.session.get(EegRecord, eeg_uuid)

        if not eeg or eeg.is_deleted:
            raise NotFoundError("EEG record not found")

        if (
            current_user.role != UserRole.ADMIN
            and eeg.uploader_id != current_user.id
        ):
            raise PermissionError("Not allowed to access this record")

        return EegRecordService._to_dict(eeg)

    @staticmethod
    def list_by_patient(patient_id: str, current_user: User) -> list:
        try:
            patient_uuid = UUID(str(patient_id))
        except Exception:
            raise NotFoundError("Patient not found")
        patient = db.session.get(Patient, patient_uuid)
        if not patient or patient.is_deleted:
            raise NotFoundError("Patient not found")

        if (
            current_user.role != UserRole.ADMIN
            and patient.created_by != current_user.id
        ):
            raise PermissionError("Not allowed to access this patient's records")

        query = (
            EegRecord.query
            .filter_by(patient_id=patient_id, is_deleted=False)
            .order_by(EegRecord.created_at.desc())
        )

        if current_user.role != UserRole.ADMIN:
            query = query.filter_by(uploader_id=current_user.id)

        return [EegRecordService._to_dict(r) for r in query.all()]
    
    @staticmethod
    def get_eeg_status(eeg_id: str, current_user: User) -> dict:
        try:
            eeg_uuid = UUID(str(eeg_id))
        except Exception:
            raise NotFoundError("EEG record not found")
        
        eeg = db.session.get(EegRecord, eeg_uuid)

        if not eeg or eeg.is_deleted:
            raise NotFoundError("EEG record not found")

        if (
            current_user.role != UserRole.ADMIN
            and eeg.uploader_id != current_user.id
        ):
            raise PermissionError("Not allowed to access this record")

        return {
            "id": eeg.id,
            "status": eeg.status.value,
            "processing_time_ms": eeg.processing_time_ms,
            "error_msg": eeg.error_msg if eeg.status == EegStatus.FAILED else None,
        }
    
    @staticmethod
    def get_eeg_visualizations(eeg_record_id: str, types: str, channels: str | None, current_user: User) -> dict:
        try:
            eeg_uuid = UUID(str(eeg_record_id))
        except Exception:
            raise NotFoundError("EEG record not found")
        
        eeg_record = db.session.get(EegRecord, eeg_uuid)

        if not eeg_record or eeg_record.is_deleted:
            raise NotFoundError("EEG record not found")

        # Verificar permisos (reutiliza tu lógica existente)
        patient = db.session.get(Patient, eeg_record.patient_id)
        if not patient or patient.is_deleted:
            raise NotFoundError("Patient not found")

        if (
            current_user.role != UserRole.ADMIN
            and patient.created_by != current_user.id
        ):
            raise PermissionError("Not allowed to access this patient's records")

        prediction = eeg_record.prediction_result  
        if not prediction or prediction.is_deleted:
            raise NotFoundError("No prediction found for this record")

        viz = prediction.visualization
        if not viz:
            return {"status": "pending", "data": None}  # No visualization yet, but prediction exists

        if viz.status in ("pending", "processing"):
            return {"status": viz.status, "data": None}  # Still being generated

        if viz.status == "failed":
            return {"status": "failed", "error_msg": viz.error_msg}  # Generation failed

        # Filtrar por tipos solicitados
        requested_types: set[str] = {t.strip() for t in types.split(",")}

        # Filtrar canales específicos de waveforms (reduce payload)
        requested_channels: set[str] | None = (set(channels.split(",")) if channels else None)

        response_data = {"status": "completed"}

        if "waveforms" in requested_types and viz.waveforms_data:
            waveforms = viz.waveforms_data
            if requested_channels:
                waveforms = {
                    **{k: v for k, v in waveforms.items() if k != "channels"},
                    "channels": {
                        ch: data for ch, data in waveforms["channels"].items()
                        if ch in requested_channels  
                    }
                }
            response_data["waveforms"] = waveforms

        if "topomap" in requested_types and viz.topomap_data:
            response_data["topomap"] = viz.topomap_data

        if "channel_importance" in requested_types and viz.channel_importance_data:
            response_data["channel_importance"] = viz.channel_importance_data

        return response_data
    
    @staticmethod
    def delete_eeg_record(eeg_id: str, current_user: User) -> dict:
        try:
            eeg_uuid = UUID(str(eeg_id))
        except Exception:
            raise NotFoundError("EEG record not found")
        eeg = db.session.get(EegRecord, eeg_uuid)

        if not eeg or eeg.is_deleted:
            raise NotFoundError("EEG record not found")

        if (
            current_user.role != UserRole.ADMIN
            and eeg.uploader_id != current_user.id
        ):
            raise PermissionError("Not allowed to delete this record")

        if eeg.status == EegStatus.PROCESSING:
            raise ValidationError("Cannot delete a record that is currently being processed")

        eeg.soft_delete()
        db.session.commit()

        return {"id": eeg.id, "status": "deleted"}

    @staticmethod
    def _to_dict(record: EegRecord) -> dict:
        return {
            "id": str(record.id),
            "patient_id": str(record.patient_id),
            "uploader_id": str(record.uploader_id),
            "file_name": record.file_name,
            "file_type": record.file_type.value,
            "file_size_bytes": record.file_size_bytes,
            "status": record.status.value,
            "error_msg": record.error_msg,
            "processing_time_ms": record.processing_time_ms,
            "created_at": record.created_at.isoformat(),
            "updated_at": record.updated_at.isoformat(),
        }