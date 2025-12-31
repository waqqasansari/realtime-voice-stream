export default function HeroTitle() {
  return (
    <div className="relative mb-6 group cursor-default">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-purple-500/10 dark:bg-purple-500/20 blur-[90px] rounded-full pointer-events-none dark:mix-blend-screen mix-blend-multiply" />
      <h1 className="relative z-10 text-6xl sm:text-7xl md:text-9xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 animate-gradient-y drop-shadow-sm">
        VoiceStream
      </h1>
    </div>
  );
}
