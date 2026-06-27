import React, { useState } from 'react';
import { Settings, User } from 'lucide-react';

export const Header: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Translate' | 'Document'>('Translate');

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[90vw] max-w-4xl">
        
        {/* Logo area */}
        <div className="flex items-center pl-4 pr-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <span className="text-white font-bold text-lg leading-none">T</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-wide hidden sm:block">Transify</span>
        </div>

        {/* Floating Navigation with Animated Indicator */}
        <nav className="relative flex items-center bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          {/* Animated Background Indicator */}
          <div 
            className="absolute top-1 bottom-1 w-[110px] bg-gradient-to-r from-purple-600/80 to-indigo-600/80 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-500 ease-out z-0"
            style={{ 
              transform: `translateX(${activeTab === 'Translate' ? '0' : '100%'})`,
            }}
          />
          
          <button
            onClick={() => setActiveTab('Translate')}
            className={`relative z-10 w-[110px] py-2 text-sm font-medium transition-colors duration-300 ${
              activeTab === 'Translate' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Translate
          </button>
          <button
            onClick={() => setActiveTab('Document')}
            className={`relative z-10 w-[110px] py-2 text-sm font-medium transition-colors duration-300 ${
              activeTab === 'Document' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Document
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 pr-2 pl-6">
          <button className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-300">
            <User className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};
