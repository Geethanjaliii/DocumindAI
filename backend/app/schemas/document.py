from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.db.models.enums import DocumentEventType, DocumentStatus, DocumentType


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


class PaginationMeta(BaseModel):
    page: int
    page_size: int = Field(alias="limit", default=20)
    total: int
    total_pages: int | None = None

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Nested sub-schemas (mapped from related ORM models)
# ---------------------------------------------------------------------------


class OcrResultResponse(BaseModel):
    id: UUID
    raw_text: str
    ocr_engine: str
    ocr_confidence_avg: Decimal | None
    language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ClassificationResponse(BaseModel):
    id: UUID
    predicted_type: DocumentType
    confidence_score: Decimal
    model_name: str
    rationale: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExtractionResponse(BaseModel):
    id: UUID
    schema_version: str
    extracted_json: dict
    overall_confidence: Decimal
    field_confidences: dict
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Document summary — list views, upload response, dashboard, search
# ---------------------------------------------------------------------------


class DocumentSummaryResponse(BaseModel):
    id: UUID
    original_filename: str
    mime_type: str
    file_size_bytes: int
    status: DocumentStatus
    document_type: DocumentType | None
    page_count: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    processed_at: datetime | None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Document detail — single document GET, includes related records
# ---------------------------------------------------------------------------


class DocumentDetailResponse(DocumentSummaryResponse):
    ocr_result: OcrResultResponse | None = None
    classification: ClassificationResponse | None = None
    extraction: ExtractionResponse | None = None


# ---------------------------------------------------------------------------
# Document event
# ---------------------------------------------------------------------------


class DocumentEventResponse(BaseModel):
    id: UUID
    event_type: DocumentEventType
    metadata_: dict | None = Field(default=None, alias="metadata_")
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Response wrappers
# ---------------------------------------------------------------------------


class DocumentUploadResponse(BaseModel):
    data: DocumentSummaryResponse


class DocumentListResponse(BaseModel):
    data: list[DocumentSummaryResponse]
    pagination: PaginationMeta


class DocumentDetailWrapper(BaseModel):
    data: DocumentDetailResponse


class DocumentEventsResponse(BaseModel):
    data: list[DocumentEventResponse]