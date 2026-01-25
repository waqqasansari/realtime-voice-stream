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
    AudioWaveform
} from "lucide-react";
import VoiceVisualizer from "@/components/stream/VoiceVisualizer";
import useVoiceStream from "@/hooks/useVoiceStream";
import BackgroundBlobs from "@/components/home/BackgroundBlobs";
import ThemeToggle from "@/components/home/ThemeToggle";

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
            <BackgroundBlobs />
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
                        {/* Animated border glow */}
                        <div className={`absolute -inset-0.5 rounded-3xl transition-all duration-1000 ${isRecording
                            ? 'bg-gradient-to-r from-rose-500 via-violet-500 to-rose-500 opacity-60 blur-md animate-pulse'
                            : 'bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 opacity-40 blur-md'
                            }`} style={{ animationDuration: '2s' }} />

                        <div className="relative rounded-3xl bg-card dark:bg-secondary/30 backdrop-blur-2xl border border-card-border dark:border-white/10 overflow-hidden shadow-2xl">
                            {/* Top bar */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/5 dark:border-white/5 bg-foreground/[0.02] dark:bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isRecording ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-500/50' : 'bg-muted-foreground/30'}`} />
                                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <AudioWaveform className="w-4 h-4 text-primary" />
                                        Audio Waveform
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground font-mono bg-foreground/5 dark:bg-white/10 px-2 py-1 rounded">48kHz • Opus</span>
                                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isRecording
                                        ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400'
                                        : 'bg-foreground/5 dark:bg-white/10 text-muted-foreground'
                                        }`}>
                                        {isRecording && <Sparkles className="w-3 h-3" />}
                                        {isRecording ? 'Recording' : 'Idle'}
                                    </div>
                                </div>
                            </div>

                            {/* Visualizer */}
                            <div className="p-4 md:p-6">
                                <VoiceVisualizer audioLevel={audioLevel} isRecording={isRecording} />
                            </div>

                            {/* Audio level meter */}
                            <div className="px-6 pb-5 flex items-center gap-4">
                                <Volume2 className={`w-4 h-4 transition-colors ${isRecording ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                <div className="flex-1 h-2.5 bg-foreground/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-100 rounded-full shadow-lg"
                                        style={{ width: `${audioLevel * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground w-12 text-right tabular-nums bg-foreground/5 dark:bg-white/10 px-2 py-0.5 rounded">
                                    {Math.round(audioLevel * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Recording Control Card */}
                        <div className="relative rounded-3xl bg-card dark:bg-secondary/30 backdrop-blur-xl border border-card-border dark:border-white/10 p-8 flex flex-col items-center justify-center overflow-hidden shadow-xl">
                            {/* Animated background effect */}
                            {isRecording && (
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-violet-500/5" />
                            )}

                            {/* Pulsing rings when recording */}
                            {isRecording && (
                                <>
                                    <div className="absolute inset-0 rounded-3xl border-2 border-rose-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                                    <div className="absolute inset-4 rounded-2xl border border-rose-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                                </>
                            )}

                            {/* Duration Display */}
                            <div className={`relative font-mono text-5xl md:text-6xl font-bold transition-all duration-500 tabular-nums mb-6 ${isRecording ? 'text-foreground' : 'text-muted-foreground/30'
                                }`}>
                                {formatDuration(duration)}
                                {isRecording && (
                                    <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/10 via-transparent to-rose-500/10 blur-2xl -z-10" />
                                )}
                            </div>

                            {/* Record Button */}
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={!isConnected}
                                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${!isConnected
                                    ? 'opacity-50 grayscale cursor-not-allowed'
                                    : 'hover:scale-105 active:scale-95 cursor-pointer'
                                    }`}
                            >
                                {/* Button glow effect */}
                                <div className={`absolute -inset-3 rounded-full transition-all duration-500 blur-xl ${isRecording
                                    ? 'bg-rose-500/40'
                                    : 'bg-primary/30'
                                    }`} />

                                {/* Background gradient */}
                                <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isRecording
                                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-[0_0_60px_rgba(225,29,72,0.4)]'
                                    : 'bg-gradient-to-tr from-primary to-accent shadow-[0_0_40px_rgba(139,92,246,0.3)]'
                                    }`} />

                                {/* Inner content */}
                                <div className="relative z-10 text-white">
                                    {isRecording ? (
                                        <div className="w-8 h-8 rounded-md bg-white shadow-lg" />
                                    ) : (
                                        <Mic className="w-10 h-10" />
                                    )}
                                </div>
                            </button>

                            {/* Status text */}
                            <p className="relative mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ChevronRight className={`w-4 h-4 transition-transform ${isRecording ? 'rotate-90' : ''}`} />
                                {isRecording ? 'Click to Stop' : 'Click to Start'}
                            </p>
                        </div>

                        {/* Stats Panel */}
                        <div className="rounded-3xl bg-card dark:bg-secondary/30 backdrop-blur-xl border border-card-border dark:border-white/10 p-6 shadow-xl">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Activity className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-foreground">Stream Statistics</h3>
                            </div>

                            <div className="space-y-3">
                                {/* Stat items */}
                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] dark:bg-white/5 border border-foreground/5 dark:border-white/5 hover:bg-foreground/5 dark:hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-500/15 dark:bg-blue-500/20 flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Chunk Size</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-foreground/5 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                                        {audioProgress ? `${audioProgress.chunkBytes} B` : '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] dark:bg-white/5 border border-foreground/5 dark:border-white/5 hover:bg-foreground/5 dark:hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center">
                                            <Server className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Total Data</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-foreground/5 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                                        {audioProgress ? `${(audioProgress.totalBytes / 1024).toFixed(1)} KB` : '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] dark:bg-white/5 border border-foreground/5 dark:border-white/5 hover:bg-foreground/5 dark:hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-violet-500/15 dark:bg-violet-500/20 flex items-center justify-center">
                                            <Signal className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Packets Sent</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-foreground/5 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                                        {audioProgress ? audioProgress.totalChunks : '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] dark:bg-white/5 border border-foreground/5 dark:border-white/5 hover:bg-foreground/5 dark:hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Duration</span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground bg-foreground/5 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                                        {formatDuration(duration)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Transcript Panel */}
                <div className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-28 lg:h-[calc(100vh-160px)]">
                    <div className="h-full rounded-3xl bg-card dark:bg-secondary/30 backdrop-blur-2xl border border-card-border dark:border-white/10 overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-foreground/5 dark:border-white/10 bg-foreground/[0.02] dark:bg-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`w-3 h-3 rounded-full transition-all ${isRecording ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                                        {isRecording && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />}
                                    </div>
                                    <h3 className="font-bold text-foreground">Live Transcript</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isRecording
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-foreground/5 dark:bg-white/10 text-muted-foreground'
                                        }`}>
                                        {isRecording ? 'Active' : 'Waiting'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Real-time speech-to-text transcription
                            </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {transcript ? (
                                <div className="space-y-4">
                                    <div className="flex gap-3 animate-fade-in-up">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                                            <Mic className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-foreground">You</span>
                                                <span className="text-[10px] text-muted-foreground">just now</span>
                                            </div>
                                            <div className="p-4 rounded-2xl rounded-tl-sm bg-foreground/[0.02] dark:bg-white/5 border border-foreground/5 dark:border-white/5 text-sm leading-relaxed text-foreground/90">
                                                {transcript}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                                            <Activity className="w-8 h-8 text-muted-foreground/40" />
                                        </div>
                                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/10 animate-spin" style={{ animationDuration: '10s' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Waiting for speech...</p>
                                        <p className="text-xs text-muted-foreground/50 mt-1 max-w-[200px]">
                                            Start recording and speak to generate live transcripts
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-foreground/[0.02] dark:bg-white/5 border-t border-foreground/5 dark:border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                                        {isRecording ? 'Processing audio...' : 'Microphone idle'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Powered by AI
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
