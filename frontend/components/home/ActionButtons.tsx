"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic, Zap, BookOpen } from "lucide-react";

export default function ActionButtons() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 z-20">
      {/* Primary Action Button */}
      <button
        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-foreground text-background font-bold text-lg tracking-wide transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] overflow-hidden ring-1 ring-white/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => router.push('/stream')}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-20 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

        <Mic className={`relative z-10 w-5 h-5 transition-all duration-300 ${isHovered ? "scale-110 text-white" : "text-primary/80 group-hover:text-white"}`} />
        <span className="relative z-10 group-hover:text-white transition-colors duration-300">Start Streaming</span>
        <ArrowRight className="relative z-10 w-5 h-5 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white" />
      </button>

      {/* Secondary Ghost Button */}
      <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-secondary hover:bg-secondary/80 dark:bg-white/5 dark:hover:bg-white/10 text-foreground transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5">
        <BookOpen className="w-4 h-4 text-accent" />
        <span>View Documentation</span>
      </button>
    </div>
  );
}
