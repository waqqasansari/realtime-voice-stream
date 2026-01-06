from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import config
from app.routers import health, voice_stream

app = FastAPI(
    title=config.APP_NAME,
    description=config.APP_DESCRIPTION,
    version=config.APP_VERSION,
)

# Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(voice_stream.router)
