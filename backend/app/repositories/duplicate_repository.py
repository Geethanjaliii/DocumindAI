from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.models.duplicate_match import DuplicateMatch
from app.db.models.enums import DuplicateMatchType, DuplicateStatus
from app.repositories.base import BaseRepository


class DuplicateMatchRepository(BaseRepository[DuplicateMatch]):
    def __init__(self, db: Session):
        super().__init__(db, DuplicateMatch)

    def get_by_id_for_user(self, match_id: UUID, user_id: UUID) -> DuplicateMatch | None:
        stmt = (
            select(DuplicateMatch)
            .options(
                joinedload(DuplicateMatch.source_document),
                joinedload(DuplicateMatch.matched_document),
            )
            .where(DuplicateMatch.id == match_id, DuplicateMatch.user_id == user_id)
        )
        return self.db.scalar(stmt)

    def list_for_user(self, user_id: UUID) -> list[DuplicateMatch]:
        stmt = (
            select(DuplicateMatch)
            .options(
                joinedload(DuplicateMatch.source_document),
                joinedload(DuplicateMatch.matched_document),
            )
            .where(DuplicateMatch.user_id == user_id)
            .order_by(DuplicateMatch.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_existing_pair(
        self, source_document_id: UUID, matched_document_id: UUID
    ) -> DuplicateMatch | None:
        first_id = min(source_document_id, matched_document_id)
        second_id = max(source_document_id, matched_document_id)
        stmt = select(DuplicateMatch).where(
            DuplicateMatch.source_document_id == first_id,
            DuplicateMatch.matched_document_id == second_id,
        )
        return self.db.scalar(stmt)

    def create(
        self,
        *,
        user_id: UUID,
        source_document_id: UUID,
        matched_document_id: UUID,
        match_type: DuplicateMatchType,
        similarity_score: float,
        match_details: dict,
        status: DuplicateStatus = DuplicateStatus.PENDING,
    ) -> DuplicateMatch:
        first_id = min(source_document_id, matched_document_id)
        second_id = max(source_document_id, matched_document_id)
        match = DuplicateMatch(
            user_id=user_id,
            source_document_id=first_id,
            matched_document_id=second_id,
            match_type=match_type,
            similarity_score=similarity_score,
            match_details=match_details,
            status=status,
        )
        return self.add(match)

    def update_status(self, match: DuplicateMatch, status: DuplicateStatus) -> DuplicateMatch:
        match.status = status
        self.db.flush()
        return match

    def count_pending_for_user(self, user_id: UUID) -> int:
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(DuplicateMatch)
            .where(
                DuplicateMatch.user_id == user_id,
                DuplicateMatch.status == DuplicateStatus.PENDING,
            )
        )
        return self.db.scalar(stmt) or 0
