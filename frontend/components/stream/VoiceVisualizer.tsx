"use client";

import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
    audioLevel: number;
    isRecording: boolean;
}

export default function VoiceVisualizer({ audioLevel, isRecording }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const barsRef = useRef<number[]>(Array(60).fill(0));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);

        const barCount = 60;
        const barWidth = (rect.width / barCount) * 0.5;
        const spacing = (rect.width / barCount) * 0.5;
        const centerY = rect.height / 2;

        const animate = () => {
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Update bars with smooth interpolation
            for (let i = 0; i < barCount; i++) {
                const targetHeight = isRecording
                    ? Math.random() * audioLevel * 150 + audioLevel * 50 + 4
                    : Math.sin((Date.now() / 800 + i * 0.1)) * 10 + 4; // Idle animation

                // Elastic interpolation for premium feel
                barsRef.current[i] += (targetHeight - barsRef.current[i]) * 0.2;

                const barHeight = Math.max(4, barsRef.current[i]);
                const x = i * (barWidth + spacing) + spacing / 2;

                // Create gradient for each bar
                const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);

                if (isRecording) {
                    // Vibrant recording colors (Violet to Rose)
                    gradient.addColorStop(0, '#8b5cf6'); // Violet
                    gradient.addColorStop(0.5, '#f43f5e'); // Rose
                    gradient.addColorStop(1, '#8b5cf6'); // Violet
                } else {
                    // Subtle idle colors (Slate/zinc)
                    gradient.addColorStop(0, 'rgba(148, 163, 184, 0.5)');
                    gradient.addColorStop(0.5, 'rgba(148, 163, 184, 0.8)');
                    gradient.addColorStop(1, 'rgba(148, 163, 184, 0.5)');
                }

                ctx.fillStyle = gradient;

                // Draw rounded bars
                ctx.beginPath();
                ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 10);
                ctx.fill();

                // Add glow effect when recording
                if (isRecording && audioLevel > 0.05) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioLevel, isRecording]);

    return (
        <div className="relative h-64 w-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}
