"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic, Play, Sparkles } from "lucide-react";

export default function ActionButtons() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 z-20">
      {/* Primary Action Button */}
      <button
        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-right text-white font-bold text-lg tracking-wide transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(139,92,246,0.4)] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => router.push('/stream')}
      >
        {/* Animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out]" />

        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />

        <Mic className={`relative z-10 w-5 h-5 transition-all duration-300 ${isHovered ? "scale-110" : ""}`} />
        <span className="relative z-10">Start Streaming</span>
        <ArrowRight className="relative z-10 w-5 h-5 transition-all duration-300 group-hover:translate-x-1" />
      </button>

      {/* Secondary Ghost Button */}
      <button className="group flex items-center gap-3 px-7 py-4 rounded-full bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/30 hover:bg-white/10 text-foreground transition-all duration-300 font-semibold hover:-translate-y-0.5 hover:shadow-lg">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300">
          <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
        </div>
        <span className="text-sm font-medium">Watch Demo</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">2 min</span>
      </button>
    </div>
  );
}
