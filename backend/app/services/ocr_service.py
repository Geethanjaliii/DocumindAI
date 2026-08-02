from __future__ import annotations

import logging
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import pytesseract
from pdf2image import convert_from_path
from pdf2image.exceptions import (
    PDFInfoNotInstalledError,
    PDFPageCountError,
    PDFSyntaxError,
)
from PIL import Image, ImageEnhance, ImageFilter

# ------------------------------------------------------------
# Tesseract binary resolution — platform-aware, fails fast at import time
# ------------------------------------------------------------
if sys.platform == "win32":
    _win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    pytesseract.pytesseract.tesseract_cmd = _win_path
elif shutil.which("tesseract") is None:
    raise RuntimeError(
        "tesseract-ocr is not installed or not on PATH. "
        "Install with: apt-get install tesseract-ocr"
    )

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Supported MIME types
# ---------------------------------------------------------------------------
_SUPPORTED_IMAGE_MIMES = {"image/png", "image/jpeg", "image/jpg"}
_SUPPORTED_PDF_MIMES = {"application/pdf"}
SUPPORTED_MIMES = _SUPPORTED_IMAGE_MIMES | _SUPPORTED_PDF_MIMES


# ---------------------------------------------------------------------------
# Result dataclass — keeps the return contract explicit and easy to extend
# ---------------------------------------------------------------------------
@dataclass(frozen=True, slots=True)
class OcrResult:
    text: str
    confidence: float | None  # 0–100 average over all words with conf > 0
    page_count: int


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class OcrService:
    """Extract text from PDFs and images using Tesseract OCR.

    This service is stateless and holds no database session.  Instantiate it
    once per request (or share it application-wide — both are safe).

    Supported MIME types: application/pdf, image/png, image/jpeg.

    Returns an :class:`OcrResult` with:
    - ``text``       — full extracted text, pages joined by form-feed (\\f)
    - ``confidence`` — average Tesseract word-level confidence (0–100), or
                       ``None`` when no scoreable words were found
    - ``page_count`` — number of pages/images processed
    """

    # Tesseract page-segmentation mode 3 = fully automatic, no OSD.
    _DEFAULT_CONFIG = "--psm 3"
    # DPI for PDF rasterisation — 300 dpi is the sweet spot for OCR quality.
    _PDF_DPI = 300

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def extract_text(
        self,
        storage_path: str,
        mime_type: str,
    ) -> OcrResult:
        """Run OCR on *storage_path* and return an :class:`OcrResult`.

        Args:
            storage_path: Absolute path to the file on disk.
            mime_type:    Normalised MIME type (e.g. ``"application/pdf"``).
                          The ``; charset=…`` suffix must be stripped before
                          passing here — ``DocumentService`` already does this.

        Raises:
            ValueError:   Unsupported MIME type or file not found.
            RuntimeError: Tesseract binary missing or PDF conversion failed.
        """
        path = Path(storage_path)
        self._validate(path, mime_type)

        if mime_type in _SUPPORTED_PDF_MIMES:
            return self._process_pdf(path)
        else:
            return self._process_image(path)

    # ------------------------------------------------------------------ #
    # PDF path                                                             #
    # ------------------------------------------------------------------ #

    def _process_pdf(self, path: Path) -> OcrResult:
        logger.info("OCR: converting PDF to images — %s", path.name)

        try:
            images = convert_from_path(
                str(path),
                dpi=self._PDF_DPI,
                fmt="PNG",
                thread_count=2,
                use_cropbox=True,
                poppler_path=r"C:\poppler\poppler-26.02.0\Library\bin",
            )
        except PDFInfoNotInstalledError as exc:
            raise RuntimeError(
                "poppler-utils is not installed; cannot convert PDF to images. "
                "Install it with: apt-get install poppler-utils"
            ) from exc
        except (PDFPageCountError, PDFSyntaxError) as exc:
            raise ValueError(f"PDF is corrupt or unreadable: {exc}") from exc
        except Exception as exc:
            raise RuntimeError(f"PDF conversion failed unexpectedly: {exc}") from exc

        if not images:
            raise ValueError("PDF produced no pages after conversion.")

        return self._ocr_pages(images, page_count=len(images))

    # ------------------------------------------------------------------ #
    # Single-image path                                                    #
    # ------------------------------------------------------------------ #

    def _process_image(self, path: Path) -> OcrResult:
        logger.info("OCR: processing image — %s", path.name)
        try:
            image = Image.open(path)
            image.load()
        except Exception as exc:
            raise ValueError(f"Cannot open image file '{path.name}': {exc}") from exc

        return self._ocr_pages([image], page_count=1)

    # ------------------------------------------------------------------ #
    # Core OCR logic (shared between PDF and image paths)                 #
    # ------------------------------------------------------------------ #

    def _ocr_pages(self, images: list[Image.Image], *, page_count: int) -> OcrResult:
        """Run Tesseract over a list of PIL images and aggregate results."""
        page_texts: list[str] = []
        all_confidences: list[float] = []

        for page_num, image in enumerate(images, start=1):
            try:
                preprocessed = self._preprocess(image)
                page_text, page_confs = self._ocr_single(preprocessed)
            except pytesseract.TesseractNotFoundError as exc:
                raise RuntimeError(
                    "Tesseract OCR is not installed or not on PATH. "
                    "Install it with: apt-get install tesseract-ocr"
                ) from exc
            except Exception as exc:
                logger.warning(
                    "OCR failed on page %d/%d (%s); skipping page.",
                    page_num, page_count, exc,
                )
                page_texts.append("")
                continue

            page_texts.append(page_text)
            all_confidences.extend(page_confs)
            logger.debug(
                "OCR page %d/%d — chars: %d, words scored: %d",
                page_num, page_count, len(page_text), len(page_confs),
            )

        full_text = "\f".join(page_texts).strip()
        avg_confidence = self._average(all_confidences)

        logger.info(
            "OCR complete — pages: %d, chars: %d, confidence: %s",
            page_count,
            len(full_text),
            f"{avg_confidence:.1f}" if avg_confidence is not None else "n/a",
        )

        return OcrResult(
            text=full_text,
            confidence=avg_confidence,
            page_count=page_count,
        )

    def _ocr_single(self, image: Image.Image) -> tuple[str, list[float]]:
        """Run Tesseract on one image; return (text, list_of_word_confidences)."""
        data = pytesseract.image_to_data(
            image,
            config=self._DEFAULT_CONFIG,
            lang="eng",
            output_type=pytesseract.Output.DICT,
        )

        word_confidences: list[float] = [
            float(conf)
            for conf, text in zip(data["conf"], data["text"])
            if int(conf) > 0 and str(text).strip()
        ]

        words = [str(t) for t in data["text"] if str(t).strip()]
        text = " ".join(words)

        return text, word_confidences

    # ------------------------------------------------------------------ #
    # Image pre-processing                                                 #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _preprocess(image: Image.Image) -> Image.Image:
        """Apply light pre-processing to improve OCR accuracy.

        Strategy: convert to greyscale → sharpen edges → boost contrast.
        We deliberately avoid binarisation (thresholding) here because
        Tesseract 4+ with LSTM performs better on greyscale than hard
        black-and-white for most document types.
        """
        img = image.convert("L")
        img = img.filter(ImageFilter.SHARPEN)
        img = ImageEnhance.Contrast(img).enhance(1.5)
        return img

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _validate(path: Path, mime_type: str) -> None:
        if not path.exists():
            raise ValueError(f"File not found at storage path: {path}")
        if not path.is_file():
            raise ValueError(f"Storage path is not a regular file: {path}")
        if mime_type not in SUPPORTED_MIMES:
            raise ValueError(
                f"Unsupported MIME type '{mime_type}'. "
                f"Supported types: {sorted(SUPPORTED_MIMES)}"
            )

    @staticmethod
    def _average(values: list[float]) -> float | None:
        """Return the mean of *values*, or ``None`` if the list is empty."""
        if not values:
            return None
        return round(sum(values) / len(values), 2)
