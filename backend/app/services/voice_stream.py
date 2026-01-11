import logging
import subprocess
import threading
from dataclasses import dataclass

import numpy as np
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor

logger = logging.getLogger(__name__)

MODEL_NAME = "openai/whisper-tiny"
SAMPLE_RATE = 16000


@dataclass
class TranscriptionResult:
    text: str
    duration_seconds: float


def decode_audio_bytes(audio_bytes: bytes) -> np.ndarray:
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


class WhisperTranscriber:
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
            self._model.config.forced_decoder_ids = None
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            self._model = self._model.to(self._device)
            logger.info("Whisper model loaded on %s", self._device)

    def transcribe(self, audio_bytes: bytes) -> TranscriptionResult:
        self._ensure_loaded()
        if self._processor is None or self._model is None or self._device is None:
            return TranscriptionResult(text="", duration_seconds=0.0)

        audio = decode_audio_bytes(audio_bytes)
        return self.transcribe_audio(audio)

    def transcribe_audio(self, audio: np.ndarray) -> TranscriptionResult:
        self._ensure_loaded()
        if self._processor is None or self._model is None or self._device is None:
            return TranscriptionResult(text="", duration_seconds=0.0)

        if audio.size == 0:
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


transcriber = WhisperTranscriber()
