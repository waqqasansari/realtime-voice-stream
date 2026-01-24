"use client";

import ActionButtons from "@/components/home/ActionButtons";
import AudioWaveVisual from "@/components/home/AudioWaveVisual";
import BackgroundBlobs from "@/components/home/BackgroundBlobs";
import CTASection from "@/components/home/CTASection";
import FeatureGrid from "@/components/home/FeatureGrid";
import HeroTitle from "@/components/home/HeroTitle";
import HowItWorks from "@/components/home/HowItWorks";
import SiteFooter from "@/components/home/SiteFooter";
import StatsSection from "@/components/home/StatsSection";
import StatusBadge from "@/components/home/StatusBadge";
import TechStack from "@/components/home/TechStack";
import ThemeToggle from "@/components/home/ThemeToggle";
import UseCases from "@/components/home/UseCases";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      <BackgroundBlobs />
      <ThemeToggle />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-6xl mx-auto w-full pt-24 md:pt-32">
        <StatusBadge />
        <HeroTitle />

        <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mb-10 leading-relaxed font-light tracking-wide">
          Ultra-low latency audio streaming infrastructure.
          <span className="hidden sm:inline"> Built for developers who demand real-time performance.</span>
        </p>

        <ActionButtons />

        {/* Audio Wave Visualization */}
        <div className="mt-16 w-full">
          <AudioWaveVisual />
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Feature Grid */}
      <section className="relative z-10 flex flex-col items-center px-4 max-w-6xl mx-auto w-full">
        <FeatureGrid />
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Use Cases */}
      <UseCases />

      {/* Technology Stack */}
      <TechStack />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
