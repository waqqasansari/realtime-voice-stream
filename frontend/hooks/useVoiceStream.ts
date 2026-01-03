"use client";

import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = "ws://localhost:8080/ws/voice";

type AudioProgress = {
    type: "audio_progress";
    chunkBytes: number;
    totalBytes: number;
    totalChunks: number;
};

export default function useVoiceStream() {
    const [isConnected, setIsConnected] = useState(false);
    const [audioProgress, setAudioProgress] = useState<AudioProgress | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);

    const connect = () => {
        try {
            const ws = new WebSocket(WEBSOCKET_URL);

            ws.onopen = () => {
                console.log("WebSocket connected");
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected");
                setIsConnected(false);
                websocketRef.current = null;

                // Attempt to reconnect with exponential backoff
                if (reconnectAttemptsRef.current < 5) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
                    console.log(`Reconnecting in ${delay}ms...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data) as AudioProgress;
                    if (payload.type === "audio_progress") {
                        setAudioProgress(payload);
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

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (websocketRef.current) {
                websocketRef.current.close();
            }
        };
    }, []);

    const sendAudioData = (audioData: ArrayBuffer) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(audioData);
        } else {
            console.warn("WebSocket is not connected. Cannot send audio data.");
        }
    };

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

    const clearAudioProgress = () => {
        setAudioProgress(null);
    };

    return {
        isConnected,
        audioProgress,
        sendAudioData,
        sendMetadata,
        sendControl,
        clearAudioProgress,
    };
}
