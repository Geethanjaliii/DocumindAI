from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: list[str] | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
