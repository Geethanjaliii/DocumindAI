from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse


class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.db = db

    def register(self, payload: RegisterRequest) -> AuthResponse:
        existing = self.user_repo.get_by_email(payload.email.lower())
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = self.user_repo.create(
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
        )
        self.user_repo.commit()
        self.user_repo.refresh(user)

        token = create_access_token(str(user.id))
        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=token,
        )

    def login(self, payload: LoginRequest) -> AuthResponse:
        user = self.user_repo.get_by_email(payload.email.lower())
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        token = create_access_token(str(user.id))
        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=token,
        )

    def get_profile(self, user_id) -> UserResponse:
        user = self.user_repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return UserResponse.model_validate(user)
