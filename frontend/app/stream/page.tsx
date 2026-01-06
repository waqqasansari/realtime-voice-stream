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

            <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl px-4 mx-auto py-20">
                {/* Header Section */}
                <div className="mb-12 text-center space-y-4 animate-fade-in-down">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 backdrop-blur-sm">
                        <Activity className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 drop-shadow-sm">
                        Live Voice Stream
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto font-light tracking-wide">
                        High-fidelity, low-latency audio transmission channel
                    </p>
                </div>

                {/* Main Visualizer Area */}
                <div className="w-full mb-12 relative group max-w-3xl mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative glass-panel rounded-[2.5rem] p-8 overflow-hidden">
                        <VoiceVisualizer audioLevel={audioLevel} isRecording={isRecording} />
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex flex-col items-center gap-10 w-full max-w-2xl">

                    {/* Recording Control */}
                    <div className="flex flex-col items-center gap-6">
                        <div className={`font-mono text-4xl font-bold transition-all duration-500 ${isRecording ? 'opacity-100 text-foreground' : 'opacity-30 text-muted-foreground'}`}>
                            {formatDuration(duration)}
                        </div>

                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={!isConnected}
                            className={`
                                relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 
                                ${!isConnected ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-110 active:scale-95 cursor-pointer'}
                            `}
                        >
                            {/* Button Background/Glow */}
                            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isRecording
                                ? 'bg-gradient-to-tr from-rose-500 to-red-600 shadow-[0_0_60px_-10px_rgba(225,29,72,0.6)]'
                                : 'bg-gradient-to-tr from-foreground to-foreground/80 shadow-2xl border border-white/10'
                                }`} />

                            {/* Ripple Effect when recording */}
                            {isRecording && (
                                <>
                                    <div className="absolute inset-0 rounded-full border-2 border-rose-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                    <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                                </>
                            )}

                            {/* Icon */}
                            <div className={`relative z-10 transition-colors duration-300 ${isRecording ? 'text-white' : 'text-background'}`}>
                                {isRecording ? (
                                    <div className="w-10 h-10 rounded-lg bg-white shadow-lg animate-[pulse_2s_infinite]" />
                                ) : (
                                    <Mic className="w-12 h-12" />
                                )}
                            </div>
                        </button>

                        <p className="text-sm text-muted-foreground/80 font-medium uppercase tracking-widest">
                            {isRecording ? 'Broadcasting...' : 'Tap to Stream'}
                        </p>
                    </div>

                    {/* Stats & Captions */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Stats Panel */}
                        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Stream Stats</div>
                            <div className="font-mono text-xs text-foreground/80 space-y-1">
                                {audioProgress ? (
                                    <>
                                        <div className="flex justify-between w-full gap-4"><span>Chunk Size:</span> <span className="text-primary">{audioProgress.chunkBytes} B</span></div>
                                        <div className="flex justify-between w-full gap-4"><span>Total Data:</span> <span className="text-primary">{(audioProgress.totalBytes / 1024).toFixed(1)} KB</span></div>
                                        <div className="flex justify-between w-full gap-4"><span>Packets:</span> <span className="text-primary">{audioProgress.totalChunks}</span></div>
                                    </>
                                ) : (
                                    <p className="opacity-50">No data transmitted yet</p>
                                )}
                            </div>
                        </div>

                        {/* Captions Panel */}
                        <div className="glass-panel p-6 rounded-2xl min-h-[120px]">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Live Captions
                            </div>

                            <div className="h-24 overflow-y-auto custom-scrollbar">
                                {captions.length > 0 ? (
                                    <ul className="space-y-2 text-sm">
                                        {captions.slice(-6).map((caption) => (
                                            <li key={`${caption.chunkIndex}-${caption.text}`} className="text-foreground/90 leading-relaxed animate-fade-in-up">
                                                <span className="text-[10px] font-mono text-primary/70 mr-2">
                                                    #{caption.chunkIndex}
                                                </span>
                                                {caption.text}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground/50 italic">
                                        Waiting for speech...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
