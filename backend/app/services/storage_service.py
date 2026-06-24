import hashlib
import uuid
from pathlib import Path

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.upload_dir = Path(self.settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def compute_sha256(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def save(self, user_id: uuid.UUID, filename: str, content: bytes) -> tuple[str, str]:
        user_dir = self.upload_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        extension = Path(filename).suffix.lower()
        stored_name = f"{uuid.uuid4()}{extension}"
        file_path = user_dir / stored_name
        file_path.write_bytes(content)

        return str(file_path), self.compute_sha256(content)

    def delete(self, storage_path: str) -> None:
        path = Path(storage_path)
        if path.exists() and path.is_file():
            path.unlink()
