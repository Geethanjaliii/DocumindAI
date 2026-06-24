import logging
from uuid import UUID

from app.db.models.enums import DocumentEventType, DocumentStatus
from app.db.session import SessionLocal
from app.repositories.classification_repository import ClassificationRepository
from app.repositories.document_event_repository import DocumentEventRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.extraction_repository import ExtractionRepository
from app.repositories.ocr_repository import OcrResultRepository
from app.services.ai_service import AIService
from app.services.duplicate_service import DuplicateService
from app.services.ocr_service import OcrService

logger = logging.getLogger(__name__)


def enqueue_document_processing(document_id: UUID) -> None:
    print(f"WORKER STARTED — document_id={document_id}")
    logger.info("WORKER STARTED — document_id=%s", document_id)

    db = SessionLocal()
    document_repo = DocumentRepository(db)
    event_repo = DocumentEventRepository(db)
    ocr_repo = OcrResultRepository(db)
    classification_repo = ClassificationRepository(db)
    extraction_repo = ExtractionRepository(db)

    try:
        document = document_repo.get_by_id(document_id)
        if document is None:
            logger.error("WORKER — document %s not found in DB; aborting", document_id)
            print(f"WORKER ERROR — document {document_id} not found in DB")
            return

        logger.info("DOCUMENT LOADED — id=%s status=%s", document.id, document.status)

        # ------------------------------------------------------------------ #
        # 1. Mark as PROCESSING                                                #
        # ------------------------------------------------------------------ #
        document_repo.update_status(document, DocumentStatus.PROCESSING)
        event_repo.create(
            document_id=document.id,
            user_id=document.user_id,
            event_type=DocumentEventType.OCR_STARTED,
        )
        document_repo.commit()
        logger.info("STATUS UPDATED TO PROCESSING — document_id=%s", document.id)

        # ------------------------------------------------------------------ #
        # 2. OCR                                                               #
        # ------------------------------------------------------------------ #
        print(f"OCR STARTED — path={document.storage_path} mime={document.mime_type}")
        logger.info("OCR STARTED — path=%s mime=%s", document.storage_path, document.mime_type)

        ocr_service = OcrService()
        ocr_result = ocr_service.extract_text(
            storage_path=document.storage_path,
            mime_type=document.mime_type,
        )

        print(
            f"OCR COMPLETED — pages={ocr_result.page_count} "
            f"chars={len(ocr_result.text)} "
            f"confidence={f'{ocr_result.confidence:.1f}' if ocr_result.confidence is not None else 'n/a'}"
        )
        logger.info(
            "OCR COMPLETED — pages=%d chars=%d confidence=%s",
            ocr_result.page_count,
            len(ocr_result.text),
            f"{ocr_result.confidence:.1f}" if ocr_result.confidence is not None else "n/a",
        )

        # ------------------------------------------------------------------ #
        # 3. Persist OCR result                                                #
        # ------------------------------------------------------------------ #
        ocr_repo.create(
            document_id=document.id,
            raw_text=ocr_result.text,
            ocr_confidence_avg=ocr_result.confidence,
            ocr_engine="tesseract",
            language="eng",
        )
        document.page_count = ocr_result.page_count

        event_repo.create(
            document_id=document.id,
            user_id=document.user_id,
            event_type=DocumentEventType.OCR_COMPLETED,
            metadata={
                "page_count": ocr_result.page_count,
                "char_count": len(ocr_result.text),
                "confidence": float(ocr_result.confidence) if ocr_result.confidence is not None else None,
            },
        )
        document_repo.commit()

        # ------------------------------------------------------------------ #
        # 4. AI Classification                                                 #
        # ------------------------------------------------------------------ #
        ai_service = AIService()

        try:
            doc_type, confidence, model_name, rationale = ai_service.classify(ocr_result.text)

            print(f"CLASSIFIED — type={doc_type} confidence={confidence:.3f}")
            logger.info("CLASSIFIED — type=%s confidence=%.3f", doc_type, confidence)

            classification_repo.create(
                document_id=document.id,
                predicted_type=doc_type,
                confidence_score=confidence,
                model_name=model_name,
                rationale=rationale,
            )
            document_repo.update_status(
                document,
                document.status,
                document_type=doc_type,
            )
            event_repo.create(
                document_id=document.id,
                user_id=document.user_id,
                event_type=DocumentEventType.CLASSIFIED,
                metadata={"predicted_type": str(doc_type), "confidence": confidence},
            )
            document_repo.commit()

            # -------------------------------------------------------------- #
            # 5. AI Extraction                                                 #
            # -------------------------------------------------------------- #
            try:
                extracted_json, field_confidences, overall_confidence = ai_service.extract(
                    ocr_result.text,
                    doc_type,
                )

                print(f"EXTRACTED — confidence={overall_confidence:.3f}")
                logger.info("EXTRACTED — confidence=%.3f", overall_confidence)

                extraction_repo.create(
                    document_id=document.id,
                    schema_version="1.0",
                    extracted_json=extracted_json,
                    overall_confidence=overall_confidence,
                    field_confidences=field_confidences,
                )
                event_repo.create(
                    document_id=document.id,
                    user_id=document.user_id,
                    event_type=DocumentEventType.EXTRACTED,
                    metadata={"overall_confidence": overall_confidence},
                )
                document_repo.commit()

                duplicate_result = DuplicateService(db).detect_for_document(
                    user_id=document.user_id,
                    document_id=document.id,
                    document_type=doc_type,
                    extracted_json=extracted_json,
                )
                if duplicate_result.is_duplicate:
                    print(
                        f"DUPLICATE DETECTED — document_id={document.id} "
                        f"original_document_id={duplicate_result.original_document_id}"
                    )
                    logger.info(
                        "DUPLICATE DETECTED — document_id=%s original_document_id=%s matches=%d",
                        document.id,
                        duplicate_result.original_document_id,
                        duplicate_result.match_count,
                    )
                document_repo.commit()

            except NotImplementedError:
                logger.warning(
                    "EXTRACTION SKIPPED — AIService.extract() not yet implemented — document_id=%s",
                    document_id,
                )
                print("EXTRACTION SKIPPED — AIService.extract() not yet implemented")

        except NotImplementedError:
            logger.warning(
                "CLASSIFICATION SKIPPED — AIService.classify() not yet implemented — document_id=%s",
                document_id,
            )
            print("CLASSIFICATION SKIPPED — AIService.classify() not yet implemented")

        # ------------------------------------------------------------------ #
        # 6. Mark as COMPLETED                                                 #
        # ------------------------------------------------------------------ #
        document_repo.update_status(document, DocumentStatus.COMPLETED)
        document_repo.commit()

        print(f"STATUS UPDATED TO COMPLETED — document_id={document.id}")
        logger.info("STATUS UPDATED TO COMPLETED — document_id=%s", document.id)

    except Exception as exc:
        print(f"WORKER FAILED — document_id={document_id} — {type(exc).__name__}: {exc}")
        logger.exception("WORKER FAILED — document_id=%s — unhandled exception", document_id)

        try:
            document_repo.db.rollback()
            document = document_repo.get_by_id(document_id)
            if document is not None:
                document_repo.update_status(
                    document,
                    DocumentStatus.FAILED,
                    error_message=str(exc),
                )
                event_repo.create(
                    document_id=document.id,
                    user_id=document.user_id,
                    event_type=DocumentEventType.PROCESSING_FAILED,
                    metadata={"error": str(exc)},
                )
                document_repo.commit()
                print(f"STATUS UPDATED TO FAILED — document_id={document_id}")
        except Exception:
            logger.exception(
                "WORKER — additionally failed to persist FAILED status for document_id=%s",
                document_id,
            )
    finally:
        db.close()