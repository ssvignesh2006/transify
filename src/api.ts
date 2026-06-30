import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import {
  getCachedTranslation,
  saveTranslation,
  type TranslationRecord,
} from './db';

// Initialize PDF worker from static asset in /public (CDN doesn't have v6.x)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const TIMEOUT_MS = 8000;

export interface TranslationResult {
  translatedText: string;
  fromCache: boolean;
}

/**
 * Core translation function.
 *
 * Priority:
 *  1. IndexedDB cache hit  → return immediately (offline-safe)
 *  2. MyMemory API request
 *  3. Fallback error if network fails
 */
export async function translateText(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  isGuest: boolean = false
): Promise<TranslationResult> {
  const trimmed = sourceText.trim();
  if (!trimmed) throw new Error('Empty input');

  // Fast path for identical languages
  if (sourceLang !== 'auto' && sourceLang === targetLang) {
    return { translatedText: trimmed, fromCache: false };
  }

  // 1. Cache lookup
  const cached = await getCachedTranslation(trimmed, sourceLang, targetLang);
  if (cached) {
    return { translatedText: cached.translatedText, fromCache: true };
  }

  // 2. Network - Google Translate Primary
  let finalTranslatedText = '';
  
  try {
    const gSource = sourceLang === 'auto' ? 'auto' : sourceLang;
    const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${gSource}&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const gRes = await axios.get(gUrl, { timeout: TIMEOUT_MS });
    
    if (Array.isArray(gRes.data) && Array.isArray(gRes.data[0])) {
      finalTranslatedText = gRes.data[0].map((x: any) => x[0]).join('');
    } else {
      throw new Error('Invalid Google Translate response');
    }
  } catch (err) {
    // 3. Fallback to MyMemory
    try {
      const src = sourceLang === 'auto' ? 'Autodetect' : sourceLang;
      const encoded = encodeURIComponent(trimmed);
      const url = `${MYMEMORY_URL}?q=${encoded}&langpair=${src}|${targetLang}&de=transifyapp@example.com`;

      const response = await axios.get<{ responseData: { translatedText: string, match?: number }, responseStatus: number, responseDetails?: string }>(url, {
        timeout: TIMEOUT_MS,
        headers: { Accept: 'application/json' },
      });

      const status = Number(response.data?.responseStatus);

      if (status === 403 && response.data.responseDetails?.includes('TWO DISTINCT LANGUAGES')) {
        finalTranslatedText = trimmed;
      } else if (status === 200 && response.data?.responseData?.translatedText && !response.data.responseDetails?.includes('MYMEMORY WARNING')) {
        finalTranslatedText = response.data.responseData.translatedText;
      } else {
        throw new Error('MyMemory quota exceeded or invalid status');
      }

    } catch (gErr) {
      throw gErr ?? new Error('Both primary and fallback translation APIs failed');
    }
  }

  if (!finalTranslatedText) throw new Error('Empty response from APIs');

  // Persist to IndexedDB conditionally
  if (!isGuest) {
    const record: Omit<TranslationRecord, 'id'> = {
      sourceText: trimmed,
      translatedText: finalTranslatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now(),
    };
    await saveTranslation(record);
  }

  return { translatedText: finalTranslatedText, fromCache: false };
}

// ---------------------------------------------------------------------------
// Debounce helper (generic, cancellable)
// ---------------------------------------------------------------------------
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delayMs: number,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced as T & { cancel: () => void };
}

// ---------------------------------------------------------------------------
// Text-to-Speech helper
// ---------------------------------------------------------------------------
export function speak(text: string, lang: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'auto' ? 'en' : lang;
  utterance.rate = 0.95;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ---------------------------------------------------------------------------
// Document Translation
// ---------------------------------------------------------------------------
export async function extractTextFromPDF(file: File, onProgress?: (msg: string) => void): Promise<string> {
  onProgress?.('Reading PDF file...');
  const arrayBuffer = await file.arrayBuffer();
  
  onProgress?.('Initializing PDF parser...');
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  
  const numPages = pdfDocument.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(`Extracting text from page ${pageNum} of ${numPages}...`);
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}

export async function translateDocument(
  text: string, 
  sourceLang: string, 
  targetLang: string, 
  onProgress?: (msg: string) => void
): Promise<string> {
  // Chunk text by words to safely avoid API limits and URI Too Long errors
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const word of words) {
    if (currentChunk.length + word.length > 450) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = word + ' ';
    } else {
      currentChunk += word + ' ';
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  let translatedDoc = '';
  const totalChunks = chunks.length;

  for (let i = 0; i < totalChunks; i++) {
    onProgress?.(`Translating part ${i + 1} of ${totalChunks}...`);
    try {
      const res = await translateText(chunks[i], sourceLang, targetLang);
      translatedDoc += res.translatedText + '\n\n';
    } catch (err) {
      console.warn(`Chunk ${i} failed to translate:`, err);
      // Fallback: append original text
      translatedDoc += chunks[i] + '\n\n';
    }
    
    if (i < totalChunks - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return translatedDoc.trim();
}
