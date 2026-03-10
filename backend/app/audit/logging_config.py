"""
Configuración centralizada para logging técnico y auditoría.

Se crean dos loggers independientes:
1. technical_logger: para errores, warnings, debug
2. audit_logger: para registrar acciones de usuario
"""

import logging
import logging.handlers
import os
from datetime import datetime


# Crear directorio de logs si no existe
LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Rutas de archivos de log
TECHNICAL_LOG_FILE = os.path.join(LOG_DIR, "technical.log")
AUDIT_LOG_FILE = os.path.join(LOG_DIR, "audit.log")


def setup_logger(
    name: str,
    log_file: str,
    level: int = logging.DEBUG,
    max_bytes: int = 10485760,  # 10 MB
    backup_count: int = 5,
) -> logging.Logger:
    """
    Configura un logger con RotatingFileHandler.
    
    Args:
        name: Nombre del logger
        log_file: Ruta del archivo de log
        level: Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        max_bytes: Tamaño máximo del archivo antes de rotar (en bytes)
        backup_count: Cantidad de archivos de backup a mantener
    
    Returns:
        Logger configurado
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Evitar duplicar handlers si ya existen
    if logger.handlers:
        return logger
    
    # Formato de logs
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # RotatingFileHandler
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger


def setup_technical_logger() -> logging.Logger:
    """
    Configura el logger técnico para errores, warnings y debug.
    """
    return setup_logger(
        name="technical",
        log_file=TECHNICAL_LOG_FILE,
        level=logging.DEBUG
    )


def setup_audit_logger() -> logging.Logger:
    """
    Configura el logger de auditoría para acciones de usuario.
    """
    return setup_logger(
        name="audit",
        log_file=AUDIT_LOG_FILE,
        level=logging.INFO
    )


# Inicializar loggers globales
technical_logger = setup_technical_logger()
audit_logger = setup_audit_logger()


# Opcional: Agregar handlers de consola en desarrollo
def add_console_handlers(debug: bool = False):
    """
    Agrega handlers de consola a ambos loggers (útil en desarrollo).
    
    Args:
        debug: Si True, muestra DEBUG y superiores; si False, solo INFO y superiores
    """
    console_level = logging.DEBUG if debug else logging.INFO
    console_formatter = logging.Formatter(
        "%(asctime)s | %(name)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S"
    )
    
    for logger in [technical_logger, audit_logger]:
        if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
            console_handler = logging.StreamHandler()
            console_handler.setLevel(console_level)
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)


def get_technical_logger() -> logging.Logger:
    """Obtiene el logger técnico."""
    return technical_logger


def get_audit_logger() -> logging.Logger:
    """Obtiene el logger de auditoría."""
    return audit_logger
