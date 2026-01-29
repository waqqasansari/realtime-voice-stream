"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Mic,
    ArrowLeft,
    Wifi,
    WifiOff,
    Activity,
    Radio,
    Volume2,
    Clock,
    Zap,
    Server,
    ChevronRight,
    Signal,
    Sparkles,
    AudioWaveform,
    Waves
} from "lucide-react";
import VoiceVisualizer from "@/components/stream/VoiceVisualizer";
import useVoiceStream from "@/hooks/useVoiceStream";
import ThemeToggle from "@/components/home/ThemeToggle";

// Animated floating orbs component
const FloatingOrbs = ({ isRecording }: { isRecording: boolean }) => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary orb */}
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000 ${isRecording
            ? 'bg-gradient-to-br from-rose-500/30 via-violet-500/20 to-fuchsia-500/30 animate-pulse'
            : 'bg-gradient-to-br from-primary/20 via-accent/15 to-violet-500/20'
            }`} style={{ animation: 'float 8s ease-in-out infinite' }} />

        {/* Secondary orb */}
        <div className={`absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-1000 ${isRecording
            ? 'bg-gradient-to-tl from-amber-500/20 via-rose-500/25 to-pink-500/20'
            : 'bg-gradient-to-tl from-accent/15 via-primary/20 to-indigo-500/15'
            }`} style={{ animation: 'float 10s ease-in-out infinite reverse' }} />

        {/* Accent orb */}
        <div className={`absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-[100px] transition-all duration-1000 ${isRecording
            ? 'bg-violet-500/20 animate-pulse'
            : 'bg-primary/10'
            }`} style={{ animation: 'float 12s ease-in-out infinite', animationDelay: '-2s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
    </div>
);

export default function StreamPage() {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const {
        sendAudioData,
        sendMetadata,
        sendControl,
        clearAudioProgress,
        isConnected,
        audioProgress,
        transcript,
    } = useVoiceStream();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            stopRecording();
        };
    }, []);

    const analyzeAudio = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1

        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            });

            // Set up audio analysis
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            // Start analyzing audio levels
            analyzeAudio();

            // Set up MediaRecorder to capture audio chunks
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && isConnected) {
                    // Convert blob to array buffer and send via WebSocket
                    const arrayBuffer = await event.data.arrayBuffer();
                    sendAudioData(arrayBuffer);
                }
            };

            // Send audio chunks every 100ms for real-time streaming
            mediaRecorder.start(100);

            clearAudioProgress();
            sendControl("stream_start", {
                startTime: new Date().toISOString(),
                mimeType: 'audio/webm;codecs=opus',
                sampleRate: 44100,
            });

            // Send metadata
            sendMetadata({
                startTime: new Date().toISOString(),
                mimeType: 'audio/webm;codecs=opus',
                sampleRate: 44100,
            });

            setIsRecording(true);
            setDuration(0);

            // Start duration counter
            durationIntervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }

        setIsRecording(false);
        setAudioLevel(0);
        sendControl("stream_end");
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col font-sans bg-background transition-colors duration-500">
            <FloatingOrbs isRecording={isRecording} />
            <ThemeToggle />

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
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Radio className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary to-accent opacity-30 blur-md -z-10" />
                            </div>
                            <div>
                                <span className="font-bold text-foreground text-lg">VoiceStream</span>
                                <p className="text-[10px] text-muted-foreground -mt-0.5">Real-time Audio</p>
                            </div>
                        </div>
                    </div>

                    {/* Center: Recording Status */}
                    <div className={`hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-500 ${isRecording
                        ? 'bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 shadow-lg shadow-rose-500/10'
                        : 'glass-panel'
                        }`}>
                        <div className={`relative w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500' : 'bg-muted-foreground/40'}`}>
                            {isRecording && (
                                <>
                                    <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping" />
                                    <div className="absolute -inset-1 rounded-full bg-rose-500/30 animate-pulse" />
                                </>
                            )}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${isRecording ? 'text-rose-500' : 'text-muted-foreground'}`}>
                            {isRecording ? 'Live' : 'Standby'}
                        </span>
                        {isRecording && (
                            <span className="font-mono text-sm font-bold text-rose-400 tabular-nums bg-rose-500/10 px-2 py-0.5 rounded">
                                {formatDuration(duration)}
                            </span>
                        )}
                    </div>

                    {/* Right: Connection Status */}
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl backdrop-blur-xl border transition-all duration-500 ${isConnected
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                            : 'bg-red-500/10 dark:bg-red-500/15 border-red-500/30 text-red-500 dark:text-red-400'
                            }`}>
                            <div className="relative">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {isConnected && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                            </div>
                            <span className="text-xs font-bold tracking-wide uppercase hidden sm:inline">
                                {isConnected ? 'Connected' : 'Offline'}
                            </span>
                            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 w-full max-w-[95rem] px-4 md:px-8 mx-auto pt-28 pb-8 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-screen">

                {/* Left Column: Visuals & Controls */}
                <div className="flex-1 flex flex-col">

                    {/* Main Visualizer Card */}
                    <div className="relative group mb-6">
                        {/* Animated gradient border */}
                        <div className={`absolute -inset-[1px] rounded-[28px] transition-all duration-700 ${isRecording
                            ? 'bg-[conic-gradient(from_var(--angle),theme(colors.rose.500),theme(colors.violet.500),theme(colors.fuchsia.500),theme(colors.rose.500))] opacity-100'
                            : 'bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 opacity-50'
                            }`}
                            style={{
                                '--angle': '0deg',
                                animation: isRecording ? 'spin 3s linear infinite' : 'none'
                            } as React.CSSProperties}
                        />

                        {/* Outer glow */}
                        <div className={`absolute -inset-2 rounded-[32px] blur-xl transition-all duration-700 ${isRecording
                            ? 'bg-gradient-to-r from-rose-500/30 via-violet-500/30 to-rose-500/30 opacity-80'
                            : 'bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-40'
                            }`} />

                        <div className="relative rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl">
                            {/* Noise texture overlay */}
                            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                            {/* Top bar with enhanced styling */}
                            <div className="relative flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.03] bg-gradient-to-r from-slate-100/50 dark:from-white/[0.02] via-transparent to-slate-100/50 dark:to-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className={`relative w-3 h-3 rounded-full transition-all duration-300 ${isRecording ? 'bg-rose-500' : 'bg-muted-foreground/30'}`}>
                                        {isRecording && (
                                            <>
                                                <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping" />
                                                <div className="absolute -inset-1.5 rounded-full bg-rose-500/20 animate-pulse" />
                                            </>
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Waves className={`w-4 h-4 transition-colors ${isRecording ? 'text-rose-400' : 'text-primary'}`} />
                                        Audio Waveform
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground font-mono bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
                                        48kHz • Opus
                                    </span>
                                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${isRecording
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-500/10'
                                        : 'bg-slate-100 dark:bg-white/[0.03] text-muted-foreground border-slate-200 dark:border-white/5'
                                        }`}>
                                        {isRecording && <Sparkles className="w-3 h-3 animate-pulse" />}
                                        {isRecording ? 'Recording' : 'Idle'}
                                    </div>
                                </div>
                            </div>

                            {/* Visualizer with enhanced padding */}
                            <div className="p-5 md:p-8 relative">
                                <VoiceVisualizer audioLevel={audioLevel} isRecording={isRecording} />
                            </div>

                            {/* Enhanced audio level meter */}
                            <div className="px-6 pb-6 flex items-center gap-4">
                                <div className={`p-2 rounded-lg transition-all ${isRecording ? 'bg-primary/10' : 'bg-slate-100 dark:bg-white/5'}`}>
                                    <Volume2 className={`w-4 h-4 transition-colors ${isRecording ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                </div>
                                <div className="flex-1 h-3 bg-slate-100 dark:bg-white/[0.03] rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                                        style={{ width: `${audioLevel * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground w-14 text-right tabular-nums bg-slate-100 dark:bg-white/[0.03] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                                    {Math.round(audioLevel * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Recording Control Card */}
                        <div className="relative rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 p-8 flex flex-col items-center justify-center overflow-hidden shadow-2xl min-h-[320px]">
                            {/* Noise texture */}
                            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                            {/* Animated background gradient */}
                            <div className={`absolute inset-0 transition-opacity duration-700 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-fuchsia-500/10" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-transparent to-amber-500/5 animate-pulse" style={{ animationDuration: '3s' }} />
                            </div>

                            {/* Orbital rings */}
                            {isRecording && (
                                <>
                                    <div className="absolute inset-8 rounded-full border border-rose-500/20" style={{ animation: 'spin 8s linear infinite' }} />
                                    <div className="absolute inset-12 rounded-full border border-violet-500/15" style={{ animation: 'spin 12s linear infinite reverse' }} />
                                    <div className="absolute inset-4 rounded-full border border-fuchsia-500/10" style={{ animation: 'spin 15s linear infinite' }} />
                                </>
                            )}

                            {/* Duration Display */}
                            <div className={`relative font-mono text-5xl md:text-6xl font-bold transition-all duration-500 tabular-nums mb-8 ${isRecording
                                ? 'text-foreground drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                                : 'text-slate-300 dark:text-muted-foreground/25'
                                }`}>
                                {formatDuration(duration)}
                                {isRecording && (
                                    <div className="absolute -inset-6 bg-gradient-to-r from-rose-500/15 via-transparent to-rose-500/15 blur-2xl -z-10 rounded-full" />
                                )}
                            </div>

                            {/* Premium Record Button */}
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={!isConnected}
                                className={`group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${!isConnected
                                    ? 'opacity-40 grayscale cursor-not-allowed'
                                    : 'hover:scale-105 active:scale-95 cursor-pointer'
                                    }`}
                            >
                                {/* Multi-layer glow */}
                                <div className={`absolute -inset-4 rounded-full transition-all duration-700 blur-2xl ${isRecording
                                    ? 'bg-rose-500/50'
                                    : 'bg-primary/40 group-hover:bg-primary/50'
                                    }`} />
                                <div className={`absolute -inset-2 rounded-full transition-all duration-500 blur-lg ${isRecording
                                    ? 'bg-rose-500/60'
                                    : 'bg-accent/40'
                                    }`} />

                                {/* Button background with premium gradient */}
                                <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isRecording
                                    ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 shadow-[0_0_80px_rgba(225,29,72,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                                    : 'bg-gradient-to-br from-primary via-violet-600 to-accent shadow-[0_0_60px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]'
                                    }`} />

                                {/* Shimmer effect */}
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </div>

                                {/* Icon */}
                                <div className="relative z-10 text-white">
                                    {isRecording ? (
                                        <div className="w-9 h-9 rounded-lg bg-white shadow-lg transition-transform duration-200 group-hover:scale-90" />
                                    ) : (
                                        <Mic className="w-11 h-11 transition-transform duration-200 group-hover:scale-110" />
                                    )}
                                </div>
                            </button>

                            {/* Status text */}
                            <p className={`relative mt-8 text-sm font-semibold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${isRecording ? 'text-rose-400' : 'text-muted-foreground'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-rose-400 animate-pulse' : 'bg-muted-foreground/50'}`} />
                                {isRecording ? 'Recording...' : 'Ready to Record'}
                            </p>
                        </div>

                        {/* Stats Panel */}
                        <div className="relative rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 p-6 shadow-2xl overflow-hidden">
                            {/* Noise texture */}
                            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                            <div className="relative flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/10">
                                    <Activity className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">Stream Statistics</h3>
                                    <p className="text-[10px] text-muted-foreground">Real-time metrics</p>
                                </div>
                            </div>

                            <div className="relative space-y-2.5">
                                {/* Stat items with hover effects */}
                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/10 group-hover:scale-110 transition-transform">
                                            <Zap className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Chunk Size</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-sm">
                                        {audioProgress ? `${audioProgress.chunkBytes} B` : '—'}
                                    </span>
                                </div>

                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform">
                                            <Server className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Total Data</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-sm">
                                        {audioProgress ? `${(audioProgress.totalBytes / 1024).toFixed(1)} KB` : '—'}
                                    </span>
                                </div>

                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/10 group-hover:scale-110 transition-transform">
                                            <Signal className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Packets Sent</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-sm">
                                        {audioProgress ? audioProgress.totalChunks : '—'}
                                    </span>
                                </div>

                                <div className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/10 group-hover:scale-110 transition-transform">
                                            <Clock className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Duration</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-sm">
                                        {formatDuration(duration)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Transcript Panel */}
                <div className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-28 lg:h-[calc(100vh-160px)]">
                    <div className="relative h-full rounded-[26px] bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col shadow-2xl">
                        {/* Noise texture */}
                        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                        {/* Subtle gradient overlay */}
                        <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
                        </div>

                        {/* Header */}
                        <div className="relative px-6 py-5 border-b border-slate-200/80 dark:border-white/[0.03] bg-gradient-to-r from-slate-100/50 dark:from-white/[0.02] via-transparent to-slate-100/50 dark:to-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`w-3 h-3 rounded-full transition-all ${isRecording ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                                        {isRecording && (
                                            <>
                                                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
                                                <div className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-pulse" />
                                            </>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-foreground">Live Transcript</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isRecording
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                                        : 'bg-slate-100 dark:bg-white/[0.03] text-muted-foreground border-slate-200 dark:border-white/5'
                                        }`}>
                                        {isRecording ? 'Active' : 'Waiting'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                Real-time speech-to-text transcription
                            </p>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 overflow-y-auto p-6">
                            {transcript ? (
                                <div className="space-y-4">
                                    <div className="flex gap-3 animate-fade-in-up">
                                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-violet-600 to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                                            <Mic className="w-4 h-4 text-white" />
                                            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-primary to-accent opacity-50 blur-sm -z-10" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-foreground">You</span>
                                                <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">just now</span>
                                            </div>
                                            <div className="p-4 rounded-2xl rounded-tl-md bg-gradient-to-br from-slate-100/70 to-slate-50/70 dark:from-white/[0.03] dark:to-white/[0.01] border border-slate-200 dark:border-white/5 text-sm leading-relaxed text-foreground/90 shadow-lg">
                                                {transcript}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-violet-500/10 flex items-center justify-center border border-slate-200 dark:border-white/5">
                                            <Activity className="w-10 h-10 text-muted-foreground/30" />
                                        </div>
                                        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-muted-foreground/10" style={{ animation: 'spin 15s linear infinite' }} />
                                        <div className="absolute -inset-3 rounded-3xl border border-dashed border-muted-foreground/5" style={{ animation: 'spin 25s linear infinite reverse' }} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Waiting for speech...</p>
                                        <p className="text-xs text-muted-foreground/50 max-w-[220px] leading-relaxed">
                                            Start recording and speak to generate live transcripts
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="relative px-6 py-4 bg-gradient-to-r from-slate-100/50 dark:from-white/[0.02] via-transparent to-slate-100/50 dark:to-white/[0.02] border-t border-slate-200/80 dark:border-white/[0.03]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full transition-all ${isRecording ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-muted-foreground/30'}`}>
                                        {isRecording && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                                        {isRecording ? 'Processing audio...' : 'Microphone idle'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                                    <Sparkles className="w-3 h-3" />
                                    AI Powered
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
