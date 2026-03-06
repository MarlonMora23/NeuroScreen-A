"""
Módulo de auditoría para registrar acciones de usuario y eventos del sistema.

Proporciona decoradores y funciones para registrar:
- Acciones de usuario (login, logout, crear recurso, actualizar, eliminar)
- Cambios técnicos importantes
- Errores y excepciones
"""

from functools import wraps
from typing import Optional, Any, Dict
from flask import request, g, has_request_context
from .logging_config import get_audit_logger, get_technical_logger
import traceback
import json


# Loggers
audit_logger = get_audit_logger()
technical_logger = get_technical_logger()


class AuditLogger:
    """Clase para registrar eventos de auditoría."""
    
    @staticmethod
    def get_client_info() -> Dict[str, Any]:
        """
        Obtiene información del cliente (IP, User-Agent, etc.).
        
        Returns:
            Diccionario con información del cliente
        """
        if not has_request_context():
            return {
                "ip": None,
                "user_agent": "system/celery",
                "endpoint": None,
                "method": None,
            }
        
        client_ip = request.remote_addr
        if request.headers.get("X-Forwarded-For"):
            client_ip = request.headers.get("X-Forwarded-For").split(",")[0].strip()
        
        user_agent = request.headers.get("User-Agent", "Unknown")
        
        return {
            "ip": client_ip,
            "user_agent": user_agent,
            "endpoint": request.path,
            "method": request.method,
        }
    
    @staticmethod
    def get_user_info() -> Dict[str, Any]:
        """
        Obtiene información del usuario autenticado (si existe).
        
        Returns:
            Diccionario con información del usuario
        """
        user_info = {"user_id": None, "email": None}
        
        # Intentar obtener del contexto de Flask-JWT
        if has_request_context():
            try:
                from flask_jwt_extended import get_jwt_identity
                user_identity = get_jwt_identity()
                user_info["user_id"] = str(user_identity)
            except Exception:
                pass
            
            # Intentar obtener del storage/sesión de la app
            if hasattr(g, "user_id"):
                user_info["user_id"] = str(g.user_id)
            if hasattr(g, "user_email"):
                user_info["email"] = g.user_email
        
        return user_info
    
    @staticmethod
    def log_action(
        action: str,
        resource: str,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
        result: Optional[Any] = None,
    ):
        """
        Registra una acción de usuario.
        
        Args:
            action: Tipo de acción (login, logout, create, update, delete, read)
            resource: Recurso afectado (user, patient, eeg_record, etc.)
            details: Detalles adicionales (datos enviados, cambios realizados, etc.)
            status: Estado de la acción (success, failed, unauthorized)
            result: Resultado de la acción (para auditoría)
        """
        try:
            user_info = AuditLogger.get_user_info()
            client_info = AuditLogger.get_client_info()
            
            log_entry = {
                "action": action,
                "resource": resource,
                "status": status,
                "user_id": user_info.get("user_id"),
                "email": user_info.get("email"),
                "ip": client_info.get("ip"),
                "endpoint": client_info.get("endpoint"),
                "method": client_info.get("method"),
            }
            
            if details:
                log_entry["details"] = str(details)[:500]  # Limitar a 500 caracteres
            
            if result:
                log_entry["result"] = str(result)[:200]  # Limitar a 200 caracteres
            
            message = f"{action.upper()} | {resource} | {status} | {log_entry}"
            audit_logger.info(message)
            
        except Exception as e:
            technical_logger.error(f"Error registrando acción de auditoría: {str(e)}")
    
    @staticmethod
    def log_auth_event(
        event_type: str,
        user_email: str,
        success: bool,
        reason: Optional[str] = None,
    ):
        """
        Registra eventos de autenticación.
        
        Args:
            event_type: Tipo de evento (login, logout, failed_login, password_change)
            user_email: Email del usuario
            success: Si el evento fue exitoso
            reason: Razón en caso de fallo
        """
        try:
            client_info = AuditLogger.get_client_info()
            
            status = "success" if success else "failed"
            message = f"{event_type.upper()} | {user_email} | {status}"
            
            if reason and not success:
                message += f" | Reason: {reason}"
            
            message += f" | IP: {client_info.get('ip')}"
            
            audit_logger.info(message)
            
        except Exception as e:
            technical_logger.error(f"Error registrando evento de auth: {str(e)}")
    
    @staticmethod
    def log_data_change(
        action: str,
        resource: str,
        resource_id: Any,
        changes: Dict[str, Any],
    ):
        """
        Registra cambios en datos.
        
        Args:
            action: Acción realizada (create, update, delete)
            resource: Tipo de recurso
            resource_id: ID del recurso afectado
            changes: Diccionario con cambios {campo: valores_anteriores -> valores_nuevos}
        """
        try:
            user_info = AuditLogger.get_user_info()
            
            message = (
                f"{action.upper()} | {resource} (ID: {resource_id}) | "
                f"Changes: {str(changes)[:300]} | User: {user_info.get('user_id')}"
            )
            audit_logger.info(message)
            
        except Exception as e:
            technical_logger.error(f"Error registrando cambio de datos: {str(e)}")


def audit_log(
    action: str,
    resource: str,
    include_result: bool = False,
):
    """
    Decorador para registrar automáticamente acciones en rutas.
    
    Args:
        action: Tipo de acción
        resource: Recurso afectado
        include_result: Si debe incluir el resultado en el log
    
    Ejemplo:
        @audit_log("create", "patient")
        def create_patient():
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                AuditLogger.log_action(
                    action=action,
                    resource=resource,
                    status="success",
                    result=result if include_result else None,
                )
                return result
            except Exception as e:
                AuditLogger.log_action(
                    action=action,
                    resource=resource,
                    status="failed",
                    details={"error": str(e)},
                )
                raise
        return wrapper
    return decorator


def log_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    level: str = "error",
):
    """
    Registra un error técnico con contexto opcional.
    
    Args:
        error: Excepción a registrar
        context: Contexto adicional del error
        level: Nivel de logging (error, warning, critical)
    """
    try:
        error_message = f"{type(error).__name__}: {str(error)}"
        
        if context:
            error_message += f" | Context: {str(context)[:300]}"
        
        error_message += f"\nTraceback: {traceback.format_exc()}"
        
        if level == "critical":
            technical_logger.critical(error_message)
        elif level == "warning":
            technical_logger.warning(error_message)
        else:
            technical_logger.error(error_message)
            
    except Exception as log_error:
        technical_logger.error(f"Error registrando error: {str(log_error)}")


class TechnicalLogger:
    """Clase para registrar eventos técnicos."""
    
    @staticmethod
    def debug(message: str, context: Optional[Dict[str, Any]] = None):
        """Registra un mensaje de DEBUG."""
        if context:
            message += f" | {str(context)[:300]}"
        technical_logger.debug(message)
    
    @staticmethod
    def info(message: str, context: Optional[Dict[str, Any]] = None):
        """Registra un mensaje de INFO."""
        if context:
            message += f" | {str(context)[:300]}"
        technical_logger.info(message)
    
    @staticmethod
    def warning(message: str, context: Optional[Dict[str, Any]] = None):
        """Registra un mensaje de WARNING."""
        if context:
            message += f" | {str(context)[:300]}"
        technical_logger.warning(message)
    
    @staticmethod
    def error(message: str, context: Optional[Dict[str, Any]] = None):
        """Registra un mensaje de ERROR."""
        if context:
            message += f" | {str(context)[:300]}"
        technical_logger.error(message)
    
    @staticmethod
    def critical(message: str, context: Optional[Dict[str, Any]] = None):
        """Registra un mensaje de CRITICAL."""
        if context:
            message += f" | {str(context)[:300]}"
        technical_logger.critical(message)


# Alias convenientes para uso rápido
log_action = AuditLogger.log_action
log_auth = AuditLogger.log_auth_event
log_change = AuditLogger.log_data_change
log_tech = TechnicalLogger
