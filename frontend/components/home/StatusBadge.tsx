"use client";

import { Activity } from "lucide-react";

export default function StatusBadge() {
  return (
    <div className="animate-fade-in-down mb-10 inline-flex items-center gap-3 px-5 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:border-emerald-500/50 transition-all duration-500 cursor-default backdrop-blur-sm">
      {/* Animated status indicator */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
      </span>

      {/* Status text */}
      <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
        System Operational
      </span>

      {/* Separator */}
      <div className="w-px h-4 bg-emerald-500/30" />

      {/* Latency indicator */}
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-emerald-500" />
        <span className="text-xs font-medium text-muted-foreground">
          &lt;50ms latency
        </span>
      </div>
    </div>
  );
}
