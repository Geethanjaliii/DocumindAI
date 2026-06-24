ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


def validate_upload(filename: str, mime_type: str, file_size: int, max_bytes: int) -> None:
    if file_size <= 0:
        raise ValueError("File is empty")
    if file_size > max_bytes:
        raise ValueError(f"File exceeds maximum size of {max_bytes // (1024 * 1024)} MB")

    extension = ""
    if "." in filename:
        extension = "." + filename.rsplit(".", 1)[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file extension. Allowed: PDF, PNG, JPG")

    normalized_mime = mime_type.split(";")[0].strip().lower()
    if normalized_mime not in ALLOWED_MIME_TYPES:
        raise ValueError("Unsupported MIME type. Allowed: PDF, PNG, JPG")
