"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

export default function CTASection() {
    const router = useRouter();

    return (
        <section className="w-full max-w-5xl mx-auto px-4 py-24">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-pink-500/10 border border-primary/20 p-8 md:p-16">
                {/* Animated background elements */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-primary/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "4s" }} />
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />

                {/* Floating particles */}
                <div className="absolute top-10 left-[20%] w-2 h-2 rounded-full bg-primary animate-float opacity-60" />
                <div className="absolute top-20 right-[30%] w-1.5 h-1.5 rounded-full bg-accent animate-float opacity-50" style={{ animationDelay: "1s" }} />
                <div className="absolute bottom-16 left-[40%] w-1 h-1 rounded-full bg-pink-500 animate-float opacity-40" style={{ animationDelay: "2s" }} />

                {/* Content */}
                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 mb-6">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-foreground">Ready to get started?</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                        Start Streaming in
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-pink-500">
                            Under 5 Minutes
                        </span>
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                        No complex setup. No vendor lock-in. Just connect and stream.
                        Experience real-time voice communication like never before.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {/* Primary CTA */}
                        <button
                            onClick={() => router.push("/stream")}
                            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-lg tracking-wide transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            <Zap className="w-5 h-5" />
                            <span>Start Free Trial</span>
                            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </button>

                        {/* Secondary CTA */}
                        <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 text-foreground transition-all duration-300 font-semibold hover:bg-white/20 hover:-translate-y-0.5">
                            <span>View Pricing</span>
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6 mt-10 text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            No credit card required
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Cancel anytime
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            24/7 Support
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
