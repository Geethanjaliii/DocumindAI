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
import re

from dotenv import load_dotenv

load_dotenv()

from typing import Any

import google.genai as genai
import google.genai.types as gtypes

from app.db.models.enums import DocumentType
from app.services.extraction_schemas import empty_extraction, get_extraction_schema

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-2.5-flash"

# Shared generation config — JSON mode + thinking disabled
_JSON_CONFIG = gtypes.GenerateContentConfig(
    response_mime_type="application/json",
    thinking_config=gtypes.ThinkingConfig(thinking_budget=0),
)

_MARKDOWN_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)


def _safe_confidence(value: Any, default: float = 0.75) -> float:
    """Coerce any value to a float clamped to [0.0, 1.0]."""
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return default


def _parse_json_response(raw: str) -> dict[str, Any]:
    """
    Parse Gemini JSON output safely.

    Strips optional markdown fences as a fallback even though JSON mode should
    prevent them. Returns {} on empty or malformed input.
    """
    if not raw or not raw.strip():
        return {}

    text = _MARKDOWN_FENCE_RE.sub("", raw.strip()).strip()
    if not text:
        return {}

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return {}

    return parsed if isinstance(parsed, dict) else {}


def _normalize_extracted_fields(
    payload: dict[str, Any],
    document_type: DocumentType,
) -> dict[str, str]:
    """Coerce extracted values to strings and restrict to known schema keys."""
    schema = get_extraction_schema(document_type)
    normalized = empty_extraction(document_type)

    for key in schema:
        value = payload.get(key)
        if value is None:
            normalized[key] = ""
        else:
            normalized[key] = str(value).strip()
    return normalized


def _build_field_confidences(
    raw_confidences: Any,
    schema: dict[str, str],
    extracted_json: dict[str, str],
) -> dict[str, float]:
    """Ensure one confidence value exists for every schema field."""
    source = raw_confidences if isinstance(raw_confidences, dict) else {}
    field_confidences: dict[str, float] = {}

    for key in schema:
        if key in source:
            field_confidences[key] = _safe_confidence(source[key], default=0.0)
        elif extracted_json.get(key):
            field_confidences[key] = 0.5
        else:
            field_confidences[key] = 0.0

    return field_confidences


def _average_confidence(field_confidences: dict[str, float]) -> float:
    if not field_confidences:
        return 0.0
    return sum(field_confidences.values()) / len(field_confidences)


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

    def _generate(self, prompt: str) -> tuple[dict[str, Any], str]:
        """
        Call Gemini with JSON mode enabled.

        Returns (parsed_dict, raw_text). parsed_dict is {} on any failure.
        """
        raw = ""
        try:
            response = self._client.models.generate_content(
                model=_MODEL_NAME,
                contents=prompt,
                config=_JSON_CONFIG,
            )
            raw = response.text or ""
            logger.debug("Gemini raw response (%.300s)", raw)
            return _parse_json_response(raw), raw
        except json.JSONDecodeError as exc:
            logger.warning("Gemini JSON decode failed: %s — raw: %.300s", exc, raw)
            return {}, raw
        except Exception as exc:
            logger.exception("Gemini API call failed: %s", exc)
            return {}, raw

    # ---------------------------------------------------
    # Classification                                                         
    # ----------------------------------------------------

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
        data, _ = self._generate(prompt)

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
        schema = get_extraction_schema(document_type)
        logger.info("AI extract — extraction started doc_type=%s", document_type)

        if not raw_text or not raw_text.strip():
            logger.warning("AI extract — extraction failed doc_type=%s reason=empty_text", document_type)
            field_confidences = {key: 0.0 for key in schema}
            return empty_extraction(document_type), field_confidences, 0.0

        schema_str = json.dumps(schema, indent=2)

        prompt = f"""You are a document data extraction expert.

Extract structured data from the document below according to the schema provided.

Rules:
- Return valid JSON only. Do not wrap the response in markdown or code fences.
- All extracted field values must be strings. Use an empty string for missing fields.
- Do not invent data that is not present in the document.
- Populate field_confidences with a 0.0-1.0 float for each schema field.
- Dates and amounts should be copied exactly as they appear on the document.

Respond with a JSON object containing exactly these top-level keys:
  extracted          : object with the schema fields below
  field_confidences  : object mapping each schema field name to a confidence float

Schema for document type "{document_type.value}":
{schema_str}

Document text (first 8000 chars):
{raw_text[:8000]}
"""
        data, raw = self._generate(prompt)

        if not data:
            logger.error(
                "AI extract — extraction failed doc_type=%s reason=malformed_or_empty_json raw=%.300s",
                document_type,
                raw,
            )
            field_confidences = {key: 0.0 for key in schema}
            return empty_extraction(document_type), field_confidences, 0.0

        if isinstance(data.get("extracted"), dict):
            extracted_payload = data["extracted"]
        else:
            excluded = {"field_confidences", "overall_confidence"}
            extracted_payload = {k: v for k, v in data.items() if k not in excluded}

        extracted_json = _normalize_extracted_fields(extracted_payload, document_type)
        field_confidences = _build_field_confidences(
            data.get("field_confidences"),
            schema,
            extracted_json,
        )
        overall_confidence = _average_confidence(field_confidences)

        logger.info(
            "AI extract — extraction completed doc_type=%s fields=%d overall_confidence=%.3f",
            document_type,
            len(extracted_json),
            overall_confidence,
        )
        return extracted_json, field_confidences, overall_confidence
