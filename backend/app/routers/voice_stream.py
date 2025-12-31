import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["voice-stream"])


@router.websocket("/voice")
async def voice_stream(websocket: WebSocket) -> None:
    """Receive streamed audio bytes over WebSocket and persist on disconnect."""
    await websocket.accept()
    audio_buffer = bytearray()
    metadata: dict[str, str] = {}

    try:
        while True:
            message = await websocket.receive()
            if message.get("bytes") is not None:
                audio_buffer.extend(message["bytes"])
                continue

            text_payload = message.get("text")
            if text_payload is None:
                continue

            try:
                metadata = json.loads(text_payload)
                logger.info("Received voice stream metadata: %s", metadata)
            except json.JSONDecodeError:
                logger.info("Received non-JSON message on voice stream: %s", text_payload)
    except WebSocketDisconnect:
        logger.info("Voice stream disconnected; persisting %d bytes", len(audio_buffer))
    finally:
        if not audio_buffer:
            return

        recordings_dir = Path(__file__).resolve().parents[2] / "recordings"
        recordings_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        stream_id = uuid4().hex
        audio_path = recordings_dir / f"voice-{timestamp}-{stream_id}.bin"
        audio_path.write_bytes(audio_buffer)

        if metadata:
            metadata_path = recordings_dir / f"voice-{timestamp}-{stream_id}.json"
            metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        logger.info("Saved voice stream to %s", audio_path)
