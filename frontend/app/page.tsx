"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Mic, Activity, ArrowRight, Zap } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-purple-500/30">

      {/* Background Gradients & Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Main Background Color */}
        <div className="absolute inset-0 bg-zinc-50 dark:bg-black z-0 transition-colors duration-500" />

        {/* Dynamic Blobs - adjusted for better light mode visibility */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-pulse bg-purple-200/40 dark:bg-purple-900/20 duration-[4000ms]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-pulse bg-blue-200/40 dark:bg-blue-900/20 duration-[5000ms]" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full blur-[80px] animate-pulse bg-indigo-200/30 dark:bg-indigo-900/10 duration-[6000ms]" style={{ animationDelay: "2s" }} />
      </div>

      {/* Navigation / Theme Toggle */}
      <nav className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-3 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group"
          aria-label="Toggle Theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-300 group-hover:rotate-90 transition-transform duration-500" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
          )}
        </button>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full">

        {/* Status Badge */}
        <div className="animate-fade-in-down mb-8 inline-flex items-center px-4 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:border-purple-500/30 transition-colors duration-300">
          <span className="relative flex h-2 w-2 mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-400">
            System Operational
          </span>
        </div>

        {/* Hero Title */}
        <div className="relative mb-6 group cursor-default">
          {/* Improved Glow effect: Softer, mixed blend mode fixes for light theme */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-purple-500/10 dark:bg-purple-500/20 blur-[90px] rounded-full pointer-events-none dark:mix-blend-screen mix-blend-multiply" />

          <h1 className="relative z-10 text-6xl sm:text-7xl md:text-9xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 animate-gradient-y drop-shadow-sm">
            VoiceStream
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-2xl text-zinc-700 dark:text-zinc-300 max-w-2xl mb-12 leading-relaxed font-normal">
          Real-time, ultra-low latency audio communication infrastructure.
          <span className="hidden md:inline"> Built for instant connection.</span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6">

          {/* Main Primary Button */}
          <button
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => console.log("Start clicked")}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent z-10" />

            <Mic className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
            <span className="relative z-20">Start Streaming</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          {/* Secondary Button */}
          <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-white/50 dark:bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 font-semibold shadow-sm dark:shadow-none">
            <Zap className="w-4 h-4" />
            <span>View Docs</span>
          </button>
        </div>

        {/* Feature Grid (Mini) */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-3xl">
          {[
            { label: "Latency", value: "< 50ms", icon: Activity },
            { label: "Protocol", value: "WebSocket", icon: Zap },
            { label: "Codec", value: "Opus 48kHz", icon: Mic },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-md dark:hover:bg-white/10 transition-all duration-300">
              <stat.icon className="w-6 h-6 mb-3 text-purple-600 dark:text-purple-400" />
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</div>
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 w-full text-center">
        <p className="text-zinc-500 dark:text-zinc-500 text-xs tracking-wider">
          VOICESTREAM EXPERIMENT • V1.0.0
        </p>
      </footer>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes fade-in-down {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
