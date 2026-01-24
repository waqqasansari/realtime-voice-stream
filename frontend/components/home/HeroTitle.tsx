"use client";

export default function HeroTitle() {
  return (
    <div className="relative mb-8 group cursor-default">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />

      {/* Main Title with stacked effect */}
      <div className="relative">
        {/* Shadow text for depth */}
        <h1 className="absolute top-1 left-1 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-primary/10 blur-sm">
          VoiceStream
        </h1>

        {/* Primary text */}
        <h1 className="relative z-10 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter">
          <span className="text-foreground dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-white/90 dark:to-white/60">
            Voice
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-pink-500">
            Stream
          </span>
        </h1>
      </div>

      {/* Animated underline */}
      <div className="relative mt-4">
        <div className="absolute left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="absolute left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 animate-pulse" style={{ animationDuration: "3s" }} />
      </div>

      {/* Tagline */}
      <p className="mt-8 text-lg md:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary/80 via-accent/80 to-pink-500/80 tracking-wide">
        Real-Time Audio Infrastructure
      </p>
    </div>
  );
}
