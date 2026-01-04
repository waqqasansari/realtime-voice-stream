"use client";

import ActionButtons from "@/components/home/ActionButtons";
import BackgroundBlobs from "@/components/home/BackgroundBlobs";
import FeatureGrid from "@/components/home/FeatureGrid";
import HeroTitle from "@/components/home/HeroTitle";
import SiteFooter from "@/components/home/SiteFooter";
import StatusBadge from "@/components/home/StatusBadge";
import ThemeToggle from "@/components/home/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-purple-500/30">
      <BackgroundBlobs />
      <ThemeToggle />

      <main className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full">
        <StatusBadge />
        <HeroTitle />
        <p className="text-lg md:text-2xl text-zinc-700 dark:text-zinc-300 max-w-2xl mb-12 leading-relaxed font-normal">
          Real-time, ultra-low latency audio communication infrastructure.
          <span className="hidden md:inline"> Built for instant connection.</span>
        </p>
        <ActionButtons />
        <FeatureGrid />
      </main>

      <SiteFooter />

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
