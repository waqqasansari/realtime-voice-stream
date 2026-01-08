export default function HeroTitle() {
  return (
    <div className="relative mb-8 group cursor-default animate-float">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Title */}
      <h1 className="relative z-10 text-6xl sm:text-7xl md:text-9xl font-extrabold tracking-tighter text-foreground dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-white/90 dark:to-white/50 drop-shadow-sm">
        VoiceStream
      </h1>

      {/* Subtitle/Accent line */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
    </div>
  );
}
