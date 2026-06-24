from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.enums import DocumentType
from app.repositories.document_repository import DocumentRepository
from app.schemas.dashboard import SearchResponse
from app.schemas.document import PaginationMeta


class SearchService:
    def __init__(self, db: Session):
        self.document_repo = DocumentRepository(db)

    def search(
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
    ) -> SearchResponse:
        items, total = self.document_repo.search_for_user(
            user_id,
            query=query,
            document_type=document_type,
            date_from=date_from,
            date_to=date_to,
            min_confidence=min_confidence,
            page=page,
            limit=limit,
        )
        from app.schemas.document import DocumentSummaryResponse

        return SearchResponse(
            data=[DocumentSummaryResponse.model_validate(item) for item in items],
            meta=PaginationMeta(page=page, limit=limit, total=total),
        )
