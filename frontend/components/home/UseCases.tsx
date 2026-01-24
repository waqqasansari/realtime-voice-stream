"use client";

import { Gamepad2, Video, Headset, Phone, Globe, Bot } from "lucide-react";

const useCases = [
    {
        icon: Gamepad2,
        title: "Gaming",
        description: "Real-time voice chat for competitive gaming with zero perceptible delay.",
        gradient: "from-green-500/20 to-emerald-500/20",
        borderGradient: "from-green-500 to-emerald-500",
    },
    {
        icon: Video,
        title: "Live Streaming",
        description: "Broadcast-quality audio for streamers and content creators.",
        gradient: "from-red-500/20 to-pink-500/20",
        borderGradient: "from-red-500 to-pink-500",
    },
    {
        icon: Headset,
        title: "Call Centers",
        description: "Enterprise-grade voice infrastructure for customer support teams.",
        gradient: "from-blue-500/20 to-cyan-500/20",
        borderGradient: "from-blue-500 to-cyan-500",
    },
    {
        icon: Phone,
        title: "VoIP Apps",
        description: "Build next-gen voice applications with our robust APIs.",
        gradient: "from-violet-500/20 to-purple-500/20",
        borderGradient: "from-violet-500 to-purple-500",
    },
    {
        icon: Globe,
        title: "Webinars",
        description: "Crystal-clear audio for virtual events and online conferences.",
        gradient: "from-orange-500/20 to-amber-500/20",
        borderGradient: "from-orange-500 to-amber-500",
    },
    {
        icon: Bot,
        title: "AI Voice Bots",
        description: "Low-latency streaming for conversational AI and voice assistants.",
        gradient: "from-indigo-500/20 to-blue-500/20",
        borderGradient: "from-indigo-500 to-blue-500",
    },
];

export default function UseCases() {
    return (
        <section className="w-full max-w-6xl mx-auto px-4 py-20">
            {/* Section Header */}
            <div className="text-center mb-16">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
                    Use Cases
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                    Built for
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> Every Industry</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    From gaming to enterprise, our infrastructure powers voice communication at any scale.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {useCases.map((useCase, index) => (
                    <div
                        key={useCase.title}
                        className="group relative overflow-hidden rounded-3xl bg-card border border-card-border p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Gradient background on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        {/* Top border gradient */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${useCase.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        {/* Content */}
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                                <useCase.icon className="w-6 h-6 text-foreground" />
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">{useCase.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{useCase.description}</p>
                        </div>

                        {/* Arrow indicator */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
