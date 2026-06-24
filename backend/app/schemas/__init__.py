from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.schemas.common import ErrorDetail, ErrorResponse
from app.schemas.dashboard import (
    DashboardRecentResponse,
    DashboardStatsResponse,
    DashboardStatsWrapper,
    SearchResponse,
)
from app.schemas.document import (
    ClassificationResponse,
    DocumentBulkUploadResponse,
    DocumentDetailResponse,
    DocumentDetailWrapper,
    DocumentEventResponse,
    DocumentEventsResponse,
    DocumentListResponse,
    DocumentSummaryResponse,
    DocumentUploadResponse,
    ExtractionResponse,
    OcrResultResponse,
    PaginationMeta,
)
from app.schemas.duplicate import DuplicateListResponse, DuplicateMatchResponse, DuplicateUpdateRequest

__all__ = [
    # auth
    "AuthResponse",
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "UserResponse",
    # common
    "ErrorDetail",
    "ErrorResponse",
    # dashboard
    "DashboardRecentResponse",
    "DashboardStatsResponse",
    "DashboardStatsWrapper",
    "SearchResponse",
    # document
    "ClassificationResponse",
    "DocumentDetailResponse",
    "DocumentDetailWrapper",
    "DocumentEventResponse",
    "DocumentEventsResponse",
    "DocumentListResponse",
    "DocumentSummaryResponse",
    "DocumentBulkUploadResponse",
    "DocumentUploadResponse",
    "ExtractionResponse",
    "OcrResultResponse",
    "PaginationMeta",
    # duplicate
    "DuplicateListResponse",
    "DuplicateMatchResponse",
    "DuplicateUpdateRequest",
]