export default function StatusBadge() {
  return (
    <div className="animate-fade-in-down mb-8 inline-flex items-center px-4 py-1.5 rounded-full border border-primary/20 bg-background/50 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:border-primary/50 transition-colors duration-500 cursor-default">
      <span className="relative flex h-2 w-2 mr-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
      </span>
      <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-300">
        System Operational
      </span>
    </div>
  );
}
