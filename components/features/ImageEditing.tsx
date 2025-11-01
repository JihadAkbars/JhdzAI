
import React, { useState, useRef } from 'react';
import { editImage } from '../../services/geminiService';
import { SparklesIcon } from '../Icons';
import { fileToBase64 } from '../../utils/fileUtils';

export const ImageEditing: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<{ file: File; base64: string } | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setError("File size should not exceed 4MB.");
                return;
            }
            const base64 = await fileToBase64(file);
            setOriginalImage({ file, base64 });
            setEditedImage(null);
            setError(null);
        }
    };
    
    const handleEdit = async () => {
        if (!prompt.trim() || !originalImage) {
            setError('Please upload an image and enter an editing instruction.');
            return;
        }
        setIsLoading(true);
        setEditedImage(null);
        setError(null);
        try {
            const imagePart = {
                data: originalImage.base64.split(',')[1],
                mimeType: originalImage.file.type,
            };
            const resultUrl = await editImage(prompt, imagePart);
            setEditedImage(resultUrl);
        } catch (err) {
            console.error(err);
            setError('Failed to edit image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">Image Editing</h2>
                <p className="text-gray-400 mb-6">Upload an image and tell me how you'd like to change it.</p>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Image</label>
                        <div 
                          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500"
                          onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-500">
                                    <p className="pl-1">{originalImage ? 'Click to change image' : 'Click to upload an image'}</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 4MB</p>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {originalImage && (
                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">2. Editing Instructions</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Add a retro filter, or remove the person in the background"
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white resize-none"
                                rows={2}
                            />
                        </div>
                    )}
                    
                    <button
                        onClick={handleEdit}
                        disabled={isLoading || !originalImage || !prompt}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Applying Edits...' : 'Edit Image'}
                        {!isLoading && <SparklesIcon />}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>

                 {isLoading && (
                    <div className="mt-8 flex justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                    </div>
                )}
                
                {(originalImage || editedImage) && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-center">Original</h3>
                            <div className="bg-gray-800 p-2 rounded-lg">
                              {originalImage && <img src={originalImage.base64} alt="Original" className="rounded-md w-full" />}
                            </div>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold mb-2 text-center">Edited</h3>
                            <div className="bg-gray-800 p-2 rounded-lg h-full flex items-center justify-center">
                               {editedImage ? <img src={editedImage} alt="Edited" className="rounded-md w-full" /> : <div className="text-gray-500">Your edited image will appear here</div>}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
