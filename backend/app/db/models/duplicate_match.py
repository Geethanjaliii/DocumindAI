import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.enums import DuplicateMatchType, DuplicateStatus


class DuplicateMatch(Base):
    __tablename__ = "duplicate_matches"
    __table_args__ = (
        UniqueConstraint("source_document_id", "matched_document_id", name="uq_duplicate_pair"),
        CheckConstraint(
            "source_document_id < matched_document_id",
            name="ck_duplicate_canonical_order",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    source_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    matched_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    match_type: Mapped[DuplicateMatchType] = mapped_column(
        Enum(DuplicateMatchType, name="duplicate_match_type", native_enum=False),
        nullable=False,
    )
    similarity_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    match_details: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[DuplicateStatus] = mapped_column(
        Enum(DuplicateStatus, name="duplicate_status", native_enum=False),
        default=DuplicateStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="duplicate_matches")
    source_document: Mapped["Document"] = relationship(
        back_populates="duplicate_matches_as_source",
        foreign_keys=[source_document_id],
    )
    matched_document: Mapped["Document"] = relationship(
        back_populates="duplicate_matches_as_matched",
        foreign_keys=[matched_document_id],
    )


from app.db.models.document import Document  # noqa: E402
from app.db.models.user import User  # noqa: E402
