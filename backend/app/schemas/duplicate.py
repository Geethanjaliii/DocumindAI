from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.db.models.enums import DuplicateMatchType, DuplicateStatus
from app.schemas.document import DocumentSummaryResponse


class DuplicateMatchResponse(BaseModel):
    id: UUID
    match_type: DuplicateMatchType
    similarity_score: Decimal
    match_details: dict
    status: DuplicateStatus
    created_at: datetime
    source_document: DocumentSummaryResponse
    matched_document: DocumentSummaryResponse

    model_config = {"from_attributes": True}


class DuplicateListResponse(BaseModel):
    data: list[DuplicateMatchResponse]


class DuplicateUpdateRequest(BaseModel):
    status: DuplicateStatus
