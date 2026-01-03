import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# Set up logging for this module
logger = logging.getLogger(__name__)

# Initialize the API router with a prefix and tags for documentation
router = APIRouter(prefix="/ws", tags=["voice-stream"])


@router.websocket("/voice")
async def voice_stream(websocket: WebSocket) -> None:
    """
    WebSocket endpoint that receives streamed audio bytes and metadata.
    On disconnect, it persists the accumulated audio data to a file.
    """
    # Accept the incoming WebSocket connection
    await websocket.accept()
    
    # Buffer to accumulate incoming raw audio bytes
    audio_buffer = bytearray()
    
    # Dictionary to store any metadata received as JSON text
    metadata: dict[str, str] = {}

    try:
        while True:
            # Wait for any message from the client
            message = await websocket.receive()
            
            # If the message contains binary data (bytes), append it to our buffer
            if message.get("bytes") is not None:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                try:
                    await websocket.send_json(
                        {
                            "type": "audio_progress",
                            "chunkBytes": len(chunk),
                            "totalBytes": len(audio_buffer),
                        }
                    )
                except RuntimeError as exc:
                    logger.warning("Failed to send progress update: %s", exc)
                continue

            # If the message contains text, handle it (e.g., metadata)
            text_payload = message.get("text")
            if text_payload is None:
                continue

            try:
                # Attempt to parse text payload as JSON metadata
                metadata = json.loads(text_payload)
                logger.info("Received voice stream metadata: %s", metadata)
            except json.JSONDecodeError:
                # Log if the text is not JSON (it might be a simple message)
                logger.info("Received non-JSON message on voice stream: %s", text_payload)
                
    except WebSocketDisconnect:
        # Handle the case where the client closes the connection
        logger.info("Voice stream disconnected; persisting %d bytes", len(audio_buffer))
    finally:
        # If no audio was received, simply exit without saving anything
        if not audio_buffer:
            return

        # Define the directory where recordings will be saved (backend/recordings)
        recordings_dir = Path(__file__).resolve().parents[2] / "recordings"
        recordings_dir.mkdir(parents=True, exist_ok=True)

        # Generate a unique filename using timestamp and a random ID
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        stream_id = uuid4().hex
        
        # Determine the file extension from metadata or default to .webm
        # (Since the frontend sends audio/webm, this ensures it's playable)
        mime_type = metadata.get("mimeType", "audio/webm")
        extension = ".webm"
        if "audio/wav" in mime_type:
            extension = ".wav"
        elif "audio/mpeg" in mime_type:
            extension = ".mp3"
        elif "audio/ogg" in mime_type:
            extension = ".ogg"
            
        # Save the audio data with the correct extension
        audio_path = recordings_dir / f"voice-{timestamp}-{stream_id}{extension}"
        audio_path.write_bytes(audio_buffer)

        # If metadata was received, save it as a separate JSON file
        if metadata:
            metadata_path = recordings_dir / f"voice-{timestamp}-{stream_id}.json"
            metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        logger.info("Saved voice stream to %s", audio_path)
