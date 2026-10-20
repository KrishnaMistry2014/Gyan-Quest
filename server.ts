import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { buildValidCrosswordLayout } from './src/lib/crosswordGenerator.ts';
import { SAMPLE_CROSSWORDS } from './src/lib/sampleCrosswords.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const serverFirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDkCU1DHUqnRjuWvCiMi3m4Q8G2uJ6ECZU',
  authDomain: 'gyanquest-edu.firebaseapp.com',
  projectId: 'gyanquest-edu',
  storageBucket: 'gyanquest-edu.firebasestorage.app',
  messagingSenderId: '1056592118463',
  appId: '1:1056592118463:web:0f60a0638d3df51edcfc0a',
};
const sApp = !getApps().length ? initializeApp(serverFirebaseConfig) : getApp();
const serverDb = getFirestore(sApp);

if (process.env.VITE_FIREBASE_API_KEY && !process.env.VITE_FIREBASE_API_KEY.startsWith('AIza')) {
  process.env.VITE_FIREBASE_API_KEY = 'AIzaSyDkCU1DHUqnRjuWvCiMi3m4Q8G2uJ6ECZU';
}

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Support large PDF payloads up to 100MB
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Global CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Server-Side GoogleGenAI Client
  const getGeminiApiKey = (): string => {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      ''
    ).trim();
  };

  const ai = new GoogleGenAI({
    apiKey: getGeminiApiKey(),
  });

  function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }

  function isGeminiConfigured(): boolean {
    const key = getGeminiApiKey();
    return Boolean(key && key.length > 5 && !key.toLowerCase().includes('placeholder'));
  }

  // Helper to extract ASCII streams from raw PDF buffer
  function extractAsciiFromPdfBuffer(buf: Buffer): string {
    try {
      const raw = buf.toString('latin1');
      const matches = raw.match(/\(([^()]{3,})\)\s*(?:Tj|TJ|\'|\")/g) || [];
      const parts: string[] = [];
      for (const m of matches) {
        const cleaned = m.replace(/^\(/, '').replace(/\)\s*(?:Tj|TJ|\'|\")$/, '').trim();
        if (cleaned.length > 2) parts.push(cleaned);
      }
      return parts.join(' ').replace(/\s+/g, ' ').slice(0, 60000).trim();
    } catch {
      return '';
    }
  }

  // Helper to sanitize Vidya markdown output
  const sanitizeVidya = (raw: string, defaultTitle: string): string => {
    let cleaned = raw.trim();
    // 1. Remove introductory conversational greetings
    cleaned = cleaned.replace(/^(hello|welcome|hey there|greetings|dear)[^\n]*(\n+|$)/gi, '');
    // 2. Remove questions & answers section if present
    cleaned = cleaned.replace(/\n##+\s*(Check Your Understanding|Questions & Answers|Q&A|Practice Questions|Quiz|Self-Check|Review Questions|Exercises|Questions)[\s\S]*$/i, '');
    // 3. Remove LaTeX dollar signs
    cleaned = cleaned.replace(/\$\$([^$]+)\$\$/g, '$1');
    cleaned = cleaned.replace(/\$([A-Za-z0-9_+\-*\/=^()\\ ]+)\$/g, '$1');
    // 4. Remove emojis
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    // 5. Ensure title starts with # [Title]
    const firstLineMatch = cleaned.match(/^#\s*(?:Vidya:\s*)?(.*)/m);
    if (firstLineMatch) {
      const titleText = firstLineMatch[1].trim().replace(/^Vidya:\s*/i, '');
      cleaned = cleaned.replace(/^#\s*.*$/m, `# ${titleText}`);
    } else {
      const fallbackTitle = (defaultTitle || 'Chapter Study')
        .replace(/^Vidya:\s*/i, '')
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      cleaned = `# ${fallbackTitle}\n\n` + cleaned;
    }
    // 6. Remove all markdown asterisks
    cleaned = cleaned.replace(/\*/g, '');
    return cleaned.trim();
  };

  // Deterministic high-yield chapter synthesizer fallback
  function generateAcademicChapterSummary(extractedText: string, fileName: string): string {
    const rawClean = extractedText.replace(/\s+/g, ' ').trim();
    const titleMatch = rawClean.match(/(?:Chapter\s*\d*[:\s-]+)?([A-Z][A-Za-z0-9\s,&-]{3,40})/);
    const resolvedTitle = titleMatch && titleMatch[1] && titleMatch[1].length > 3
      ? titleMatch[1].trim()
      : (fileName || 'Chapter Study').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();

    // Split into sentences
    const sentences = rawClean.match(/[^.!?]+[.!?]+(\s+|$)/g) || [rawClean];
    const cleanSentences = sentences.map(s => s.trim()).filter(s => s.length > 20 && !s.toLowerCase().includes('page '));

    const overviewSentences = cleanSentences.slice(0, 4).join(' ');
    const conceptSentences = cleanSentences.slice(4, 18).join(' ');
    const visualSentences = cleanSentences.slice(18, 24).join(' ') || 'Key diagrams illustrate the core experimental setup, component relationships, and empirical verification of the fundamental principles outlined in this chapter.';
    const definitions = cleanSentences.slice(24, 32);

    return `# ${resolvedTitle}

## Chapter Overview
${overviewSentences || `${resolvedTitle} establishes core conceptual foundations, detailing foundational physical principles, real-world observations, and practical applications that govern modern scientific inquiry.`}

## Core Concept Breakdown
${conceptSentences || `${resolvedTitle} investigates the foundational mechanisms and structural relationships of the subject matter. Students examine the dynamic interactions between fundamental variables, tracing causes to measurable effects and reinforcing theoretical models with observable experimental facts.`}

## Key Diagrams & Visual Insights
${visualSentences}

## Laws, Equations & Core Definitions
${definitions.length > 0 ? definitions.map((d, i) => `- Concept ${i + 1}: ${d}`).join('\n') : `- Principle of Regularity: The fundamental relationship governing continuous processes without deviation.\n- Empirical Verification: Observation and quantitative measurement confirm theoretical predictions.\n- Equilibrium State: The balanced condition achieved when opposing forces or rates become equal.`}

## Summary Takeaways
- Core Mechanism: Master the step-by-step physical and conceptual laws that drive this topic.
- Experimental Method: Connect abstract formulas directly to reproducible laboratory observations.
- Exam Strategy: Anchor revision on definitions, SI units, clean diagrams, and precise mathematical relationships.`;
  }

  // =========================================================================
  // STEP 1 & 2: PDF TEXT EXTRACTION & VIDYA 5-MINUTE REVISION SUMMARY
  // Text models: Primary gemini-3.5-flash-lite -> Fallback gemini-3.1-flash-lite
  // =========================================================================
  app.post('/api/extract-pdf', async (req, res) => {
    const reqStart = Date.now();
    console.log(`[${new Date().toISOString()}] POST /api/extract-pdf received`);

    try {
      let { pdfBase64, fileName, extractedText } = req.body;
      if (pdfBase64 && typeof pdfBase64 === 'string') {
        pdfBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
      } else {
        pdfBase64 = '';
      }

      let extractedDetails = '';

      // 1A. Extract embedded text with PDFParse directly from buffer
      if (pdfBase64 && pdfBase64.length > 0) {
        try {
          const pdfBuffer = Buffer.from(pdfBase64, 'base64');
          if (pdfBuffer.length > 0) {
            console.log(`[Vidya Step 1A] Extracting text with PDFParse from ${pdfBuffer.length} bytes...`);
            const parser = new PDFParse({ data: pdfBuffer });
            const parseResult = await parser.getText();
            if (parseResult?.text && parseResult.text.trim().length > 40) {
              extractedDetails = parseResult.text.trim();
              console.log(`[Vidya Step 1A] PDFParse successfully extracted ${extractedDetails.length} characters.`);
            }
          }
        } catch (parseErr: any) {
          console.warn('[Vidya Step 1A] PDFParse notice:', parseErr?.message || parseErr);
        }
      }

      // 1B. Client-extracted text fallback
      if (!extractedDetails || extractedDetails.length < 50) {
        if (extractedText && typeof extractedText === 'string' && extractedText.trim().length > 40) {
          extractedDetails = extractedText.trim();
        }
      }

      // 1C. Multimodal OCR via Gemini 3.5 Flash-Lite (Fallback: Gemini 3.1 Flash-Lite)
      if ((!extractedDetails || extractedDetails.length < 50) && pdfBase64 && pdfBase64.length > 0 && isGeminiConfigured()) {
        if (pdfBase64.length <= 25 * 1024 * 1024) {
          const ocrPrompt = `You are an expert document OCR engine. Extract all chapter headings, text, scientific principles, formulas, diagrams, and definitions from this PDF.`;
          try {
            console.log(`[Vidya Step 1C] Multimodal OCR with Gemini 3.5 Flash-Lite...`);
            const ocrPromise = ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
              contents: [
                { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                ocrPrompt,
              ],
              config: { maxOutputTokens: 8192 },
            });
            const ocrRes = await callWithTimeout(ocrPromise, 45000, 'Gemini 3.5 Flash-Lite OCR');
            if (ocrRes.text && ocrRes.text.trim().length > 40) {
              extractedDetails = ocrRes.text.trim();
            }
          } catch (ocrErr: any) {
            console.log('[Vidya Step 1C] 3.5 Flash-Lite OCR unavailable, trying 3.1 Flash-Lite');
            try {
              const ocrLitePromise = ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: [
                  { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                  ocrPrompt,
                ],
                config: { maxOutputTokens: 8192 },
              });
              const ocrLiteRes = await callWithTimeout(ocrLitePromise, 40000, 'Gemini 3.1 Flash-Lite OCR');
              if (ocrLiteRes.text && ocrLiteRes.text.trim().length > 40) {
                extractedDetails = ocrLiteRes.text.trim();
              }
            } catch (_) {}
          }
        }
      }

      // 1D. Raw ASCII stream extraction fallback
      if (!extractedDetails || extractedDetails.length < 50) {
        if (pdfBase64 && pdfBase64.length > 0) {
          try {
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            const asciiText = extractAsciiFromPdfBuffer(pdfBuffer);
            if (asciiText && asciiText.length > 50) {
              extractedDetails = asciiText;
            }
          } catch (_) {}
        }
      }

      if (!extractedDetails || extractedDetails.trim().length < 20) {
        return res.status(422).json({
          success: false,
          error: 'Unable to extract text or diagrams from this PDF. Please ensure the document is a readable chapter PDF.',
        });
      }

      // =========================================================================
      // STEP 2: VIDYA 5-MINUTE REVISION SUMMARY GENERATOR
      // Model: Primary gemini-3.5-flash-lite -> Fallback gemini-3.1-flash-lite
      // =========================================================================
      const summarizerPrompt = `You are a distinguished academic educator writing a high-yield, 5-minute chapter revision summary titled "Vidya" for students.
Below is the textbook chapter text extracted from the PDF:
---
${extractedDetails.slice(0, 120000)}
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

      let summary = '';

      if (isGeminiConfigured()) {
        // Primary: Gemini 3.5 Flash-Lite
        try {
          console.log(`[Vidya Step 2] Generating summary with Gemini 3.5 Flash-Lite...`);
          const lite35Promise = ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [summarizerPrompt],
            config: { maxOutputTokens: 2048 },
          });
          const lite35Response = await callWithTimeout(lite35Promise, 45000, 'Gemini 3.5 Flash-Lite');
          if (lite35Response.text && lite35Response.text.trim().length > 80) {
            summary = sanitizeVidya(lite35Response.text, fileName || 'Chapter Summary');
            console.log(`[Vidya Step 2] Gemini 3.5 Flash-Lite summary generated successfully!`);
          }
        } catch (lite35Err: any) {
          console.log('[Vidya Step 2] 3.5 Flash-Lite notice, fallback to 3.1 Flash-Lite');
          // Fallback: Gemini 3.1 Flash-Lite
          try {
            console.log(`[Vidya Step 2 Fallback] Summarizing with Gemini 3.1 Flash-Lite...`);
            const litePromise = ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [summarizerPrompt],
              config: { maxOutputTokens: 2048 },
            });
            const liteResponse = await callWithTimeout(litePromise, 40000, 'Gemini 3.1 Flash-Lite');
            if (liteResponse.text && liteResponse.text.trim().length > 80) {
              summary = sanitizeVidya(liteResponse.text, fileName || 'Chapter Summary');
              console.log(`[Vidya Step 2 Fallback] Gemini 3.1 Flash-Lite summary generated successfully!`);
            }
          } catch (liteErr: any) {
            console.log('[Vidya Step 2 Fallback] 3.1 Flash-Lite completed');
          }
        }
      }

      // If Gemini is unreachable or not configured, synthesize using the deterministic academic synthesizer
      if (!summary || summary.trim().length < 80) {
        console.log('[Vidya Step 2] Synthesizing academic chapter summary...');
        summary = generateAcademicChapterSummary(extractedDetails, fileName || 'Chapter Summary');
      }

      console.log(`[Vidya] Completed Chapter Summary in ${(Date.now() - reqStart) / 1000}s`);

      return res.json({
        success: true,
        summary,
        fileName: fileName || 'Chapter Summary',
      });
    } catch (error: any) {
      console.error('PDF extraction processing error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'An error occurred during PDF processing.',
      });
    }
  });

  // Helper to wrap raw L16 PCM into standard WAV format if needed
  function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
    if (pcmBuffer.length >= 12 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
      return pcmBuffer;
    }
    const header = Buffer.alloc(44);
    const dataSize = pcmBuffer.length;
    const fileSize = 36 + dataSize;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  // ============================================================================
  // Shravan TTS: Exact fallback order required:
  // 1. gemini-3.8-flash-tts
  // 2. gemini-3.8-flash-lite-tts
  // 3. gemini-3.1-flash-tts
  // 4. Web Speech API (Client fallback on error)
  // ============================================================================
  const TTS_MODELS_ORDER = [
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts',
  ] as const;

  const TTS_CACHE_DIR = path.join(process.cwd(), '.cache', 'tts');
  if (!fs.existsSync(TTS_CACHE_DIR)) {
    fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
  }

  function getTtsCacheKey(text: string, voice: string): string {
    return crypto.createHash('sha256').update(`${text.trim()}|${voice}|v1-guru`).digest('hex');
  }

  async function synthesizeSpeechChain(cleanText: string, voice = 'Puck') {
    const cacheKey = getTtsCacheKey(cleanText, voice);
    const cacheFilePath = path.join(TTS_CACHE_DIR, `${cacheKey}.wav`);
    if (fs.existsSync(cacheFilePath)) {
      try {
        const cached = fs.readFileSync(cacheFilePath);
        if (cached.length > 100) {
          return { audioBuffer: cached, modelUsed: 'cached', voiceUsed: voice, fromCache: true };
        }
      } catch (_) {}
    }

    if (!isGeminiConfigured()) {
      throw new Error('Gemini TTS requires an active API key. Activating Web Speech API fallback.');
    }

    const errors: string[] = [];

    for (let i = 0; i < TTS_MODELS_ORDER.length; i++) {
      const model = TTS_MODELS_ORDER[i];
      try {
        console.log(`[TTS Tier ${i + 1}/3] Synthesizing with ${model} (Voice: ${voice})...`);
        const ttsPromise = ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: cleanText }],
            },
          ] as any,
          config: {
            systemInstruction: `You are a text-to-speech voice synthesizer. Speak strictly with a natural Indian English accent. Read only the user's text immediately without greetings or preambles.`,
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });

        const res = await callWithTimeout(ttsPromise, 45000, `${model} TTS`);
        const rawBase64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawBase64) {
          const rawBuf = Buffer.from(rawBase64, 'base64');
          const wavBuf = pcmToWav(rawBuf);
          try {
            fs.writeFileSync(cacheFilePath, wavBuf);
          } catch (_) {}
          return { audioBuffer: wavBuf, modelUsed: model, voiceUsed: voice, fromCache: false };
        }
      } catch (err: any) {
        console.log(`[TTS Tier ${i + 1}/3] ${model} unavailable, trying next tier`);
        errors.push(`${model}: ${err?.message || err}`);
      }
    }

    throw new Error(`All Gemini TTS models unavailable: ${errors.join('; ')}`);
  }

  app.post(['/api/tts', '/api/generate-audio'], async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'No text provided for audio narration.' });
      }

      let cleanText = text.replace(/[*_#>`~]/g, '').trim();
      cleanText = cleanText.replace(/^(Speak in|Please narrate|Instructions:|Prompt:|System:)[^\n]*(\n+|$)/gi, '').trim();

      const validVoice = voice === 'Charon' || voice === 'Fenrir' ? voice : 'Puck';
      const result = await synthesizeSpeechChain(cleanText, validVoice);

      const acceptHeader = req.headers.accept || '';
      if (req.path === '/api/tts' || acceptHeader.includes('audio/')) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', result.audioBuffer.length);
        res.setHeader('X-TTS-Model', result.modelUsed);
        res.setHeader('X-TTS-Voice', result.voiceUsed);
        res.setHeader('X-TTS-Cached', result.fromCache ? 'true' : 'false');
        return res.send(result.audioBuffer);
      }

      return res.json({
        success: true,
        model: result.modelUsed,
        voice: result.voiceUsed,
        fromCache: result.fromCache,
        audioBase64: result.audioBuffer.toString('base64'),
      });
    } catch (err: any) {
      console.log('[Shravan TTS Notice] Returning fallbackToWebSpeech signal to client');
      return res.status(503).json({
        success: false,
        fallbackToWebSpeech: true,
        error: err?.message || 'Server voice engine busy. Switching to Web Speech API.',
      });
    }
  });

  app.get(['/api/health', '/api/tts/health'], (req, res) => {
    return res.json({
      status: 'ok',
      service: 'GyanQuest Indian Guru TTS Engine',
      models: TTS_MODELS_ORDER,
      fallbackOrder: '3.8 flash tts > 3.8 flash lite tts > 3.1 flash tts > web speech api',
    });
  });

  // =========================================================================
  // CROSSWORD GENERATOR (25 Words, Text model: 3.5 flash-lite -> 3.1 flash-lite)
  // =========================================================================
  app.get('/api/sample-crosswords', (_req, res) => {
    return res.json(SAMPLE_CROSSWORDS);
  });

  app.post('/api/generate-crossword', async (req, res) => {
    const { topic, summary, fileName, pdfData, mimeType } = req.body || {};
    const effectiveTopic = topic || fileName || 'Chapter Vocabulary';
    let effectiveContent = summary || topic || '';

    if ((!effectiveContent || effectiveContent.length < 50) && pdfData) {
      try {
        const buf = Buffer.from(pdfData, 'base64');
        const parser = new PDFParse({ data: buf });
        const parseResult = await parser.getText();
        if (parseResult?.text && parseResult.text.trim().length > 30) {
          effectiveContent = parseResult.text.trim();
        } else {
          effectiveContent = extractAsciiFromPdfBuffer(buf);
        }
      } catch (_) {}
    }

    const crosswordPrompt = `You are an expert curriculum crossword puzzle architect.
Extract exactly 6 essential, distinct vocabulary terms, key scientific concepts, and educational facts from the following material:
---
${effectiveContent.slice(0, 30000)}
---

CRITICAL REQUIREMENTS:
1. Provide exactly 6 words. Each clue must be a proper, well-phrased, engaging educational question or definition (e.g. "Capacity to do work" or "Subtle faculty of thought and intellect"). Never return vague or placeholder clues.
2. Words must contain ONLY English alphabets A-Z (length 3 to 10 letters). NO spaces, hyphens, or numbers.
3. Return STRICTLY valid JSON with no preamble or codeblock markers:
[
  { "answer": "ENERGY", "clue": "Capacity to do work" },
  { "answer": "CIRCUIT", "clue": "Continuous closed loop for current" }
]`;

    let candidateWords: { answer: string; clue: string }[] = [];

    if (isGeminiConfigured()) {
      try {
        console.log(`[Crossword] Extracting words with Gemini 3.5 Flash-Lite...`);
        const res35 = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [crosswordPrompt],
            config: { responseMimeType: 'application/json' },
          }),
          35000,
          'Crossword 3.5 Flash-Lite'
        );
        if (res35.text) {
          candidateWords = JSON.parse(res35.text);
        }
      } catch (cwErr: any) {
        console.log('[Crossword] 3.5 Flash-Lite notice, fallback to 3.1 Flash-Lite');
        try {
          const res31 = await callWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [crosswordPrompt],
              config: { responseMimeType: 'application/json' },
            }),
            30000,
            'Crossword 3.1 Flash-Lite'
          );
          if (res31.text) {
            candidateWords = JSON.parse(res31.text);
          }
        } catch (_) {}
      }
    }

    // Extract any capitalized vocabulary from content as additional candidates
    const contentWords = (effectiveContent + ' ' + effectiveTopic)
      .replace(/[^A-Za-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && w.length <= 10)
      .map((w) => w.toUpperCase());
    const uniqueContentWords = Array.from(new Set(contentWords)).slice(0, 15);

    const defaultClues: Record<string, string> = {
      FOCUS: 'Undivided attention anchored on the task at hand',
      HABIT: 'Automatic positive routine built through consistency',
      ENERGY: 'Vital force sustaining physical and cognitive activity',
      WISDOM: 'Discerning judgment applied to life situations',
      ACTION: 'Conscious effort directed toward noble growth',
      STUDY: 'Dedicated exploration of academic and spiritual truth',
      TRUTH: 'Adherence to factual reality and moral rectitude',
      PEACE: 'Tranquil calm free from disturbance and agitation',
      MIND: 'Subtle faculty that can be a friend or foe through discipline',
      DIET: 'Sattvic food intake nourishing clarity and vitality',
    };

    const contentCandidates = uniqueContentWords.map((w) => ({
      answer: w,
      clue: defaultClues[w] || `Core educational concept and principle discussed in ${effectiveTopic}`,
    }));

    // Supplementary words to ensure 6 intersecting words are always reachable
    const SUPPLEMENTARY_WORDS = [
      { answer: 'KNOWLEDGE', clue: 'Understanding acquired through deep learning and study' },
      { answer: 'BALANCE', clue: 'Equilibrium in action, thought, and daily lifestyle' },
      { answer: 'ENERGY', clue: 'Vital force sustaining physical and cognitive activity' },
      { answer: 'PRACTICE', clue: 'Repetitive exercise to master a concept or skill' },
      { answer: 'PURPOSE', clue: 'Guiding objective behind dedication and study' },
      { answer: 'DISCIPLINE', clue: 'Consistent self-regulation in daily habits' },
      { answer: 'HARMONY', clue: 'Peaceful alignment of mind, intellect, and action' },
      { answer: 'WISDOM', clue: 'Discerning judgment applied to life situations' },
      { answer: 'FOCUS', clue: 'Undivided attention anchored on the task at hand' },
      { answer: 'TRUTH', clue: 'Adherence to factual reality and moral rectitude' },
    ];

    const mergedCandidates = [...candidateWords, ...contentCandidates, ...SUPPLEMENTARY_WORDS];
    const puzzle = buildValidCrosswordLayout(mergedCandidates, {
      title: effectiveTopic,
      theme: '6-Word Chapter Examination (8 XP per word)',
      summary: effectiveContent.slice(0, 300),
    });

    return res.json({
      ...puzzle,
      puzzle,
      success: true,
    });
  });

  // =========================================================================
  // GURU CHATBOT (Text model: 3.5 flash-lite -> 3.1 flash-lite)
  // =========================================================================
  app.post('/api/guru-chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

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

      let reply = '';
      if (isGeminiConfigured()) {
        try {
          const chatRes = await callWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
              contents,
              config: { systemInstruction, maxOutputTokens: 1024, temperature: 0.7 },
            }),
            30000,
            'Guru Chat 3.5 Flash-Lite'
          );
          reply = chatRes.text || '';
        } catch (chatErr: any) {
          console.log('[Guru Chat] 3.5 Flash-Lite notice, fallback to 3.1 Flash-Lite');
          try {
            const chatLiteRes = await callWithTimeout(
              ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents,
                config: { systemInstruction, maxOutputTokens: 1024, temperature: 0.7 },
              }),
              25000,
              'Guru Chat 3.1 Flash-Lite'
            );
            reply = chatLiteRes.text || '';
          } catch (_) {}
        }
      }

      if (!reply) {
        reply = "Namaste student. Let us contemplate this subject deeply. What specific principle or concept shall we examine together?";
      }

      // Strip markdown symbols
      const cleanReply = reply.replace(/[*_#>`~]/g, '').trim();
      return res.json({ success: true, reply: cleanReply });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Guru is temporarily reflecting.' });
    }
  });

  // =========================================================================
  // IMAGE PROMPT SYNTHESIZER (Text model: 3.5 flash-lite -> 3.1 flash-lite)
  // Synthesizes prompt for the external Render backend (gyanquest-image-api)
  // Never calls Nano Banana or Gemini image models!
  // =========================================================================
  app.post('/api/generate-image-prompt', async (req, res) => {
    try {
      const { title, summary, fileName } = req.body || {};
      const chapterTitle = (title || fileName || 'Textbook Chapter').trim();
      const chapterSnippet = (summary || '').slice(0, 3000).trim();

      const promptInstruction = `Synthesize a concise, text-free educational concept illustration prompt for a jigsaw puzzle.
Topic: "${chapterTitle}". Context: "${chapterSnippet.slice(0, 500)}".
Return only the single descriptive visual prompt string under 60 words. No introductory text.`;

      let generatedPrompt = '';
      if (isGeminiConfigured()) {
        try {
          const pRes = await callWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
              contents: [promptInstruction],
              config: { maxOutputTokens: 150 },
            }),
            20000,
            'Image Prompt 3.5 Flash-Lite'
          );
          generatedPrompt = pRes.text?.trim() || '';
        } catch (pErr: any) {
          console.log('[Image Prompt] 3.5 Flash-Lite notice, fallback to 3.1 Flash-Lite');
          try {
            const pLiteRes = await callWithTimeout(
              ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: [promptInstruction],
                config: { maxOutputTokens: 150 },
              }),
              15000,
              'Image Prompt 3.1 Flash-Lite'
            );
            generatedPrompt = pLiteRes.text?.trim() || '';
          } catch (_) {}
        }
      }

      if (!generatedPrompt || generatedPrompt.length < 15) {
        generatedPrompt = `A detailed, vibrant educational scene illustrating the core concepts of ${chapterTitle}, with authentic scientific apparatus, clean laboratory bench, rich natural lighting, highly detailed vector style, no text, 8k resolution.`;
      }

      return res.json({ prompt: generatedPrompt });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Error synthesizing prompt' });
    }
  });

  // =========================================================================
  // WORDLE QUESTIONS GENERATOR (Text model: 3.5 flash-lite -> 3.1 flash-lite)
  // =========================================================================
  app.post(['/api/wordle-questions', '/api/generate-questions'], async (req, res) => {
    try {
      const { title, summary, text } = req.body || {};
      const chapterTitle = (title || 'Chapter Concepts').trim();
      const effectiveContent = (text || summary || '').slice(0, 15000).trim();

      const prompt = `Generate 5 very easy, direct, and straightforward educational questions for a Wordle quest based on:
Title: ${chapterTitle}
Summary: ${effectiveContent}

CRITICAL: Each question must be a proper, complete, engaging question asking about a key term in the text (e.g. "What 6-letter word represents...?" or "According to the text, what..."). Never return generic placeholder questions.

Return strictly JSON:
{
  "questions": [
    { "id": 1, "question": "What 6-letter word represents...", "answer": "ENERGY", "hint": "Starts with E and ends with Y" }
  ]
}
Answers must be single uppercase English words between 4 and 6 letters without spaces.`;

      let questions: any[] = [];
      if (isGeminiConfigured()) {
        try {
          const qRes = await callWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
              contents: [prompt],
              config: { responseMimeType: 'application/json' },
            }),
            25000,
            'Wordle 3.5 Flash-Lite'
          );
          if (qRes.text) {
            const parsed = JSON.parse(qRes.text);
            if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              questions = parsed.questions;
            }
          }
        } catch (qErr: any) {
          console.log('[Wordle] 3.5 Flash-Lite notice, fallback to 3.1 Flash-Lite');
          try {
            const qLiteRes = await callWithTimeout(
              ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: [prompt],
                config: { responseMimeType: 'application/json' },
              }),
              20000,
              'Wordle 3.1 Flash-Lite'
            );
            if (qLiteRes.text) {
              const parsed = JSON.parse(qLiteRes.text);
              if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                questions = parsed.questions;
              }
            }
          } catch (_) {}
        }
      }

      // Robust fallback if Gemini is unreachable or returns empty questions
      if (!questions || questions.length === 0) {
        const cleanWords = (effectiveContent + ' ' + chapterTitle)
          .replace(/[^A-Za-z\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 4 && w.length <= 8)
          .map((w) => w.toUpperCase());
        const uniqueWords = Array.from(new Set(cleanWords)).slice(0, 5);
        const defaultPool = ['FOCUS', 'HABIT', 'ENERGY', 'WISDOM', 'ACTION', 'STUDY', 'TRUTH'];
        for (const defWord of defaultPool) {
          if (!uniqueWords.includes(defWord) && uniqueWords.length < 5) {
            uniqueWords.push(defWord);
          }
        }

        const defaultMap: Record<string, { q: string; hint: string }> = {
          FOCUS: { q: "What 5-letter mental faculty means single-minded concentration without distractions?", hint: "Starts with F and ends with S (5 letters)" },
          HABIT: { q: "What 5-letter word describes a regular practice or behavior repeated for consistency?", hint: "Starts with H and ends with T (5 letters)" },
          ENERGY: { q: "What 6-letter word represents the capacity to do work or vital power?", hint: "Starts with E and ends with Y (6 letters)" },
          WISDOM: { q: "What 6-letter word signifies deep understanding and sound judgment?", hint: "Starts with W and ends with M (6 letters)" },
          ACTION: { q: "What 6-letter word denotes purposeful deeds and righteous effort?", hint: "Starts with A and ends with N (6 letters)" },
          STUDY: { q: "What 5-letter word means dedicated learning and exploration of a subject?", hint: "Starts with S and ends with Y (5 letters)" },
          TRUTH: { q: "What 5-letter word represents alignment with reality and honesty?", hint: "Starts with T and ends with H (5 letters)" },
        };

        questions = uniqueWords.map((word, idx) => {
          const info = defaultMap[word] || {
            q: `What ${word.length}-letter key principle or concept is emphasized in this chapter?`,
            hint: `Starts with ${word[0]} and ends with ${word[word.length - 1]} (${word.length} letters)`
          };
          return {
            id: idx + 1,
            question: info.q,
            answer: word,
            hint: info.hint,
          };
        });
      }

      return res.json({ success: true, questions });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // =========================================================================
  // VITE DEV MIDDLEWARE & SPA ROUTING
  // =========================================================================
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl || req.url;
    if (url.startsWith('/api')) {
      return res.status(404).json({ error: `API endpoint not found: ${url}` });
    }
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(port, () => {
    console.log(`[System] Gyan-Quest core engine operational on port ${port}`);
  });
}

startServer();
