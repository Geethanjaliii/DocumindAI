from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.classification import Classification
from app.db.models.enums import DocumentType
from app.repositories.base import BaseRepository


class ClassificationRepository(BaseRepository[Classification]):
    def __init__(self, db: Session):
        super().__init__(db, Classification)

    def create(
        self,
        *,
        document_id: UUID,
        predicted_type: DocumentType,
        confidence_score: float,
        model_name: str,
        rationale: str | None = None,
    ) -> Classification:
        classification = Classification(
            document_id=document_id,
            predicted_type=predicted_type,
            confidence_score=confidence_score,
            model_name=model_name,
            rationale=rationale,
        )
        return self.add(classification)
