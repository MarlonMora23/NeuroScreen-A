from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from app.models.user import User


class AuthService:

    @staticmethod
    def login(email: str, password: str):
        user: User = User.query.filter_by(email=email.lower()).first()

        if not user:
            raise ValueError("Invalid credentials")

        if not check_password_hash(user.password_hash, password):
            raise ValueError("Invalid credentials")

        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role.value
            }
        )

        return {
            "access_token": access_token
        }
