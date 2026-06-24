from decimal import Decimal


class ConfidenceService:
    @staticmethod
    def compute_overall(
        ocr_confidence: float | None,
        classification_confidence: float | None,
        extraction_confidence: float | None,
    ) -> Decimal:
        ocr = ocr_confidence if ocr_confidence is not None else 0.0
        classification = classification_confidence if classification_confidence is not None else 0.0
        extraction = extraction_confidence if extraction_confidence is not None else 0.0
        overall = (0.3 * ocr) + (0.2 * classification) + (0.5 * extraction)
        return Decimal(str(round(overall, 2)))
