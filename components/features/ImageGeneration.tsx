
import React, { useState } from 'react';
import { generateImage } from '../../services/geminiService';
import { AspectRatio } from '../../types';
import { SparklesIcon } from '../Icons';

const AspectRatioButton: React.FC<{ value: AspectRatio; selected: AspectRatio; setSelected: (val: AspectRatio) => void; }> = ({ value, selected, setSelected }) => (
    <button
        onClick={() => setSelected(value)}
        className={`px-4 py-2 text-sm rounded-md transition-colors ${
            selected === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
        }`}
    >
        {value}
    </button>
);

export const ImageGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setGeneratedImage(null);
        setError(null);
        try {
            const imageUrl = await generateImage(prompt, aspectRatio);
            setGeneratedImage(imageUrl);
        } catch (err) {
            console.error(err);
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">Image Generation</h2>
                <p className="text-gray-400 mb-6">Describe the image you want to create. Be as specific as you can!</p>
                
                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A photo of a futuristic city at sunset, with flying cars and neon lights."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white resize-none"
                        rows={3}
                    />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                        <div className="flex gap-2 flex-wrap">
                            <AspectRatioButton value="1:1" selected={aspectRatio} setSelected={setAspectRatio} />
                            <AspectRatioButton value="16:9" selected={aspectRatio} setSelected={setAspectRatio} />
                            <AspectRatioButton value="9:16" selected={aspectRatio} setSelected={setAspectRatio} />
                            <AspectRatioButton value="4:3" selected={aspectRatio} setSelected={setAspectRatio} />
                            <AspectRatioButton value="3:4" selected={aspectRatio} setSelected={setAspectRatio} />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Image'}
                        {!isLoading && <SparklesIcon />}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>
                
                {isLoading && (
                    <div className="mt-8 flex justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                    </div>
                )}
                
                {generatedImage && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-center">Your Creation</h3>
                        <div className="bg-gray-800 p-2 rounded-lg">
                             <img src={generatedImage} alt="Generated" className="rounded-md w-full" />
                        </div>
                        <a 
                          href={generatedImage} 
                          download="generated-image.jpg"
                          className="mt-4 block w-full text-center bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Download Image
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};
