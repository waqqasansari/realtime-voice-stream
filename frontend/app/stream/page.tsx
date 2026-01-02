"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, ArrowLeft } from "lucide-react";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import useVoiceStream from "@/hooks/useVoiceStream";

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

    const { sendAudioData, sendMetadata, isConnected } = useVoiceStream();

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
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans bg-zinc-50 dark:bg-black selection:bg-purple-500/30">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-800/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-800/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 dark:from-purple-800/10 dark:to-blue-800/10 rounded-full blur-[80px]" />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-40 brightness-100 dark:brightness-100 mix-blend-overlay"></div>
            </div>

            {/* Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30">
                <button
                    onClick={() => router.push('/')}
                    className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all duration-300 hover:scale-105"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium text-sm">Back</span>
                </button>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-colors duration-500 ${isConnected
                    ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">
                        {isConnected ? 'System Online' : 'Offline'}
                    </span>
                </div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4 mx-auto">
                {/* Header Section */}
                <div className="mb-12 text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                        Voice Streaming
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto font-light">
                        Real-time high fidelity audio transmission
                    </p>
                </div>

                {/* Main Visualizer Area */}
                <div className="w-full mb-16 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                    <VoiceVisualizer audioLevel={audioLevel} isRecording={isRecording} />
                </div>

                {/* Controls Section */}
                <div className="flex flex-col items-center gap-8">
                    {/* Timer */}
                    <div className={`font-mono text-2xl font-bold transition-all duration-500 ${isRecording ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
                        } text-zinc-800 dark:text-zinc-200`}>
                        {formatDuration(duration)}
                    </div>

                    {/* Main Interaction Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!isConnected}
                        className={`
                            relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer
                            ${!isConnected ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                        `}
                    >
                        {/* Button Glow/Background */}
                        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isRecording
                            ? 'bg-gradient-to-tr from-red-500 to-pink-600 shadow-[0_0_50px_-5px_rgba(239,68,68,0.5)]'
                            : 'bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-800 dark:to-zinc-900 shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)] border border-white/10'
                            }`} />

                        {/* Ripple Effect when recording */}
                        {isRecording && (
                            <>
                                <div className="absolute inset-0 rounded-full border border-red-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                <div className="absolute inset-0 rounded-full border border-red-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                            </>
                        )}

                        {/* Icon */}
                        <div className="relative z-10 text-white">
                            {isRecording ? (
                                <div className="w-8 h-8 rounded bg-white shadow-lg animate-[pulse_2s_infinite]" />
                            ) : (
                                <Mic className="w-10 h-10 drop-shadow-md" />
                            )}
                        </div>
                    </button>

                    <p className="text-sm text-zinc-500 dark:text-zinc-500 font-medium">
                        {isRecording ? 'Tap to stop recording' : 'Tap to start listening'}
                    </p>
                </div>
            </main>
        </div>
    );
}
