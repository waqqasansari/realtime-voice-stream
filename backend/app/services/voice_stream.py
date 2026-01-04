import json
import logging
import random
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


def generate_dummy_caption(chunk_index: int) -> str:
    starters = [
        "Hearing",
        "Detecting",
        "Catching",
        "Noting",
        "Parsing",
        "Capturing",
    ]
    subjects = [
        "a quick phrase",
        "background speech",
        "short response",
        "a brief thought",
        "a clear sentence",
        "steady narration",
    ]
    extras = [
        "coming through",
        "from the stream",
        "in real time",
        "with stable signal",
        "for this chunk",
        "just now",
    ]
    return (
        f"{random.choice(starters)} {random.choice(subjects)} "
        f"{random.choice(extras)} (chunk {chunk_index})."
    )


def persist_recording(buffer: bytearray, meta: dict[str, str]) -> None:
    if not buffer:
        return

    recordings_dir = Path(__file__).resolve().parents[2] / "recordings"
    recordings_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    stream_id = uuid4().hex

    mime_type = meta.get("mimeType", "audio/webm")
    extension = ".webm"
    if "audio/wav" in mime_type:
        extension = ".wav"
    elif "audio/mpeg" in mime_type:
        extension = ".mp3"
    elif "audio/ogg" in mime_type:
        extension = ".ogg"

    audio_path = recordings_dir / f"voice-{timestamp}-{stream_id}{extension}"
    audio_path.write_bytes(buffer)

    if meta:
        metadata_path = recordings_dir / f"voice-{timestamp}-{stream_id}.json"
        metadata_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    logger.info("Saved voice stream to %s", audio_path)


async def handle_voice_stream(websocket: WebSocket) -> None:
    """
    WebSocket endpoint that receives streamed audio bytes and metadata.
    On disconnect, it persists the accumulated audio data to a file.
    """
    await websocket.accept()

    audio_buffer = bytearray()
    chunk_count = 0

    metadata: dict[str, str] = {}

    try:
        while True:
            message = await websocket.receive()

            if message.get("bytes") is not None:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                chunk_count += 1
                dummy_caption = generate_dummy_caption(chunk_count)
                try:
                    await websocket.send_json(
                        {
                            "type": "audio_progress",
                            "chunkBytes": len(chunk),
                            "totalBytes": len(audio_buffer),
                            "totalChunks": chunk_count,
                        }
                    )
                    await websocket.send_json(
                        {
                            "type": "chunk_caption",
                            "chunkIndex": chunk_count,
                            "text": dummy_caption,
                        }
                    )
                except RuntimeError as exc:
                    logger.warning("Failed to send progress update: %s", exc)
                continue

            text_payload = message.get("text")
            if text_payload is None:
                continue

            try:
                payload = json.loads(text_payload)
                message_type = payload.get("type")
                if message_type == "stream_start":
                    audio_buffer.clear()
                    chunk_count = 0
                    metadata.clear()
                    metadata.update(payload.get("metadata", {}))
                    await websocket.send_json(
                        {
                            "type": "audio_progress",
                            "chunkBytes": 0,
                            "totalBytes": 0,
                            "totalChunks": 0,
                        }
                    )
                    logger.info("Voice stream started with metadata: %s", metadata)
                    continue
                if message_type == "stream_end":
                    logger.info(
                        "Voice stream ended; persisting %d bytes", len(audio_buffer)
                    )
                    persist_recording(audio_buffer, metadata)
                    audio_buffer.clear()
                    chunk_count = 0
                    metadata.clear()
                    await websocket.send_json(
                        {
                            "type": "audio_progress",
                            "chunkBytes": 0,
                            "totalBytes": 0,
                            "totalChunks": 0,
                        }
                    )
                    continue

                if message_type == "metadata":
                    metadata = payload.get("metadata", {})
                else:
                    metadata = payload
                logger.info("Received voice stream metadata: %s", metadata)
            except json.JSONDecodeError:
                logger.info(
                    "Received non-JSON message on voice stream: %s", text_payload
                )

    except WebSocketDisconnect:
        logger.info("Voice stream disconnected; persisting %d bytes", len(audio_buffer))
    finally:
        persist_recording(audio_buffer, metadata)
