from datetime import datetime, timezone, timedelta
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, decode_token
from app.models.user import User
from app.models.session import Session
from app.extensions import db

SESSION_DURATION_MINUTES = 30


class AuthService:

    @staticmethod
    def login(data: dict) -> dict:
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            raise ValueError("Email and password are required")

        user = User.query.filter_by(email=email, is_deleted=False).first()

        # Same message for both cases to avoid user enumeration
        if not user or not check_password_hash(user.password_hash, password):
            raise ValueError("Invalid credentials")

        # Invalidate existing sessions
        AuthService._invalidate_existing_session(user.id)

        now = datetime.now(timezone.utc)
        expiration = now + timedelta(minutes=SESSION_DURATION_MINUTES)

        token = create_access_token(identity=user.id)

        session = Session(
            user_id=user.id,
            token=token,
            start_date=now,
            expiration_date=expiration,
            is_active=True,
        )

        user.last_login = now

        db.session.add(session)
        db.session.commit()

        return {
            "access_token": token,
            "expires_in": SESSION_DURATION_MINUTES * 60,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
            }
        }

    @staticmethod
    def logout(token: str) -> None:
        session = Session.query.filter_by(token=token, is_active=True).first()
        if session:
            session.is_active = False
            db.session.commit()

    @staticmethod
    def validate_session(token: str) -> bool:
        """
        Verifies that the session exists in the database, is active, and has not expired.
        Called by the middleware on every authenticated request.
        """
        now = datetime.now(timezone.utc)

        session = Session.query.filter_by(token=token, is_active=True).first()

        if not session:
            return False

        if now > session.expiration_date.replace(tzinfo=timezone.utc):
            session.is_active = False
            db.session.commit()
            return False

        return True

    @staticmethod
    def refresh_session(token: str) -> None:
        """
        Extends session expiration on each valid request,
        implementing 30-minute inactivity behavior.
        """
        now = datetime.now(timezone.utc)
        session = Session.query.filter_by(token=token, is_active=True).first()
        if session:
            session.expiration_date = now + timedelta(minutes=SESSION_DURATION_MINUTES)
            db.session.commit()

    @staticmethod
    def _invalidate_existing_session(user_id: int) -> None:
        Session.query.filter_by(
            user_id=user_id,
            is_active=True
        ).update({"is_active": False})
        db.session.commit()

    # Password reset helpers
    @staticmethod
    def create_password_reset_token(email: str, expires_minutes: int = 15) -> str:
        email = email.strip().lower()
        user = User.query.filter_by(email=email, is_deleted=False).first()
        # Do not reveal whether the email exists; still generate a token only if user exists
        if not user:
            # Return empty string to indicate no token created (frontend should show generic message)
            return ""

        token = create_access_token(identity=user.id, expires_delta=timedelta(minutes=expires_minutes), additional_claims={"pw_reset": True})
        return token

    @staticmethod
    def reset_password(token: str, new_password: str) -> None:
        if not token or not new_password:
            raise ValueError("Token and new password are required")

        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        try:
            decoded = decode_token(token)
        except Exception:
            raise ValueError("Invalid or expired token")

        claims = decoded.get("claims", {}) or decoded.get("_", {})
        # flask-jwt-extended stores custom claims under top-level keys
        if not decoded.get("pw_reset") and not claims.get("pw_reset"):
            raise ValueError("Invalid token")

        user_id = decoded.get("sub") or decoded.get("identity")
        if not user_id:
            raise ValueError("Invalid token payload")

        user = User.query.get(user_id)
        if not user or user.is_deleted:
            raise ValueError("User not found")

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()