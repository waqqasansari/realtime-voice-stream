"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Volume2,
    Type,
    Sparkles,
    Play,
    Pause,
    RotateCcw,
    Wand2,
    Waves,
    AudioLines,
    Copy,
    Check,
    Loader2
} from "lucide-react";
import ThemeToggle from "@/components/home/ThemeToggle";

// Animated floating orbs component
const FloatingOrbs = ({ isPlaying }: { isPlaying: boolean }) => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary orb */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000 ${isPlaying
            ? 'bg-gradient-to-br from-cyan-500/30 via-teal-500/20 to-emerald-500/30 animate-pulse'
            : 'bg-gradient-to-br from-primary/20 via-accent/15 to-violet-500/20'
            }`} style={{ animation: 'float 8s ease-in-out infinite' }} />

        {/* Secondary orb */}
        <div className={`absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-1000 ${isPlaying
            ? 'bg-gradient-to-tl from-blue-500/20 via-cyan-500/25 to-teal-500/20'
            : 'bg-gradient-to-tl from-accent/15 via-primary/20 to-indigo-500/15'
            }`} style={{ animation: 'float 10s ease-in-out infinite reverse' }} />

        {/* Accent orb */}
        <div className={`absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-[100px] transition-all duration-1000 ${isPlaying
            ? 'bg-teal-500/20 animate-pulse'
            : 'bg-primary/10'
            }`} style={{ animation: 'float 12s ease-in-out infinite', animationDelay: '-2s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
    </div>
);

// Audio Wave Animation Component
const AudioWaveAnimation = ({ isPlaying }: { isPlaying: boolean }) => (
    <div className="flex items-center justify-center gap-1 h-16">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${isPlaying
                    ? 'bg-gradient-to-t from-cyan-500 via-teal-500 to-emerald-400'
                    : 'bg-muted-foreground/20'
                    }`}
                style={{
                    height: isPlaying ? `${20 + Math.sin(i * 0.8) * 20 + Math.random() * 24}px` : '8px',
                    animation: isPlaying ? `wave ${0.5 + i * 0.1}s ease-in-out infinite alternate` : 'none',
                    animationDelay: `${i * 0.05}s`
                }}
            />
        ))}
    </div>
);

export default function TTSPage() {
    const router = useRouter();
    const [text, setText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const characterLimit = 1000;
    const characterCount = text.length;

    const handleGenerateSpeech = async () => {
        if (!text.trim() || isGenerating) return;

        setIsGenerating(true);

        // Simulate API call - Replace with actual TTS API when backend is ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsGenerating(false);
        setHasGenerated(true);
        setIsPlaying(true);

        // Simulate audio playing duration
        setTimeout(() => {
            setIsPlaying(false);
        }, 5000);
    };

    const handlePlayPause = () => {
        if (!hasGenerated) return;
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setText("");
        setIsPlaying(false);
        setHasGenerated(false);
    };

    const handleCopyText = async () => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const sampleTexts = [
        "Welcome to VoiceStream, the future of real-time audio synthesis.",
        "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
        "In a world where technology meets creativity, the possibilities are endless.",
    ];

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col font-sans bg-background transition-colors duration-500">
            <FloatingOrbs isPlaying={isPlaying} />
            <ThemeToggle />

            {/* Style for wave animation */}
            <style jsx>{`
                @keyframes wave {
                    0% { transform: scaleY(0.5); }
                    100% { transform: scaleY(1.2); }
                }
            `}</style>

            {/* Premium Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-40">
                <div className="absolute inset-0 bg-background/70 dark:bg-background/60 backdrop-blur-2xl border-b border-foreground/5 dark:border-white/5" />
                <div className="relative max-w-[95rem] mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                    {/* Left: Logo & Back */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel hover:bg-foreground/5 dark:hover:bg-white/10 transition-all duration-300"
                        >
                            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-0.5 transition-all" />
                            <span className="font-medium text-sm text-muted-foreground group-hover:text-foreground hidden sm:inline transition-colors">Home</span>
                        </button>

                        <div className="hidden md:flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                    <Volume2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 opacity-30 blur-md -z-10" />
                            </div>
                            <div>
                                <span className="font-bold text-foreground text-lg">Text to Speech</span>
                                <p className="text-[10px] text-muted-foreground -mt-0.5">AI Voice Synthesis</p>
                            </div>
                        </div>
                    </div>

                    {/* Center: Status */}
                    <div className={`hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-500 ${isGenerating
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                        : isPlaying
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'glass-panel'
                        }`}>
                        <div className={`relative w-2.5 h-2.5 rounded-full ${isGenerating ? 'bg-amber-500' : isPlaying ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}>
                            {(isGenerating || isPlaying) && (
                                <>
                                    <div className={`absolute inset-0 rounded-full ${isGenerating ? 'bg-amber-500' : 'bg-emerald-500'} animate-ping`} />
                                    <div className={`absolute -inset-1 rounded-full ${isGenerating ? 'bg-amber-500/30' : 'bg-emerald-500/30'} animate-pulse`} />
                                </>
                            )}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${isGenerating ? 'text-amber-500' : isPlaying ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {isGenerating ? 'Generating' : isPlaying ? 'Playing' : 'Ready'}
                        </span>
                    </div>

                    {/* Right: Feature Badge */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass-panel">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold tracking-wide uppercase hidden sm:inline text-muted-foreground">
                                AI Powered
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 w-full max-w-[95rem] px-4 md:px-8 mx-auto pt-28 pb-8 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-screen">

                {/* Left Column: Text Input */}
                <div className="flex-1 flex flex-col">

                    {/* Main Input Card */}
                    <div className="relative group mb-6">
                        {/* Animated gradient border */}
                        <div className={`absolute -inset-[1px] rounded-[28px] transition-all duration-700 ${isPlaying
                            ? 'bg-[conic-gradient(from_var(--angle),theme(colors.cyan.500),theme(colors.teal.500),theme(colors.emerald.500),theme(colors.cyan.500))] opacity-100'
                            : 'bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 opacity-50'
                            }`}
                            style={{
                                '--angle': '0deg',
                                animation: isPlaying ? 'spin 3s linear infinite' : 'none'
                            } as React.CSSProperties}
                        />

                        {/* Outer glow */}
                        <div className={`absolute -inset-2 rounded-[32px] blur-xl transition-all duration-700 ${isPlaying
                            ? 'bg-gradient-to-r from-cyan-500/30 via-teal-500/30 to-cyan-500/30 opacity-80'
                            : 'bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-40'
                            }`} />

                        <div className="relative rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl">
                            {/* Noise texture overlay */}
                            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                            {/* Top bar */}
                            <div className="relative flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.03] bg-gradient-to-r from-slate-100/50 dark:from-white/[0.02] via-transparent to-slate-100/50 dark:to-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-all ${text.length > 0 ? 'bg-primary/10' : 'bg-slate-100 dark:bg-white/5'}`}>
                                        <Type className={`w-4 h-4 transition-colors ${text.length > 0 ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">Enter Your Text</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCopyText}
                                        disabled={!text}
                                        className={`p-2 rounded-lg border transition-all ${text
                                            ? 'bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer'
                                            : 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/5'
                                            }`}
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                    <span className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${characterCount > characterLimit * 0.9
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-slate-100 dark:bg-white/[0.03] text-muted-foreground border-slate-200 dark:border-white/5'
                                        }`}>
                                        {characterCount}/{characterLimit}
                                    </span>
                                </div>
                            </div>

                            {/* Textarea */}
                            <div className="p-5 md:p-8 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={text}
                                    onChange={(e) => setText(e.target.value.slice(0, characterLimit))}
                                    placeholder="Type or paste your text here to convert to speech..."
                                    className="w-full h-64 bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none text-base leading-relaxed"
                                />
                            </div>

                            {/* Quick suggestions */}
                            <div className="px-6 pb-6 flex flex-wrap gap-2">
                                <span className="text-xs text-muted-foreground mr-2">Try:</span>
                                {sampleTexts.map((sample, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setText(sample)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all truncate max-w-[200px]"
                                    >
                                        {sample.slice(0, 50)}...
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Generate Button Card */}
                        <div className="relative rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 p-8 flex flex-col items-center justify-center overflow-hidden shadow-2xl min-h-[280px]">
                            {/* Noise texture */}
                            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                            {/* Animated background gradient */}
                            <div className={`absolute inset-0 transition-opacity duration-700 ${isGenerating || isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-teal-500/10" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-cyan-500/5 animate-pulse" style={{ animationDuration: '3s' }} />
                            </div>

                            {/* Audio Wave Visualization */}
                            <div className="mb-6">
                                <AudioWaveAnimation isPlaying={isPlaying} />
                            </div>

                            {/* Main Action Button */}
                            <button
                                onClick={hasGenerated ? handlePlayPause : handleGenerateSpeech}
                                disabled={!text.trim() || isGenerating}
                                className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${!text.trim() || isGenerating
                                    ? 'opacity-40 grayscale cursor-not-allowed'
                                    : 'hover:scale-105 active:scale-95 cursor-pointer'
                                    }`}
                            >
                                {/* Multi-layer glow */}
                                <div className={`absolute -inset-4 rounded-full transition-all duration-700 blur-2xl ${isPlaying
                                    ? 'bg-emerald-500/50'
                                    : 'bg-gradient-to-br from-cyan-500/40 to-teal-500/40 group-hover:opacity-80'
                                    }`} />
                                <div className={`absolute -inset-2 rounded-full transition-all duration-500 blur-lg ${isPlaying
                                    ? 'bg-emerald-500/60'
                                    : 'bg-teal-500/40'
                                    }`} />

                                {/* Button background */}
                                <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isPlaying
                                    ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-[0_0_80px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                                    : 'bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 shadow-[0_0_60px_rgba(20,184,166,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]'
                                    }`} />

                                {/* Shimmer effect */}
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </div>

                                {/* Icon */}
                                <div className="relative z-10 text-white">
                                    {isGenerating ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : isPlaying ? (
                                        <Pause className="w-8 h-8" />
                                    ) : hasGenerated ? (
                                        <Play className="w-8 h-8 ml-1" />
                                    ) : (
                                        <Wand2 className="w-8 h-8" />
                                    )}
                                </div>
                            </button>

                            {/* Status text */}
                            <p className={`relative mt-6 text-sm font-semibold uppercase tracking-[0.15em] flex items-center gap-2 transition-colors ${isGenerating ? 'text-amber-400' : isPlaying ? 'text-emerald-400' : 'text-muted-foreground'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-amber-400 animate-pulse' : isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50'}`} />
                                {isGenerating ? 'Synthesizing...' : isPlaying ? 'Playing Audio' : hasGenerated ? 'Click to Play' : 'Generate Speech'}
                            </p>

                            {/* Reset Button */}
                            {hasGenerated && (
                                <button
                                    onClick={handleReset}
                                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-sm text-muted-foreground hover:text-foreground hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Features Info Panel */}
                        <div className="relative rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 p-6 shadow-2xl overflow-hidden">
                            {/* Noise texture */}
                            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                            <div className="relative flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/10">
                                    <AudioLines className="w-5 h-5 text-cyan-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">Voice Features</h3>
                                    <p className="text-[10px] text-muted-foreground">AI synthesis capabilities</p>
                                </div>
                            </div>

                            <div className="relative space-y-2.5">
                                {/* Feature items */}
                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/10 group-hover:scale-110 transition-transform">
                                            <Waves className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Natural Voice</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-xs">
                                        HD Quality
                                    </span>
                                </div>

                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">AI Powered</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-xs">
                                        Neural TTS
                                    </span>
                                </div>

                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/10 group-hover:scale-110 transition-transform">
                                            <Type className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Multi-language</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-xs">
                                        50+ Languages
                                    </span>
                                </div>

                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/10 group-hover:scale-110 transition-transform">
                                            <Volume2 className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Character Limit</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-xs">
                                        {characterLimit} chars
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview Panel */}
                <div className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-28 lg:h-[calc(100vh-160px)]">
                    <div className="relative h-full rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col shadow-2xl">
                        {/* Noise texture */}
                        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                        {/* Subtle gradient overlay */}
                        <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
                        </div>

                        {/* Header */}
                        <div className="relative px-6 py-5 border-b border-slate-200/80 dark:border-white/[0.03] bg-gradient-to-r from-slate-100/50 dark:from-white/[0.02] via-transparent to-slate-100/50 dark:to-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`w-3 h-3 rounded-full transition-all ${isPlaying ? 'bg-emerald-500' : hasGenerated ? 'bg-cyan-500' : 'bg-muted-foreground/30'}`} />
                                        {isPlaying && (
                                            <>
                                                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
                                                <div className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-pulse" />
                                            </>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-foreground">Audio Preview</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPlaying
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                                        : hasGenerated
                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                            : 'bg-slate-100 dark:bg-white/[0.03] text-muted-foreground border-slate-200 dark:border-white/5'
                                        }`}>
                                        {isPlaying ? 'Playing' : hasGenerated ? 'Ready' : 'Waiting'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                Generated audio preview
                            </p>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 overflow-y-auto p-6">
                            {hasGenerated ? (
                                <div className="h-full flex flex-col">
                                    {/* Waveform visualization placeholder */}
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-full">
                                            {/* Large waveform display */}
                                            <div className="flex items-center justify-center gap-0.5 h-32 mb-6">
                                                {[...Array(40)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1 rounded-full transition-all duration-150 ${isPlaying
                                                            ? 'bg-gradient-to-t from-cyan-500 via-teal-500 to-emerald-400'
                                                            : 'bg-muted-foreground/20'
                                                            }`}
                                                        style={{
                                                            height: isPlaying
                                                                ? `${15 + Math.sin(i * 0.4) * 30 + Math.random() * 50}px`
                                                                : `${15 + Math.sin(i * 0.3) * 25}px`,
                                                            animation: isPlaying ? `wave ${0.3 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Audio info */}
                                            <div className="text-center space-y-3">
                                                <p className="text-sm text-foreground font-medium">
                                                    {text.slice(0, 100)}{text.length > 100 ? '...' : ''}
                                                </p>
                                                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Type className="w-3 h-3" />
                                                        {characterCount} characters
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Volume2 className="w-3 h-3" />
                                                        ~{Math.ceil(characterCount / 15)}s duration
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Playback controls */}
                                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                        <button
                                            onClick={handlePlayPause}
                                            className={`p-4 rounded-full transition-all ${isPlaying
                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                : 'bg-slate-100 dark:bg-white/5 text-foreground hover:bg-slate-200 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-emerald-500/10 flex items-center justify-center border border-slate-200 dark:border-white/5">
                                            <Volume2 className="w-10 h-10 text-muted-foreground/30" />
                                        </div>
                                        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-muted-foreground/10" style={{ animation: 'spin 15s linear infinite' }} />
                                        <div className="absolute -inset-3 rounded-3xl border border-dashed border-muted-foreground/5" style={{ animation: 'spin 25s linear infinite reverse' }} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">No audio generated yet</p>
                                        <p className="text-xs text-muted-foreground/50 max-w-[220px] leading-relaxed">
                                            Enter some text and click generate to create speech audio
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="relative px-6 py-4 bg-gradient-to-r from-slate-100/50 dark:from-white/[0.02] via-transparent to-slate-100/50 dark:to-white/[0.02] border-t border-slate-200/80 dark:border-white/[0.03]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full transition-all ${isPlaying ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : hasGenerated ? 'bg-cyan-500' : 'bg-muted-foreground/30'}`}>
                                        {isPlaying && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                                        {isPlaying ? 'Audio streaming...' : hasGenerated ? 'Audio ready' : 'Awaiting input'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                                    <Sparkles className="w-3 h-3" />
                                    Neural TTS
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
