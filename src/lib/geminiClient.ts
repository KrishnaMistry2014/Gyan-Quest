import { GoogleGenAI } from '@google/genai';
import { SavedChapter } from './chapters';
import { getScriptureDefinition } from './scriptureData';
import { CrosswordData } from '../types';
import { buildValidCrosswordLayout } from './crosswordGenerator';
import { SAMPLE_CROSSWORDS } from './sampleCrosswords';

/**
 * Primary model for puzzle & text generation as requested:
 * gemini-3.5-flash-lite first, with seamless fallback if an endpoint aliases the model name.
 */
export const TEXT_MODELS_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
] as const;

/**
 * TTS Models priority order for Shravan audio narration
 */
export const TTS_MODELS_CHAIN = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-2.5-flash-preview-tts',
] as const;

function isValidApiKey(val: unknown): val is string {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (
    trimmed.length < 10 ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.toLowerCase().includes('placeholder') ||
    trimmed.toLowerCase().includes('your_api_key')
  ) {
    return false;
  }
  return true;
}

/**
 * Retrieves all valid browser-injected Gemini API keys.
 * Supports both VITE_GURU_GEMINI_API_KEY and VITE_GEMINI_API_KEY across import.meta.env,
 * window runtime globals, and build-time process.env definitions.
 */
export function getBrowserGeminiApiKeys(): string[] {
  const candidates: unknown[] = [];

  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      candidates.push(metaEnv.VITE_GURU_GEMINI_API_KEY);
      candidates.push(metaEnv.VITE_GEMINI_API_KEY);
      candidates.push(metaEnv.GEMINI_API_KEY);
    }
  } catch (_) {}

  try {
    if (typeof window !== 'undefined') {
      const win = window as any;
      candidates.push(win.VITE_GURU_GEMINI_API_KEY);
      candidates.push(win.VITE_GEMINI_API_KEY);
      candidates.push(win.GEMINI_API_KEY);
      if (win.__ENV__) {
        candidates.push(win.__ENV__.VITE_GURU_GEMINI_API_KEY);
        candidates.push(win.__ENV__.VITE_GEMINI_API_KEY);
        candidates.push(win.__ENV__.GEMINI_API_KEY);
      }
    }
  } catch (_) {}

  try {
    if (typeof process !== 'undefined' && process.env) {
      candidates.push((process.env as any).VITE_GURU_GEMINI_API_KEY);
      candidates.push((process.env as any).VITE_GEMINI_API_KEY);
      candidates.push((process.env as any).GEMINI_API_KEY);
    }
  } catch (_) {}

  const uniqueKeys: string[] = [];
  for (const c of candidates) {
    if (isValidApiKey(c)) {
      const clean = c.trim();
      if (!uniqueKeys.includes(clean)) {
        uniqueKeys.push(clean);
      }
    }
  }

  return uniqueKeys;
}

export function createBrowserGeminiClients(): GoogleGenAI[] {
  const keys = getBrowserGeminiApiKeys();
  return keys.map(
    (apiKey) =>
      new GoogleGenAI({
        apiKey,
      })
  );
}

function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Generates content using the browser API keys (VITE_GURU_GEMINI_API_KEY & VITE_GEMINI_API_KEY),
 * prioritizing gemini-3.5-flash-lite first.
 */
export async function generateBrowserGeminiContent(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<{ text: string; modelUsed: string }> {
  const clients = createBrowserGeminiClients();
  if (clients.length === 0) {
    throw new Error('No browser Gemini API key (VITE_GURU_GEMINI_API_KEY or VITE_GEMINI_API_KEY) found.');
  }

  const timeoutMs = params.timeoutMs || 30000;
  const errors: string[] = [];

  for (const client of clients) {
    for (const model of TEXT_MODELS_CHAIN) {
      try {
        const config: Record<string, any> = {};
        if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
        if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
        if (params.temperature !== undefined) config.temperature = params.temperature;

        const res = await callWithTimeout(
          client.models.generateContent({
            model,
            contents: params.contents,
            config: Object.keys(config).length > 0 ? config : undefined,
          }),
          timeoutMs,
          `Gemini ${model}`
        );

        const text = res.text?.trim();
        if (text && text.length > 0) {
          return { text, modelUsed: model };
        }
      } catch (err: any) {
        errors.push(`${model}: ${err?.message || String(err)}`);
      }
    }
  }

  throw new Error(`Browser Gemini generation failed across keys/models: ${errors.slice(0, 3).join(' | ')}`);
}

/**
 * Converts base64 audio (either RIFF WAV or raw 24kHz 16-bit mono L16 PCM) into a valid audio/wav Blob.
 */
export function base64AudioToWavBlob(base64Data: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Blob {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check if already a valid RIFF WAV file
  if (
    bytes.byteLength >= 44 &&
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46    // 'F'
  ) {
    return new Blob([bytes], { type: 'audio/wav' });
  }

  // Wrap raw PCM in a 44-byte WAV header
  const dataSize = bytes.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(bytes, 44);

  return new Blob([wavBytes], { type: 'audio/wav' });
}

const browserTtsCache = new Map<string, { blob: Blob; modelUsed: string; voiceUsed: string }>();

/**
 * Synthesizes Shravan TTS directly in the browser using VITE_GURU_GEMINI_API_KEY and VITE_GEMINI_API_KEY.
 */
export async function synthesizeSpeechBrowser(
  rawText: string,
  voice = 'Puck',
  signal?: AbortSignal
): Promise<{ blob: Blob; modelUsed: string; voiceUsed: string; fromCache: boolean }> {
  const cleanText = rawText
    .replace(/[*_#>`~]/g, '')
    .replace(/^(Speak in|Please narrate|Instructions:|Prompt:|System:)[^\n]*(\n+|$)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    throw new Error('Empty text for TTS synthesis');
  }

  const validVoice = voice === 'Charon' || voice === 'Fenrir' ? voice : 'Puck';
  const cacheKey = `${validVoice}:${cleanText}`;
  const cached = browserTtsCache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const clients = createBrowserGeminiClients();
  if (clients.length === 0) {
    throw new Error('No browser Gemini API key configured for TTS');
  }

  const errors: string[] = [];

  for (const client of clients) {
    for (const model of TTS_MODELS_CHAIN) {
      if (signal?.aborted) {
        const abortErr = new Error('Aborted');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      try {
        const res = await callWithTimeout(
          client.models.generateContent({
            model,
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: validVoice },
                },
              },
            },
          }),
          90000,
          `${model} Browser TTS`
        );

        const base64Audio = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio && base64Audio.length > 50) {
          const blob = base64AudioToWavBlob(base64Audio);
          const entry = { blob, modelUsed: model, voiceUsed: validVoice };
          browserTtsCache.set(cacheKey, entry);
          return { ...entry, fromCache: false };
        }
      } catch (err: any) {
        if (signal?.aborted || err?.name === 'AbortError') throw err;
        errors.push(`${model}: ${err?.message || String(err)}`);
      }
    }
  }

  throw new Error(`Browser TTS failed: ${errors.slice(0, 2).join(' | ')}`);
}

/**
 * Guru Chatbot reply generator using Browser API keys first, then server fallback.
 */
export async function generateGuruReply(
  message: string,
  history: { sender: 'user' | 'guru'; text: string }[]
): Promise<string> {
  const systemInstruction = `You are Guru, a revered, warm, wise, scholarly educational mentor on Gyan Quest.
Answer academic, scientific, Indian culture, Sanskrit, and epic questions with deep knowledge and warmth.
STRICT PLAIN TEXT ONLY. NO markdown asterisks, hashes, backticks, or LaTeX math dollar signs.`;

  const contents: any[] = [];
  if (Array.isArray(history)) {
    for (const turn of history.slice(-8)) {
      if (turn.sender === 'user' && turn.text) {
        contents.push({ role: 'user', parts: [{ text: turn.text }] });
      } else if (turn.sender === 'guru' && turn.text) {
        contents.push({ role: 'model', parts: [{ text: turn.text }] });
      }
    }
  }
  contents.push({ role: 'user', parts: [{ text: message.trim() }] });

  // 1. Try Browser API Keys (VITE_GURU_GEMINI_API_KEY & VITE_GEMINI_API_KEY)
  try {
    const { text } = await generateBrowserGeminiContent({
      contents,
      systemInstruction,
      temperature: 0.7,
      timeoutMs: 25000,
    });
    if (text) {
      return text.replace(/[*_#>`~]/g, '').trim();
    }
  } catch (browserErr) {
    console.warn('[Guru] Browser key attempt notice, trying backend:', browserErr);
  }

  // 2. Fallback to Express backend /api/guru-chat
  const response = await fetch('/api/guru-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Guru backend unreachable');
  }

  const data = await response.json();
  if (data?.reply && typeof data.reply === 'string') {
    return data.reply.replace(/[*_#>`~]/g, '').trim();
  }
  throw new Error(data?.error || 'Unable to generate Guru response');
}

/**
 * Curated, 100% relevant Scripture Wordle Question Decks
 */
export const SCRIPTURE_WORDLE_DECKS: Record<
  'gita' | 'ramayana' | 'mahabharata',
  { question: string; answer: string; hint: string; lore?: string }[]
> = {
  gita: [
    {
      question: 'In Bhagavad Gita Verse 6.17, which Sanskrit word means "regulated" or "balanced" in daily habits?',
      answer: 'YUKTA',
      hint: 'Means regulated or balanced (yuktahara-viharasya) — starts with Y and ends with A (5 letters).',
      lore: 'Verse 6.17 teaches that one who is yukta (regulated) in eating, sleeping, recreation, and work mitigates all sorrow.',
    },
    {
      question: 'In Verse 6.17 (yuktahara), what 5-letter Sanskrit term refers to wholesome eating and nourishment?',
      answer: 'AHARA',
      hint: 'Refers to regulated food and diet in Verse 6.17 — starts with A and ends with A (5 letters).',
      lore: 'Regulated eating (yukta-ahara) fuels the body and mind with sattvic clarity for focused study.',
    },
    {
      question: 'Chapter 6 of the Bhagavad Gita is titled "______ Yoga", the yoga of meditation and focused mind.',
      answer: 'DHYANA',
      hint: 'The Sanskrit name of Chapter 6 meaning meditation — starts with D and ends with A (6 letters).',
      lore: 'Dhyana Yoga guides students to steady the restless mind through balanced daily habits.',
    },
    {
      question: 'According to Verse 6.17 (yukta-karmasu), what 5-letter Sanskrit word denotes purposeful duties and actions?',
      answer: 'KARMA',
      hint: 'Righteous action and discharging of student duties — starts with K and ends with A (5 letters).',
      lore: 'Approaching academic work with dedicated concentration (yukta-cestasya karmasu) prevents last-minute panic.',
    },
    {
      question: 'Maintaining 8 to 10 hours of restorative _____ is the first practical pillar of student memory and clarity in Verse 6.17.',
      answer: 'SLEEP',
      hint: 'Restorative nightly rest (swapna) — starts with S and ends with P (5 letters).',
      lore: 'Regulated sleep and wakefulness (yukta-swapnavabodhasya) keeps recall sharp and removes mental fatigue.',
    },
  ],
  ramayana: [
    {
      question: 'In the Ramayana, what 5-letter Sanskrit pillar means unwavering truthfulness, exemplified by keeping King Dasharatha’s word?',
      answer: 'SATYA',
      hint: 'The Sanskrit word for Truthfulness — starts with S and ends with A (5 letters).',
      lore: 'Sri Rama joyfully embraced fourteen years of forest exile rather than compromising on Satya (truth).',
    },
    {
      question: 'What 6-letter Sanskrit principle of righteous duty and moral order did Sri Rama uphold above personal comfort?',
      answer: 'DHARMA',
      hint: 'Righteous action and moral duty — starts with D and ends with A (6 letters).',
      lore: 'Rama is revered as Maryada Purushottama, the ideal embodiment of Dharma.',
    },
    {
      question: 'Which 4-letter noble prince of Ayodhya exemplifies truth, humility, and steadfast righteousness in Valmiki’s epic?',
      answer: 'RAMA',
      hint: 'The central hero of the Ramayana — starts with R and ends with A (4 letters).',
      lore: 'Just as Rama remained balanced in the palace and the forest, a student practices calm focus in daily life.',
    },
    {
      question: 'What 6-letter Sanskrit word describes Hanuman’s selfless devotion, courage, and single-minded dedication?',
      answer: 'BHAKTI',
      hint: 'Selfless devotion and dedication — starts with B and ends with I (6 letters).',
      lore: 'Hanuman faced immense hurdles with Bhakti, wisdom, and humility in service of truth.',
    },
    {
      question: 'Rama, Sita, and Lakshmana spent fourteen years in forest _____ to honor King Dasharatha’s promise.',
      answer: 'EXILE',
      hint: 'Living away from Ayodhya in the forest for 14 years — starts with E and ends with E (5 letters).',
      lore: 'Through forest exile, the trio demonstrated brotherly loyalty (Bhratru-prema) and harmony with nature.',
    },
  ],
  mahabharata: [
    {
      question: 'In the Mahabharata, which 6-letter legendary archer demonstrated unbroken focus by seeing only the eye of the bird?',
      answer: 'ARJUNA',
      hint: 'The Pandava archer who mastered single-minded concentration — starts with A and ends with A (6 letters).',
      lore: 'Arjuna’s discipline illustrates the power of undivided academic attention.',
    },
    {
      question: '"Yato Dharmas Tato Jayah" teaches that where there is ______, there is victory.',
      answer: 'DHARMA',
      hint: 'The moral compass of righteousness in the Mahabharata — starts with D and ends with A (6 letters).',
      lore: 'The Mahabharata explores complex ethical dilemmas and the eternal supremacy of Dharma.',
    },
    {
      question: 'Nishkama _____ teaches students to perform their study and duty with full dedication without anxiety over results.',
      answer: 'KARMA',
      hint: 'Selfless action and duty — starts with K and ends with A (5 letters).',
      lore: 'Focusing on effort rather than obsessing over rewards brings steady calmness under pressure.',
    },
    {
      question: 'What 6-letter Sanskrit term from the Mahabharata lesson means wise discernment between right and wrong?',
      answer: 'VIVEKA',
      hint: 'Sanskrit term for discernment cultivated by scholars — starts with V and ends with A (6 letters).',
      lore: 'The Mahabharata teaches scholars to cultivate Viveka (discernment) and loyalty to truth.',
    },
    {
      question: 'Which 5-letter revered sage (Krishna Dvaipayana) composed the great epic Mahabharata?',
      answer: 'VYASA',
      hint: 'The sage author of the Mahabharata — starts with V and ends with A (5 letters).',
      lore: 'Sage Vyasa composed the Mahabharata as an unparalleled Itihasa of human nature and ethics.',
    },
  ],
};

const STOPWORDS = new Set([
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'ANY', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR',
  'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO',
  'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'THAT', 'WITH', 'HAVE', 'THIS', 'FROM',
  'THEY', 'WENT', 'WERE', 'WHAT', 'WHEN', 'SOME', 'THEM', 'THEN', 'LIKE', 'TIME', 'JUST', 'KNOW', 'TAKE',
  'INTO', 'YEAR', 'YOUR', 'GOOD', 'COULD', 'WOULD', 'THERE', 'THESE', 'OTHER', 'AFTER', 'FIRST', 'ABOUT',
  'THEIR', 'WHICH', 'WHERE', 'EVERY', 'BECAUSE', 'THROUGH', 'BEFORE', 'SHOULD', 'PEOPLE', 'LITTLE', 'WILL',
  'OVER', 'SUCH', 'EVEN', 'MOST', 'MADE', 'ALSO', 'BACK', 'WELL', 'MUCH', 'ONLY', 'VERY', 'CHAPTER', 'SUMMARY',
  'SECTION', 'STUDENT', 'STUDENTS', 'LESSON', 'FOLLOWING', 'BETWEEN', 'DURING', 'WITHOUT', 'WITHIN', 'UNDER'
]);

/**
 * Extracts context-grounded fallback Wordle questions strictly from the chapter's sentences.
 */
export function buildContextualWordleFallback(
  chapter: SavedChapter
): { question: string; answer: string; hint: string; lore?: string }[] {
  const scripture = getScriptureDefinition(chapter);
  if (scripture && SCRIPTURE_WORDLE_DECKS[scripture.scriptureKey]) {
    return SCRIPTURE_WORDLE_DECKS[scripture.scriptureKey];
  }

  const rawText = (chapter.summary || '').replace(/[#*_>`~]/g, '');
  const sentences = rawText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 220);

  const results: { question: string; answer: string; hint: string; lore?: string }[] = [];
  const usedAnswers = new Set<string>();

  for (const sentence of sentences) {
    if (results.length >= 5) break;
    const words = sentence.match(/\b[A-Za-z]{4,7}\b/g) || [];
    for (const rawWord of words) {
      const upper = rawWord.toUpperCase();
      if (STOPWORDS.has(upper) || usedAnswers.has(upper)) continue;

      // Replace the target word in the sentence with blanks to form a direct, relevant fill-in-the-blank question
      const blanked = sentence.replace(new RegExp(`\\b${rawWord}\\b`, 'i'), '_____');
      if (blanked !== sentence && blanked.includes('_____')) {
        usedAnswers.add(upper);
        results.push({
          question: `Complete this key statement from "${chapter.title}": "${blanked}"`,
          answer: upper,
          hint: `Key term from the lesson — starts with '${upper[0]}' and ends with '${upper[upper.length - 1]}' (${upper.length} letters).`,
          lore: sentence,
        });
        break;
      }
    }
  }

  if (results.length >= 3) {
    return results;
  }

  return SCRIPTURE_WORDLE_DECKS.gita;
}

/**
 * Generates 5 highly relevant, chapter/scripture-specific Wordle questions using
 * Browser API keys (VITE_GURU_GEMINI_API_KEY & VITE_GEMINI_API_KEY) and Gemini 3.5 Flash Lite.
 */
export async function generateWordleQuestionsForChapter(
  chapter: SavedChapter
): Promise<{ question: string; answer: string; hint: string; lore?: string }[]> {
  const scripture = getScriptureDefinition(chapter);
  const effectiveTitle = scripture ? scripture.title : (chapter.title || 'Chapter Study');
  const effectiveSummary = (scripture ? scripture.summary : (chapter.summary || '')).slice(0, 15000).trim();

  const scriptureConstraint = scripture
    ? `IMPORTANT: This lesson is from the sacred scripture "${scripture.title}". Every single answer word MUST be a core Sanskrit or thematic term directly present in this scripture text (for example: ${SCRIPTURE_WORDLE_DECKS[scripture.scriptureKey].map((d) => d.answer).join(', ')}). Do NOT generate generic or unrelated words.`
    : `IMPORTANT: Every single answer word MUST be an actual key concept, scientific term, or historical/educational keyword that appears directly in the provided chapter summary. Do NOT generate unrelated words.`;

  const prompt = `You are creating a 5-question educational Word Quest (Wordle) game strictly based on the following lesson:
Lesson Title: ${effectiveTitle}
Lesson Text:
---
${effectiveSummary}
---

${scriptureConstraint}

CRITICAL RULES:
1. Generate exactly 5 easy, clear, direct questions (or fill-in-the-blank clues) based strictly on the Lesson Text above.
2. Each "answer" MUST be a single uppercase English/Sanskrit word of 4 to 7 letters (ONLY A-Z, no spaces or hyphens) that is directly from the lesson.
3. Each "question" must clearly ask about the concept or quote the lesson so a student who read the lesson can easily figure out the word.
4. Return STRICTLY valid JSON:
{
  "questions": [
    {
      "question": "Clear, direct question or fill-in-the-blank from the lesson",
      "answer": "WORD",
      "hint": "Helpful clue mentioning first and last letter",
      "lore": "One sentence from the lesson explaining this concept"
    }
  ]
}`;

  const sanitizeQuestions = (rawList: any[]): { question: string; answer: string; hint: string; lore?: string }[] => {
    if (!Array.isArray(rawList)) return [];
    const seen = new Set<string>();
    const valid: { question: string; answer: string; hint: string; lore?: string }[] = [];

    for (const item of rawList) {
      if (!item || typeof item.question !== 'string' || typeof item.answer !== 'string') continue;
      const ans = item.answer.trim().toUpperCase().replace(/[^A-Z]/g, '');
      if (ans.length < 3 || ans.length > 8 || STOPWORDS.has(ans) || seen.has(ans)) continue;
      const qText = item.question.trim();
      if (qText.length < 12 || qText.toLowerCase().includes('placeholder')) continue;

      seen.add(ans);
      valid.push({
        question: qText,
        answer: ans,
        hint:
          item.hint && typeof item.hint === 'string' && item.hint.trim().length > 5
            ? item.hint.trim()
            : `Starts with '${ans[0]}' and ends with '${ans[ans.length - 1]}' (${ans.length} letters).`,
        lore: typeof item.lore === 'string' ? item.lore.trim() : undefined,
      });
    }
    return valid;
  };

  // 1. Try Browser Gemini API keys first (gemini-3.5-flash-lite)
  try {
    const { text } = await generateBrowserGeminiContent({
      contents: [prompt],
      responseMimeType: 'application/json',
      temperature: 0.4,
      timeoutMs: 25000,
    });
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    const list = Array.isArray(parsed) ? parsed : parsed?.questions;
    const valid = sanitizeQuestions(list);
    if (valid.length >= 3) {
      return valid.slice(0, 5);
    }
  } catch (browserErr) {
    console.warn('[Word Quest] Browser Gemini notice, trying backend/scripture deck:', browserErr);
  }

  // 2. If predefined Scripture and browser Gemini was unavailable, return the authentic Scripture deck immediately
  // so it never returns unrelated generic words from a fallback!
  if (scripture && SCRIPTURE_WORDLE_DECKS[scripture.scriptureKey]) {
    return SCRIPTURE_WORDLE_DECKS[scripture.scriptureKey];
  }

  // 3. Try Express server endpoint if available
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: effectiveSummary,
        title: effectiveTitle,
      }),
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      const valid = sanitizeQuestions(data?.questions);
      if (valid.length >= 3) {
        return valid.slice(0, 5);
      }
    }
  } catch (_) {}

  // 4. Contextual fill-in-the-blank fallback from actual chapter sentences
  return buildContextualWordleFallback(chapter);
}

/**
 * Generates a 6-word collision-free Crossword puzzle strictly from the chapter/scripture/PDF
 * using the Browser API keys (VITE_GURU_GEMINI_API_KEY & VITE_GEMINI_API_KEY) and Gemini 3.5 Flash Lite.
 */
export async function generateCrosswordPuzzleForChapter(params: {
  topic?: string;
  summary?: string;
  pdfBase64?: string;
  mimeType?: string;
  fileName?: string;
  chapter?: SavedChapter | null;
}): Promise<CrosswordData> {
  const scripture = getScriptureDefinition(
    params.chapter || {
      id: params.topic || params.fileName || '',
      uniqueCode: '',
      title: params.topic || params.fileName || '',
      fileName: params.fileName || '',
      summary: params.summary || '',
      createdAt: '',
    }
  );

  const effectiveTopic = scripture
    ? scripture.title
    : (params.topic || params.fileName || params.chapter?.title || 'Chapter Vocabulary').trim();
  const effectiveSummary = scripture
    ? scripture.summary
    : (params.summary || params.chapter?.summary || params.topic || '').trim();

  const crosswordPrompt = `You are an expert curriculum crossword puzzle architect.
Extract 10 to 12 essential, distinct vocabulary terms, key concepts, and educational facts STRICTLY from the following lesson material:
Lesson Title: ${effectiveTopic}
---
${effectiveSummary.slice(0, 30000)}
---

CRITICAL REQUIREMENTS:
1. Every word MUST be directly relevant to "${effectiveTopic}" and present in or directly taught by the material above. Do NOT include unrelated filler words.
2. Each clue must be a clear, specific, engaging educational question or definition directly tied to the lesson (never vague placeholders).
3. Words must contain ONLY uppercase English letters A-Z (length 3 to 10 letters). NO spaces, hyphens, or numbers.
4. Return STRICTLY valid JSON array:
[
  { "answer": "WORD", "clue": "Specific educational clue from the lesson" }
]`;

  const parseCandidates = (rawText: string): { answer: string; clue: string }[] => {
    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    const arr = Array.isArray(parsed) ? parsed : parsed?.words;
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const valid: { answer: string; clue: string }[] = [];
    for (const item of arr) {
      if (!item || typeof item.answer !== 'string' || typeof item.clue !== 'string') continue;
      const ans = item.answer.trim().toUpperCase().replace(/[^A-Z]/g, '');
      const clue = item.clue.trim();
      if (ans.length < 3 || ans.length > 10 || STOPWORDS.has(ans) || seen.has(ans)) continue;
      if (clue.length < 8 || clue.toLowerCase().includes('core educational concept')) continue;
      seen.add(ans);
      valid.push({ answer: ans, clue });
    }
    return valid;
  };

  // 1. Try Browser Gemini API keys first (gemini-3.5-flash-lite)
  try {
    const contents: any[] = [];
    if (params.pdfBase64 && (!effectiveSummary || effectiveSummary.length < 50)) {
      contents.push({
        inlineData: {
          mimeType: params.mimeType || 'application/pdf',
          data: params.pdfBase64,
        },
      });
    }
    contents.push(crosswordPrompt);

    const { text } = await generateBrowserGeminiContent({
      contents,
      responseMimeType: 'application/json',
      temperature: 0.3,
      timeoutMs: 30000,
    });

    const candidates = parseCandidates(text);
    if (candidates.length >= 6) {
      return buildValidCrosswordLayout(candidates, {
        title: effectiveTopic,
        theme: '6-Word Chapter Examination (8 XP per word)',
        summary: effectiveSummary.slice(0, 300),
        glossary: candidates.slice(0, 6).map((c) => ({ term: c.answer, definition: c.clue })),
      });
    }
  } catch (browserErr) {
    console.warn('[Crossword] Browser Gemini notice, trying fallback:', browserErr);
  }

  // 2. If this is one of the 3 predefined Scriptures, return its exact curated 6-word Scripture Crossword!
  if (scripture) {
    const matchId =
      scripture.scriptureKey === 'gita'
        ? 'gita-6-17'
        : scripture.scriptureKey === 'ramayana'
        ? 'ramayana-dharma'
        : 'mahabharata-dharma';
    const matchedSample = SAMPLE_CROSSWORDS.find((s) => s.id === matchId);
    if (matchedSample) {
      return matchedSample;
    }
  }

  // 3. Try Express backend /api/generate-crossword
  try {
    const res = await fetch('/api/generate-crossword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: effectiveTopic,
        summary: effectiveSummary,
        pdfData: params.pdfBase64,
        mimeType: params.mimeType,
        fileName: params.fileName,
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && Array.isArray(data.words) && data.words.length > 0) {
        return data;
      }
    }
  } catch (_) {}

  // 4. Contextual fallback built strictly from sentences in the chapter summary
  const contextualItems = buildContextualWordleFallback({
    id: 'temp',
    uniqueCode: '',
    title: effectiveTopic,
    fileName: params.fileName || '',
    summary: effectiveSummary,
    createdAt: '',
  });
  if (contextualItems.length >= 4) {
    return buildValidCrosswordLayout(
      contextualItems.map((item) => ({ answer: item.answer, clue: item.question })),
      {
        title: effectiveTopic,
        theme: '6-Word Chapter Examination (8 XP per word)',
        summary: effectiveSummary.slice(0, 300),
      }
    );
  }

  return SAMPLE_CROSSWORDS[0];
}

/**
 * Extracts and summarizes a textbook PDF in the browser using VITE_GURU_GEMINI_API_KEY & VITE_GEMINI_API_KEY
 * with Gemini 3.5 Flash Lite, so PDF uploads work even on static Firebase Hosting.
 */
export async function extractPdfVidyaBrowser(params: {
  pdfBase64?: string;
  fileName: string;
  extractedText?: string;
}): Promise<string> {
  let details = (params.extractedText || '').trim();

  // If client ASCII parser didn't get enough text and we have pdfBase64, perform multimodal OCR via Gemini 3.5 Flash Lite
  if (details.length < 60 && params.pdfBase64 && params.pdfBase64.length > 0) {
    const ocrPrompt = `You are an expert document OCR engine. Extract all chapter headings, text, scientific principles, formulas, diagrams, and definitions from this PDF.`;
    const { text: ocrText } = await generateBrowserGeminiContent({
      contents: [
        { inlineData: { mimeType: 'application/pdf', data: params.pdfBase64 } },
        ocrPrompt,
      ],
      timeoutMs: 45000,
    });
    if (ocrText && ocrText.trim().length > 40) {
      details = ocrText.trim();
    }
  }

  if (details.length < 30 && !params.pdfBase64) {
    throw new Error('Insufficient readable text in PDF');
  }

  const summarizerPrompt = `You are a distinguished academic educator writing a high-yield, 5-minute chapter revision summary titled "Vidya" for students.
Below is the textbook chapter content:
---
${details.slice(0, 120000)}
---

CRITICAL REQUIREMENTS:
1. TITLE FORMAT: The very first line MUST be: # [Exact Chapter Title]
2. TARGET LENGTH: Strictly ~650 to 750 words calibrated for a 5-minute read.
3. STRUCTURED HEADINGS:
   ## Chapter Overview
   ## Core Concept Breakdown
   ## Key Diagrams & Visual Insights
   ## Laws, Equations & Core Definitions
   ## Summary Takeaways
4. FORMAT: Plain keyboard characters only (NO LaTeX math dollar signs). NO emojis. NO questions or quizzes.`;

  const contents: any[] = [];
  if (details.length < 60 && params.pdfBase64) {
    contents.push({ inlineData: { mimeType: 'application/pdf', data: params.pdfBase64 } });
  }
  contents.push(summarizerPrompt);

  const { text: summary } = await generateBrowserGeminiContent({
    contents,
    timeoutMs: 45000,
  });

  if (!summary || summary.trim().length < 80) {
    throw new Error('Generated summary too short');
  }

  return summary.trim();
}
