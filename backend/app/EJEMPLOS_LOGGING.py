"""
EJEMPLOS DE INTEGRACIÓN DE LOGGING Y AUDITORÍA

Este archivo muestra cómo usar los loggers técnicos y de auditoría en:
1. Rutas (routes)
2. Servicios (services)
3. Modelos (models)
4. Tareas (tasks)

COPIAR Y ADAPTAR ESTOS EJEMPLOS A TUS ARCHIVOS.
"""

# ============================================================================
# EJEMPLO 1: LOGGING EN RUTAS (routes/auth.py)
# ============================================================================

"""
from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.auth_service import AuthService
from app.extensions import limiter
from app.audit import log_action, log_auth, log_tech  # Importar los loggers

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
@limiter.limit("5 per minute; 20 per hour")
def login():
    data = request.get_json() or {}
    email = data.get("email", "").lower()
    
    try:
        result = AuthService.login(data)
        
        # LOG DE AUDITORÍA: Registrar login exitoso
        log_auth(
            event_type="login",
            user_email=email,
            success=True
        )
        
        # LOG DE AUDITORÍA: Registrar acción
        log_action(
            action="login",
            resource="user",
            details={"email": email},
            status="success"
        )
        
        return jsonify(result), 200
        
    except ValueError as e:
        # LOG DE AUDITORÍA: Registrar login fallido
        log_auth(
            event_type="login",
            user_email=email,
            success=False,
            reason=str(e)
        )
        
        # LOG TÉCNICO: Warning para login fallido
        log_tech.warning(f"Failed login attempt for {email}")
        
        return jsonify({"error": str(e)}), 401
        
    except Exception as e:
        # LOG TÉCNICO: Error con traceback
        log_tech.error(f"Error in login endpoint", {
            "email": email,
            "error_type": type(e).__name__
        })
        
        # LOG DE AUDITORÍA: Registrar error
        log_action(
            action="login",
            resource="user",
            status="failed",
            details={"error": type(e).__name__}
        )
        
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        AuthService.logout(token)
        
        # LOG DE AUDITORÍA: Logout exitoso
        log_action(
            action="logout",
            resource="user",
            status="success"
        )
        
        log_tech.info("User logged out successfully")
        
        return jsonify({"message": "Session closed successfully"}), 200
        
    except Exception as e:
        log_tech.error("Error in logout endpoint", {"error": str(e)})
        
        return jsonify({"error": "Internal server error"}), 500
"""


# ============================================================================
# EJEMPLO 2: LOGGING EN SERVICIOS (services/user_service.py)
# ============================================================================

"""
from app.audit import log_tech, log_action, log_change
from app.logging_config import get_technical_logger

technical_logger = get_technical_logger()


class UserService:
    
    @staticmethod
    def create_user(email: str, password: str, first_name: str, **kwargs) -> dict:
        try:
            log_tech.info(f"Creating user with email: {email}")
            
            # Validaciones
            if not email or not password:
                log_tech.warning(f"Invalid user data provided")
                raise ValueError("Email and password are required")
            
            # Crear usuario
            user = User(
                email=email,
                password_hash=generate_password_hash(password),
                first_name=first_name,
                **kwargs
            )
            
            db.session.add(user)
            db.session.commit()
            
            # LOG DE AUDITORÍA: Registrar creación
            log_action(
                action="create",
                resource="user",
                details={"email": email, "role": kwargs.get("role")},
                status="success",
                result=str(user.id)
            )
            
            # LOG TÉCNICO: Info
            log_tech.info(f"User created successfully", {"user_id": str(user.id), "email": email})
            
            return {"id": str(user.id), "email": user.email}
            
        except Exception as e:
            log_tech.error(f"Error creating user", {
                "email": email,
                "error": str(e)
            })
            
            log_action(
                action="create",
                resource="user",
                status="failed",
                details={"error": str(e)}
            )
            raise
    
    
    @staticmethod
    def update_user(user_id: str, **updates) -> dict:
        try:
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Registrar cambios
            changes = {}
            for key, new_value in updates.items():
                if hasattr(user, key):
                    old_value = getattr(user, key)
                    if old_value != new_value:
                        changes[key] = f"{old_value} -> {new_value}"
                    setattr(user, key, new_value)
            
            db.session.commit()
            
            # LOG DE AUDITORÍA: Registrar cambios
            log_change(
                action="update",
                resource="user",
                resource_id=user_id,
                changes=changes
            )
            
            log_tech.info(f"User updated", {"user_id": user_id, "fields": list(updates.keys())})
            
            return {"id": str(user.id), "email": user.email}
            
        except Exception as e:
            log_tech.error(f"Error updating user", {
                "user_id": user_id,
                "error": str(e)
            })
            raise


    @staticmethod
    def delete_user(user_id: str) -> bool:
        try:
            user = User.query.get(user_id)
            if not user:
                return False
            
            user.is_deleted = True
            db.session.commit()
            
            # LOG DE AUDITORÍA: Registrar eliminación
            log_action(
                action="delete",
                resource="user",
                details={"user_id": user_id, "email": user.email},
                status="success"
            )
            
            log_tech.info(f"User deleted", {"user_id": user_id, "email": user.email})
            
            return True
            
        except Exception as e:
            log_tech.error(f"Error deleting user", {
                "user_id": user_id,
                "error": str(e)
            })
            raise
"""


# ============================================================================
# EJEMPLO 3: LOGGING EN TAREAS (tasks/eeg_tasks.py)
# ============================================================================

"""
from celery_app import celery
from app.audit import log_tech, log_action
from app.logging_config import get_technical_logger

technical_logger = get_technical_logger()


@celery.task(bind=True, max_retries=3)
def process_eeg_data(self, eeg_record_id: str):
    \"\"\"Procesa datos de EEG en una tarea asíncrona.\"\"\"
    
    try:
        log_tech.info(f"Starting EEG processing", {"eeg_record_id": eeg_record_id})
        
        # Cargar datos
        eeg_record = EegRecord.query.get(eeg_record_id)
        if not eeg_record:
            raise ValueError(f"EEG record not found: {eeg_record_id}")
        
        # Procesar
        log_tech.debug(f"Loading model for inference")
        model = load_model()
        
        log_tech.debug(f"Preprocessing EEG data")
        preprocessed = preprocess(eeg_record.data)
        
        log_tech.debug(f"Running inference")
        prediction = model.predict(preprocessed)
        
        # Guardar resultado
        result = PredictionResult(
            eeg_record_id=eeg_record_id,
            prediction=prediction,
            confidence=float(prediction[0])
        )
        db.session.add(result)
        db.session.commit()
        
        # LOG DE AUDITORÍA
        log_action(
            action="process",
            resource="eeg_record",
            details={"eeg_record_id": eeg_record_id},
            status="success",
            result=str(result.id)
        )
        
        log_tech.info(f"EEG processing completed", {
            "eeg_record_id": eeg_record_id,
            "result_id": str(result.id),
            "confidence": float(prediction[0])
        })
        
        return {
            "status": "completed",
            "result_id": str(result.id)
        }
        
    except Exception as exc:
        log_tech.error(f"Error processing EEG data", {
            "eeg_record_id": eeg_record_id,
            "error": str(exc),
            "retry_count": self.request.retries
        })
        
        log_action(
            action="process",
            resource="eeg_record",
            status="failed",
            details={"error": str(exc), "retry": True}
        )
        
        # Reintentar con exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
"""


# ============================================================================
# EJEMPLO 4: LOGGING EN MODELOS (models/base.py)
# ============================================================================

"""
from datetime import datetime, timezone
from app.audit import log_tech


class BaseModel(db.Model):
    __abstract__ = True
    
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        log_tech.debug(f"Creating {self.__class__.__name__} instance")
    
    def save(self):
        try:
            db.session.add(self)
            db.session.commit()
            log_tech.debug(f"{self.__class__.__name__} saved", {"id": getattr(self, "id", None)})
        except Exception as e:
            db.session.rollback()
            log_tech.error(f"Error saving {self.__class__.__name__}", {
                "error": str(e),
                "instance": str(self)
            })
            raise
"""


# ============================================================================
# EJEMPLO 5: USANDO DECORADORES (routes/patients.py)
# ============================================================================

"""
from flask import Blueprint
from app.audit import audit_log
from app.services.patient_service import PatientService

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("/patients", methods=["POST"])
@audit_log(action="create", resource="patient")
def create_patient():
    \"\"\"Crear paciente - automáticamente registrado en audit log.\"\"\"
    data = request.get_json()
    patient = PatientService.create_patient(**data)
    return jsonify(patient), 201


@patients_bp.route("/patients/<patient_id>", methods=["GET"])
@audit_log(action="read", resource="patient")
def get_patient(patient_id):
    \"\"\"Obtener paciente - automáticamente registrado en audit log.\"\"\"
    patient = PatientService.get_patient(patient_id)
    return jsonify(patient), 200


@patients_bp.route("/patients/<patient_id>", methods=["PUT"])
@audit_log(action="update", resource="patient", include_result=True)
def update_patient(patient_id):
    \"\"\"Actualizar paciente - automáticamente registrado con resultado.\"\"\"
    data = request.get_json()
    patient = PatientService.update_patient(patient_id, **data)
    return jsonify(patient), 200
"""


# ============================================================================
# EJEMPLO 6: ACCEDER A LOS ARCHIVOS DE LOG
# ============================================================================

"""
Los logs se guardan en:
- backend/logs/technical.log  (errores, warnings, debug)
- backend/logs/audit.log       (acciones de usuarios)

Cada archivo rota cuando llega a 10 MB, manteniendo 5 backups.
Ejemplo:
- technical.log
- technical.log.1
- technical.log.2
- ...
- technical.log.5

LOGS TÉCNICOS (technical.log):
2026-03-04 10:30:45 | DEBUG    | technical | Connection pool created
2026-03-04 10:30:46 | INFO     | technical | Iniciando aplicación NeuroScreen
2026-03-04 10:31:12 | INFO     | technical | Creating user with email: user@example.com
2026-03-04 10:31:13 | WARNING  | technical | High memory usage detected | {'memory_percent': 85.5}

LOGS DE AUDITORÍA (audit.log):
2026-03-04 10:31:13 | INFO     | audit | CREATE | user | success | {'action': 'create', 'resource': 'user', 'status': 'success', 'user_id': '123e4567-e89b-12d3-a456-426614174000', 'email': None, 'ip': '127.0.0.1', 'endpoint': '/api/users', 'method': 'POST', 'details': \"{'email': 'user@example.com', 'role': 'patient'}\", 'result': '123e4567-e89b-12d3-a456-426614174001'}

2026-03-04 10:31:15 | INFO     | audit | LOGIN | user@example.com | success | IP: 127.0.0.1

2026-03-04 10:31:16 | INFO     | audit | UPDATE | user (ID: 123e4567-e89b-12d3-a456-426614174000) | Changes: {'first_name': 'John -> Juan'} | User: 123e4567-e89b-12d3-a456-426614174000
"""


# ============================================================================
# RESUMEN DE FUNCIONES DISPONIBLES
# ============================================================================

"""
LOGS TÉCNICOS (technical_logger / log_tech):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log_tech.debug(message, context=None)
    → Información detallada para diagnóstico
    → Uso: Detalles de procesamiento, valores de variables

log_tech.info(message, context=None)
    → Información general
    → Uso: Operaciones completadas, estados

log_tech.warning(message, context=None)
    → Situaciones anormales pero recuperables
    → Uso: Valores inesperados, comportamiento inusual

log_tech.error(string, context=None)
    → Errores que no detienen la ejecución
    → Uso: Excepciones capturadas, fallos en operaciones

log_tech.critical(message, context=None)
    → Errores graves que pueden detener la aplicación
    → Uso: Fallos en base de datos, recursos críticos


LOGS DE AUDITORÍA (AuditLogger):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log_action(action, resource, details=None, status="success", result=None)
    → Registra acciones generales
    → Params:
        - action: "create", "read", "update", "delete", "process", etc.
        - resource: "user", "patient", "eeg_record", etc.
        - details: contexto adicional (dict)
        - status: "success", "failed", "unauthorized"
        - result: resultado de la acción

log_auth(event_type, user_email, success, reason=None)
    → Registra eventos de autenticación
    → Params:
        - event_type: "login", "logout", "failed_login", "password_change"
        - user_email: email del usuario
        - success: True/False
        - reason: razón de fallo (si aplica)

log_change(action, resource, resource_id, changes)
    → Registra cambios de datos
    → Params:
        - action: "update", "delete"
        - resource: tipo de recurso
        - resource_id: ID del recurso
        - changes: dict {campo: "valor_viejo -> valor_nuevo"}

log_error(error, context=None, level="error")
    → Registra excepciones técnicas
    → Params:
        - error: Exception objeto
        - context: información adicional (dict)
        - level: "error", "warning", "critical"

@audit_log(action, resource, include_result=False)
    → Decorador para logging automático en rutas


INFORMACIÓN REGISTRADA AUTOMÁTICAMENTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para LOGS DE AUDITORÍA se registran automáticamente:
    - timestamp (por el logger)
    - user_id (si está autenticado)
    - email del usuario
    - IP del cliente
    - endpoint/ruta accedida
    - método HTTP
    - User-Agent del navegador

TÚ DEBES PROPORCIONAR:
    - action: qué acción se realizó
    - resource: sobre qué recurso
    - details: contexto específico (opcional)
    - status: si fue exitoso
"""
