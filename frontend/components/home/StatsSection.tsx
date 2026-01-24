"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
    { value: 50, suffix: "ms", label: "Ultra-Low Latency", prefix: "<" },
    { value: 99.9, suffix: "%", label: "Uptime Guarantee" },
    { value: 48, suffix: "kHz", label: "Studio Quality" },
    { value: 100, suffix: "K+", label: "API Calls/Day" },
];

function AnimatedCounter({ value, suffix, prefix = "" }: { value: number; suffix: string; prefix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated.current) {
                        hasAnimated.current = true;
                        const duration = 2000;
                        const steps = 60;
                        const increment = value / steps;
                        let current = 0;

                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= value) {
                                setCount(value);
                                clearInterval(timer);
                            } else {
                                setCount(Number(current.toFixed(1)));
                            }
                        }, duration / steps);
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [value]);

    return (
        <div ref={ref} className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60">
            {prefix}{count}{suffix}
        </div>
    );
}

export default function StatsSection() {
    return (
        <section className="w-full max-w-6xl mx-auto px-4 py-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {stats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className="flex flex-col items-center text-center group"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="relative">
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
