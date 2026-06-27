import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Languages,
  ArrowLeftRight,
  Copy,
  Volume2,
  VolumeX,
  Trash2,
  Clock,
  WifiOff,
  Loader2,
  CheckCircle2,
  Database,
  BookOpen,
  X,
  MessageSquare,
  Sparkles,
  Play,
  Star,
  Download,
  Mic,
  MicOff,
  FileText,
  UploadCloud,
  Printer,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { LoginView } from './components/LoginView';
import { useTranslationStore, LANGUAGES, type AppStatus } from './store';
import { translateText, speak, stopSpeaking, extractTextFromPDF, translateDocument } from './api';
import { getHistory, clearHistory, toggleTranslationStar, getStarredHistory, deleteTranslation } from './db';
import type { TranslationRecord } from './db';
import { AnimatePresence, motion } from 'framer-motion';
import { TiltCard } from './components/TiltCard';
import { Scene3D } from './components/Scene3D';

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({ status, fromCache }: { status: AppStatus; fromCache: boolean }) {
  if (status === 'idle') return null;

  type BadgeCfg = { icon: React.ReactNode; label: string; cls: string };
  const configs: Record<string, BadgeCfg> = {
    loading: {
      icon: <Loader2 size={12} className="animate-spin" />,
      label: 'Translating...',
      cls: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    success: {
      icon: fromCache ? <Database size={12} /> : <CheckCircle2 size={12} />,
      label: fromCache ? 'From cache' : 'Translated',
      cls: fromCache
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
    },
    error: {
      icon: <WifiOff size={12} />,
      label: 'Failed',
      cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    offline: {
      icon: <WifiOff size={12} />,
      label: 'Offline',
      cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <span className={`status-pill ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading Shimmer Text
// ---------------------------------------------------------------------------
function LoadingShimmer() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-4 bg-white/5 rounded-md w-3/4 animate-pulse" />
      <div className="h-4 bg-white/5 rounded-md w-1/2 animate-pulse" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// History item
// ---------------------------------------------------------------------------
function HistoryItem({
  record,
  onRestore,
  onToggleStar,
  onDelete,
}: {
  record: TranslationRecord;
  onRestore: (r: TranslationRecord) => void;
  onToggleStar: (e: React.MouseEvent, record: TranslationRecord) => void;
  onDelete: (e: React.MouseEvent, record: TranslationRecord) => void;
}) {
  const langName = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase();

  return (
    <div className="panel-sm-hover p-3 group relative flex flex-col items-start text-left">
      <button
        onClick={() => onRestore(record)}
        className="absolute inset-0 w-full h-full text-left"
        aria-label={`Restore translation: ${record.sourceText.slice(0, 40)}`}
      />
      <div className="flex items-center gap-1.5 mb-2 w-full relative z-10 pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">
          {langName(record.sourceLang)} &rarr; {langName(record.targetLang)}
        </span>
        <div className="ml-auto flex items-center gap-0.5 pointer-events-auto">
          <button 
            onClick={(e) => onToggleStar(e, record)}
            className={`p-1.5 rounded-md transition-colors ${record.isStarred ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}
            title={record.isStarred ? 'Unstar translation' : 'Star translation'}
          >
            <Star size={14} className={record.isStarred ? 'fill-current' : ''} />
          </button>
          <button
            onClick={(e) => onDelete(e, record)}
            className="p-1.5 rounded-md text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
            title="Delete this translation"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-400 truncate mb-1 w-full pointer-events-none">{record.sourceText}</p>
      <p className="text-[13px] text-slate-200 truncate font-medium w-full pointer-events-none">
        {record.translatedText}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const {
    sourceText,
    translatedText,
    sourceLang,
    targetLang,
    status,
    errorMessage,
    fromCache,
    history,
    isSpeaking,
    isDocProcessing,
    docProgress,
    translatedDocText,
    setSourceText,
    setTranslatedText,
    setSourceLang,
    setTargetLang,
    setStatus,
    setFromCache,
    swapLanguages,
    setHistory,
    setIsSpeaking,
    setIsDocProcessing,
    setDocProgress,
    setTranslatedDocText,
    user,
    isGuest,
    theme,
    setTheme,
    logout
  } = useTranslationStore();

  const [activeTab, setActiveTab] = useState<'translate' | 'sentence' | 'document'>('translate');
  const [sentenceInput, setSentenceInput] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const copyFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);

  // ── Theme Setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ── Speech Recognition Setup ──────────────────────────────────────────────
  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (activeTab === 'translate') {
          const prev = useTranslationStore.getState().sourceText;
          setSourceText(prev ? prev + ' ' + transcript : transcript);
        } else {
          setSentenceInput((prev: string) => prev ? prev + ' ' + transcript : transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [activeTab, setSourceText, setSentenceInput]);

  const handleListen = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Configure language based on sourceLang selector
      recognitionRef.current.lang = sourceLang === 'auto' ? navigator.language : sourceLang;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  }, [isListening, sourceLang]);

  // ── Manual Translation Trigger ──────────────────────────────────────────
  const handleTranslate = useCallback(async () => {
    const textToTranslate = activeTab === 'translate' ? sourceText : sentenceInput;
    
    if (!textToTranslate.trim()) {
      setTranslatedText('');
      setStatus('idle');
      return;
    }
    
    setStatus('loading');
    try {
      const result = await translateText(textToTranslate, sourceLang, targetLang);
      setTranslatedText(result.translatedText);
      setFromCache(result.fromCache);
      setStatus('success');
      const h = showStarredOnly ? await getStarredHistory() : await getHistory();
      setHistory(h);
    } catch {
      const offline = !navigator.onLine;
      setStatus(
        offline ? 'offline' : 'error',
        offline
          ? 'You appear to be offline.'
          : 'Translation failed. Trying cached results...',
      );
      setTranslatedText('');
    }
  }, [activeTab, sourceText, sentenceInput, sourceLang, targetLang, setTranslatedText, setStatus, setFromCache, setHistory, showStarredOnly]);

  // ── Document Translation Logic ──────────────────────────────────────────
  const handleTranslateDocument = useCallback(async () => {
    if (!selectedFile) return;
    setIsDocProcessing(true);
    setTranslatedDocText('');
    
    try {
      const extractedText = await extractTextFromPDF(selectedFile, (msg) => setDocProgress(msg));
      
      if (!extractedText.trim()) {
        throw new Error('No text found in PDF');
      }

      setDocProgress('Preparing to translate...');
      const finalTranslated = await translateDocument(extractedText, sourceLang, targetLang, (msg) => setDocProgress(msg));
      
      setTranslatedDocText(finalTranslated);
      setDocProgress('Translation complete!');
    } catch (err) {
      console.error(err);
      setDocProgress('Error translating document.');
    } finally {
      setIsDocProcessing(false);
    }
  }, [selectedFile, sourceLang, targetLang, setIsDocProcessing, setDocProgress, setTranslatedDocText]);

  // ── Grammar & Humanize Logic ──────────────────────────────────────────
  // ── Load history on mount & toggle ──────────────────────────────────────
  const loadHistory = useCallback(async () => {
    const h = showStarredOnly ? await getStarredHistory() : await getHistory();
    setHistory(h);
  }, [showStarredOnly, setHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter => Translate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (activeTab === 'document') {
          handleTranslateDocument();
        } else {
          e.preventDefault();
          handleTranslate();
        }
      }
      
      // Alt + S => Swap Languages
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        swapLanguages();
      }
      
      // Esc => Clear input
      if (e.key === 'Escape') {
        if (activeTab === 'translate') {
          setSourceText('');
        } else if (activeTab === 'sentence') {
          setSentenceInput('');
        } else if (activeTab === 'document') {
          setSelectedFile(null);
          setTranslatedDocText('');
        }
        setTranslatedText('');
        setStatus('idle');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTranslate, handleTranslateDocument, swapLanguages, activeTab, setSourceText, setSentenceInput, setTranslatedText, setStatus, setSelectedFile, setTranslatedDocText]);

  const isOnline = navigator.onLine;

  // ── Copy handler ────────────────────────────────────────────────────────
  const handleCopy = useCallback(async (textToCopy?: string) => {
    const txt = textToCopy || translatedText;
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
    if (copyFeedbackRef.current) clearTimeout(copyFeedbackRef.current);
    copyFeedbackRef.current = setTimeout(() => {}, 2000);
  }, [translatedText]);

  // ── TTS handler ──────────────────────────────────────────────────────────
  const handleSpeak = useCallback((textToSpeak?: string, lang?: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const txt = textToSpeak || translatedText;
    const l = lang || targetLang;
    if (!txt) return;
    setIsSpeaking(true);
    speak(txt, l, () => setIsSpeaking(false));
  }, [isSpeaking, translatedText, targetLang, setIsSpeaking]);

  // ── Restore history item ─────────────────────────────────────────────────
  const handleRestoreHistory = useCallback(
    (record: TranslationRecord) => {
      setSourceLang(record.sourceLang === 'auto' ? 'auto' : record.sourceLang);
      setTargetLang(record.targetLang);
      setActiveTab('translate');
      setSourceText(record.sourceText);
    },
    [setSourceLang, setTargetLang, setSourceText, setActiveTab],
  );

  // ── Toggle Star ─────────────────────────────────────────────────────────
  const handleToggleStar = useCallback(async (e: React.MouseEvent, record: TranslationRecord) => {
    e.stopPropagation();
    if (!record.id) return;
    const newStatus = !record.isStarred;
    await toggleTranslationStar(record.id, newStatus);
    loadHistory();
  }, [loadHistory]);

  // ── Delete single history item ──────────────────────────────────────────
  const handleDeleteSingleHistory = useCallback(async (e: React.MouseEvent, record: TranslationRecord) => {
    e.stopPropagation();
    if (!record.id) return;
    await deleteTranslation(record.id);
    loadHistory();
  }, [loadHistory]);

  // ── Export CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(async () => {
    const records = await getStarredHistory();
    if (records.length === 0) return;

    const headers = ['Source Text', 'Translated Text', 'Source Lang', 'Target Lang'];
    const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;
    
    const rows = records.map(r => [
      escapeCSV(r.sourceText),
      escapeCSV(r.translatedText),
      escapeCSV(r.sourceLang),
      escapeCSV(r.targetLang)
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transify_vocabulary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);
  
  // ── Export Document Text ────────────────────────────────────────────────
  const handleExportDocumentText = useCallback(() => {
    if (!translatedDocText) return;
    const blob = new Blob([translatedDocText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'translated_document.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [translatedDocText]);

  // ── Export Document PDF ────────────────────────────────────────────────
  const handleExportDocumentPDF = useCallback(() => {
    if (!translatedDocText) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export as PDF.');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Translated Document - Transify</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .content { white-space: pre-wrap; font-size: 16px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Translated Document</h1>
          <div class="content">${translatedDocText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [translatedDocText]);

  // ── Clear history ────────────────────────────────────────────────────────
  const handleClearHistory = useCallback(async () => {
    await clearHistory();
    setHistory([]);
  }, [setHistory]);

  const charCount = activeTab === 'translate' ? sourceText.length : sentenceInput.length;
  const MAX_CHARS = 5000;

  if (!user && !isGuest) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-[#030510] transition-colors duration-300" style={{ perspective: '1800px' }}>
      
      {/* 3D Background Scene */}
      <Scene3D />
      
      {/* Offline top banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-orange-500/20 backdrop-blur-md border-b border-orange-500/30 px-4 py-2 text-sm text-orange-200 animate-slide-down relative z-50">
          <WifiOff size={14} />
          <span className="font-medium">You are offline &mdash; showing cached translations only</span>
        </div>
      )}

      {/* Header — 3D floating */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 w-[95vw] max-w-4xl"
          style={{ transformStyle: 'preserve-3d' }}
          initial={{ y: -40, opacity: 0, rotateX: -15 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
        >
          
          {/* Logo area */}
          <div className="flex items-center pl-4 pr-4">
            <motion.div 
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3"
              style={{ 
                boxShadow: '0 0 20px rgba(168,85,247,0.5), 0 4px 12px rgba(0,0,0,0.3)',
                transformStyle: 'preserve-3d'
              }}
              whileHover={{ scale: 1.1, rotateY: 180 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-white font-bold text-lg leading-none">T</span>
            </motion.div>
            <span className="text-white font-semibold text-lg tracking-wide hidden md:block">Transify</span>
          </div>

          {/* Floating Navigation with Animated Indicator */}
          <nav className="relative flex items-center bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            {/* Animated Background Indicator */}
            <div 
              className="absolute top-1 bottom-1 w-[90px] sm:w-[110px] bg-gradient-to-r from-purple-600/90 to-indigo-600/90 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-500 ease-out z-0"
              style={{ 
                transform: `translateX(${activeTab === 'translate' ? '0' : activeTab === 'sentence' ? '100%' : '200%'})`,
              }}
            />
            
            <button
              onClick={() => { setActiveTab('translate'); setTranslatedText(''); setStatus('idle'); }}
              className={`relative z-10 w-[90px] sm:w-[110px] py-2 text-xs sm:text-sm font-medium transition-colors duration-300 ${
                activeTab === 'translate' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Translate
            </button>
            <button
              onClick={() => { setActiveTab('sentence'); setTranslatedText(''); setStatus('idle'); }}
              className={`relative z-10 w-[90px] sm:w-[110px] py-2 text-xs sm:text-sm font-medium transition-colors duration-300 ${
                activeTab === 'sentence' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sentence
            </button>
            <button
              onClick={() => { setActiveTab('document'); }}
              className={`relative z-10 w-[90px] sm:w-[110px] py-2 text-xs sm:text-sm font-medium transition-colors duration-300 ${
                activeTab === 'document' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Document
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 pr-2 pl-4 sm:pl-6 border-l border-white/10 ml-2 sm:ml-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => {
                logout();
                setHistory([]);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>

        </motion.div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-6 header-glow mb-4" />

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col gap-8 relative z-10 pb-12 pt-24" style={{ transformStyle: 'preserve-3d' }}>

        {/* Language selector bar */}
        <div className="flex items-center gap-3 panel-sm p-2 w-full max-w-3xl mx-auto">
          <select
            className="lang-select flex-1"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            aria-label="Source language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                {l.name}
              </option>
            ))}
          </select>

          <button
            onClick={swapLanguages}
            disabled={sourceLang === 'auto'}
            className="btn-icon bg-white/5 border border-white/10"
            aria-label="Swap languages (Alt+S)"
            title={sourceLang === 'auto' ? 'Cannot swap when source is Auto Detect' : 'Swap languages (Alt+S)'}
          >
            <ArrowLeftRight size={16} />
          </button>

          <select
            className="lang-select flex-1"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            aria-label="Target language"
          >
            {LANGUAGES.filter((l) => l.code !== 'auto').map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic View based on Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'translate' && (
            /* ── Translator View ── */
            <motion.div 
              key="translate"
              initial={{ rotateX: 90, opacity: 0, transformOrigin: 'top' }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: -90, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
              className="w-full mx-auto"
            >
              <div className="flex flex-col lg:flex-row gap-6 relative items-stretch">
                
                {/* Source Text Area */}
                <TiltCard className="flex-1 flex flex-col group">
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-900/80 rounded-t-2xl border border-slate-700/50 border-b-0">
                    <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">
                      {LANGUAGES.find((l) => l.code === sourceLang)?.name ?? 'Source'}
                    </span>
                    <div className="flex items-center gap-4">
                      {sourceText && (
                        <button onClick={() => { setSourceText(''); setTranslatedText(''); setStatus('idle'); }} className="text-slate-400 hover:text-rose-400 transition-colors" title="Clear text (Esc)">
                          <X size={16} />
                        </button>
                      )}
                      <button onClick={handleListen} className={`transition-colors ${isListening ? 'text-rose-400 animate-pulse' : 'text-slate-400 hover:text-purple-400'}`} title={isListening ? 'Stop listening' : 'Dictate'}>
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-grow flex flex-col">
                    <textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="Enter text to translate..."
                      maxLength={MAX_CHARS}
                      className="w-full flex-grow min-h-[250px] p-6 bg-slate-900/40 rounded-b-2xl border border-slate-700/50 shadow-inner text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300"
                    />
                    <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-500 bg-slate-900/80 px-2 py-1 rounded-md">
                      {charCount} / {MAX_CHARS}
                    </div>
                    <button onClick={handleTranslate} className="absolute bottom-4 left-4 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5" title="Translate (Cmd/Ctrl + Enter)">
                      Translate
                    </button>
                  </div>
                </TiltCard>

                {/* Swap Button (Floating) */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex">
                  <motion.button 
                    onClick={swapLanguages}
                    disabled={sourceLang === 'auto'}
                    className="p-3 bg-slate-800 rounded-full border border-slate-600 group transition-all duration-300 disabled:opacity-50"
                    style={{
                      boxShadow: '0 0 25px rgba(139,92,246,0.25), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                      transformStyle: 'preserve-3d'
                    }}
                    whileHover={{ scale: 1.1, rotateZ: 180, boxShadow: '0 0 35px rgba(139,92,246,0.4), 0 12px 32px rgba(0,0,0,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ArrowLeftRight className="w-6 h-6 text-purple-400" />
                  </motion.button>
                </div>
                
                {/* Swap Button (Mobile) */}
                <div className="flex justify-center lg:hidden -my-2 z-10 relative">
                  <motion.button 
                    onClick={swapLanguages}
                    disabled={sourceLang === 'auto'}
                    className="p-3 bg-slate-800 rounded-full border border-slate-600 group transition-all duration-300 disabled:opacity-50"
                    style={{
                      boxShadow: '0 0 20px rgba(139,92,246,0.2), 0 6px 20px rgba(0,0,0,0.3)',
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeftRight className="w-5 h-5 text-purple-400" />
                  </motion.button>
                </div>

                {/* Target Text Area */}
                <TiltCard className="flex-1 flex flex-col group">
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-900/80 rounded-t-2xl border border-slate-700/50 border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
                        {LANGUAGES.find((l) => l.code === targetLang)?.name ?? 'Translation'}
                      </span>
                      <StatusBadge status={status} fromCache={fromCache} />
                    </div>
                    <button onClick={() => handleSpeak()} className={`transition-colors ${isSpeaking ? 'text-indigo-300 animate-pulse' : 'text-slate-400 hover:text-indigo-400'}`} title="Pronounce translation">
                      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                  <div className="relative flex-grow flex flex-col">
                    {status === 'loading' ? (
                       <div className="w-full flex-grow min-h-[250px] p-6 bg-slate-900/40 rounded-b-2xl border border-slate-700/50 shadow-inner">
                         <LoadingShimmer />
                       </div>
                    ) : status === 'error' || status === 'offline' ? (
                       <div className="w-full flex-grow min-h-[250px] p-6 bg-slate-900/40 rounded-b-2xl border border-slate-700/50 shadow-inner text-rose-400">
                         <p>{errorMessage}</p>
                       </div>
                    ) : (
                      <textarea
                        readOnly
                        value={translatedText}
                        placeholder="Translation will appear here..."
                        className="w-full flex-grow min-h-[250px] p-6 bg-slate-900/40 rounded-b-2xl border border-slate-700/50 shadow-inner text-purple-50 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                      />
                    )}
                    {/* Copy Button */}
                    {translatedText && status === 'success' && (
                      <div className="absolute bottom-4 right-4">
                         <button 
                           onClick={() => handleCopy()}
                           className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300 backdrop-blur-sm"
                         >
                           <Copy size={20} />
                         </button>
                      </div>
                    )}
                  </div>
                </TiltCard>

              </div>
            </motion.div>
          )}

          {activeTab === 'sentence' && (
            /* ── Sentence Builder View ── */
            <motion.div 
              key="sentence"
              initial={{ rotateX: 90, opacity: 0, transformOrigin: 'top' }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: -90, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
              className="flex flex-col gap-6 w-full max-w-3xl mx-auto"
            >
              <TiltCard tiltAmount={3}>
                <div className="panel p-6 flex flex-col gap-4">
                  <label htmlFor="sentence-input" className="text-sm font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} />
                    Your Sentence
                  </label>
                  <div className="relative">
                    <textarea
                      id="sentence-input"
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white text-xl font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                      rows={3}
                      placeholder="E.g., How do I get to the train station?"
                      value={sentenceInput}
                      onChange={(e) => setSentenceInput(e.target.value)}
                      maxLength={MAX_CHARS}
                    />
                    {sentenceInput && (
                      <button
                        onClick={() => {
                          setSentenceInput('');
                          setTranslatedText('');
                          setStatus('idle');
                        }}
                        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 bg-black/20 rounded-md transition-colors"
                        title="Clear (Esc)"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-2 gap-3">
                    <button
                      onClick={handleListen}
                      className={`btn-secondary transition-colors ${isListening ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse' : ''}`}
                      title={isListening ? 'Stop listening' : 'Dictate'}
                    >
                      {isListening ? <MicOff size={18} className="mr-1" /> : <Mic size={18} className="mr-1" />}
                      {isListening ? 'Listening...' : 'Dictate'}
                    </button>
                    <button 
                      onClick={handleTranslate} 
                      disabled={!sentenceInput.trim()}
                      className="btn-primary"
                      title="Translate Sentence (Cmd/Ctrl + Enter)"
                    >
                      <Languages size={18} className="mr-1" />
                      Translate Sentence
                    </button>
                  </div>
                </div>
              </TiltCard>

              <TiltCard tiltAmount={3}>
                <div className={`p-8 rounded-2xl transition-all duration-500 relative overflow-hidden h-full ${translatedText && status === 'success' ? 'panel-glow bg-gradient-to-br from-indigo-900/40 to-violet-900/20' : 'panel'}`}>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={16} />
                      Translated Sentence
                    </span>
                    <StatusBadge status={status} fromCache={fromCache} />
                  </div>

                  <div className="min-h-[80px] flex items-center relative z-10">
                    {status === 'loading' ? (
                      <div className="w-full">
                        <LoadingShimmer />
                      </div>
                    ) : status === 'error' || status === 'offline' ? (
                      <p className="text-rose-400 text-lg">{errorMessage}</p>
                    ) : translatedText ? (
                      <p className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white leading-tight">
                        {translatedText}
                      </p>
                    ) : (
                      <p className="text-slate-500 text-xl font-medium italic">
                        Result will appear here...
                      </p>
                    )}
                  </div>

                  {translatedText && status === 'success' && (
                    <div className="mt-8 flex items-center gap-3 relative z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                      <button onClick={() => handleSpeak()} className="btn-primary">
                        <Play size={18} className="fill-current" />
                        Pronounce Aloud
                      </button>
                      <button onClick={() => handleCopy()} className="btn-secondary">
                        <Copy size={18} />
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </TiltCard>
            </motion.div>
          )}

          {activeTab === 'document' && (
            /* ── Document Translator View ── */
            <motion.div 
              key="document"
              initial={{ rotateX: 90, opacity: 0, transformOrigin: 'top' }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: -90, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
              className="flex flex-col gap-6 w-full max-w-4xl mx-auto"
            >
              <TiltCard tiltAmount={2}>
                <div className="panel p-6 flex flex-col gap-4">
                  <label className="text-sm font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <FileText size={16} />
                    Upload PDF Document
                  </label>

                  <div 
                    className={`relative flex flex-col items-center justify-center w-full h-80 rounded-3xl border-2 border-dashed transition-all duration-500 ease-in-out ${
                      isDragging 
                        ? 'border-purple-400 bg-purple-900/20 shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-[pulse_2s_ease-in-out_infinite]' 
                        : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type === 'application/pdf') {
                        setSelectedFile(file);
                        setTranslatedDocText('');
                        setDocProgress('');
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setTranslatedDocText('');
                          setDocProgress('');
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {!selectedFile ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                        <div className={`p-4 rounded-full mb-4 transition-all duration-500 ${isDragging ? 'bg-purple-500/20 text-purple-400 scale-110' : 'bg-slate-800 text-slate-400'}`}>
                          <UploadCloud size={40} />
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
                      <div className="flex flex-col items-center justify-center w-full h-full p-8 animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-4 right-4 z-20">
                          <button 
                            onClick={() => setSelectedFile(null)}
                            className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-4 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                          <FileText size={48} />
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-1 truncate max-w-xs">{selectedFile.name}</h4>
                        <p className="text-sm text-slate-400 mb-6">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
                    <div className="flex items-center gap-3 flex-1">
                      {isDocProcessing && (
                        <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium animate-pulse">
                          <Loader2 size={16} className="animate-spin" />
                          {docProgress}
                        </div>
                      )}
                      {!isDocProcessing && docProgress && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                          <CheckCircle2 size={16} />
                          {docProgress}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleTranslateDocument} 
                      disabled={!selectedFile || isDocProcessing}
                      className="btn-primary"
                    >
                      <Languages size={18} className="mr-1" />
                      Translate Document
                    </button>
                  </div>
                </div>
              </TiltCard>

              <TiltCard tiltAmount={2}>
                <div className={`panel p-6 flex flex-col gap-4 min-h-[400px] h-full transition-all duration-300 ${translatedDocText ? 'panel-glow' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={16} />
                      Translated Content
                    </span>
                    {translatedDocText && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleCopy(translatedDocText)} className="btn-secondary py-1.5 px-3" title="Copy All">
                          <Copy size={14} />
                          <span className="hidden sm:inline text-xs">Copy All</span>
                        </button>
                        <button onClick={handleExportDocumentText} className="btn-secondary py-1.5 px-3 border-indigo-500/30 text-indigo-300" title="Export TXT">
                          <Download size={14} />
                          <span className="hidden sm:inline text-xs">Export TXT</span>
                        </button>
                        <button onClick={handleExportDocumentPDF} className="btn-secondary py-1.5 px-3 border-indigo-500/30 text-indigo-300" title="Export PDF">
                          <Printer size={14} />
                          <span className="hidden sm:inline text-xs">Export PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {translatedDocText ? (
                    <div className="flex-1 w-full bg-black/20 border border-white/5 rounded-xl p-6 overflow-y-auto max-h-[600px] custom-scrollbar">
                      <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                        {translatedDocText}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-black/10 border border-white/5 rounded-xl border-dashed">
                      <p className="text-slate-500 italic font-medium">
                        {isDocProcessing ? 'Translation in progress. Please do not close this tab...' : 'Translated document text will appear here.'}
                      </p>
                    </div>
                  )}
                </div>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History panel (Hide on Document tab to focus on content, hide for guests) */}
        {activeTab !== 'document' && (
          <section className="mt-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                <Clock size={16} />
                Recent History
                {history.length > 0 && (
                  <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-full ml-2">
                    {history.length}
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/[0.03] p-1 rounded-lg border border-white/10 backdrop-blur-md">
                  <button
                    onClick={() => setShowStarredOnly(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!showStarredOnly ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    All History
                  </button>
                  <button
                    onClick={() => setShowStarredOnly(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${showStarredOnly ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Star size={12} className={showStarredOnly ? 'fill-current' : ''} />
                    Starred
                  </button>
                </div>

                {showStarredOnly && history.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="btn-secondary py-1.5 px-3 h-auto min-h-0 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 hover:border-indigo-500/50"
                    title="Export Starred to CSV"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline text-xs font-medium">Export CSV</span>
                  </button>
                )}

                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="btn-ghost py-1.5 px-3 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 size={14} className="inline mr-1" />
                    <span className="hidden sm:inline">Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {history.length === 0 ? (
              <div className="panel-sm flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  {showStarredOnly ? <Star size={24} className="text-slate-500" /> : <BookOpen size={24} className="text-slate-500" />}
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-semibold text-lg">
                    {showStarredOnly ? 'No starred translations' : 'No translations yet'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {showStarredOnly ? 'Star important translations to save them here.' : 'Your offline history will appear here.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((record) => (
                  <HistoryItem
                    key={record.id}
                    record={record}
                    onRestore={handleRestoreHistory}
                    onToggleStar={handleToggleStar}
                    onDelete={handleDeleteSingleHistory}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
