import enum


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(str, enum.Enum):
    INVOICE = "invoice"
    RECEIPT = "receipt"
    PURCHASE_ORDER = "purchase_order"
    OTHER = "other"


class DuplicateMatchType(str, enum.Enum):
    INVOICE_NUMBER_VENDOR = "invoice_number_vendor"


class DuplicateStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"


class DocumentEventType(str, enum.Enum):
    UPLOADED = "uploaded"
    OCR_STARTED = "ocr_started"
    OCR_COMPLETED = "ocr_completed"
    CLASSIFIED = "classified"
    EXTRACTED = "extracted"
    DUPLICATE_FLAGGED = "duplicate_flagged"
    FAILED = "failed"
    PROCESSING_FAILED = "processing_failed"
    REPROCESS_REQUESTED = "reprocess_requested"
    DELETED = "deleted"