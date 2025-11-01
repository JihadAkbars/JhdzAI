
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage as Message } from '../ChatMessage';
import { ChatMessage, Sender } from '../../types';
import { getChatResponse } from '../../services/geminiService';
import { SendIcon, AttachmentIcon, CloseIcon, BrainIcon, SearchIcon, MapIcon } from '../Icons';
import { fileToBase64 } from '../../utils/fileUtils';

// Helper component for mode toggles
const ModeButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; label: string }> = ({ isActive, onClick, children, label }) => (
    <button
        onClick={onClick}
        title={label}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
            isActive ? 'bg-indigo-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
    >
        {children}
        {label}
    </button>
);

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', sender: Sender.AI, text: "Jhdz AI at your service. I'm a free, human-like AI companion designed to be warm, intelligent, and empathetic. Ask me anything, I'm here to help!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useProModel, setUseProModel] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const [geoLocation, setGeoLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [attachedFile, setAttachedFile] = useState<{ file: File; base64: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (useMaps && !geoLocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGeoLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setMessages(prev => [...prev, {id: Date.now().toString(), sender: Sender.System, text: "Could not get your location for Maps. Please ensure location services are enabled."}]);
                    setUseMaps(false);
                }
            );
        }
    }, [useMaps, geoLocation]);

    const handleSendMessage = useCallback(async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: Sender.User,
            text: input,
            image: attachedFile?.file.type.startsWith('image/') ? attachedFile.base64 : undefined,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const aiThinkingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: Sender.AI,
            text: '...',
        };
        setMessages(prev => [...prev, aiThinkingMessage]);

        const historyForApi = messages
            .filter(m => m.sender !== Sender.System)
            .map(m => ({
                role: m.sender === Sender.AI ? 'model' : 'user',
                parts: [{ text: m.text }],
            }));
        
        const imagePart = attachedFile?.file.type.startsWith('image/')
            ? { inlineData: { data: attachedFile.base64.split(',')[1], mimeType: attachedFile.file.type } }
            : null;

        try {
            const { text: aiResponse, sources } = await getChatResponse(historyForApi, input, imagePart, useProModel, useSearch, useMaps, geoLocation);
            const newAiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: Sender.AI,
                text: aiResponse,
                sources: sources,
            };
            setMessages(prev => prev.slice(0, -1).concat(newAiMessage));
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: Sender.AI,
                text: "I'm having a little trouble thinking right now. Please try again later.",
            };
            setMessages(prev => prev.slice(0, -1).concat(errorMessage));
        }

        setInput('');
        setAttachedFile(null);
        setIsLoading(false);
    }, [input, isLoading, messages, attachedFile, useProModel, useSearch, useMaps, geoLocation]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                alert("File size should not exceed 4MB.");
                return;
            }
            const base64 = await fileToBase64(file);
            setAttachedFile({ file, base64 });
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    {messages.map((msg) => (
                        <Message key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="border-t border-gray-700 p-4 md:p-6 bg-gray-800">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                        <ModeButton isActive={useProModel} onClick={() => setUseProModel(!useProModel)} label="Deep Thought">
                            <BrainIcon />
                        </ModeButton>
                         <ModeButton isActive={useSearch} onClick={() => setUseSearch(!useSearch)} label="Search">
                            <SearchIcon />
                        </ModeButton>
                         <ModeButton isActive={useMaps} onClick={() => setUseMaps(!useMaps)} label="Maps">
                            <MapIcon />
                        </ModeButton>
                    </div>

                    {attachedFile && (
                        <div className="mb-2 p-2 bg-gray-700 rounded-lg flex items-center justify-between text-sm">
                            <span className="truncate">{attachedFile.file.name}</span>
                            <button onClick={() => setAttachedFile(null)} className="p-1 rounded-full hover:bg-gray-600">
                                <CloseIcon />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center bg-gray-700 rounded-xl p-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white">
                            <AttachmentIcon />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask Jhdz anything..."
                            className="flex-1 bg-transparent focus:outline-none px-2 text-white"
                            disabled={isLoading}
                        />
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 bg-indigo-600 rounded-lg text-white disabled:bg-indigo-400 disabled:cursor-not-allowed">
                            {isLoading ? '...' : <SendIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};