import os
import time
from app.extensions import db, celery
from app.ml.inference import run_inference
from app.models.eeg_record import EegRecord, EegStatus
from app.models.prediction_result import PredictionResult
from app.ml.preprocessing import build_tensor_from_parquet
from app.audit.audit import log_action
from app.models.user import User
from app.models.prediction_visualization import PredictionVisualization
from app.config import Config

@celery.task(bind=True, max_retries=3)
def process_eeg_record(self, eeg_record_id: int):
    start_time = time.time()

    eeg_record = db.session.get(EegRecord, eeg_record_id)
    if not eeg_record:
        # No tiene sentido reintentar si el registro no existe
        return {"error": f"EegRecord {eeg_record_id} not found"}

    # Get the uploader (user context)
    uploader = db.session.get(User, eeg_record.uploader_id)

    try:
        eeg_record.status = EegStatus.PROCESSING
        db.session.commit()

        X = build_tensor_from_parquet(
            parquet_path=eeg_record.file_path,
            win_size=256,
            step_size=256,
            use_bands=True
        )

        if X.size == 0:
            raise ValueError("No valid EEG samples generated from the provided file")

        # Run inference
        label, raw_prob, confidence = run_inference(X)

        prediction = PredictionResult(
            eeg_record_id=eeg_record.id,
            result=label,
            confidence=confidence,
            raw_probability=raw_prob,       
            model_version="eegnet_v1"
        )

        db.session.add(prediction)
        db.session.flush()
        
        # Crear registro en estado pending
        viz = PredictionVisualization(
            prediction_id=prediction.id,
            status="pending"
        )

        db.session.add(viz)

        eeg_record.status = EegStatus.PROCESSED
        eeg_record.processing_time_ms = int((time.time() - start_time) * 1000)
        eeg_record.error_msg = None  # limpiar errores de intentos previos

        db.session.commit()

        # Encadenar tarea de visualizaciones 
        generate_eeg_visualizations.delay(eeg_record_id, prediction.id)

        # Log successful inference
        log_action(
            action="infer",
            resource="eeg_prediction",
            details={
                "eeg_record_id": eeg_record_id,
                "patient_id": str(eeg_record.patient_id),
                "uploader_id": str(uploader.id),
                "model_version": "eegnet_v1",
                "result": label,
                "confidence": float(confidence),
                "processing_time_ms": eeg_record.processing_time_ms
            },
            status="success"
        )

        return {"eeg_record_id": eeg_record_id, "status": "processed"}

    except Exception as e:
        db.session.rollback()  # importante: revertir cualquier cambio parcial

        eeg_record.status = EegStatus.FAILED
        eeg_record.error_msg = str(e)[:500]  # limitar longitud para no llenar la BD

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

        # Log failed inference
        log_action(
            action="infer",
            resource="eeg_prediction",
            details={
                "eeg_record_id": eeg_record_id,
                "patient_id": str(eeg_record.patient_id),
                "uploader_id": str(uploader.id),
                "model_version": "eegnet_v1",
                "error": str(e)[:200]
            },
            status="failed"
        )

        raise self.retry(exc=e, countdown=30)  # reintenta tras 60s, máximo 3 veces
    
@celery.task(bind=True, max_retries=2)
def generate_eeg_visualizations(self, eeg_record_id: int, prediction_id):
    """
    Tarea separada: genera y persiste las visualizaciones.
    Fallo aquí NO afecta la predicción ya guardada.
    """
    from app.ml.visualization import (
        generate_waveforms,
        generate_channel_importance,
        generate_topomap
    )
    from app.ml.preprocessing import build_tensor_from_parquet

    eeg_record = db.session.get(EegRecord, eeg_record_id)
    if not eeg_record:
        return {"error": "EegRecord not found"}

    viz = PredictionVisualization.query.filter_by(
        prediction_id=prediction_id
    ).first()

    if viz and viz.status == "completed":
        return {"prediction_id": str(prediction_id), "status": "already_completed"}

    if not viz:
        # caso raro: no existe
        viz = PredictionVisualization(
            prediction_id=prediction_id,
            status="processing"
        )
        db.session.add(viz)
    else:
        if viz.status == "completed":
            # tarea ya ejecutada antes (idempotencia)
            return {"prediction_id": str(prediction_id), "status": "already_completed"}

        viz.status = "processing"

    db.session.commit()

    try:
        # Waveforms — lee directo del parquet, sin re-tensorizar
        waveforms = generate_waveforms(
            parquet_path=eeg_record.file_path,
            trial_index=0,
            win_size=256
        )

        # Re-tensorizar para calcular importancia
        # (liviano: solo necesitamos los datos, no el modelo)
        X = build_tensor_from_parquet(
            parquet_path=eeg_record.file_path,
            win_size=256,
            step_size=256,
            use_bands=True
        )

        importance = generate_channel_importance(X)
        topomap = generate_topomap(importance)

        viz.waveforms_data = waveforms
        viz.channel_importance_data = importance
        viz.topomap_data = topomap
        viz.status = "completed"
        db.session.commit()

        # Clean up EEG file if not configured to save (production behavior)
        # Only keep files in testing/development for validation purposes
        if not Config.SAVE_EEG_FILES and eeg_record.file_path:
            try:
                if os.path.exists(eeg_record.file_path):
                    os.remove(eeg_record.file_path)
            except Exception as e:
                # Log error but don't fail the task - data has already been processed
                print(f"Warning: Could not delete EEG file {eeg_record.file_path}: {str(e)}")

        return {"prediction_id": str(prediction_id), "status": "completed"}

    except Exception as exc:
        viz.status = "failed"
        viz.error_msg = str(exc)
        db.session.commit()
        raise self.retry(exc=exc, countdown=30)