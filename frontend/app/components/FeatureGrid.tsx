import { Activity, Mic, Zap } from "lucide-react";

const features = [
  { label: "Latency", value: "< 50ms", icon: Activity },
  { label: "Protocol", value: "WebSocket", icon: Zap },
  { label: "Codec", value: "Opus 48kHz", icon: Mic },
];

export default function FeatureGrid() {
  return (
    <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-3xl">
      {features.map((feature) => (
        <div
          key={feature.label}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-md dark:hover:bg-white/10 transition-all duration-300"
        >
          <feature.icon className="w-6 h-6 mb-3 text-purple-600 dark:text-purple-400" />
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{feature.value}</div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            {feature.label}
          </div>
        </div>
      ))}
    </div>
  );
}
