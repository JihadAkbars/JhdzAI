import React, { useState } from 'react';
import { Feature } from './types';
import { Chat } from './components/features/Chat';
import { ImageGeneration } from './components/features/ImageGeneration';
import { ImageEditing } from './components/features/ImageEditing';
import { VideoGeneration } from './components/features/VideoGeneration';
import { LiveConversation } from './components/features/LiveConversation';
import { SparklesIcon } from './components/Icons';

const NavItem: React.FC<{
  feature: Feature;
  activeFeature: Feature;
  setFeature: (feature: Feature) => void;
  children: React.ReactNode;
}> = ({ feature, activeFeature, setFeature, children }) => {
  const isActive = feature === activeFeature;
  return (
    <button
      onClick={() => setFeature(feature)}
      className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
        isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'
      }`}
    >
      {children}
      <span className="ml-3">{feature}</span>
    </button>
  );
};

const App: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState<Feature>(Feature.Chat);

    const renderFeature = () => {
        switch (activeFeature) {
            case Feature.Chat:
                return <Chat />;
            case Feature.ImageGen:
                return <ImageGeneration />;
            case Feature.ImageEdit:
                return <ImageEditing />;
            case Feature.VideoGen:
                return <VideoGeneration />;
            case Feature.Live:
                return <LiveConversation />;
            default:
                return <Chat />;
        }
    };

    return (
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 hidden md:flex flex-col">
          <div className="flex items-center mb-8">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <SparklesIcon />
            </div>
            <h1 className="text-xl font-bold ml-3">Jhdz AI <span className="text-sm font-normal text-gray-400">(BETA)</span></h1>
          </div>
          <nav className="flex-1 space-y-2">
            <NavItem feature={Feature.Chat} activeFeature={activeFeature} setFeature={setActiveFeature}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </NavItem>
            <NavItem feature={Feature.ImageGen} activeFeature={activeFeature} setFeature={setActiveFeature}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </NavItem>
            <NavItem feature={Feature.ImageEdit} activeFeature={activeFeature} setFeature={setActiveFeature}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
            </NavItem>
            <NavItem feature={Feature.VideoGen} activeFeature={activeFeature} setFeature={setActiveFeature}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </NavItem>
            <NavItem feature={Feature.Live} activeFeature={activeFeature} setFeature={setActiveFeature}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </NavItem>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
           <div className="p-2 border-b border-gray-700 md:hidden">
              <select 
                value={activeFeature} 
                onChange={(e) => setActiveFeature(e.target.value as Feature)}
                className="w-full bg-gray-800 text-white p-2 rounded-md"
              >
                {Object.values(Feature).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
           </div>
          {renderFeature()}
        </main>
      </div>
    );
};

export default App;
