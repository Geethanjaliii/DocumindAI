from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DbSession
from app.schemas.dashboard import DashboardRecentResponse, DashboardStatsWrapper
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsWrapper)
def get_dashboard_stats(current_user: CurrentUser, db: DbSession) -> DashboardStatsWrapper:
    stats = DashboardService(db).get_stats(current_user.id)
    return DashboardStatsWrapper(data=stats)


@router.get("/recent", response_model=DashboardRecentResponse)
def get_recent_documents(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=5, ge=1, le=20),
) -> DashboardRecentResponse:
    data = DashboardService(db).get_recent(current_user.id, limit=limit)
    return DashboardRecentResponse(data=data)
