from fastapi import FastAPI

from app.core import config
from app.routers import health, voice_stream

app = FastAPI(
    title=config.APP_NAME,
    description=config.APP_DESCRIPTION,
    version=config.APP_VERSION,
)

app.include_router(health.router)
app.include_router(voice_stream.router)
