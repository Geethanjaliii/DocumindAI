import logging
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.enums import DocumentEventType, DocumentType, DuplicateMatchType, DuplicateStatus
from app.repositories.document_event_repository import DocumentEventRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.duplicate_repository import DuplicateMatchRepository
from app.repositories.extraction_repository import ExtractionRepository

logger = logging.getLogger(__name__)


@dataclass
class DuplicateDetectionResult:
    is_duplicate: bool
    original_document_id: UUID | None
    match_count: int


class DuplicateService:
    DUPLICATE_SCORE = 95.0

    def __init__(self, db: Session):
        self.db = db
        self.document_repo = DocumentRepository(db)
        self.extraction_repo = ExtractionRepository(db)
        self.duplicate_repo = DuplicateMatchRepository(db)
        self.event_repo = DocumentEventRepository(db)

    def detect_for_document(
        self,
        user_id: UUID,
        document_id: UUID,
        document_type: DocumentType,
        extracted_json: dict,
    ) -> DuplicateDetectionResult:
        if document_type != DocumentType.INVOICE:
            logger.debug(
                "Duplicate detection skipped — document_id=%s type=%s",
                document_id,
                document_type,
            )
            return DuplicateDetectionResult(
                is_duplicate=False,
                original_document_id=None,
                match_count=0,
            )

        invoice_number = str(extracted_json.get("invoice_number", "")).strip()
        vendor_name = str(extracted_json.get("vendor_name", "")).strip()

        if not invoice_number or not vendor_name:
            logger.info(
                "Duplicate detection skipped — document_id=%s missing invoice_number or vendor_name",
                document_id,
            )
            return DuplicateDetectionResult(
                is_duplicate=False,
                original_document_id=None,
                match_count=0,
            )

        logger.info(
            "Duplicate detection started — document_id=%s invoice_number=%r vendor_name=%r",
            document_id,
            invoice_number,
            vendor_name,
        )

        matches = self.extraction_repo.find_by_invoice_number_and_vendor(
            user_id=user_id,
            invoice_number=invoice_number,
            vendor_name=vendor_name,
            exclude_document_id=document_id,
        )

        if not matches:
            logger.info("Duplicate detection completed — document_id=%s no matches", document_id)
            return DuplicateDetectionResult(
                is_duplicate=False,
                original_document_id=None,
                match_count=0,
            )

        original_document_id = matches[0].document_id
        document = self.document_repo.get_by_id(document_id)
        if document is not None:
            self.document_repo.update_duplicate_status(
                document,
                is_duplicate=True,
                original_document_id=original_document_id,
            )

        for match in matches:
            existing = self.duplicate_repo.get_existing_pair(document_id, match.document_id)
            if existing is not None:
                continue

            self.duplicate_repo.create(
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
                    "original_document_id": str(original_document_id),
                    "invoice_number": invoice_number,
                    "vendor_name": vendor_name,
                },
            )

        logger.info(
            "Duplicate detection completed — document_id=%s is_duplicate=true original_document_id=%s matches=%d",
            document_id,
            original_document_id,
            len(matches),
        )

        return DuplicateDetectionResult(
            is_duplicate=True,
            original_document_id=original_document_id,
            match_count=len(matches),
        )
