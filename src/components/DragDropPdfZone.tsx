import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

export const DragDropPdfZone: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-80 rounded-3xl border-2 border-dashed transition-all duration-500 ease-in-out ${
          isHovering 
            ? 'border-purple-400 bg-purple-900/20 shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-[pulse_2s_ease-in-out_infinite]' 
            : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        {!file ? (
          <div className="flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className={`p-4 rounded-full mb-4 transition-all duration-500 ${isHovering ? 'bg-purple-500/20 text-purple-400 scale-110' : 'bg-slate-800 text-slate-400'}`}>
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload a Document</h3>
            <p className="text-slate-400 max-w-sm mb-6">
              Drag and drop your PDF here, or click to browse. We'll extract and translate the text automatically.
            </p>
            <button className="px-6 py-2.5 rounded-full bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-colors pointer-events-auto">
              Browse Files
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-8 animate-in fade-in duration-300">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setFile(null)}
                className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-4 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <FileText className="w-12 h-12" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1 truncate max-w-xs">{file.name}</h4>
            <p className="text-sm text-slate-400 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-1">
              Start Translation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
