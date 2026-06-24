from fastapi import APIRouter

from app.api.v1 import auth, dashboard, documents, duplicates, search

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(duplicates.router, prefix="/duplicates", tags=["duplicates"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
