from fastapi import APIRouter

from app.core import config
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=config.SERVICE_NAME,
        version=config.APP_VERSION,
    )
