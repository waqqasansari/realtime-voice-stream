import logging
import subprocess
import threading
import warnings
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import List

import numpy as np
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor

# Suppress transformers warnings about deprecated features
warnings.filterwarnings("ignore", message=".*forced_decoder_ids.*")
warnings.filterwarnings("ignore", message=".*multilingual Whisper.*")

logger = logging.getLogger(__name__)

MODEL_NAME = "openai/whisper-base"  # openai/whisper-base,openai/whisper-tiny
SAMPLE_RATE = 16000

# Audio processing thresholds
SILENCE_THRESHOLD = 0.01  # RMS threshold for silence detection
MIN_SPEECH_SAMPLES = int(0.3 * SAMPLE_RATE)  # Minimum 300ms of speech to transcribe
OVERLAP_CONTEXT_SECONDS = 0.5  # Context overlap for word boundary handling


@dataclass
class TranscriptionResult:
    text: str
    duration_seconds: float
    is_partial: bool = False


@dataclass
class StreamingChunkResult:
    """Result from incremental transcription with deduplication info"""
    chunk_text: str  # The new unique text from this chunk
    full_text: str  # Complete accumulated transcript
    confidence: float  # Estimated confidence (0-1)
    has_speech: bool  # Whether speech was detected in this chunk


@dataclass
class StreamingTranscriptionState:
    """Maintains state for streaming transcription with deduplication"""
    accumulated_text: str = ""
    last_overlap_text: str = ""  # Last few words for deduplication
    processed_samples: int = 0
    chunk_history: List[str] = field(default_factory=list)
    
    def reset(self) -> None:
        self.accumulated_text = ""
        self.last_overlap_text = ""
        self.processed_samples = 0
        self.chunk_history.clear()


def decode_audio_bytes(audio_bytes: bytes) -> np.ndarray:
    """Decode audio bytes (from container format) to raw PCM float32 samples."""
    if not audio_bytes:
        return np.array([], dtype=np.float32)

    try:
        result = subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                "-f",
                "s16le",
                "-ac",
                "1",
                "-ar",
                str(SAMPLE_RATE),
                "pipe:1",
            ],
            input=audio_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
    except FileNotFoundError:
        logger.error("ffmpeg is not available; cannot decode audio stream")
        return np.array([], dtype=np.float32)
    except subprocess.CalledProcessError as exc:
        logger.error("ffmpeg failed to decode audio: %s", exc.stderr.decode("utf-8"))
        return np.array([], dtype=np.float32)

    if not result.stdout:
        return np.array([], dtype=np.float32)

    audio_int16 = np.frombuffer(result.stdout, dtype=np.int16)
    return audio_int16.astype(np.float32) / 32768.0


def detect_speech_activity(audio: np.ndarray, threshold: float = SILENCE_THRESHOLD) -> bool:
    """
    Simple Voice Activity Detection using RMS energy.
    Returns True if speech is likely present.
    """
    if audio.size < MIN_SPEECH_SAMPLES:
        return False
    
    # Calculate RMS energy
    rms = np.sqrt(np.mean(audio ** 2))
    return rms > threshold


def find_speech_boundaries(audio: np.ndarray, threshold: float = SILENCE_THRESHOLD) -> tuple[int, int]:
    """
    Find the start and end indices of speech in the audio.
    Uses a sliding window to detect energy changes.
    """
    if audio.size == 0:
        return 0, 0
    
    window_size = int(0.02 * SAMPLE_RATE)  # 20ms windows
    
    # Find start of speech
    start_idx = 0
    for i in range(0, len(audio) - window_size, window_size):
        window = audio[i:i + window_size]
        rms = np.sqrt(np.mean(window ** 2))
        if rms > threshold:
            start_idx = max(0, i - window_size)  # Include a bit before
            break
    
    # Find end of speech (scan backwards)
    end_idx = len(audio)
    for i in range(len(audio) - window_size, start_idx, -window_size):
        window = audio[i:i + window_size]
        rms = np.sqrt(np.mean(window ** 2))
        if rms > threshold:
            end_idx = min(len(audio), i + 2 * window_size)  # Include a bit after
            break
    
    return start_idx, end_idx


def deduplicate_transcript(new_text: str, previous_text: str, overlap_words: int = 5) -> str:
    """
    Remove duplicate words/phrases that appear due to overlap context.
    Uses suffix-prefix matching to find and remove duplicates.
    """
    if not previous_text or not new_text:
        return new_text.strip()
    
    new_words = new_text.strip().split()
    prev_words = previous_text.strip().split()
    
    if not new_words or not prev_words:
        return new_text.strip()
    
    # Get the last N words from previous text for comparison
    overlap_prev = prev_words[-overlap_words:] if len(prev_words) >= overlap_words else prev_words
    
    # Find best matching overlap at the start of new text
    best_match_len = 0
    
    for match_len in range(1, min(len(overlap_prev), len(new_words)) + 1):
        # Check if the last 'match_len' words of prev match first 'match_len' of new
        prev_suffix = " ".join(overlap_prev[-match_len:]).lower()
        new_prefix = " ".join(new_words[:match_len]).lower()
        
        # Use fuzzy matching for robustness against minor transcription differences
        similarity = SequenceMatcher(None, prev_suffix, new_prefix).ratio()
        if similarity > 0.85:  # 85% similarity threshold
            best_match_len = match_len
    
    # Remove the overlapping prefix from new text
    if best_match_len > 0:
        deduplicated = " ".join(new_words[best_match_len:])
        return deduplicated.strip()
    
    return new_text.strip()


class WhisperTranscriber:
    """Thread-safe Whisper transcriber with streaming support."""
    
    def __init__(self) -> None:
        self._processor: WhisperProcessor | None = None
        self._model: WhisperForConditionalGeneration | None = None
        self._device: str | None = None
        self._lock = threading.Lock()

    def _ensure_loaded(self) -> None:
        with self._lock:
            if self._processor is not None and self._model is not None:
                return

            logger.info("Loading Whisper model: %s", MODEL_NAME)
            self._processor = WhisperProcessor.from_pretrained(MODEL_NAME)
            self._model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)
            
            # Set language to English to avoid multilingual detection warnings
            self._model.config.forced_decoder_ids = self._processor.get_decoder_prompt_ids(
                language="en", task="transcribe"
            )
            
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            self._model = self._model.to(self._device)
            logger.info("Whisper model loaded on %s", self._device)

    def warmup(self) -> None:
        """Pre-load the model to avoid cold start delays on first transcription."""
        logger.info("Warming up Whisper model...")
        self._ensure_loaded()
        
        # Run a dummy inference to fully initialize CUDA kernels
        if self._processor is not None and self._model is not None and self._device is not None:
            dummy_audio = np.zeros(SAMPLE_RATE, dtype=np.float32)  # 1 second of silence
            input_features = self._processor(
                dummy_audio,
                sampling_rate=SAMPLE_RATE,
                return_tensors="pt",
            ).input_features.to(self._device)
            
            with torch.no_grad():
                _ = self._model.generate(input_features, max_new_tokens=1)
        
        logger.info("Whisper model warmup complete")

    def transcribe(self, audio_bytes: bytes) -> TranscriptionResult:
        """Transcribe raw audio bytes (in container format like WebM)."""
        self._ensure_loaded()
        if self._processor is None or self._model is None or self._device is None:
            return TranscriptionResult(text="", duration_seconds=0.0)

        audio = decode_audio_bytes(audio_bytes)
        return self.transcribe_audio(audio)

    def transcribe_audio(self, audio: np.ndarray, detect_boundaries: bool = False) -> TranscriptionResult:
        """
        Transcribe PCM audio samples.
        
        Args:
            audio: Float32 audio samples at SAMPLE_RATE
            detect_boundaries: If True, trim silence from audio boundaries
        """
        self._ensure_loaded()
        if self._processor is None or self._model is None or self._device is None:
            return TranscriptionResult(text="", duration_seconds=0.0)

        if audio.size == 0:
            return TranscriptionResult(text="", duration_seconds=0.0)

        # Optionally trim silence
        if detect_boundaries:
            start_idx, end_idx = find_speech_boundaries(audio)
            if end_idx > start_idx:
                audio = audio[start_idx:end_idx]

        # Skip if too short
        if audio.size < MIN_SPEECH_SAMPLES:
            return TranscriptionResult(text="", duration_seconds=0.0)

        input_features = self._processor(
            audio,
            sampling_rate=SAMPLE_RATE,
            return_tensors="pt",
        ).input_features.to(self._device)

        predicted_ids = self._model.generate(input_features)
        transcription = self._processor.batch_decode(
            predicted_ids, skip_special_tokens=True
        )[0]

        duration_seconds = audio.size / SAMPLE_RATE
        return TranscriptionResult(text=transcription.strip(), duration_seconds=duration_seconds)

    def transcribe_streaming_chunk(
        self,
        audio: np.ndarray,
        state: StreamingTranscriptionState,
        overlap_samples: int = int(OVERLAP_CONTEXT_SECONDS * SAMPLE_RATE),
    ) -> StreamingChunkResult:
        """
        Transcribe an audio chunk with state tracking and deduplication.
        
        This method is optimized for streaming:
        - Includes overlap context for word boundary handling
        - Deduplicates text that appears due to overlap
        - Tracks accumulated transcript
        
        Args:
            audio: The audio chunk to transcribe (should include overlap from previous)
            state: Streaming state object (modified in-place)
            overlap_samples: Number of samples of overlap context included
            
        Returns:
            StreamingChunkResult with deduplicated chunk and full transcript
        """
        self._ensure_loaded()
        
        # Check for speech activity
        has_speech = detect_speech_activity(audio)
        if not has_speech:
            return StreamingChunkResult(
                chunk_text="",
                full_text=state.accumulated_text,
                confidence=0.0,
                has_speech=False,
            )

        # Transcribe the chunk
        result = self.transcribe_audio(audio, detect_boundaries=True)
        
        if not result.text:
            return StreamingChunkResult(
                chunk_text="",
                full_text=state.accumulated_text,
                confidence=0.0,
                has_speech=has_speech,
            )

        # Deduplicate against previous overlap
        chunk_text = deduplicate_transcript(result.text, state.last_overlap_text)
        
        # Update state
        if chunk_text:
            if state.accumulated_text:
                state.accumulated_text = f"{state.accumulated_text} {chunk_text}"
            else:
                state.accumulated_text = chunk_text
            
            state.chunk_history.append(chunk_text)
            
            # Keep last portion for next deduplication
            words = result.text.split()
            state.last_overlap_text = " ".join(words[-8:]) if len(words) > 8 else result.text

        # Estimate confidence based on speech activity strength
        rms = np.sqrt(np.mean(audio ** 2))
        confidence = min(1.0, rms / (SILENCE_THRESHOLD * 10))

        return StreamingChunkResult(
            chunk_text=chunk_text,
            full_text=state.accumulated_text,
            confidence=confidence,
            has_speech=True,
        )


# Global transcriber instance
transcriber = WhisperTranscriber()
