
import React, { useState, useRef, useEffect } from 'react';
import { generateVideo } from '../../services/geminiService';
import { SparklesIcon } from '../Icons';
import { fileToBase64 } from '../../utils/fileUtils';

type AspectRatio = '16:9' | '9:16';

const AspectRatioButton: React.FC<{ value: AspectRatio, label:string; selected: AspectRatio; setSelected: (val: AspectRatio) => void; }> = ({ value, label, selected, setSelected }) => (
    <button
        onClick={() => setSelected(value)}
        className={`px-4 py-2 text-sm rounded-md transition-colors ${
            selected === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
        }`}
    >
        {label}
    </button>
);

export const VideoGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<{ file: File; base64: string } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            // Assume success to avoid race condition
            setApiKeySelected(true);
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
             if (file.size > 16 * 1024 * 1024) { // 16MB limit for Veo
                setError("File size should not exceed 16MB.");
                return;
            }
            const base64 = await fileToBase64(file);
            setImage({ file, base64 });
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setGeneratedVideo(null);
        setError(null);
        setProgressMessage('Initiating generation...');
        try {
            const imagePart = image ? { data: image.base64.split(',')[1], mimeType: image.file.type } : null;
            const videoUrl = await generateVideo(prompt, imagePart, aspectRatio, setProgressMessage);
            setGeneratedVideo(videoUrl);
        } catch (err: any) {
            console.error(err);
             if (err.message && err.message.includes("Requested entity was not found")) {
                setError("Your API key is invalid or not found. Please select a valid key.");
                setApiKeySelected(false); // Force re-selection
            } else {
                setError('Failed to generate video. Please try again.');
            }
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };

    if (!apiKeySelected) {
        return (
            <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-white mb-4">API Key Required for Video Generation</h2>
                <p className="text-gray-400 mb-6 max-w-md">Video generation with Veo is a powerful feature that requires you to select an API key associated with a project that has billing enabled.</p>
                <button
                    onClick={handleSelectKey}
                    className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Select API Key
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-indigo-400 hover:underline">
                    Learn more about billing
                </a>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">Video Generation</h2>
                <p className="text-gray-400 mb-6">Bring your ideas to life. Describe the video you want to create.</p>
                
                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A majestic whale breaching the ocean surface in slow motion."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white resize-none"
                        rows={3}
                    />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Starting Image (Optional)</label>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full text-left p-3 bg-gray-700 border border-gray-600 rounded-lg hover:border-indigo-500">
                           {image ? <span className="text-white">{image.file.name}</span> : <span className="text-gray-400">Click to upload an image</span>}
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                        <div className="flex gap-2">
                            <AspectRatioButton value="16:9" label="Landscape" selected={aspectRatio} setSelected={setAspectRatio} />
                            <AspectRatioButton value="9:16" label="Portrait" selected={aspectRatio} setSelected={setAspectRatio} />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Video'}
                        {!isLoading && <SparklesIcon />}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>
                
                {isLoading && (
                    <div className="mt-8 text-center">
                         <div className="flex justify-center mb-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                        </div>
                        <p className="text-indigo-300 animate-pulse">{progressMessage}</p>
                    </div>
                )}
                
                {generatedVideo && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-center">Your Video</h3>
                        <div className="bg-gray-800 p-2 rounded-lg">
                           <video src={generatedVideo} controls autoPlay loop className="w-full rounded-md" />
                        </div>
                         <a 
                          href={generatedVideo} 
                          download="generated-video.mp4"
                          className="mt-4 block w-full text-center bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Download Video
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};
