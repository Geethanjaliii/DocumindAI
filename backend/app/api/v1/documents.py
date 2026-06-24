from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, File, Query, UploadFile, status

from app.core.deps import CurrentUser, DbSession
from app.db.models.enums import DocumentStatus, DocumentType
from app.schemas.document import (
    DocumentBulkUploadResponse,
    DocumentDetailWrapper,
    DocumentEventsResponse,
    DocumentListResponse,
)
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/upload", response_model=DocumentBulkUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_documents(
    current_user: CurrentUser,
    db: DbSession,
    background_tasks: BackgroundTasks,
    files: Annotated[
        list[UploadFile],
        File(description="One or more documents to upload (PDF, PNG, or JPEG)"),
    ] = [],
    file: Annotated[
        UploadFile | None,
        File(
            description="Legacy single-file upload field (use `files` for new clients)",
            include_in_schema=False,
        ),
    ] = None,
) -> DocumentBulkUploadResponse:
    upload_files = list(files)
    if file is not None:
        upload_files.append(file)

    return await DocumentService(db).upload_documents(
        current_user,
        upload_files,
        background_tasks,
    )


@router.get("", response_model=DocumentListResponse)
def list_documents(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: DocumentStatus | None = Query(default=None, alias="status"),
    doc_type_filter: DocumentType | None = Query(default=None, alias="document_type"),
) -> DocumentListResponse:
    return DocumentService(db).list_documents(
        user=current_user,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        doc_type_filter=doc_type_filter,
    )


@router.get("/{document_id}", response_model=DocumentDetailWrapper)
def get_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentDetailWrapper:
    return DocumentService(db).get_document(current_user, document_id)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    DocumentService(db).delete_document(current_user, document_id)


@router.get("/{document_id}/events", response_model=DocumentEventsResponse)
def get_document_events(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentEventsResponse:
    return DocumentService(db).get_document_events(current_user, document_id)


@router.post("/{document_id}/reprocess", response_model=DocumentDetailWrapper)
async def reprocess_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    background_tasks: BackgroundTasks,
) -> DocumentDetailWrapper:
    return await DocumentService(db).reprocess_document(current_user, document_id, background_tasks)
