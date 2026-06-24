from datetime import datetime

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.db.models.enums import DocumentType
from app.schemas.dashboard import SearchResponse
from app.services.search_service import SearchService

router = APIRouter()


@router.get("", response_model=SearchResponse)
def search_documents(
    current_user: CurrentUser,
    db: DbSession,
    q: str | None = Query(default=None),
    document_type: DocumentType | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    min_confidence: float | None = Query(default=None, ge=0, le=100),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> SearchResponse:
    return SearchService(db).search(
        current_user.id,
        query=q,
        document_type=document_type,
        date_from=date_from,
        date_to=date_to,
        min_confidence=min_confidence,
        page=page,
        limit=limit,
    )
