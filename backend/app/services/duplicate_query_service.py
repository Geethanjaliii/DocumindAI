from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models.enums import DuplicateStatus
from app.repositories.duplicate_repository import DuplicateMatchRepository
from app.schemas.duplicate import DuplicateMatchResponse, DuplicateUpdateRequest


class DuplicateQueryService:
    def __init__(self, db: Session):
        self.duplicate_repo = DuplicateMatchRepository(db)

    def list_duplicates(self, user_id: UUID) -> list[DuplicateMatchResponse]:
        matches = self.duplicate_repo.list_for_user(user_id)
        return [DuplicateMatchResponse.model_validate(match) for match in matches]

    def update_status(
        self, user_id: UUID, match_id: UUID, payload: DuplicateUpdateRequest
    ) -> DuplicateMatchResponse:
        if payload.status not in {DuplicateStatus.CONFIRMED, DuplicateStatus.DISMISSED}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be confirmed or dismissed",
            )

        match = self.duplicate_repo.get_by_id_for_user(match_id, user_id)
        if match is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duplicate match not found")

        updated = self.duplicate_repo.update_status(match, payload.status)
        self.duplicate_repo.commit()
        self.duplicate_repo.refresh(updated)
        return DuplicateMatchResponse.model_validate(updated)
