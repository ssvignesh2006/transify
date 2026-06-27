import React, { useState } from 'react';
import { ArrowLeftRight, Mic, Volume2, Copy, Check } from 'lucide-react';

export const TranslationWorkspace: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [isSwapped, setIsSwapped] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
    const temp = sourceText;
    setSourceText(targetText);
    setTargetText(temp);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row gap-6 relative items-stretch">
        
        {/* Source Text Area */}
        <div className="flex-1 flex flex-col group">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-900/80 rounded-t-2xl border border-slate-700/50 border-b-0">
            <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">
              {isSwapped ? 'Spanish' : 'English'}
            </span>
            <button className="text-slate-400 hover:text-purple-400 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <div className="relative flex-grow">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-64 lg:h-80 p-6 bg-slate-900/40 rounded-b-2xl border border-slate-700/50 shadow-inner text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300"
            />
          </div>
        </div>

        {/* Swap Button (Floating) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex">
          <button 
            onClick={handleSwap}
            className="p-3 bg-slate-800 rounded-full border border-slate-600 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:border-purple-500 group transition-all duration-300"
          >
            <ArrowLeftRight 
              className={`w-6 h-6 text-purple-400 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSwapped ? 'rotate-180' : 'rotate-0'}`} 
            />
          </button>
        </div>
        
        {/* Swap Button (Mobile) */}
        <div className="flex justify-center lg:hidden -my-2 z-10 relative">
          <button 
            onClick={handleSwap}
            className="p-3 bg-slate-800 rounded-full border border-slate-600 shadow-lg group active:scale-95 transition-all duration-300"
          >
            <ArrowLeftRight 
              className={`w-5 h-5 text-purple-400 transition-transform duration-500 ${isSwapped ? 'rotate-180' : 'rotate-0'}`} 
            />
          </button>
        </div>

        {/* Target Text Area */}
        <div className="flex-1 flex flex-col group">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-900/80 rounded-t-2xl border border-slate-700/50 border-b-0">
            <span className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
              {isSwapped ? 'English' : 'Spanish'}
            </span>
            <button className="text-slate-400 hover:text-indigo-400 transition-colors">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <div className="relative flex-grow">
            <textarea
              readOnly
              value={targetText}
              placeholder="Translation will appear here..."
              className="w-full h-64 lg:h-80 p-6 bg-slate-900/40 rounded-b-2xl border border-slate-700/50 shadow-inner text-purple-50 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
            />
            {/* Copy Button */}
            <div className="absolute bottom-4 right-4">
               <button 
                 onClick={handleCopy}
                 className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300 backdrop-blur-sm"
               >
                 {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
