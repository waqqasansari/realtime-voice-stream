export default function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-zinc-50 dark:bg-black z-0 transition-colors duration-500" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-pulse bg-purple-200/40 dark:bg-purple-900/20 duration-[4000ms]" />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-pulse bg-blue-200/40 dark:bg-blue-900/20 duration-[5000ms]"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full blur-[80px] animate-pulse bg-indigo-200/30 dark:bg-indigo-900/10 duration-[6000ms]"
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
}
