"use client";

import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
    audioLevel: number;
    isRecording: boolean;
}

export default function VoiceVisualizer({ audioLevel, isRecording }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const barsRef = useRef<number[]>(Array(80).fill(0));
    const phaseRef = useRef(0);

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

        const barCount = 80;
        const barWidth = (rect.width / barCount) * 0.6;
        const spacing = (rect.width / barCount) * 0.4;
        const centerY = rect.height / 2;

        const animate = () => {
            // Create a subtle radial gradient background
            const bgGradient = ctx.createRadialGradient(
                rect.width / 2, centerY, 0,
                rect.width / 2, centerY, rect.width / 2
            );

            if (isRecording) {
                bgGradient.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
                bgGradient.addColorStop(1, 'rgba(244, 63, 94, 0.01)');
            } else {
                bgGradient.addColorStop(0, 'rgba(148, 163, 184, 0.02)');
                bgGradient.addColorStop(1, 'rgba(100, 116, 139, 0.01)');
            }

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, rect.width, rect.height);

            phaseRef.current += 0.02;

            // Update bars with smooth interpolation
            for (let i = 0; i < barCount; i++) {
                const normalizedPosition = i / barCount;
                const centerDistance = Math.abs(normalizedPosition - 0.5) * 2;

                let targetHeight;

                if (isRecording) {
                    // Dynamic recording animation with wave effect
                    const wave1 = Math.sin(phaseRef.current + i * 0.15) * 0.5 + 0.5;
                    const wave2 = Math.sin(phaseRef.current * 1.5 + i * 0.1) * 0.3 + 0.7;
                    const randomVariation = Math.random() * 0.4 + 0.6;

                    // Center bars are more prominent
                    const centerBoost = 1 - centerDistance * 0.3;

                    targetHeight = (
                        audioLevel * 180 * wave1 * wave2 * randomVariation * centerBoost +
                        audioLevel * 40 +
                        8
                    );
                } else {
                    // Elegant idle animation
                    const wave = Math.sin(phaseRef.current * 0.8 + i * 0.12);
                    const pulse = Math.sin(phaseRef.current * 0.5) * 0.3 + 0.7;
                    targetHeight = wave * 12 * pulse + 6;
                }

                // Smooth elastic interpolation
                const smoothing = isRecording ? 0.15 : 0.08;
                barsRef.current[i] += (targetHeight - barsRef.current[i]) * smoothing;

                const barHeight = Math.max(4, barsRef.current[i]);
                const x = i * (barWidth + spacing) + spacing / 2;

                // Create vibrant gradient for each bar
                const gradient = ctx.createLinearGradient(
                    0, centerY - barHeight / 2,
                    0, centerY + barHeight / 2
                );

                if (isRecording) {
                    // Multi-color gradient based on position and audio level
                    const hue1 = 270 + normalizedPosition * 30; // Violet to Purple
                    const hue2 = 340 + normalizedPosition * 20; // Rose to Pink
                    const saturation = 70 + audioLevel * 30;
                    const lightness = 55 + audioLevel * 10;

                    gradient.addColorStop(0, `hsla(${hue1}, ${saturation}%, ${lightness}%, 0.9)`);
                    gradient.addColorStop(0.5, `hsla(${hue2}, ${saturation + 10}%, ${lightness + 5}%, 1)`);
                    gradient.addColorStop(1, `hsla(${hue1}, ${saturation}%, ${lightness}%, 0.9)`);
                } else {
                    // Subtle monochromatic gradient for idle state
                    gradient.addColorStop(0, 'rgba(148, 163, 184, 0.4)');
                    gradient.addColorStop(0.5, 'rgba(148, 163, 184, 0.7)');
                    gradient.addColorStop(1, 'rgba(148, 163, 184, 0.4)');
                }

                ctx.fillStyle = gradient;

                // Calculate glow intensity for shadow effects
                const glowIntensity = audioLevel * 30 + 10;

                // Enhanced glow effect when recording
                if (isRecording) {
                    ctx.shadowBlur = glowIntensity;
                    ctx.shadowColor = `rgba(244, 63, 94, ${audioLevel * 0.6 + 0.2})`;
                }

                // Draw rounded bars with dynamic corner radius
                const cornerRadius = Math.min(barWidth / 2, 8);
                ctx.beginPath();
                ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, cornerRadius);
                ctx.fill();

                // Add reflection effect for premium look
                if (isRecording && audioLevel > 0.1) {
                    ctx.shadowBlur = glowIntensity * 1.5;
                    ctx.shadowColor = `rgba(139, 92, 246, ${audioLevel * 0.4})`;
                    ctx.fill();
                }

                // Reset shadow
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';

                // Add subtle highlight on top of bars
                if (barHeight > 20) {
                    const highlightGradient = ctx.createLinearGradient(
                        0, centerY - barHeight / 2,
                        0, centerY - barHeight / 2 + 10
                    );
                    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = highlightGradient;
                    ctx.beginPath();
                    ctx.roundRect(x, centerY - barHeight / 2, barWidth, Math.min(10, barHeight / 3), cornerRadius);
                    ctx.fill();
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
        <div className="relative h-64 w-full flex items-center justify-center overflow-hidden">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
            />

            {/* Decorative elements */}
            {isRecording && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-rose-500/5 to-violet-500/5 pointer-events-none animate-pulse" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
                </>
            )}
        </div>
    );
}
