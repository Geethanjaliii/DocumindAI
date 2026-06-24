from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.document_event import DocumentEvent
from app.db.models.enums import DocumentEventType
from app.repositories.base import BaseRepository


class DocumentEventRepository(BaseRepository[DocumentEvent]):
    def __init__(self, db: Session):
        super().__init__(db, DocumentEvent)

    def create(
        self,
        *,
        document_id: UUID,
        user_id: UUID,
        event_type: DocumentEventType,
        metadata: dict | None = None,
    ) -> DocumentEvent:
        event = DocumentEvent(
            document_id=document_id,
            user_id=user_id,
            event_type=event_type,
            metadata_=metadata,
        )
        return self.add(event)

    def list_for_document(self, document_id: UUID, user_id: UUID) -> list[DocumentEvent]:
        stmt = (
            select(DocumentEvent)
            .where(DocumentEvent.document_id == document_id, DocumentEvent.user_id == user_id)
            .order_by(DocumentEvent.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())
