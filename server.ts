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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

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

  const resolvedServerApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GURU_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';

  // Server-Side GoogleGenAI Client
  const ai = new GoogleGenAI({
    apiKey: resolvedServerApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }

  function isGeminiConfigured(): boolean {
    const key = resolvedServerApiKey;
    return Boolean(key && typeof key === 'string' && key.trim().length > 5 && !key.toLowerCase().includes('placeholder'));
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

      const SERVER_VIDYA_MODELS = [
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.1-flash-lite-preview',
        'gemini-3.8-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-flash-latest',
      ] as const;

      // 1C. Multimodal OCR fallback if neither PDFParse nor client text produced enough text and we need raw text
      if ((!extractedDetails || extractedDetails.length < 50) && pdfBase64 && pdfBase64.length > 0 && isGeminiConfigured()) {
        if (pdfBase64.length <= 25 * 1024 * 1024) {
          const ocrPrompt = `You are an expert document OCR engine. Extract all chapter headings, text, scientific principles, formulas, diagrams, and definitions from this PDF.`;
          for (const model of SERVER_VIDYA_MODELS) {
            try {
              const ocrPromise = ai.models.generateContent({
                model,
                contents: [
                  { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                  ocrPrompt,
                ],
                config: { maxOutputTokens: 8192 },
              });
              const ocrRes = await callWithTimeout(ocrPromise, 40000, `${model} OCR`);
              if (ocrRes.text && ocrRes.text.trim().length > 40) {
                extractedDetails = ocrRes.text.trim();
                break;
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

      if ((!extractedDetails || extractedDetails.trim().length < 20) && !pdfBase64) {
        return res.status(422).json({
          success: false,
          error: 'Unable to extract text or diagrams from this PDF. Please ensure the document is a readable chapter PDF.',
        });
      }

      // =========================================================================
      // STEP 2: VIDYA 5-MINUTE REVISION SUMMARY GENERATOR
      // =========================================================================
      const summarizerPrompt = `You are a distinguished academic educator writing a high-yield, 5-minute chapter revision summary titled "Vidya" for students.
${extractedDetails ? `Below is the textbook chapter text extracted from the PDF:\n---\n${extractedDetails.slice(0, 120000)}\n---\n` : ''}
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
        const summaryContents: any[] = [];
        if (pdfBase64 && pdfBase64.length > 0 && pdfBase64.length <= 25 * 1024 * 1024) {
          summaryContents.push({ inlineData: { mimeType: 'application/pdf', data: pdfBase64 } });
        }
        summaryContents.push(summarizerPrompt);

        for (const model of SERVER_VIDYA_MODELS) {
          try {
            console.log(`[Vidya Step 2] Generating summary with ${model}...`);
            const genPromise = ai.models.generateContent({
              model,
              contents: summaryContents,
              config: { maxOutputTokens: 2048 },
            });
            const genResponse = await callWithTimeout(genPromise, 45000, model);
            if (genResponse.text && genResponse.text.trim().length > 80) {
              summary = sanitizeVidya(genResponse.text, fileName || 'Chapter Summary');
              console.log(`[Vidya Step 2] ${model} summary generated successfully!`);
              break;
            }
          } catch (_) {}
        }
      }

      // If Gemini is unreachable or not configured, synthesize using the deterministic academic synthesizer
      if (!summary || summary.trim().length < 80) {
        if (!extractedDetails || extractedDetails.trim().length < 20) {
          return res.status(422).json({
            success: false,
            error: 'Unable to extract text or diagrams from this PDF. Please ensure the document is a readable chapter PDF.',
          });
        }
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
  // 3. Web Speech API (Client fallback on error)
  // ============================================================================
  const TTS_MODELS_ORDER = [
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
  ] as const;

  const TTS_CACHE_DIR = path.join(process.cwd(), '.cache', 'tts');
  if (!fs.existsSync(TTS_CACHE_DIR)) {
    fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
  }

  const SHRAVAN_TTS_STYLE_INSTRUCTION =
    'Speak in a calm, warm, patient, teacher-like delivery with natural Indian-English pronunciation and clear, respectful articulation of Indian names and Sanskrit words.';

  function getTtsCacheKey(text: string, voice: string): string {
    return crypto.createHash('sha256').update(`${text.trim()}|${voice}|v2-guru-in`).digest('hex');
  }

  async function synthesizeSpeechChain(cleanText: string, voice = 'Sulafat') {
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
        console.log(`[TTS Tier ${i + 1}/${TTS_MODELS_ORDER.length}] Synthesizing with ${model} (Voice: ${voice})...`);
        const supportsSpeechMetadata = model.startsWith('gemini-3.8-');
        const part = supportsSpeechMetadata
          ? {
              text: cleanText,
              speechMetadata: {
                style: SHRAVAN_TTS_STYLE_INSTRUCTION,
              },
            }
          : {
              text: `### DIRECTOR'S NOTES:\n${SHRAVAN_TTS_STYLE_INSTRUCTION}\n\n### TRANSCRIPT:\n${cleanText}`,
            };

        const ttsPromise = ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [part] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              languageCode: 'en-IN',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });

        const res = await callWithTimeout(ttsPromise, 90000, `${model} TTS`);
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
        console.log(`[TTS Tier ${i + 1}/${TTS_MODELS_ORDER.length}] ${model} unavailable:`, err?.message || err);
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
      cleanText = cleanText
        .replace(/^(Speak in|Please narrate|Instructions:|Prompt:|System:)[^\n]*(\n+|$)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const validVoice = voice === 'Charon' || voice === 'Fenrir' || voice === 'Puck' ? voice : 'Sulafat';
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
      console.log('[Shravan TTS Notice] Returning fallbackToWebSpeech signal to client:', err?.message);
      // NOTE: Do not return 502/503/504 because Nginx intercepts those and serves warmup.html.
      // Return 200 with fallbackToWebSpeech flag so frontend cleanly uses Web Speech API.
      return res.status(200).json({
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
Extract 10 to 12 essential, distinct vocabulary terms, key scientific concepts, and educational facts STRICTLY from the following material:
Topic: ${effectiveTopic}
---
${effectiveContent.slice(0, 30000)}
---

CRITICAL REQUIREMENTS:
1. Every word MUST be directly from or central to "${effectiveTopic}" and the text above. Do NOT generate unrelated filler words.
2. Each clue must be a proper, well-phrased, specific educational question or definition from the material.
3. Words must contain ONLY English alphabets A-Z (length 3 to 10 letters). NO spaces, hyphens, or numbers.
4. Return STRICTLY valid JSON array:
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

    // Check if topic matches one of the 3 scriptures when candidateWords is empty
    const lowerTopic = (effectiveTopic + ' ' + effectiveContent.slice(0, 200)).toLowerCase();
    if (!candidateWords || candidateWords.length < 4) {
      if (lowerTopic.includes('gita') || lowerTopic.includes('dhyana')) {
        const gitaSample = SAMPLE_CROSSWORDS.find((s) => s.id === 'gita-6-17');
        if (gitaSample) return res.json({ ...gitaSample, puzzle: gitaSample, success: true });
      }
      if (lowerTopic.includes('ramayana') || lowerTopic.includes('valmiki')) {
        const ramSample = SAMPLE_CROSSWORDS.find((s) => s.id === 'ramayana-dharma');
        if (ramSample) return res.json({ ...ramSample, puzzle: ramSample, success: true });
      }
      if (lowerTopic.includes('mahabharata') || lowerTopic.includes('vyasa') || lowerTopic.includes('kurukshetra')) {
        const mahaSample = SAMPLE_CROSSWORDS.find((s) => s.id === 'mahabharata-dharma');
        if (mahaSample) return res.json({ ...mahaSample, puzzle: mahaSample, success: true });
      }
    }

    // If Gemini returned valid chapter words, build the 6-word crossword strictly from those words!
    if (Array.isArray(candidateWords) && candidateWords.length >= 6) {
      const puzzle = buildValidCrosswordLayout(candidateWords, {
        title: effectiveTopic,
        theme: '6-Word Chapter Examination (8 XP per word)',
        summary: effectiveContent.slice(0, 300),
      });
      return res.json({
        ...puzzle,
        puzzle,
        success: true,
      });
    }

    // Fallback: extract contextual sentences from the content itself
    const sentences = effectiveContent
      .replace(/[#*_>`~]/g, '')
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 25 && s.length < 200);
    const contextualCandidates: { answer: string; clue: string }[] = [];
    for (const s of sentences) {
      if (contextualCandidates.length >= 12) break;
      const matches = s.match(/\b[A-Za-z]{4,9}\b/g) || [];
      for (const m of matches) {
        const up = m.toUpperCase();
        if (!['THIS', 'THAT', 'WITH', 'FROM', 'HAVE', 'WERE', 'CHAPTER', 'STUDENT'].includes(up)) {
          const blanked = s.replace(new RegExp(`\\b${m}\\b`, 'i'), '_____');
          if (blanked !== s) {
            contextualCandidates.push({ answer: up, clue: blanked });
            break;
          }
        }
      }
    }

    const finalPool = [...(candidateWords || []), ...contextualCandidates];
    const puzzle = buildValidCrosswordLayout(
      finalPool.length >= 4 ? finalPool : SAMPLE_CROSSWORDS[0].words.map((w) => ({ answer: w.answer, clue: w.clue })),
      {
        title: effectiveTopic,
        theme: '6-Word Chapter Examination (8 XP per word)',
        summary: effectiveContent.slice(0, 300),
      }
    );

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
  // CLOUDFLARE WORKERS AI INTEGRATION (Server-Side Only - 75s Timeout)
  // =========================================================================
  let cachedCloudflareAccountId: string | null = null;

  async function getCloudflareAccountId(apiToken: string): Promise<string | null> {
    const envAccountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
    if (envAccountId) {
      return envAccountId;
    }
    if (cachedCloudflareAccountId) {
      return cachedCloudflareAccountId;
    }
    try {
      const accountsRes = await fetch('https://api.cloudflare.com/client/v4/accounts', {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        if (Array.isArray(data?.result) && data.result.length > 0 && data.result[0]?.id) {
          cachedCloudflareAccountId = data.result[0].id;
          return cachedCloudflareAccountId;
        }
      }
    } catch (_) {}
    return null;
  }

  // Harmless verification endpoint for testing the Cloudflare API integration
  app.get('/api/cloudflare/verify', async (_req, res) => {
    const apiToken = (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY || '').trim();
    if (!apiToken) {
      return res.status(200).json({
        configured: false,
        status: 'missing_token',
        message: 'CLOUDFLARE_API_TOKEN is not configured on the server.',
      });
    }

    try {
      const verifyRes = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await verifyRes.json().catch(() => null);

      if (verifyRes.ok && data?.success) {
        const accountId = await getCloudflareAccountId(apiToken);
        return res.json({
          configured: true,
          valid: true,
          status: 'active',
          message: 'Cloudflare API token is valid and active.',
          accountConfigured: Boolean(accountId),
        });
      } else {
        return res.status(200).json({
          configured: true,
          valid: false,
          status: 'invalid_or_expired',
          httpStatus: verifyRes.status,
          message: 'Cloudflare rejected the token. Please verify token permissions and validity.',
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        configured: true,
        valid: false,
        status: 'network_error',
        message: 'Failed to reach Cloudflare API: ' + (err?.message || String(err)),
      });
    }
  });

  // Server-side Cloudflare Workers AI image generation endpoint
  app.post('/api/generate-image-cloudflare', async (req, res) => {
    try {
      const { prompt } = req.body || {};
      const apiToken = (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY || '').trim();

      if (!apiToken) {
        return res.status(503).json({
          error: 'CLOUDFLARE_API_TOKEN is not configured on the server. Please add CLOUDFLARE_API_TOKEN to your environment.',
        });
      }

      const cleanPrompt = (prompt || '').trim();
      if (!cleanPrompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const accountId = await getCloudflareAccountId(apiToken);
      if (!accountId) {
        return res.status(502).json({
          error: 'Could not determine Cloudflare Account ID. Please set CLOUDFLARE_ACCOUNT_ID in the environment or ensure the token has Account Settings Read permission.',
        });
      }

      // 75-second timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 75000);

      const cfModel = '@cf/bytedance/stable-diffusion-xl-lightning';
      const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${cfModel}`;

      const cfRes = await fetch(cfUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: cleanPrompt }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!cfRes.ok) {
        console.warn(`[Model Failure Log] Cloudflare Image API HTTP ${cfRes.status}`);
        return res.status(cfRes.status).json({
          error: `Cloudflare Image API error (HTTP ${cfRes.status})`,
          details: cfRes.status === 401
            ? 'Unauthorized: Check CLOUDFLARE_API_TOKEN validity'
            : cfRes.status === 403
            ? 'Forbidden: Check Workers AI permissions on token'
            : 'Cloudflare API call failed',
        });
      }

      const contentType = cfRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await cfRes.json();
        if (json?.result?.image) {
          const dataUrl = `data:image/png;base64,${json.result.image}`;
          return res.json({ imageUrl: dataUrl, isAiGenerated: true, provider: 'cloudflare' });
        }
      }

      // Raw binary image response
      const arrayBuffer = await cfRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mime = contentType.includes('jpeg') ? 'image/jpeg' : 'image/png';
      const dataUrl = `data:${mime};base64,${base64}`;

      return res.json({ imageUrl: dataUrl, isAiGenerated: true, provider: 'cloudflare' });
    } catch (err: any) {
      const msg = err?.name === 'AbortError' ? 'Cloudflare image generation timed out after 75s' : err?.message || String(err);
      console.warn('[Model Failure Log] Cloudflare image error:', msg);
      return res.status(500).json({ error: msg });
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
