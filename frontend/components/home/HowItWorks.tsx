"use client";

import { Mic, Radio, Headphones, Zap } from "lucide-react";

const steps = [
    {
        icon: Mic,
        title: "Capture",
        description: "High-fidelity audio capture with Opus 48kHz codec for crystal-clear voice quality.",
        color: "from-emerald-500 to-teal-500",
    },
    {
        icon: Radio,
        title: "Stream",
        description: "WebSocket-powered bidirectional streaming with persistent, low-latency connections.",
        color: "from-blue-500 to-indigo-500",
    },
    {
        icon: Zap,
        title: "Process",
        description: "Edge-computed real-time processing ensures sub-50ms end-to-end latency.",
        color: "from-violet-500 to-purple-500",
    },
    {
        icon: Headphones,
        title: "Deliver",
        description: "Seamless audio delivery with adaptive quality based on network conditions.",
        color: "from-pink-500 to-rose-500",
    },
];

export default function HowItWorks() {
    return (
        <section className="w-full max-w-6xl mx-auto px-4 py-20">
            {/* Section Header */}
            <div className="text-center mb-16">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase mb-4">
                    How It Works
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                    From Voice to
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-pink-500"> Stream</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    A seamless pipeline designed for real-time communication at scale.
                </p>
            </div>

            {/* Steps */}
            <div className="relative">
                {/* Connection line (desktop only) */}
                <div className="hidden md:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div
                            key={step.title}
                            className="relative flex flex-col items-center text-center group"
                        >
                            {/* Step number */}
                            <span className="absolute -top-2 -right-2 md:top-0 md:right-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-6 h-6 rounded-full bg-background border-2 border-primary text-primary text-xs font-bold flex items-center justify-center z-20">
                                {index + 1}
                            </span>

                            {/* Icon container */}
                            <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                                    <step.icon className={`w-8 h-8 bg-gradient-to-br ${step.color} bg-clip-text text-transparent`} style={{ stroke: "url(#gradient)" }} />
                                    <step.icon className={`w-8 h-8 absolute opacity-50 blur-sm bg-gradient-to-br ${step.color} bg-clip-text`} style={{ stroke: "url(#gradient)" }} />
                                </div>
                                {/* Glow */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* SVG Gradient Definition */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
            </svg>
        </section>
    );
}
