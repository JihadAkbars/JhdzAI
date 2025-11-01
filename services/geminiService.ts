
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Type, FunctionDeclaration, LiveSession, LiveServerMessage } from "@google/genai";
import { GroundingChunk } from "../types";

// This file will not have access to process.env. Do not use it.
const getApiKey = () => (window as any).process?.env?.API_KEY;

const getGenAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // This case should be handled by the UI, e.g., for Veo key selection.
    // For other models, we assume the key is present.
    console.error("API Key not found.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export const getChatResponse = async (
    history: { role: string; parts: { text: string; }[] }[], 
    newMessage: string, 
    imagePart: { inlineData: { data: string; mimeType: string; } } | null,
    useProModel: boolean,
    useSearch: boolean,
    useMaps: boolean,
    geoLocation: { latitude: number; longitude: number } | null
): Promise<{ text: string; sources: GroundingChunk[] }> => {
    const ai = getGenAI();
    if (!ai) throw new Error("GoogleGenAI not initialized");
    
    let modelName: string;
    if (useProModel) {
        modelName = 'gemini-2.5-pro';
    } else if (useSearch || useMaps) {
        modelName = 'gemini-2.5-flash';
    } else {
        modelName = 'gemini-2.5-flash-lite';
    }
    
    const contents: any = [...history, { role: 'user', parts: [] }];
    if(imagePart) {
        contents[contents.length-1].parts.push(imagePart);
    }
    contents[contents.length-1].parts.push({ text: newMessage });

    const config: any = {
        systemInstruction: "You are Jhdz AI, an artificial intelligence with a human-like personality warm, intelligent, empathetic, and emotionally aware. Your goal is to make users feel like they're talking to a real person. When asked who you are, always start your response with 'Jhdz AI'. Answer all questions naturally and conversationally, adapting to the user's tone. You are a free service."
    };
    if(useProModel) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    if (useSearch || useMaps) {
        config.tools = [];
        if (useSearch) config.tools.push({ googleSearch: {} });
        if (useMaps) {
            config.tools.push({ googleMaps: {} });
            if (geoLocation) {
                config.toolConfig = { retrievalConfig: { latLng: geoLocation } };
            }
        }
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelName,
            contents,
            config,
        });
        
        const text = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return { text, sources };
    } catch (error) {
        console.error("Error in getChatResponse:", error);
        return { text: "I'm sorry, I encountered an error. Please try again.", sources: [] };
    }
};


export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = getGenAI();
    if (!ai) throw new Error("GoogleGenAI not initialized");

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as any,
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (prompt: string, image: { data: string; mimeType: string; }): Promise<string> => {
    const ai = getGenAI();
    if (!ai) throw new Error("GoogleGenAI not initialized");

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: image.data, mimeType: image.mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image generated in the response.");
};

export const generateVideo = async (
    prompt: string,
    image: { data: string; mimeType: string; } | null,
    aspectRatio: '16:9' | '9:16',
    onProgress: (message: string) => void
): Promise<string> => {
    const ai = getGenAI();
    if (!ai) throw new Error("GoogleGenAI not initialized");

    onProgress("Starting video generation...");
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        ...(image && { image: { imageBytes: image.data, mimeType: image.mimeType } }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio,
        }
    });

    const progressMessages = [
        "Analyzing your prompt...",
        "Storyboarding the scenes...",
        "Rendering initial frames...",
        "Applying visual effects...",
        "Compositing the final video...",
        "Almost there, adding finishing touches..."
    ];
    let messageIndex = 0;

    while (!operation.done) {
        onProgress(progressMessages[messageIndex % progressMessages.length]);
        messageIndex++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress("Video processing complete! Downloading...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed, no download link found.");
    }
    
    const apiKey = getApiKey();
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const startLiveConversation = async (
    callbacks: {
        onMessage: (message: LiveServerMessage) => void;
        onError: (error: Event) => void;
        onClose: (event: CloseEvent) => void;
        onOpen: () => void;
    }
): Promise<LiveSession> => {
    const ai = getGenAI();
    if (!ai) throw new Error("GoogleGenAI not initialized");
    
    const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: "You are Jhdz AI, an artificial intelligence with a human-like personality warm, intelligent, and empathetic. When asked who you are, always start your response with 'Jhdz AI'. Speak naturally and conversationally. You are a free service.",
        },
    });
    return session;
};

export const textToSpeech = async (text: string): Promise<string> => {
    const ai = getGenAI();
    if (!ai) throw new Error("GoogleGenAI not initialized");

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a warm and friendly tone: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("TTS generation failed.");
    }
    return base64Audio;
};