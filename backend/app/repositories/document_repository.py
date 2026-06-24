from datetime import datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.db.models.document import Document
from app.db.models.enums import DocumentStatus, DocumentType
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, db: Session):
        super().__init__(db, Document)

    def get_by_id_for_user(self, document_id: UUID, user_id: UUID) -> Document | None:
        stmt = (
            select(Document)
            .options(
                joinedload(Document.ocr_result),
                joinedload(Document.classification),
                joinedload(Document.extraction),
                joinedload(Document.events),
            )
            .where(Document.id == document_id, Document.user_id == user_id)
        )
        return self.db.scalar(stmt)

    def list_for_user(
        self,
        user_id: UUID,
        *,
        page: int = 1,
        limit: int = 20,
        status: DocumentStatus | None = None,
        document_type: DocumentType | None = None,
        sort: str = "created_at_desc",
    ) -> tuple[list[Document], int]:
        filters = [Document.user_id == user_id]
        if status is not None:
            filters.append(Document.status == status)
        if document_type is not None:
            filters.append(Document.document_type == document_type)

        count_stmt = select(func.count()).select_from(Document).where(*filters)
        total = self.db.scalar(count_stmt) or 0

        stmt = select(Document).where(*filters)
        if sort == "created_at_asc":
            stmt = stmt.order_by(Document.created_at.asc())
        else:
            stmt = stmt.order_by(Document.created_at.desc())

        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.scalars(stmt).all())
        return items, total

    def create(
        self,
        *,
        user_id: UUID,
        original_filename: str,
        storage_path: str,
        mime_type: str,
        file_size_bytes: int,
        file_hash_sha256: str,
        page_count: int = 1,
    ) -> Document:
        document = Document(
            user_id=user_id,
            original_filename=original_filename,
            storage_path=storage_path,
            mime_type=mime_type,
            file_size_bytes=file_size_bytes,
            file_hash_sha256=file_hash_sha256,
            page_count=page_count,
            status=DocumentStatus.UPLOADED,
        )
        return self.add(document)

    def update_status(
        self,
        document: Document,
        status: DocumentStatus,
        *,
        error_message: str | None = None,
        document_type: DocumentType | None = None,
        processed_at: datetime | None = None,
    ) -> Document:
        document.status = status
        if error_message is not None:
            document.error_message = error_message
        if document_type is not None:
            document.document_type = document_type
        if processed_at is not None:
            document.processed_at = processed_at
        self.db.flush()
        return document

    def update_duplicate_status(
        self,
        document: Document,
        *,
        is_duplicate: bool,
        original_document_id: UUID | None,
    ) -> Document:
        document.is_duplicate = is_duplicate
        document.original_document_id = original_document_id
        self.db.flush()
        return document

    def search_for_user(
        self,
        user_id: UUID,
        *,
        query: str | None = None,
        document_type: DocumentType | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        min_confidence: float | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Document], int]:
        from app.db.models.extraction import Extraction
        from app.db.models.ocr_result import OcrResult

        stmt = (
            select(Document)
            .outerjoin(OcrResult, OcrResult.document_id == Document.id)
            .outerjoin(Extraction, Extraction.document_id == Document.id)
            .where(Document.user_id == user_id)
        )

        if query:
            pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Document.original_filename.ilike(pattern),
                    OcrResult.raw_text.ilike(pattern),
                )
            )
        if document_type is not None:
            stmt = stmt.where(Document.document_type == document_type)
        if date_from is not None:
            stmt = stmt.where(Document.created_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(Document.created_at <= date_to)
        if min_confidence is not None:
            stmt = stmt.where(Extraction.overall_confidence >= min_confidence)

        stmt = stmt.distinct()

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.scalar(count_stmt) or 0

        offset = (page - 1) * limit
        items = list(
            self.db.scalars(stmt.order_by(Document.created_at.desc()).offset(offset).limit(limit)).all()
        )
        return items, total

    def count_by_user(self, user_id: UUID) -> int:
        stmt = select(func.count()).select_from(Document).where(Document.user_id == user_id)
        return self.db.scalar(stmt) or 0

    def count_by_status(self, user_id: UUID, status: DocumentStatus) -> int:
        stmt = (
            select(func.count())
            .select_from(Document)
            .where(Document.user_id == user_id, Document.status == status)
        )
        return self.db.scalar(stmt) or 0

    def count_by_type(self, user_id: UUID, document_type: DocumentType) -> int:
        stmt = (
            select(func.count())
            .select_from(Document)
            .where(Document.user_id == user_id, Document.document_type == document_type)
        )
        return self.db.scalar(stmt) or 0

    def get_recent_for_user(self, user_id: UUID, limit: int = 5) -> list[Document]:
        stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def get_avg_confidence(self, user_id: UUID) -> float | None:
        from app.db.models.extraction import Extraction

        stmt = (
            select(func.avg(Extraction.overall_confidence))
            .join(Document, Document.id == Extraction.document_id)
            .where(Document.user_id == user_id)
        )
        result = self.db.scalar(stmt)
        return float(result) if result is not None else None
