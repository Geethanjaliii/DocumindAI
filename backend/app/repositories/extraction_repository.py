from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.document import Document
from app.db.models.extraction import Extraction
from app.repositories.base import BaseRepository


class ExtractionRepository(BaseRepository[Extraction]):
    def __init__(self, db: Session):
        super().__init__(db, Extraction)

    def create(
        self,
        *,
        document_id: UUID,
        schema_version: str,
        extracted_json: dict,
        overall_confidence: float,
        field_confidences: dict,
    ) -> Extraction:
        extraction = Extraction(
            document_id=document_id,
            schema_version=schema_version,
            extracted_json=extracted_json,
            overall_confidence=overall_confidence,
            field_confidences=field_confidences,
        )
        return self.add(extraction)

    def find_by_invoice_number_and_vendor(
        self,
        user_id: UUID,
        invoice_number: str,
        vendor_name: str,
        exclude_document_id: UUID | None = None,
    ) -> list[Extraction]:
        normalized_invoice = invoice_number.strip().lower()
        normalized_vendor = vendor_name.strip().lower()

        stmt = (
            select(Extraction)
            .join(Document, Document.id == Extraction.document_id)
            .where(Document.user_id == user_id)
        )
        if exclude_document_id is not None:
            stmt = stmt.where(Document.id != exclude_document_id)

        extractions = list(self.db.scalars(stmt).all())
        matches: list[Extraction] = []
        for extraction in extractions:
            data = extraction.extracted_json or {}
            ext_invoice = str(data.get("invoice_number", "")).strip().lower()
            ext_vendor = str(data.get("vendor_name", "")).strip().lower()
            if ext_invoice == normalized_invoice and ext_vendor == normalized_vendor:
                matches.append(extraction)
        return matches
