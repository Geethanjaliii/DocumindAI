"""Add duplicate flags to documents

Revision ID: 002
Revises: 001
Create Date: 2026-06-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column("is_duplicate", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "documents",
        sa.Column("original_document_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_documents_original_document_id",
        "documents",
        "documents",
        ["original_document_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_documents_is_duplicate",
        "documents",
        ["user_id", "is_duplicate"],
    )


def downgrade() -> None:
    op.drop_index("ix_documents_is_duplicate", table_name="documents")
    op.drop_constraint("fk_documents_original_document_id", "documents", type_="foreignkey")
    op.drop_column("documents", "original_document_id")
    op.drop_column("documents", "is_duplicate")
