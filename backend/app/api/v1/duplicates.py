from uuid import UUID

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.duplicate import DuplicateListResponse, DuplicateMatchResponse, DuplicateUpdateRequest
from app.services.duplicate_query_service import DuplicateQueryService

router = APIRouter()


@router.get("", response_model=DuplicateListResponse)
def list_duplicates(current_user: CurrentUser, db: DbSession) -> DuplicateListResponse:
    data = DuplicateQueryService(db).list_duplicates(current_user.id)
    return DuplicateListResponse(data=data)


@router.patch("/{duplicate_id}", response_model=DuplicateMatchResponse)
def update_duplicate_status(
    duplicate_id: UUID,
    payload: DuplicateUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> DuplicateMatchResponse:
    return DuplicateQueryService(db).update_status(current_user.id, duplicate_id, payload)
