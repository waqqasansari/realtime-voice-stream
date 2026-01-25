"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface VoiceVisualizerProps {
    audioLevel: number;
    isRecording: boolean;
}

export default function VoiceVisualizer({ audioLevel, isRecording }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const barsRef = useRef<number[]>(Array(100).fill(0));
    const phaseRef = useRef(0);
    const glowRef = useRef(0);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const isDark = resolvedTheme === "dark";

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const barCount = 100;

        // Theme-aware colors
        const colors = {
            // Background colors
            bgFade: isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
            // Recording gradient colors
            recordingGradientStart: isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(99, 102, 241, 0.08)',
            recordingGradientMid: isDark ? 'rgba(244, 63, 94, 0.03)' : 'rgba(236, 72, 153, 0.05)',
            // Idle gradient colors
            idleGradientStart: isDark ? 'rgba(100, 116, 139, 0.03)' : 'rgba(100, 116, 139, 0.05)',
            // Bar colors for idle
            idleBarColor: isDark ? 'rgba(148, 163, 184, ' : 'rgba(100, 116, 139, ',
            // Glow colors
            primaryGlow: isDark ? 'rgba(139, 92, 246, ' : 'rgba(99, 102, 241, ',
            secondaryGlow: isDark ? 'rgba(236, 72, 153, ' : 'rgba(219, 39, 119, ',
            // Line colors
            lineColor: isDark ? 'rgba(139, 92, 246, ' : 'rgba(99, 102, 241, ',
            lineColorAlt: isDark ? 'rgba(236, 72, 153, ' : 'rgba(219, 39, 119, ',
        };

        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            const barWidth = (rect.width / barCount) * 0.55;
            const spacing = (rect.width / barCount) * 0.45;
            const centerY = rect.height / 2;

            // Clear with fade effect for trails
            ctx.fillStyle = colors.bgFade;
            ctx.fillRect(0, 0, rect.width, rect.height);

            // Subtle radial gradient background
            const bgGradient = ctx.createRadialGradient(
                rect.width / 2, centerY, 0,
                rect.width / 2, centerY, rect.width / 2
            );

            if (isRecording) {
                bgGradient.addColorStop(0, colors.recordingGradientStart);
                bgGradient.addColorStop(0.5, colors.recordingGradientMid);
                bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                bgGradient.addColorStop(0, colors.idleGradientStart);
                bgGradient.addColorStop(1, isDark ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)');
            }

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, rect.width, rect.height);

            phaseRef.current += isRecording ? 0.04 : 0.015;
            glowRef.current = Math.sin(phaseRef.current * 0.5) * 0.5 + 0.5;

            // Update and draw bars
            for (let i = 0; i < barCount; i++) {
                const normalizedPosition = i / barCount;
                const centerDistance = Math.abs(normalizedPosition - 0.5) * 2;

                let targetHeight;

                if (isRecording) {
                    // Dynamic multi-wave recording animation
                    const wave1 = Math.sin(phaseRef.current * 1.2 + i * 0.12) * 0.5 + 0.5;
                    const wave2 = Math.sin(phaseRef.current * 0.8 + i * 0.08 + 1) * 0.4 + 0.6;
                    const wave3 = Math.sin(phaseRef.current * 2 + i * 0.2) * 0.3 + 0.7;
                    const randomVariation = Math.random() * 0.3 + 0.7;

                    // Stronger center prominence
                    const centerBoost = Math.pow(1 - centerDistance, 1.5) * 0.4 + 0.6;

                    targetHeight = (
                        audioLevel * 220 * wave1 * wave2 * wave3 * randomVariation * centerBoost +
                        audioLevel * 50 +
                        6
                    );
                } else {
                    // Elegant breathing idle animation
                    const wave = Math.sin(phaseRef.current + i * 0.1);
                    const pulse = Math.sin(phaseRef.current * 0.4) * 0.4 + 0.6;
                    const centerEffect = 1 - centerDistance * 0.5;
                    targetHeight = wave * 15 * pulse * centerEffect + 4;
                }

                // Smooth elastic interpolation
                const smoothing = isRecording ? 0.18 : 0.06;
                barsRef.current[i] += (targetHeight - barsRef.current[i]) * smoothing;

                const barHeight = Math.max(3, barsRef.current[i]);
                const x = i * (barWidth + spacing) + spacing / 2;

                // Create premium gradient for each bar
                const gradient = ctx.createLinearGradient(
                    0, centerY - barHeight / 2,
                    0, centerY + barHeight / 2
                );

                if (isRecording) {
                    // Dynamic color based on position and audio level
                    const hue = 260 + (normalizedPosition * 60) + (audioLevel * 20);
                    const saturation = 75 + audioLevel * 25;
                    const lightness = isDark ? (50 + audioLevel * 15) : (45 + audioLevel * 10);

                    gradient.addColorStop(0, `hsla(${hue - 20}, ${saturation}%, ${lightness + 10}%, 0.85)`);
                    gradient.addColorStop(0.4, `hsla(${hue}, ${saturation + 10}%, ${lightness + 5}%, 1)`);
                    gradient.addColorStop(0.6, `hsla(${hue + 40}, ${saturation + 10}%, ${lightness}%, 1)`);
                    gradient.addColorStop(1, `hsla(${hue - 20}, ${saturation}%, ${lightness + 10}%, 0.85)`);
                } else {
                    // Theme-aware monochromatic for idle
                    const baseOpacity = isDark ? 0.3 : 0.5;
                    const pulseOpacity = isDark ? 0.2 : 0.3;
                    const opacity = baseOpacity + glowRef.current * pulseOpacity;
                    gradient.addColorStop(0, `${colors.idleBarColor}${opacity * 0.5})`);
                    gradient.addColorStop(0.5, `${colors.idleBarColor}${opacity})`);
                    gradient.addColorStop(1, `${colors.idleBarColor}${opacity * 0.5})`);
                }

                // Enhanced glow effect when recording
                if (isRecording && audioLevel > 0.1) {
                    const glowIntensity = audioLevel * 40 + 15;
                    ctx.shadowBlur = glowIntensity;
                    ctx.shadowColor = `${colors.primaryGlow}${audioLevel * 0.7})`;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = gradient;

                // Draw rounded bar
                const cornerRadius = Math.min(barWidth / 2, 6);
                ctx.beginPath();
                ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, cornerRadius);
                ctx.fill();

                // Add secondary glow layer for recording
                if (isRecording && audioLevel > 0.2 && barHeight > 30) {
                    ctx.shadowBlur = audioLevel * 60;
                    ctx.shadowColor = `${colors.secondaryGlow}${audioLevel * 0.4})`;
                    ctx.fill();
                }

                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';

                // Premium highlight effect
                if (barHeight > 25 && isRecording) {
                    const highlightGradient = ctx.createLinearGradient(
                        0, centerY - barHeight / 2,
                        0, centerY - barHeight / 2 + barHeight * 0.3
                    );
                    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
                    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = highlightGradient;
                    ctx.beginPath();
                    ctx.roundRect(
                        x + barWidth * 0.1,
                        centerY - barHeight / 2 + 1,
                        barWidth * 0.8,
                        Math.min(barHeight * 0.35, 15),
                        cornerRadius * 0.8
                    );
                    ctx.fill();
                }
            }

            // Draw center line glow when recording
            if (isRecording) {
                const lineGradient = ctx.createLinearGradient(0, 0, rect.width, 0);
                lineGradient.addColorStop(0, `${colors.lineColor}0)`);
                lineGradient.addColorStop(0.3, `${colors.lineColor}${audioLevel * 0.3})`);
                lineGradient.addColorStop(0.5, `${colors.lineColorAlt}${audioLevel * 0.4})`);
                lineGradient.addColorStop(0.7, `${colors.lineColor}${audioLevel * 0.3})`);
                lineGradient.addColorStop(1, `${colors.lineColor}0)`);

                ctx.strokeStyle = lineGradient;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, centerY);
                ctx.lineTo(rect.width, centerY);
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioLevel, isRecording, resolvedTheme]);

    return (
        <div className="relative h-56 md:h-72 w-full flex items-center justify-center overflow-hidden rounded-2xl">
            {/* Base background - theme aware */}
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.02] to-foreground/5 dark:from-black/20 dark:to-black/40 transition-colors duration-500" />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="relative w-full h-full z-10"
                style={{ width: "100%", height: "100%" }}
            />

            {/* Decorative overlays */}
            {isRecording && (
                <>
                    {/* Pulsing gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-rose-500/5 to-violet-500/5 pointer-events-none animate-pulse" style={{ animationDuration: '2s' }} />

                    {/* Top edge glow */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

                    {/* Bottom edge glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-violet-500/30 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-violet-500/30 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-rose-500/30 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-rose-500/30 rounded-br-xl" />
                </>
            )}

            {/* Scanline effect - theme aware */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                }}
            />
        </div>
    );
}
