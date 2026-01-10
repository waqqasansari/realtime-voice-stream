"use client";

import { useEffect, useRef, useState } from "react";

// The backend WebSocket endpoint URL
const WEBSOCKET_URL = "ws://localhost:8080/ws/voice";

/**
 * Type defining the structure of progress updates received from the server.
 */
type AudioProgress = {
    type: "audio_progress";
    chunkBytes: number;
    totalBytes: number;
    totalChunks: number;
};

/**
 * Type defining the structure of simulated captions received from the server.
 */
type TranscriptUpdate = {
    type: "transcript_update" | "chunk_caption";
    chunkIndex: number;
    text: string;
};

/**
 * A custom hook to manage WebSocket communication for voice streaming.
 * It handles connection lifecycle, automatic reconnection, and data transmission.
 */
export default function useVoiceStream() {
    // UI state for connection status and incoming data
    const [isConnected, setIsConnected] = useState(false);
    const [audioProgress, setAudioProgress] = useState<AudioProgress | null>(null);
    const [transcript, setTranscript] = useState("");
    const lastTranscriptRef = useRef("");

    // Refs to persist values across renders without triggering re-renders
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);

    /**
     * Establishes a WebSocket connection to the backend.
     */
    const connect = () => {
        try {
            const ws = new WebSocket(WEBSOCKET_URL);

            // Handler for successful connection
            ws.onopen = () => {
                console.log("WebSocket connected");
                setIsConnected(true);
                reconnectAttemptsRef.current = 0; // Reset retry counter
            };

            // Handler for connection closure (planned or unplanned)
            ws.onclose = () => {
                console.log("WebSocket disconnected");
                setIsConnected(false);
                websocketRef.current = null;

                // Attempt to reconnect with exponential backoff (max 5 retries)
                if (reconnectAttemptsRef.current < 5) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
                    console.log(`Reconnecting in ${delay}ms...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                }
            };

            // Handler for WebSocket errors
            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            // Handler for incoming messages from the backend
            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data) as AudioProgress | TranscriptUpdate;

                    // Route the message based on its 'type' property
                    if (payload.type === "audio_progress") {
                        setAudioProgress(payload);
                    } else if (payload.type === "transcript_update" || payload.type === "chunk_caption") {
                        // The backend sends the full cumulative transcript each time
                        // (it transcribes the entire audio buffer from the start).
                        // So we should just use the latest transcript as-is.
                        const incoming = payload.text.trim();
                        if (incoming) {
                            setTranscript(incoming);
                            lastTranscriptRef.current = incoming;
                        }
                    }
                } catch (error) {
                    console.warn("Unable to parse WebSocket message:", error);
                }
            };

            websocketRef.current = ws;
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            setIsConnected(false);
        }
    };

    // Effect to connect on mount and cleanup on unmount
    useEffect(() => {
        connect();

        return () => {
            // Cancel any pending reconnect attempts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            // Close the connection if the component is removed from the DOM
            if (websocketRef.current) {
                websocketRef.current.close();
            }
        };
    }, []);

    /**
     * Sends raw binary audio data (e.g., from MediaRecorder) over the WebSocket.
     */
    const sendAudioData = (audioData: ArrayBuffer) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(audioData);
        } else {
            console.warn("WebSocket is not connected. Cannot send audio data.");
        }
    };

    /**
     * Sends descriptive metadata (MIME type, user settings) to the server.
     */
    const sendMetadata = (metadata: Record<string, any>) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(
                JSON.stringify({
                    type: "metadata",
                    metadata,
                })
            );
        } else {
            console.warn("WebSocket is not connected. Cannot send metadata.");
        }
    };

    /**
     * Sends "start" or "end" control signals to manage the streaming lifecycle.
     */
    const sendControl = (type: "stream_start" | "stream_end", metadata?: Record<string, any>) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(
                JSON.stringify({
                    type,
                    metadata,
                })
            );
        } else {
            console.warn("WebSocket is not connected. Cannot send control message.");
        }
    };

    /**
     * Resets the progress and captions state in the UI.
     */
    const clearAudioProgress = () => {
        setAudioProgress(null);
        setTranscript("");
        lastTranscriptRef.current = "";
    };

    return {
        isConnected,
        audioProgress,
        transcript,
        sendAudioData,
        sendMetadata,
        sendControl,
        clearAudioProgress,
    };
}
