from functools import wraps
from flask import current_app, jsonify
from app.audit.audit import log_action
from app.exceptions import AppError

def audit(action, resource, details_fn=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            details = {}
            try:
                response, status_code, details = func(*args, **kwargs)
                log_action(
                    action=action,
                    resource=resource,
                    details=details if details_fn is None else details_fn(details),
                    status="success"
                )
                return response, status_code

            except AppError as e:
                log_action(action=action, resource=resource, details=details, status="failed")
                return jsonify({"error": e.message}), e.http_status

            except Exception as e:
                current_app.logger.exception(e)
                log_action(action=action, resource=resource, details=details, status="failed")
                return jsonify({"error": "Internal server error"}), 500

        return wrapper
    return decorator