import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.voice_stream import transcriber

# Configure logging for this module
logger = logging.getLogger(__name__)

# Create an APIRouter for websocket endpoints, prefixed with /ws
router = APIRouter(prefix="/ws", tags=["voice-stream"])

TRANSCRIBE_EVERY_CHUNKS = 10


def persist_recording(buffer: bytearray, meta: dict[str, str]) -> None:
    """
    Saves the accumulated audio buffer and its metadata to the local filesystem.

    Args:
        buffer: The raw audio bytes accumulated during the stream.
        meta: A dictionary containing metadata about the recording (e.g., mimeType).
    """
    if not buffer:
        return

    # Define the directory where recordings will be saved (backend/recordings)
    recordings_dir = Path(__file__).resolve().parents[2] / "recordings"
    recordings_dir.mkdir(parents=True, exist_ok=True)

    # Generate a unique timestamp and stream ID for the filenames
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    stream_id = uuid4().hex

    # Determine the file extension based on the MIME type provided in metadata
    mime_type = meta.get("mimeType", "audio/webm")
    extension = ".webm"
    if "audio/wav" in mime_type:
        extension = ".wav"
    elif "audio/mpeg" in mime_type:
        extension = ".mp3"
    elif "audio/ogg" in mime_type:
        extension = ".ogg"

    # Save the audio data to a binary file
    audio_path = recordings_dir / f"voice-{timestamp}-{stream_id}{extension}"
    audio_path.write_bytes(buffer)

    # If metadata exists, save it to a corresponding JSON file
    if meta:
        metadata_path = recordings_dir / f"voice-{timestamp}-{stream_id}.json"
        metadata_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    logger.info("Saved voice stream to %s", audio_path)


@router.websocket("/voice")
async def handle_voice_stream(websocket: WebSocket) -> None:
    """
    WebSocket endpoint that receives streamed audio bytes and metadata.

    Workflow:
    1. Accepts the WebSocket connection.
    2. Enters a loop to receive messages:
       - Binary bytes: Appends to audio buffer, generates dummy captions, and sends progress updates.
       - JSON text: Handles control messages like 'stream_start', 'stream_end', or 'metadata'.
    3. On disconnect or 'stream_end', it saves the audio data via persist_recording.
    """
    await websocket.accept()

    # Local state for the current stream session
    audio_buffer = bytearray()
    chunk_count = 0
    metadata: dict[str, str] = {}
    last_transcript = ""

    try:
        while True:
            # Receive the next message from the client
            message = await websocket.receive()

            # Handle Binary Data (Audio Chunks)
            if message.get("bytes") is not None:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                chunk_count += 1

                try:
                    # Provide feedback to the client about the stream progress
                    await websocket.send_json(
                        {
                            "type": "audio_progress",
                            "chunkBytes": len(chunk),
                            "totalBytes": len(audio_buffer),
                            "totalChunks": chunk_count,
                        }
                    )
                except RuntimeError as exc:
                    logger.warning("Failed to send progress update: %s", exc)

                if chunk_count % TRANSCRIBE_EVERY_CHUNKS == 0:
                    audio_snapshot = bytes(audio_buffer)
                    result = await asyncio.to_thread(transcriber.transcribe, audio_snapshot)
                    if result.text:
                        delta = result.text
                        if last_transcript and result.text.startswith(last_transcript):
                            delta = result.text[len(last_transcript):].strip()
                        if delta:
                            last_transcript = result.text
                            await websocket.send_json(
                                {
                                    "type": "chunk_caption",
                                    "chunkIndex": chunk_count,
                                    "text": delta,
                                }
                            )

                continue

            # Handle Text Data (Control Messages / Metadata)
            text_payload = message.get("text")
            if text_payload is None:
                continue

            try:
                # Parse the incoming JSON message
                payload = json.loads(text_payload)
                message_type = payload.get("type")

                if message_type == "stream_start":
                    # Initialize/Reset session state for a new stream
                    audio_buffer.clear()
                    chunk_count = 0
                    metadata.clear()
                    metadata.update(payload.get("metadata", {}))
                    last_transcript = ""

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
                    # Finalize the stream and save data
                    logger.info(
                        "Voice stream ended; persisting %d bytes", len(audio_buffer)
                    )
                    persist_recording(audio_buffer, metadata)

                    if audio_buffer:
                        result = await asyncio.to_thread(
                            transcriber.transcribe, bytes(audio_buffer)
                        )
                        if result.text and result.text != last_transcript:
                            await websocket.send_json(
                                {
                                    "type": "chunk_caption",
                                    "chunkIndex": chunk_count,
                                    "text": result.text,
                                }
                            )

                    # Clear session state after saving
                    audio_buffer.clear()
                    chunk_count = 0
                    metadata.clear()
                    last_transcript = ""

                    await websocket.send_json(
                        {
                            "type": "audio_progress",
                            "chunkBytes": 0,
                            "totalBytes": 0,
                            "totalChunks": 0,
                        }
                    )
                    continue

                # Handle standalone metadata updates
                if message_type == "metadata":
                    metadata = payload.get("metadata", {})
                else:
                    # Fallback for unexpected or legacy formats
                    metadata = payload

                logger.info("Received voice stream metadata: %s", metadata)

            except json.JSONDecodeError:
                logger.info(
                    "Received non-JSON message on voice stream: %s", text_payload
                )

    except WebSocketDisconnect:
        # Handle client-initiated disconnection (e.g., closing tab)
        logger.info("Voice stream disconnected; persisting %d bytes", len(audio_buffer))
    finally:
        # Ensure any remaining data is saved even if an error occurs
        persist_recording(audio_buffer, metadata)
