"""
Per-document-type field schemas for Gemini structured extraction.

Field names are stable — duplicate detection relies on
extracted_json["invoice_number"] and extracted_json["vendor_name"] via
ExtractionRepository.find_by_invoice_number_and_vendor().
"""

from typing import Any

from app.db.models.enums import DocumentType

INVOICE_EXTRACTION_SCHEMA: dict[str, str] = {
    "invoice_number": "",
    "vendor_name": "",
    "invoice_date": "",
    "due_date": "",
    "total_amount": "",
    "currency": "",
}

RECEIPT_EXTRACTION_SCHEMA: dict[str, str] = {
    "merchant_name": "",
    "purchase_date": "",
    "total_amount": "",
    "payment_method": "",
}

PURCHASE_ORDER_EXTRACTION_SCHEMA: dict[str, str] = {
    "po_number": "",
    "vendor_name": "",
    "order_date": "",
    "total_amount": "",
}

OTHER_EXTRACTION_SCHEMA: dict[str, str] = {
    "summary": "",
}

EXTRACTION_SCHEMAS: dict[DocumentType, dict[str, str]] = {
    DocumentType.INVOICE: INVOICE_EXTRACTION_SCHEMA,
    DocumentType.RECEIPT: RECEIPT_EXTRACTION_SCHEMA,
    DocumentType.PURCHASE_ORDER: PURCHASE_ORDER_EXTRACTION_SCHEMA,
    DocumentType.OTHER: OTHER_EXTRACTION_SCHEMA,
}


def get_extraction_schema(document_type: DocumentType) -> dict[str, str]:
    """Return the field schema for *document_type*, falling back to OTHER."""
    return EXTRACTION_SCHEMAS.get(document_type, OTHER_EXTRACTION_SCHEMA)


def empty_extraction(document_type: DocumentType) -> dict[str, Any]:
    """Return a copy of the schema with every field set to an empty string."""
    return dict(get_extraction_schema(document_type))
