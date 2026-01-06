export default function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* Deep overlay for better text contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-background/80 to-background z-0" />

      {/* Primary Blob - Top Left */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[120px] opacity-40 dark:opacity-20 animate-pulse"
        style={{
          background: 'radial-gradient(circle, var(--color-primary), transparent 70%)',
          animationDuration: '8s'
        }}
      />

      {/* Accent Blob - Bottom Right */}
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[120px] opacity-40 dark:opacity-20 animate-pulse"
        style={{
          background: 'radial-gradient(circle, var(--color-accent), transparent 70%)',
          animationDelay: '1s',
          animationDuration: '10s'
        }}
      />

      {/* Secondary Blob - Center/Top */}
      <div
        className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[100px] opacity-30 dark:opacity-15 animate-pulse"
        style={{
          background: 'radial-gradient(circle, #ec4899, transparent 70%)', // Pink for vibrancy
          animationDelay: '2s',
          animationDuration: '12s'
        }}
      />

      {/* Grid Pattern Overlay for Texture */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-10" />
    </div>
  );
}
