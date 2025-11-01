import React, { useState } from 'react';
import { ChatMessage as ChatMessageProps, Sender } from '../types';
import { BotIcon, UserIcon, SpeakerIcon } from './Icons';
import { textToSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

// A simple markdown to HTML converter
const Markdown = ({ content }: { content: string }) => {
    const html = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 rounded px-1 py-0.5 text-sm font-mono">$1</code>')
        .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export const ChatMessage: React.FC<{ message: ChatMessageProps }> = ({ message }) => {
    const isUser = message.sender === Sender.User;
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = async () => {
        if (isSpeaking) return;
        setIsSpeaking(true);
        try {
            const audioData = await textToSpeech(message.text);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const decodedBytes = decode(audioData);
            const buffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
            
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();
            source.onended = () => setIsSpeaking(false);
        } catch (error) {
            console.error("TTS Error:", error);
            setIsSpeaking(false);
        }
    };
    
    return (
        <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <BotIcon />
                </div>
            )}
            <div className={`max-w-xl md:max-w-2xl p-4 rounded-2xl ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <div className="prose prose-invert prose-sm">
                    {message.image && <img src={message.image} alt="user upload" className="rounded-lg mb-2 max-h-60" />}
                    <Markdown content={message.text} />
                </div>
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                        <h4 className="text-xs font-semibold text-gray-400 mb-1">Sources:</h4>
                        <ul className="text-xs space-y-1">
                            {message.sources.map((source, index) => (
                                <li key={index} className="truncate">
                                    {source.web && <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{source.web.title}</a>}
                                    {source.maps && <a href={source.maps.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{source.maps.title}</a>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                 {!isUser && (
                    <div className="mt-2">
                        <button onClick={handleSpeak} disabled={isSpeaking} className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                            <SpeakerIcon />
                        </button>
                    </div>
                )}
            </div>
             {isUser && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <UserIcon />
                </div>
            )}
        </div>
    );
};