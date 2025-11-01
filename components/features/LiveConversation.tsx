
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { startLiveConversation } from '../../services/geminiService';
import { MicIcon } from '../Icons';
import { GoogleGenAI, LiveServerMessage, LiveSession, Blob } from "@google/genai";
import { decode, encode, decodeAudioData } from '../../utils/audioUtils';

export const LiveConversation: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [transcriptHistory, setTranscriptHistory] = useState<{user: string, ai: string}[]>([]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    const stopConversation = useCallback(() => {
        if(sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsActive(false);
        setIsConnecting(false);
    }, []);

    const handleMessage = async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            setAiTranscript(prev => prev + message.serverContent.outputTranscription.text);
        }
        if (message.serverContent?.inputTranscription) {
            setUserTranscript(prev => prev + message.serverContent.inputTranscription.text);
        }

        if (message.serverContent?.turnComplete) {
            setTranscriptHistory(prev => [...prev, {user: userTranscript, ai: aiTranscript}]);
            setUserTranscript('');
            setAiTranscript('');
        }

        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            const outputAudioContext = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);

            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }

         if (message.serverContent?.interrupted) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = 0;
        }
    };
    
    const startConversation = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = startLiveConversation({
                onOpen: () => {
                    if (!streamRef.current || !inputAudioContextRef.current) return;
                    setIsActive(true);
                    setIsConnecting(false);

                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                    scriptProcessorRef.current.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };

                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onMessage: handleMessage,
                onError: (e) => {
                    console.error("Live session error:", e);
                    setError("A connection error occurred.");
                    stopConversation();
                },
                onClose: () => {
                    stopConversation();
                },
            });

        } catch (err) {
            console.error("Failed to start conversation:", err);
            setError("Could not access microphone. Please grant permission and try again.");
            setIsConnecting(false);
        }
    };

    const toggleConversation = () => {
        if (isActive || isConnecting) {
            stopConversation();
        } else {
            startConversation();
        }
    };
    
     useEffect(() => {
        // Cleanup on component unmount
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Live Conversation</h2>
            <p className="text-gray-400 mb-8">Talk with Jhdz in real-time. Tap the button to start.</p>
            
            <div className="mb-8">
                <button
                    onClick={toggleConversation}
                    disabled={isConnecting}
                    className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-colors duration-300 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:bg-gray-500`}
                >
                    {isActive && <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>}
                    <MicIcon recording={isActive} />
                </button>
                <p className="mt-4 text-sm text-gray-400">
                    {isConnecting ? 'Connecting...' : isActive ? 'Tap to end conversation' : 'Tap to start conversation'}
                </p>
            </div>

            <div className="w-full max-w-2xl h-64 bg-gray-800 rounded-lg p-4 overflow-y-auto text-left text-sm">
                {transcriptHistory.map((turn, index) => (
                    <div key={index} className="mb-3">
                        <p className="text-blue-400"><strong>You:</strong> {turn.user}</p>
                        <p className="text-indigo-400"><strong>Jhdz:</strong> {turn.ai}</p>
                    </div>
                ))}
                 {(userTranscript || aiTranscript) && (
                     <div className="opacity-70">
                        {userTranscript && <p className="text-blue-400"><strong>You:</strong> {userTranscript}</p>}
                        {aiTranscript && <p className="text-indigo-400"><strong>Jhdz:</strong> {aiTranscript}</p>}
                    </div>
                 )}
                 {!isActive && transcriptHistory.length === 0 && (
                     <p className="text-gray-500 h-full flex items-center justify-center">Your conversation transcript will appear here.</p>
                 )}
            </div>
            {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>
    );
};
