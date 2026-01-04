from fastapi import APIRouter, WebSocket

from app.services.voice_stream import handle_voice_stream

router = APIRouter(prefix="/ws", tags=["voice-stream"])


@router.websocket("/voice")
async def voice_stream(websocket: WebSocket) -> None:
    await handle_voice_stream(websocket)
