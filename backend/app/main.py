from fastapi import FastAPI
from app.routers import health

app = FastAPI(
    title="VoiceStream Backend",
    description="voice stream backend",
    version="1.0.0"
)

app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "voice stream backend running ✅"}