from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.enums import DocumentEventType, DocumentStatus, DocumentType
from app.db.models.user import User
from app.repositories.document_event_repository import DocumentEventRepository
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import (
    DocumentDetailResponse,
    DocumentDetailWrapper,
    DocumentEventsResponse,
    DocumentEventResponse,
    DocumentListResponse,
    DocumentSummaryResponse,
    DocumentUploadResponse,
    PaginationMeta,
)
from app.services.storage_service import StorageService
from app.utils.file_validation import validate_upload
from app.workers.process_document import enqueue_document_processing


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.document_repo = DocumentRepository(db)
        self.event_repo = DocumentEventRepository(db)
        self.storage = StorageService()
        self.settings = get_settings()

    async def upload_document(
        self,
        user: User,
        file: UploadFile,
        background_tasks: BackgroundTasks,
    ) -> DocumentUploadResponse:
        if file.filename is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

        content = await file.read()
        mime_type = file.content_type or "application/octet-stream"

        try:
            validate_upload(
                filename=file.filename,
                mime_type=mime_type,
                file_size=len(content),
                max_bytes=self.settings.max_upload_bytes,
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

        storage_path, file_hash = self.storage.save(
            user.id,
            file.filename,
            content,
        )

        document = self.document_repo.create(
            user_id=user.id,
            original_filename=file.filename,
            storage_path=storage_path,
            mime_type=mime_type.split(";")[0].strip().lower(),
            file_size_bytes=len(content),
            file_hash_sha256=file_hash,
        )

        self.event_repo.create(
            document_id=document.id,
            user_id=user.id,
            event_type=DocumentEventType.UPLOADED,
            metadata={
                "filename": file.filename,
                "size_bytes": len(content),
            },
        )

        self.document_repo.commit()
        self.document_repo.refresh(document)

        print("BACKGROUND TASK QUEUED", document.id)

        background_tasks.add_task(
            enqueue_document_processing,
            document.id,
        )

        return DocumentUploadResponse(
            data=DocumentSummaryResponse.model_validate(document)
        )

    def list_documents(
        self,
        user: User,
        page: int = 1,
        page_size: int = 20,
        status_filter: DocumentStatus | None = None,
        doc_type_filter: DocumentType | None = None,
    ) -> DocumentListResponse:
        documents, total = self.document_repo.list_for_user(
            user_id=user.id,
            page=page,
            limit=page_size,
            status=status_filter,
            document_type=doc_type_filter,
        )

        return DocumentListResponse(
            data=[DocumentSummaryResponse.model_validate(doc) for doc in documents],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=-(-total // page_size),
            ),
        )

    def get_document(
        self,
        user: User,
        document_id: UUID,
    ) -> DocumentDetailWrapper:
        document = self.document_repo.get_by_id_for_user(
            document_id=document_id,
            user_id=user.id,
        )

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        return DocumentDetailWrapper(
            data=DocumentDetailResponse.model_validate(document)
        )

    def delete_document(
        self,
        user: User,
        document_id: UUID,
    ) -> None:
        document = self.document_repo.get_by_id_for_user(
            document_id=document_id,
            user_id=user.id,
        )

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        self.storage.delete(document.storage_path)

        self.event_repo.create(
            document_id=document.id,
            user_id=user.id,
            event_type=DocumentEventType.DELETED,
            metadata={"filename": document.original_filename},
        )

        self.document_repo.delete(document)
        self.document_repo.commit()

    def get_document_events(
        self,
        user: User,
        document_id: UUID,
    ) -> DocumentEventsResponse:
        document = self.document_repo.get_by_id_for_user(
            document_id=document_id,
            user_id=user.id,
        )

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        events = self.event_repo.list_for_document(document_id=document_id)

        return DocumentEventsResponse(
            data=[DocumentEventResponse.model_validate(event) for event in events]
        )

    async def reprocess_document(
        self,
        user: User,
        document_id: UUID,
        background_tasks: BackgroundTasks,
    ) -> DocumentDetailWrapper:
        document = self.document_repo.get_by_id_for_user(
            document_id=document_id,
            user_id=user.id,
        )

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        if document.status == DocumentStatus.PROCESSING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document is already being processed",
            )

        self.document_repo.update_status(document, DocumentStatus.PENDING)

        self.event_repo.create(
            document_id=document.id,
            user_id=user.id,
            event_type=DocumentEventType.REPROCESS_REQUESTED,
            metadata={"triggered_by": str(user.id)},
        )

        self.document_repo.commit()
        self.document_repo.refresh(document)

        background_tasks.add_task(
            enqueue_document_processing,
            document.id,
        )

        return DocumentDetailWrapper(
            data=DocumentDetailResponse.model_validate(document)
        )