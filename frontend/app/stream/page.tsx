"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, ArrowLeft, Wifi, WifiOff, Activity } from "lucide-react";
import VoiceVisualizer from "@/components/stream/VoiceVisualizer";
import useVoiceStream from "@/hooks/useVoiceStream";
import BackgroundBlobs from "@/components/home/BackgroundBlobs";

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
        captions,
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
        clearAudioProgress();
        sendControl("stream_end");
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans">
            <BackgroundBlobs />

            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30">
                <button
                    onClick={() => router.push('/')}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Back to Home</span>
                </button>

                <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-md border transition-all duration-500 shadow-lg ${isConnected
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                    <div className="relative">
                        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {isConnected && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                    </div>
                    <span className="text-sm font-semibold tracking-wide uppercase">
                        {isConnected ? 'System Online' : 'Offline'}
                    </span>
                    {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                </div>
            </div>

            <main className="relative z-10 w-full max-w-[95rem] px-4 md:px-8 mx-auto py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center min-h-[calc(100vh-100px)]">
                {/* Left Column: Visuals & Controls */}
                <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center">
                    {/* Header Section - More Compact */}
                    <div className="mb-6 text-center space-y-2 animate-fade-in-down w-full max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 mb-2 backdrop-blur-sm">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 drop-shadow-sm">
                            Live Voice Stream
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-lg mx-auto font-light tracking-wide">
                            High-fidelity, low-latency audio transmission
                        </p>
                    </div>

                    {/* Main Visualizer Area */}
                    <div className="w-full mb-6 relative group max-w-4xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative glass-panel rounded-3xl p-6 overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
                            <VoiceVisualizer audioLevel={audioLevel} isRecording={isRecording} />
                        </div>
                    </div>

                    {/* Duration Display - Centered Above Controls */}
                    <div className={`font-mono text-5xl font-bold transition-all duration-500 tabular-nums mb-6 ${isRecording ? 'opacity-100 text-foreground' : 'opacity-30 text-muted-foreground'}`}>
                        {formatDuration(duration)}
                    </div>

                    {/* Controls - Horizontal Layout */}
                    <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 items-center justify-center">
                        {/* Recording Button */}
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={!isConnected}
                                className={`
                                    relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 
                                    ${!isConnected ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-110 active:scale-95 cursor-pointer'}
                                `}
                            >
                                <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isRecording
                                    ? 'bg-gradient-to-tr from-rose-500 to-red-600 shadow-[0_0_60px_-10px_rgba(225,29,72,0.6)]'
                                    : 'bg-gradient-to-tr from-foreground to-foreground/80 shadow-2xl border border-white/10'
                                    }`} />

                                {isRecording && (
                                    <>
                                        <div className="absolute inset-0 rounded-full border-2 border-rose-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                        <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                                    </>
                                )}

                                <div className={`relative z-10 transition-colors duration-300 ${isRecording ? 'text-white' : 'text-background'}`}>
                                    {isRecording ? (
                                        <div className="w-12 h-12 rounded-lg bg-white shadow-lg animate-[pulse_2s_infinite]" />
                                    ) : (
                                        <Mic className="w-14 h-14" />
                                    )}
                                </div>
                            </button>
                            <p className="text-sm text-muted-foreground/80 font-medium uppercase tracking-widest">
                                {isRecording ? 'Broadcasting' : 'Start Stream'}
                            </p>
                        </div>

                        {/* Stats Panel - Horizontal */}
                        <div className="glass-panel p-6 rounded-2xl flex-1 max-w-md bg-white/5 border border-white/5 shadow-xl hover:bg-white/10 transition-colors">
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Network Statistics</div>
                            <div className="font-mono text-sm text-foreground/80 space-y-3">
                                {audioProgress ? (
                                    <>
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-xs text-muted-foreground uppercase">Chunk Size</span>
                                            <span className="text-primary font-bold">{audioProgress.chunkBytes} B</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                            <span className="text-xs text-muted-foreground uppercase">Total Data</span>
                                            <span className="text-primary font-bold">{(audioProgress.totalBytes / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground uppercase">Packets</span>
                                            <span className="text-primary font-bold">{audioProgress.totalChunks}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 opacity-40 py-2">
                                        <Wifi className="w-6 h-6" />
                                        <p className="text-xs">No stream data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Captions */}
                <div className="w-full lg:w-[420px] shrink-0 h-[600px] lg:h-[calc(100vh-140px)] sticky top-24">
                    <div className="glass-panel h-full rounded-2xl p-0 overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md flex flex-col shadow-2xl">
                        {/* Caption Header */}
                        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="font-bold text-sm uppercase tracking-wider">Live Transcripts</span>
                            </div>
                            <span className="bg-white/10 text-[10px] font-mono px-2 py-1 rounded text-muted-foreground">REAL-TIME</span>
                        </div>

                        {/* Caption Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                            {captions.length > 0 ? (
                                <div className="space-y-4">
                                    {captions.map((caption, idx) => (
                                        <div key={`${caption.chunkIndex}-${idx}`} className="animate-fade-in-up flex gap-3 group">
                                            <span className="text-[10px] font-mono text-muted-foreground/50 pt-1 select-none w-6 flex-shrink-0">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </span>
                                            <div className="p-3 rounded-r-xl rounded-bl-xl bg-white/5 border border-white/5 text-sm leading-relaxed text-foreground/90 group-hover:bg-white/10 transition-colors">
                                                {caption.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-4" /> {/* Spacer */}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                        <Activity className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Waiting for speech...</p>
                                        <p className="text-xs text-muted-foreground/50 mt-1">Start recording and speak to generate captions.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Caption Footer/Status */}
                        <div className="p-3 bg-white/5 border-t border-white/10 text-[10px] text-center text-muted-foreground/60 font-mono uppercase tracking-widest">
                            {isRecording ? 'Listening for speech...' : 'Microphone Idle'}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
