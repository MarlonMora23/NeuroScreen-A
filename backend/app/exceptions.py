class AppError(Exception):
    """Base para todas las excepciones de dominio."""
    http_status: int = 500
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

class NotFoundError(AppError):
    http_status = 404

class ValidationError(AppError):
    http_status = 400

class AuthenticationError(AppError):
    http_status = 401

class PermissionError(AppError):
    http_status = 403