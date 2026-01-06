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
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-primary/30">
      <BackgroundBlobs />
      <ThemeToggle />

      <main className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-6xl mx-auto w-full pt-20 pb-32">
        <StatusBadge />
        <HeroTitle />

        <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-2xl mb-12 leading-relaxed font-light tracking-wide animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Real-time, ultra-low latency audio communication infrastructure.
          <span className="hidden md:inline block mt-2 font-medium text-foreground"> Built for instant connection.</span>
        </p>

        <ActionButtons />
        <FeatureGrid />
      </main>

      <SiteFooter />
    </div>
  );
}
