from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.enums import DocumentStatus, DocumentType
from app.repositories.document_repository import DocumentRepository
from app.repositories.duplicate_repository import DuplicateMatchRepository
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.document import DocumentSummaryResponse


class DashboardService:
    def __init__(self, db: Session):
        self.document_repo = DocumentRepository(db)
        self.duplicate_repo = DuplicateMatchRepository(db)

    def get_stats(self, user_id: UUID) -> DashboardStatsResponse:
        return DashboardStatsResponse(
            total_documents=self.document_repo.count_by_user(user_id),
            processing_documents=self.document_repo.count_by_status(user_id, DocumentStatus.PROCESSING),
            completed_documents=self.document_repo.count_by_status(user_id, DocumentStatus.COMPLETED),
            failed_documents=self.document_repo.count_by_status(user_id, DocumentStatus.FAILED),
            invoice_count=self.document_repo.count_by_type(user_id, DocumentType.INVOICE),
            receipt_count=self.document_repo.count_by_type(user_id, DocumentType.RECEIPT),
            purchase_order_count=self.document_repo.count_by_type(user_id, DocumentType.PURCHASE_ORDER),
            other_count=self.document_repo.count_by_type(user_id, DocumentType.OTHER),
            pending_duplicates=self.duplicate_repo.count_pending_for_user(user_id),
            average_confidence=self.document_repo.get_avg_confidence(user_id),
        )

    def get_recent(self, user_id: UUID, limit: int = 5) -> list[DocumentSummaryResponse]:
        items = self.document_repo.get_recent_for_user(user_id, limit=limit)
        return [DocumentSummaryResponse.model_validate(item) for item in items]
