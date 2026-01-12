import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.voice_stream import decode_audio_bytes, transcriber

# Configure logging for this module
logger = logging.getLogger(__name__)

# Create an APIRouter for websocket endpoints, prefixed with /ws
router = APIRouter(prefix="/ws", tags=["voice-stream"])

# Transcribe every N chunks. At 100ms per chunk from frontend:
# - 30 chunks = ~3 seconds of audio per transcription batch
# - Larger chunks give Whisper more complete speech segments, reducing hallucinations
TRANSCRIBE_EVERY_CHUNKS = 30

# Overlap in samples to include from previous chunk for context (avoids mid-word cuts)
# At 16kHz sample rate: 0.5 seconds * 16000 = 8000 samples
OVERLAP_SAMPLES = 8000


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
    last_sample_count = 0  # Track how many samples have been processed

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
                    # Decode full audio buffer (needed because WebM is container format)
                    audio_snapshot = bytes(audio_buffer)
                    decoded_audio = await asyncio.to_thread(
                        decode_audio_bytes, audio_snapshot
                    )
                    
                    if decoded_audio.size > last_sample_count:
                        # Calculate where to start: include OVERLAP_SAMPLES for context
                        # This prevents cutting words in the middle
                        start_idx = max(0, last_sample_count - OVERLAP_SAMPLES)
                        new_audio = decoded_audio[start_idx:]
                        
                        # Update the sample count for next iteration
                        last_sample_count = decoded_audio.size
                        
                        # Transcribe only the new audio chunk (with overlap context)
                        result = await asyncio.to_thread(
                            transcriber.transcribe_audio, new_audio
                        )
                        
                        if result.text:
                            chunk_text = result.text.strip()
                            # Send incremental update - frontend will append
                            if chunk_text:
                                # Append to running transcript
                                if last_transcript:
                                    last_transcript = f"{last_transcript} {chunk_text}"
                                else:
                                    last_transcript = chunk_text
                                    
                                await websocket.send_json(
                                    {
                                        "type": "chunk_transcript",
                                        "chunkIndex": chunk_count,
                                        "chunkText": chunk_text,  # Just the new chunk
                                        "fullText": last_transcript,  # Full accumulated
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
                    last_sample_count = 0

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
                        # Transcribe any remaining unprocessed audio
                        decoded_audio = await asyncio.to_thread(
                            decode_audio_bytes, bytes(audio_buffer)
                        )
                        if decoded_audio.size > last_sample_count:
                            # Include overlap for context
                            start_idx = max(0, last_sample_count - OVERLAP_SAMPLES)
                            remaining_audio = decoded_audio[start_idx:]
                            
                            result = await asyncio.to_thread(
                                transcriber.transcribe_audio, remaining_audio
                            )
                            if result.text:
                                final_chunk = result.text.strip()
                                if final_chunk:
                                    if last_transcript:
                                        last_transcript = f"{last_transcript} {final_chunk}"
                                    else:
                                        last_transcript = final_chunk
                                    await websocket.send_json(
                                        {
                                            "type": "chunk_transcript",
                                            "chunkIndex": chunk_count,
                                            "chunkText": final_chunk,
                                            "fullText": last_transcript,
                                            "isFinal": True,
                                        }
                                    )

                    # Clear session state after saving
                    audio_buffer.clear()
                    chunk_count = 0
                    metadata.clear()
                    last_transcript = ""
                    last_sample_count = 0

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

