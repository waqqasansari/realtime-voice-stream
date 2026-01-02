"use client";

import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = "ws://localhost:8080/ws/voice";

export default function useVoiceStream() {
    const [isConnected, setIsConnected] = useState(false);
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
            websocketRef.current.send(JSON.stringify(metadata));
        } else {
            console.warn("WebSocket is not connected. Cannot send metadata.");
        }
    };

    return {
        isConnected,
        sendAudioData,
        sendMetadata,
    };
}
