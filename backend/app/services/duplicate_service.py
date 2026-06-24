from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.enums import DuplicateMatchType, DuplicateStatus, DocumentEventType
from app.repositories.document_event_repository import DocumentEventRepository
from app.repositories.duplicate_repository import DuplicateMatchRepository
from app.repositories.extraction_repository import ExtractionRepository


class DuplicateService:
    DUPLICATE_SCORE = 95.0

    def __init__(self, db: Session):
        self.db = db
        self.extraction_repo = ExtractionRepository(db)
        self.duplicate_repo = DuplicateMatchRepository(db)
        self.event_repo = DocumentEventRepository(db)

    def detect_for_document(self, user_id: UUID, document_id: UUID, extracted_json: dict) -> list:
        invoice_number = str(extracted_json.get("invoice_number", "")).strip()
        vendor_name = str(extracted_json.get("vendor_name", "")).strip()

        if not invoice_number or not vendor_name:
            return []

        matches = self.extraction_repo.find_by_invoice_number_and_vendor(
            user_id=user_id,
            invoice_number=invoice_number,
            vendor_name=vendor_name,
            exclude_document_id=document_id,
        )

        created_matches = []
        for match in matches:
            existing = self.duplicate_repo.get_existing_pair(document_id, match.document_id)
            if existing is not None:
                continue

            duplicate = self.duplicate_repo.create(
                user_id=user_id,
                source_document_id=document_id,
                matched_document_id=match.document_id,
                match_type=DuplicateMatchType.INVOICE_NUMBER_VENDOR,
                similarity_score=self.DUPLICATE_SCORE,
                match_details={
                    "invoice_number": invoice_number,
                    "vendor_name": vendor_name,
                },
                status=DuplicateStatus.PENDING,
            )
            self.event_repo.create(
                document_id=document_id,
                user_id=user_id,
                event_type=DocumentEventType.DUPLICATE_FLAGGED,
                metadata={
                    "matched_document_id": str(match.document_id),
                    "invoice_number": invoice_number,
                    "vendor_name": vendor_name,
                },
            )
            created_matches.append(duplicate)

        return created_matches
