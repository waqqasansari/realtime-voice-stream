"use client";

import { useEffect, useRef } from "react";

export default function AudioWaveVisual() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener("resize", resize);

        const bars = 60;
        const barWidth = 4;
        const barGap = 4;
        let animationId: number;
        let time = 0;

        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const totalWidth = bars * (barWidth + barGap);
            const startX = centerX - totalWidth / 2;

            for (let i = 0; i < bars; i++) {
                // Create wave effect
                const frequency = 0.15;
                const amplitude = Math.sin(time * 0.02 + i * frequency) * 0.5 + 0.5;
                const wave2 = Math.sin(time * 0.015 + i * 0.2 + 2) * 0.3 + 0.5;
                const combined = (amplitude + wave2) / 2;

                const minHeight = 8;
                const maxHeight = rect.height * 0.6;
                const height = minHeight + combined * (maxHeight - minHeight);

                const x = startX + i * (barWidth + barGap);
                const y = centerY - height / 2;

                // Create gradient for each bar
                const gradient = ctx.createLinearGradient(x, y, x, y + height);
                gradient.addColorStop(0, "rgba(99, 102, 241, 0.9)");   // Indigo
                gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.9)"); // Purple
                gradient.addColorStop(1, "rgba(236, 72, 153, 0.8)");   // Pink

                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, height, 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Add glow effect
                ctx.shadowColor = "rgba(139, 92, 246, 0.5)";
                ctx.shadowBlur = 10;
            }

            time++;
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="relative w-full max-w-3xl mx-auto h-48 md:h-64">
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl rounded-full opacity-50" />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="relative w-full h-full z-10"
                style={{ display: "block" }}
            />

            {/* Decorative rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-primary/10 rounded-full animate-ping opacity-30" style={{ animationDuration: "3s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-accent/10 rounded-full animate-ping opacity-20" style={{ animationDuration: "4s" }} />
        </div>
    );
}
