"use client";

import { Activity, Mic, Zap, Shield, Cpu, Globe } from "lucide-react";

const features = [
  {
    label: "Latency",
    value: "<50ms",
    icon: Activity,
    description: "Edge-computed real-time processing with global infrastructure.",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    label: "Protocol",
    value: "WebSocket",
    icon: Zap,
    description: "Persistent bi-directional connections for instant communication.",
    gradient: "from-blue-500 to-indigo-500"
  },
  {
    label: "Codec",
    value: "Opus 48kHz",
    icon: Mic,
    description: "Studio-grade voice clarity with adaptive bitrate control.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    label: "Security",
    value: "E2E Encrypted",
    icon: Shield,
    description: "End-to-end encryption with TLS 1.3 for all streams.",
    gradient: "from-rose-500 to-pink-500"
  },
  {
    label: "Processing",
    value: "Edge AI",
    icon: Cpu,
    description: "On-device processing for privacy-first voice enhancement.",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    label: "Coverage",
    value: "Global CDN",
    icon: Globe,
    description: "200+ edge locations for minimal latency worldwide.",
    gradient: "from-cyan-500 to-blue-500"
  },
];

export default function FeatureGrid() {
  return (
    <div className="w-full py-16">
      {/* Section Header */}
      <div className="text-center mb-16">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
          Core Features
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Enterprise-Grade
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> Infrastructure</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Everything you need to build world-class voice applications.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={feature.label}
            className="group relative flex flex-col p-6 rounded-3xl bg-card backdrop-blur-sm border border-card-border overflow-hidden hover:bg-card/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top border gradient on hover */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10 flex items-start gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                {/* Value */}
                <div className="text-2xl font-bold text-foreground mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all duration-300">
                  {feature.value}
                </div>

                {/* Label */}
                <div className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-2">
                  {feature.label}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
