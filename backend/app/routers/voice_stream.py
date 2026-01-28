import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.voice_stream import (
    SAMPLE_RATE,
    StreamingTranscriptionState,
    decode_audio_bytes,
    transcriber,
)

# Configure logging for this module
logger = logging.getLogger(__name__)

# Create an APIRouter for websocket endpoints, prefixed with /ws
router = APIRouter(prefix="/ws", tags=["voice-stream"])

# Transcribe every N chunks. At 100ms per chunk from frontend:
# - 20 chunks = ~2 seconds of audio per transcription batch
# - Balanced between latency and transcription quality
TRANSCRIBE_EVERY_CHUNKS = 20

# Overlap in seconds to include from previous chunk for context (avoids mid-word cuts)
OVERLAP_SECONDS = 0.5
OVERLAP_SAMPLES = int(OVERLAP_SECONDS * SAMPLE_RATE)


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


async def process_transcription(
    audio_buffer: bytearray,
    transcription_state: StreamingTranscriptionState,
    websocket: WebSocket,
    chunk_count: int,
    is_final: bool = False,
) -> None:
    """
    Process audio buffer and send transcription results.
    
    Args:
        audio_buffer: Complete audio buffer (WebM container)
        transcription_state: State object for incremental transcription
        websocket: WebSocket connection to send results
        chunk_count: Current chunk count for logging
        is_final: Whether this is the final transcription
    """
    # Skip processing if buffer is too small (WebM needs enough container data)
    # At least 10KB ensures we have valid WebM headers and some audio data
    MIN_BUFFER_SIZE = 10 * 1024  # 10KB minimum
    if len(audio_buffer) < MIN_BUFFER_SIZE and not is_final:
        return
    
    # Decode the full audio buffer (WebM container requires full decode)
    decoded_audio = await asyncio.to_thread(
        decode_audio_bytes, bytes(audio_buffer)
    )
    
    # Skip if no audio decoded or nothing new
    if decoded_audio.size == 0 or decoded_audio.size <= transcription_state.processed_samples:
        return
    
    # Calculate chunk boundaries with overlap
    start_idx = max(0, transcription_state.processed_samples - OVERLAP_SAMPLES)
    new_audio = decoded_audio[start_idx:]
    
    # Update processed samples count
    transcription_state.processed_samples = decoded_audio.size
    
    # Use the streaming transcription method with deduplication
    result = await asyncio.to_thread(
        transcriber.transcribe_streaming_chunk,
        new_audio,
        transcription_state,
        OVERLAP_SAMPLES,
    )
    
    if result.chunk_text or is_final:
        try:
            await websocket.send_json({
                "type": "chunk_transcript",
                "chunkIndex": chunk_count,
                "chunkText": result.chunk_text,
                "fullText": result.full_text,
                "confidence": float(result.confidence),  # Convert numpy float32 to Python float
                "hasSpeech": bool(result.has_speech),
                "isFinal": is_final,
            })
        except RuntimeError as exc:
            logger.warning("Failed to send transcript: %s", exc)


@router.websocket("/voice")
async def handle_voice_stream(websocket: WebSocket) -> None:
    """
    WebSocket endpoint that receives streamed audio bytes and metadata.

    Workflow:
    1. Accepts the WebSocket connection.
    2. Enters a loop to receive messages:
       - Binary bytes: Appends to audio buffer and triggers transcription periodically.
       - JSON text: Handles control messages like 'stream_start', 'stream_end', or 'metadata'.
    3. On disconnect or 'stream_end', it saves the audio data via persist_recording.
    """
    await websocket.accept()

    # Local state for the current stream session
    audio_buffer = bytearray()
    chunk_count = 0
    metadata: dict[str, str] = {}
    transcription_state = StreamingTranscriptionState()

    try:
        while True:
            # Receive the next message from the client
            message = await websocket.receive()

            # Check for disconnect message
            if message.get("type") == "websocket.disconnect":
                logger.info("Received disconnect message; ending stream")
                break

            # Handle Binary Data (Audio Chunks)
            if message.get("bytes") is not None:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                chunk_count += 1

                try:
                    # Provide feedback to the client about the stream progress
                    await websocket.send_json({
                        "type": "audio_progress",
                        "chunkBytes": len(chunk),
                        "totalBytes": len(audio_buffer),
                        "totalChunks": chunk_count,
                    })
                except RuntimeError as exc:
                    logger.warning("Failed to send progress update: %s", exc)

                # Trigger transcription every N chunks
                if chunk_count % TRANSCRIBE_EVERY_CHUNKS == 0:
                    await process_transcription(
                        audio_buffer,
                        transcription_state,
                        websocket,
                        chunk_count,
                        is_final=False,
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
                    transcription_state.reset()

                    await websocket.send_json({
                        "type": "audio_progress",
                        "chunkBytes": 0,
                        "totalBytes": 0,
                        "totalChunks": 0,
                    })
                    logger.info("Voice stream started with metadata: %s", metadata)
                    continue

                if message_type == "stream_end":
                    # Finalize the stream and save data
                    logger.info(
                        "Voice stream ended; persisting %d bytes", len(audio_buffer)
                    )
                    persist_recording(audio_buffer, metadata)

                    # Process any remaining audio
                    if audio_buffer:
                        await process_transcription(
                            audio_buffer,
                            transcription_state,
                            websocket,
                            chunk_count,
                            is_final=True,
                        )

                    # Clear session state after saving
                    audio_buffer.clear()
                    chunk_count = 0
                    metadata.clear()
                    transcription_state.reset()

                    await websocket.send_json({
                        "type": "audio_progress",
                        "chunkBytes": 0,
                        "totalBytes": 0,
                        "totalChunks": 0,
                    })
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
    except RuntimeError as e:
        # Handle "Cannot call receive once a disconnect message has been received"
        # This can happen if client disconnects during an async operation
        if "disconnect" in str(e).lower():
            logger.info("Voice stream connection closed; persisting %d bytes", len(audio_buffer))
        else:
            logger.error("Runtime error in voice stream: %s", e)
    finally:
        # Ensure any remaining data is saved even if an error occurs
        persist_recording(audio_buffer, metadata)


