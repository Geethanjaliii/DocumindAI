"""
backend/app/services/ai_service.py

Uses the current google-genai SDK (google.genai >= 1.0).
Key decisions:
  - response_mime_type="application/json" — forces Gemini to emit valid JSON,
    eliminates markdown fences and thinking-token bleed entirely.
  - thinking_config(thinking_budget=0) — disables thinking tokens for
    classification/extraction (they add latency with no benefit for structured
    output tasks; JSON mode already constrains the output).
  - Migrated from deprecated google.generativeai to google.genai.
"""

import json
import logging
import os

from dotenv import load_dotenv

load_dotenv()

from typing import Any

import google.genai as genai
import google.genai.types as gtypes

from app.db.models.enums import DocumentType

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-2.5-flash"

# ---------------------------------------------------------------------------
# Per-type extraction schemas
# Field names are intentionally stable — duplicate detection relies on
# extracted_json["invoice_number"] and extracted_json["vendor_name"] via
# ExtractionRepository.find_by_invoice_number_and_vendor().
# ---------------------------------------------------------------------------
_EXTRACTION_SCHEMAS: dict[DocumentType, dict[str, Any]] = {
    DocumentType.INVOICE: {
        "invoice_number": "string — invoice identifier",
        "invoice_date": "string — ISO 8601 date or as printed",
        "due_date": "string — payment due date, or null",
        "vendor_name": "string — seller / issuing company",
        "vendor_address": "string — seller address, or null",
        "vendor_tax_id": "string — VAT / GST / tax ID, or null",
        "customer_name": "string — buyer name, or null",
        "customer_address": "string — buyer address, or null",
        "line_items": [
            {
                "description": "string",
                "quantity": "number or null",
                "unit_price": "number or null",
                "total": "number or null",
            }
        ],
        "subtotal": "number or null",
        "tax_amount": "number or null",
        "tax_rate": "number — percentage e.g. 18 for 18%, or null",
        "total_amount": "number — grand total",
        "currency": "string — ISO 4217 e.g. USD, INR",
        "payment_terms": "string or null",
        "notes": "string or null",
    },
    DocumentType.RECEIPT: {
        "receipt_number": "string or null",
        "receipt_date": "string — ISO 8601 date or as printed",
        "merchant_name": "string — store or business name",
        "merchant_address": "string or null",
        "line_items": [
            {
                "description": "string",
                "quantity": "number or null",
                "unit_price": "number or null",
                "total": "number or null",
            }
        ],
        "subtotal": "number or null",
        "tax_amount": "number or null",
        "total_amount": "number — amount paid",
        "currency": "string — ISO 4217",
        "payment_method": "string — cash / card / UPI etc, or null",
        "card_last4": "string — last 4 digits if card, else null",
    },
    DocumentType.PURCHASE_ORDER: {
        "po_number": "string — purchase order number",
        "po_date": "string — ISO 8601 date or as printed",
        "delivery_date": "string — expected delivery date, or null",
        "buyer_name": "string — issuing company",
        "buyer_address": "string or null",
        "vendor_name": "string — supplier / seller",
        "vendor_address": "string or null",
        "line_items": [
            {
                "description": "string",
                "quantity": "number or null",
                "unit_price": "number or null",
                "total": "number or null",
            }
        ],
        "subtotal": "number or null",
        "tax_amount": "number or null",
        "total_amount": "number — order total",
        "currency": "string — ISO 4217",
        "payment_terms": "string or null",
        "shipping_terms": "string or null",
        "notes": "string or null",
    },
    DocumentType.OTHER: {
        "title": "string — document title or best description",
        "date": "string — primary date on document, or null",
        "issuer": "string — issuing entity, or null",
        "recipient": "string — recipient, or null",
        "summary": "string — one-sentence summary of document content",
        "key_values": "object — any notable key-value pairs extracted",
    },
}

# Shared generation config — JSON mode + thinking disabled
_JSON_CONFIG = gtypes.GenerateContentConfig(
    response_mime_type="application/json",
    thinking_config=gtypes.ThinkingConfig(thinking_budget=0),
)


def _safe_confidence(value: Any, default: float = 0.75) -> float:
    """Coerce any value to a float clamped to [0.0, 1.0]."""
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return default


class AIService:
    """
    Gemini-powered document classification and structured field extraction.

    classify() → (DocumentType, confidence: float, model_name: str, rationale: str)
    extract()  → (extracted_json: dict, field_confidences: dict, overall_confidence: float)

    Both methods are safe to call even when the document text is empty or the
    Gemini response is unexpected — they return sensible defaults rather than
    raising, so the worker pipeline always reaches COMPLETED.
    """

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable is not set")
        self._client = genai.Client(api_key=api_key)

    def _generate(self, prompt: str) -> dict:
        """
        Call Gemini with JSON mode enabled.
        Returns a parsed dict, or {} on any failure.
        """
        try:
            response = self._client.models.generate_content(
                model=_MODEL_NAME,
                contents=prompt,
                config=_JSON_CONFIG,
            )
            raw = response.text or ""
            logger.debug("Gemini raw response (%.300s)", raw)
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.warning("Gemini JSON decode failed: %s — raw: %.300s", exc, raw)
            return {}
        except Exception as exc:
            logger.exception("Gemini API call failed: %s", exc)
            return {}

    # ---------------------------------------------------------------------- #
    # Classification                                                           #
    # ---------------------------------------------------------------------- #

    def classify(self, raw_text: str) -> tuple[DocumentType, float, str, str]:
        """
        Classify the document using Gemini.

        Returns:
            doc_type    — DocumentType enum member
            confidence  — float in [0.0, 1.0]
            model_name  — stored in classifications.model_name
            rationale   — stored in classifications.rationale
        """
        if not raw_text or not raw_text.strip():
            logger.warning("AI classify — empty text; defaulting to OTHER")
            return DocumentType.OTHER, 0.0, _MODEL_NAME, "Empty document text"

        prompt = f"""You are a document classification expert.

Classify the document below into EXACTLY ONE of:
  invoice         — a bill issued by a seller to a buyer for goods or services
  receipt         — proof of a completed payment or purchase transaction
  purchase_order  — a buyer's formal order authorising a purchase from a supplier
  other           — anything that does not clearly fit the above

Respond with a JSON object containing exactly these fields:
  document_type  : one of "invoice", "receipt", "purchase_order", "other"
  confidence     : float from 0.0 to 1.0
  rationale      : one or two sentence explanation

Document text (first 5000 chars):
{raw_text[:5000]}
"""
        data = self._generate(prompt)

        label = str(data.get("document_type", "")).strip().lower()
        mapping: dict[str, DocumentType] = {
            "invoice": DocumentType.INVOICE,
            "receipt": DocumentType.RECEIPT,
            "purchase_order": DocumentType.PURCHASE_ORDER,
            "other": DocumentType.OTHER,
        }
        doc_type = mapping.get(label, DocumentType.OTHER)
        confidence = _safe_confidence(data.get("confidence"), default=0.75)
        rationale = str(data.get("rationale", "")).strip()

        logger.info(
            "AI classify — label=%r doc_type=%s confidence=%.3f",
            label, doc_type, confidence,
        )
        return doc_type, confidence, _MODEL_NAME, rationale

    # ---------------------------------------------------------------------- #
    # Extraction                                                               #
    # ---------------------------------------------------------------------- #

    def extract(
        self,
        raw_text: str,
        document_type: DocumentType,
    ) -> tuple[dict, dict, float]:
        """
        Extract structured fields from the document using Gemini.

        Returns:
            extracted_json     — stored in extractions.extracted_json
            field_confidences  — stored in extractions.field_confidences
            overall_confidence — stored in extractions.overall_confidence
        """
        if not raw_text or not raw_text.strip():
            logger.warning("AI extract — empty text; returning empty extraction")
            return {}, {}, 0.0

        schema = _EXTRACTION_SCHEMAS.get(document_type, _EXTRACTION_SCHEMAS[DocumentType.OTHER])
        schema_str = json.dumps(schema, indent=2)

        prompt = f"""You are a document data extraction expert.

Extract structured data from the document below according to the schema provided.

Rules:
- Use null for any field not present in the document. Do not invent data.
- Numeric fields (amounts, quantities) must be numbers, not strings.
- Dates should be returned exactly as printed if not ISO 8601.
- Populate field_confidences with a 0.0-1.0 float for each top-level field.
- Set overall_confidence (0.0-1.0) to your overall extraction quality assessment.

Respond with a JSON object containing exactly these top-level keys:
  extracted          : object matching the schema below
  field_confidences  : object mapping each field name to a confidence float
  overall_confidence : float from 0.0 to 1.0

Schema for document type "{document_type.value}":
{schema_str}

Document text (first 8000 chars):
{raw_text[:8000]}
"""
        data = self._generate(prompt)

        # Pull structured sub-keys
        extracted_json: dict = {}
        field_confidences: dict = {}

        if isinstance(data.get("extracted"), dict):
            extracted_json = data["extracted"]
        else:
            # Gemini returned a flat dict — treat whole response as extracted payload
            excluded = {"field_confidences", "overall_confidence"}
            extracted_json = {k: v for k, v in data.items() if k not in excluded}

        if isinstance(data.get("field_confidences"), dict):
            field_confidences = {
                k: _safe_confidence(v) for k, v in data["field_confidences"].items()
            }

        overall_confidence = _safe_confidence(
            data.get("overall_confidence"),
            default=0.75 if extracted_json else 0.0,
        )

        logger.info(
            "AI extract — doc_type=%s fields=%d overall_confidence=%.3f",
            document_type, len(extracted_json), overall_confidence,
        )
        return extracted_json, field_confidences, overall_confidence