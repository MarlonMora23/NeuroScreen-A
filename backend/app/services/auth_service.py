from datetime import datetime, timezone, timedelta
from uuid import UUID
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.models.session import Session
from app.extensions import db
from app.exceptions import AuthenticationError
from app.config import Config

SESSION_DURATION_MINUTES = Config.SESSION_DURATION_MINUTES

class AuthService:

    @staticmethod
    def login(data: dict) -> dict:
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            raise AuthenticationError("Email and password are required")

        user = User.query.filter_by(email=email, is_deleted=False).first()

        # Same message for both cases to avoid user enumeration
        if not user or not check_password_hash(user.password_hash, password):
            raise AuthenticationError("Invalid credentials")

        # Invalidate existing sessions
        AuthService._invalidate_existing_session(user.id)

        now = datetime.now(timezone.utc)
        expiration = now + timedelta(minutes=SESSION_DURATION_MINUTES)

        token = create_access_token(identity=str(user.id))

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
                "id": str(user.id),
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
    def _invalidate_existing_session(user_id: str) -> None:
        try:
            user_uuid = UUID(str(user_id))
        except Exception:
            return
        Session.query.filter_by(
            user_id=user_uuid,
            is_active=True
        ).update({"is_active": False})
        db.session.commit()