# 🎙️ VoiceStream WebSocket

Real-time voice streaming and transcription application using WebSocket communication. Captures audio from the browser, streams it to a FastAPI backend, and returns live transcriptions using OpenAI's Whisper model.

## 📋 Features

- **Real-time Audio Streaming**: Continuous 100ms audio chunks via WebSocket
- **Live Transcription**: Whisper-based speech-to-text every ~3 seconds
- **Low Latency**: Incremental chunk processing with overlap context
- **Beautiful UI**: Modern glassmorphism design with audio visualizer
- **Progress Tracking**: Real-time stats (chunk size, total data, packets)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  MediaRecorder (100ms chunks)  →  WebSocket  →  Display Transcripts         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↕ WebSocket (ws://localhost:8080/ws/voice)
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (FastAPI)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Receive Chunks  →  Buffer Audio  →  Whisper Transcription  →  Send Result  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

| Step | Component | Action |
|------|-----------|--------|
| 1 | Frontend | MediaRecorder captures audio in 100ms chunks |
| 2 | Frontend | Sends audio chunk via WebSocket |
| 3 | Backend | Appends chunk to buffer, sends progress update |
| 4 | Backend | Every 30 chunks (~3s): decode + transcribe |
| 5 | Backend | Extract NEW audio with 0.5s overlap context |
| 6 | Backend | Whisper transcribes, sends result to frontend |
| 7 | Frontend | Displays accumulated transcription |

### Transcription Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `TRANSCRIBE_EVERY_CHUNKS` | 30 | Transcribe every 30 chunks (~3 seconds) |
| `OVERLAP_SAMPLES` | 8000 | 0.5s overlap at 16kHz (avoids mid-word cuts) |
| Whisper Model | `openai/whisper-base` | Can be changed in `voice_stream.py` |

## 📁 Project Structure

```
voicestream_websocket/
├── frontend/                    # Next.js frontend
│   ├── app/
│   │   ├── page.tsx            # Home page
│   │   ├── stream/
│   │   │   └── page.tsx        # Voice streaming page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── home/
│   │   │   └── BackgroundBlobs.tsx
│   │   └── stream/
│   │       └── VoiceVisualizer.tsx
│   └── hooks/
│       └── useVoiceStream.ts   # WebSocket hook
│
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entry
│   │   ├── routers/
│   │   │   └── voice_stream.py # WebSocket endpoint
│   │   └── services/
│   │       └── voice_stream.py # Whisper transcription
│   ├── recordings/             # Saved audio files
│   └── requirements.txt
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (3.10+)
- **FFmpeg** (for audio decoding)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --port 8080 --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Stream Page**: http://localhost:3000/stream

## 🔧 Configuration

### Change Whisper Model

Edit `backend/app/services/voice_stream.py`:

```python
MODEL_NAME = "openai/whisper-base"  # Options: whisper-tiny, whisper-small, whisper-medium, whisper-large
```

### Adjust Transcription Interval

Edit `backend/app/routers/voice_stream.py`:

```python
TRANSCRIBE_EVERY_CHUNKS = 30  # Lower = more frequent, higher latency per chunk
OVERLAP_SAMPLES = 8000        # 0.5s at 16kHz sample rate
```

### Frontend Chunk Interval

Edit `frontend/app/stream/page.tsx`:

```typescript
mediaRecorder.start(100);  // 100ms chunks
```

## 📡 WebSocket Messages

### Frontend → Backend

| Type | Description |
|------|-------------|
| `stream_start` | Signal to start a new recording session |
| `stream_end` | Signal to end recording and finalize |
| `metadata` | Audio metadata (mimeType, sampleRate) |
| Binary data | Raw audio chunks |

### Backend → Frontend

| Type | Description |
|------|-------------|
| `audio_progress` | Stats: chunkBytes, totalBytes, totalChunks |
| `chunk_transcript` | Transcription: chunkText, fullText, isFinal |

## 🎨 UI Features

- **Glassmorphism design** with blur effects
- **Real-time audio visualizer** with waveform
- **Connection status indicator**
- **Recording duration timer**
- **Network statistics panel**
- **Live transcription display**

## 📝 Saved Recordings

Audio recordings and metadata are saved to `backend/recordings/`:

```
recordings/
├── voice-20260111T120000Z-abc123.webm  # Audio file
└── voice-20260111T120000Z-abc123.json  # Metadata
```

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS (optional)
- Lucide Icons

### Backend
- FastAPI
- Python 3.10+
- Whisper (transformers)
- PyTorch
- FFmpeg

## 📄 License

MIT License
