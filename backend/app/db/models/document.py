import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.enums import DocumentStatus, DocumentType


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_user_created", "user_id", "created_at"),
        Index("ix_documents_user_status", "user_id", "status"),
        Index("ix_documents_file_hash", "file_hash_sha256"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    file_hash_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status", native_enum=False),
        default=DocumentStatus.UPLOADED,
        nullable=False,
    )
    document_type: Mapped[DocumentType | None] = mapped_column(
        Enum(DocumentType, name="document_type", native_enum=False),
        nullable=True,
    )
    page_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    original_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped["User"] = relationship(back_populates="documents")
    original_document: Mapped["Document | None"] = relationship(
        remote_side="Document.id",
        foreign_keys=[original_document_id],
    )
    ocr_result: Mapped["OcrResult | None"] = relationship(
        back_populates="document", uselist=False, cascade="all, delete-orphan"
    )
    classification: Mapped["Classification | None"] = relationship(
        back_populates="document", uselist=False, cascade="all, delete-orphan"
    )
    extraction: Mapped["Extraction | None"] = relationship(
        back_populates="document", uselist=False, cascade="all, delete-orphan"
    )
    events: Mapped[list["DocumentEvent"]] = relationship(
        back_populates="document", cascade="all, delete-orphan", order_by="DocumentEvent.created_at"
    )
    duplicate_matches_as_source: Mapped[list["DuplicateMatch"]] = relationship(
        back_populates="source_document",
        foreign_keys="DuplicateMatch.source_document_id",
        cascade="all, delete-orphan",
    )
    duplicate_matches_as_matched: Mapped[list["DuplicateMatch"]] = relationship(
        back_populates="matched_document",
        foreign_keys="DuplicateMatch.matched_document_id",
        cascade="all, delete-orphan",
    )


from app.db.models.classification import Classification  # noqa: E402
from app.db.models.document_event import DocumentEvent  # noqa: E402
from app.db.models.duplicate_match import DuplicateMatch  # noqa: E402
from app.db.models.extraction import Extraction  # noqa: E402
from app.db.models.ocr_result import OcrResult  # noqa: E402
from app.db.models.user import User  # noqa: E402
