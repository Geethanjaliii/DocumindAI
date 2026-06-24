from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models.ocr_result import OcrResult
from app.repositories.base import BaseRepository


class OcrResultRepository(BaseRepository[OcrResult]):
    def __init__(self, db: Session):
        super().__init__(db, OcrResult)

    def create(
        self,
        *,
        document_id: UUID,
        raw_text: str,
        ocr_confidence_avg: float | None = None,
        ocr_engine: str = "tesseract",
        language: str = "eng",
    ) -> OcrResult:
        result = OcrResult(
            document_id=document_id,
            raw_text=raw_text,
            ocr_confidence_avg=ocr_confidence_avg,
            ocr_engine=ocr_engine,
            language=language,
        )
        return self.add(result)
