"use client";

import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
    audioLevel: number;
    isRecording: boolean;
}

export default function VoiceVisualizer({ audioLevel, isRecording }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const barsRef = useRef<number[]>(Array(40).fill(0)); // Reduced bar count for wider, cleaner bars

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

        const barCount = 40;
        const barWidth = (rect.width / barCount) * 0.6; // Create spacing between bars
        const spacing = (rect.width / barCount) * 0.4;
        const centerY = rect.height / 2;

        const animate = () => {
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Update bars with smooth interpolation
            for (let i = 0; i < barCount; i++) {
                const targetHeight = isRecording
                    ? Math.random() * audioLevel * 120 + audioLevel * 30 + 5
                    : Math.sin((Date.now() / 1000 + i * 0.2)) * 15 + 5;

                // Smooth interpolation
                barsRef.current[i] += (targetHeight - barsRef.current[i]) * 0.15;

                const barHeight = Math.max(4, barsRef.current[i]);
                const x = i * (barWidth + spacing) + spacing / 2;

                // Create gradient for each bar
                const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);

                if (isRecording) {
                    gradient.addColorStop(0, '#a855f7'); // purple-500
                    gradient.addColorStop(0.5, '#ec4899'); // pink-500
                    gradient.addColorStop(1, '#3b82f6'); // blue-500
                } else {
                    gradient.addColorStop(0, '#a1a1aa'); // zinc-400
                    gradient.addColorStop(1, '#71717a'); // zinc-500
                }

                ctx.fillStyle = gradient;

                // Draw rounded bars
                ctx.beginPath();
                ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 4);
                ctx.fill();

                // Add glow effect when recording
                if (isRecording && audioLevel > 0.1) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
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
        <div className="relative w-full max-w-2xl mx-auto">
            {/* Main Glass Container */}
            <div className={`
                relative p-1 rounded-3xl transition-all duration-500
                ${isRecording
                    ? 'bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30 shadow-2xl shadow-purple-500/20'
                    : 'bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10'
                }
            `}>
                <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl rounded-[22px] overflow-hidden p-8 border border-white/50 dark:border-white/10">

                    {/* Visualizer Canvas */}
                    <div className="relative h-48 w-full flex items-center justify-center">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full"
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>

                    {/* Status Text & Level */}
                    <div className="mt-6 flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-400'}`} />
                            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                {isRecording ? 'Listening...' : 'Ready'}
                            </span>
                        </div>
                        <div className="text-sm font-medium font-mono text-zinc-500 dark:text-zinc-500">
                            {Math.round(audioLevel * 100)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
