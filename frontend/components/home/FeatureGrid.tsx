import { Activity, Mic, Zap } from "lucide-react";

const features = [
  { label: "Latency", value: "< 50ms", icon: Activity, description: "Edge-computed real-time processing" },
  { label: "Protocol", value: "WebSocket", icon: Zap, description: "Persistent bi-directional connection" },
  { label: "Codec", value: "Opus 48kHz", icon: Mic, description: "Studio-grade voice clarity" },
];

export default function FeatureGrid() {
  return (
    <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10 px-4">
      {features.map((feature, index) => (
        <div
          key={feature.label}
          className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-card backdrop-blur-sm border border-card-border overflow-hidden hover:bg-card/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Hover Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 p-4 rounded-2xl bg-white/10 dark:bg-white/5 mb-4 group-hover:scale-110 transition-transform duration-500 ring-1 ring-white/20">
            <feature.icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
          </div>

          <div className="relative z-10 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 mb-2">
            {feature.value}
          </div>

          <div className="relative z-10 text-sm font-semibold text-primary/80 uppercase tracking-widest mb-2">
            {feature.label}
          </div>

          <p className="relative z-10 text-sm text-center text-muted-foreground/80 font-medium">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
