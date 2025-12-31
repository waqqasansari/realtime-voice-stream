export default function StatusBadge() {
  return (
    <div className="animate-fade-in-down mb-8 inline-flex items-center px-4 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:border-purple-500/30 transition-colors duration-300">
      <span className="relative flex h-2 w-2 mr-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-400">
        System Operational
      </span>
    </div>
  );
}
