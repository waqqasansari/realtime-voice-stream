"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic, Zap } from "lucide-react";

export default function ActionButtons() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <button
        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => router.push('/stream')}
      >
        <div className="absolute inset-0 -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent z-10" />
        <Mic className={`w-5 h-5 transition-transform duration-300 ${isHovered ? "scale-110" : ""}`} />
        <span className="relative z-20">Start Streaming</span>
        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
      <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-white/50 dark:bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 font-semibold shadow-sm dark:shadow-none">
        <Zap className="w-4 h-4" />
        <span>View Docs</span>
      </button>
    </div>
  );
}
