from pydantic import BaseModel

from app.schemas.document import DocumentSummaryResponse, PaginationMeta


class DashboardStatsResponse(BaseModel):
    total_documents: int
    processing_documents: int
    completed_documents: int
    failed_documents: int
    invoice_count: int
    receipt_count: int
    purchase_order_count: int
    other_count: int
    pending_duplicates: int
    average_confidence: float | None


class DashboardStatsWrapper(BaseModel):
    data: DashboardStatsResponse


class DashboardRecentResponse(BaseModel):
    data: list[DocumentSummaryResponse]


class SearchResponse(BaseModel):
    data: list[DocumentSummaryResponse]
    meta: PaginationMeta
