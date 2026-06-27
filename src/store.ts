import { create } from 'zustand';
import type { TranslationRecord } from './db';

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'cs', name: 'Czech' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ta', name: 'Tamil' },
  { code: 'bn', name: 'Bengali' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'hr', name: 'Croatian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'et', name: 'Estonian' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'fa', name: 'Persian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'sw', name: 'Swahili' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'hy', name: 'Armenian' },
  { code: 'ka', name: 'Georgian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'be', name: 'Belarusian' },
];

export type AppStatus = 'idle' | 'loading' | 'success' | 'error' | 'offline';

interface TranslationStore {
  // Auth
  user: string | null;
  userEmail: string | null;
  userPhotoURL: string | null;
  isGuest: boolean;
  theme: 'light' | 'dark';

  // Core state
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  status: AppStatus;
  errorMessage: string;
  fromCache: boolean;

  // History
  history: TranslationRecord[];

  // TTS
  isSpeaking: boolean;

  // Document Translation
  isDocProcessing: boolean;
  docProgress: string;
  translatedDocText: string;

  // Actions
  setUser: (user: string | null, email?: string | null, photoURL?: string | null) => void;
  setIsGuest: (val: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;

  setSourceText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  setStatus: (status: AppStatus, message?: string) => void;
  setFromCache: (val: boolean) => void;
  swapLanguages: () => void;
  setHistory: (history: TranslationRecord[]) => void;
  setIsSpeaking: (val: boolean) => void;
  setIsDocProcessing: (val: boolean) => void;
  setDocProgress: (val: string) => void;
  setTranslatedDocText: (val: string) => void;
  reset: () => void;
}

export const useTranslationStore = create<TranslationStore>((set, get) => ({
  user: localStorage.getItem('transify_user') || null,
  userEmail: localStorage.getItem('transify_user_email') || null,
  userPhotoURL: localStorage.getItem('transify_user_photo') || null,
  isGuest: localStorage.getItem('transify_guest') === 'true',
  theme: (localStorage.getItem('transify_theme') as 'light' | 'dark') || 'dark',

  sourceText: '',
  translatedText: '',
  sourceLang: 'auto',
  targetLang: 'en',
  status: 'idle',
  errorMessage: '',
  fromCache: false,
  history: [],
  isSpeaking: false,
  isDocProcessing: false,
  docProgress: '',
  translatedDocText: '',

  setUser: (user, email, photoURL) => {
    if (user) {
      localStorage.setItem('transify_user', user);
      if (email) localStorage.setItem('transify_user_email', email);
      if (photoURL) localStorage.setItem('transify_user_photo', photoURL);
    } else {
      localStorage.removeItem('transify_user');
      localStorage.removeItem('transify_user_email');
      localStorage.removeItem('transify_user_photo');
    }
    set({ user, userEmail: email || null, userPhotoURL: photoURL || null, isGuest: false });
    localStorage.removeItem('transify_guest');
  },
  setIsGuest: (val) => {
    localStorage.setItem('transify_guest', val.toString());
    set({ isGuest: val, user: null, userEmail: null, userPhotoURL: null });
    localStorage.removeItem('transify_user');
    localStorage.removeItem('transify_user_email');
    localStorage.removeItem('transify_user_photo');
  },
  setTheme: (theme) => {
    localStorage.setItem('transify_theme', theme);
    set({ theme });
  },
  logout: () => {
    localStorage.removeItem('transify_user');
    localStorage.removeItem('transify_guest');
    localStorage.removeItem('transify_user_email');
    localStorage.removeItem('transify_user_photo');
    set({ user: null, userEmail: null, userPhotoURL: null, isGuest: false, history: [] });
  },

  setSourceText: (text) => set({ sourceText: text }),
  setTranslatedText: (text) => set({ translatedText: text }),
  setSourceLang: (lang) => set({ sourceLang: lang }),
  setTargetLang: (lang) => set({ targetLang: lang }),
  setStatus: (status, message = '') => set({ status, errorMessage: message }),
  setFromCache: (val) => set({ fromCache: val }),

  swapLanguages: () => {
    const { sourceLang, targetLang, sourceText, translatedText } = get();
    // Don't swap if source is auto-detect
    if (sourceLang === 'auto') return;
    set({
      sourceLang: targetLang,
      targetLang: sourceLang,
      sourceText: translatedText,
      translatedText: sourceText,
    });
  },

  setHistory: (history) => set({ history }),
  setIsSpeaking: (val) => set({ isSpeaking: val }),
  setIsDocProcessing: (val) => set({ isDocProcessing: val }),
  setDocProgress: (val) => set({ docProgress: val }),
  setTranslatedDocText: (val) => set({ translatedDocText: val }),

  reset: () =>
    set({
      sourceText: '',
      translatedText: '',
      status: 'idle',
      errorMessage: '',
      fromCache: false,
    }),
}));
