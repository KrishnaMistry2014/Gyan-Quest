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
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { buildValidCrosswordLayout } from './src/lib/crosswordGenerator.ts';

dotenv.config();

const serverFirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDkCU1DHUqnRjuWvCiMi3m4Q8G2uJ6ECZU",
  authDomain: "gyanquest-edu.firebaseapp.com",
  projectId: "gyanquest-edu",
  storageBucket: "gyanquest-edu.firebasestorage.app",
  messagingSenderId: "1056592118463",
  appId: "1:1056592118463:web:0f60a0638d3df51edcfc0a",
};
const sApp = !getApps().length ? initializeApp(serverFirebaseConfig) : getApp();
const serverDb = getFirestore(sApp);

async function getServerExceededModels(): Promise<string[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const snap = await getDoc(doc(serverDb, 'systemStatus', 'dailyQuotaStatus'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.date === today && Array.isArray(data.exceededModels)) {
        return data.exceededModels;
      }
    }
  } catch (err) {
    console.warn('[Server Quota] Error reading daily quota from Firestore:', err);
  }
  return [];
}

async function recordServerExceededModel(model: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const ref = doc(serverDb, 'systemStatus', 'dailyQuotaStatus');
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data()?.date !== today) {
      await setDoc(ref, {
        date: today,
        exceededModels: [model],
        updatedAt: Date.now(),
      });
    } else {
      const current = snap.data()?.exceededModels || [];
      if (!current.includes(model)) {
        await updateDoc(ref, {
          exceededModels: arrayUnion(model),
          updatedAt: Date.now(),
        });
      }
    }
    console.log(`[Server Quota] Recorded model ${model} as exceeded for today (${today}).`);
  } catch (err) {
    console.warn('[Server Quota] Error recording exceeded model to Firestore:', err);
  }
}

if (process.env.VITE_FIREBASE_API_KEY && !process.env.VITE_FIREBASE_API_KEY.startsWith('AIza')) {
  process.env.VITE_FIREBASE_API_KEY = 'AIzaSyDkCU1DHUqnRjuWvCiMi3m4Q8G2uJ6ECZU';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Support large PDF payloads up to 100MB
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
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

app.post('/api/extract-pdf', async (req, res) => {
  const reqStart = Date.now();
  console.log(`[${new Date().toISOString()}] POST /api/extract-pdf received`);

  try {
    let { pdfBase64, fileName, extractedText } = req.body;
    console.log(`[Extraction] Incoming file: "${fileName}", base64 length: ${pdfBase64 ? pdfBase64.length : 0}, clientText length: ${extractedText ? extractedText.length : 0}`);

    if ((!pdfBase64 || typeof pdfBase64 !== 'string' || pdfBase64.trim().length === 0) && (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'No readable PDF data or text was received. Please select a valid chapter PDF.',
      });
    }

    // Clean up base64 prefix and whitespace if present
    if (pdfBase64 && typeof pdfBase64 === 'string') {
      pdfBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
    } else {
      pdfBase64 = '';
    }

    // Helper to sanitize Vidya output
    const sanitizeVidya = (raw: string, defaultTitle: string): string => {
      let cleaned = raw.trim();

      // 1. Remove introductory conversational greetings (e.g. "Hello, little scholar...", "Welcome, ...")
      cleaned = cleaned.replace(/^(hello|welcome|hey there|greetings|dear)[^\n]*(\n+|$)/gi, '');

      // 2. Remove questions and answers / check your understanding section if present
      cleaned = cleaned.replace(/\n##+\s*(Check Your Understanding|Questions & Answers|Q&A|Practice Questions|Quiz|Self-Check|Review Questions|Exercises|Questions)[\s\S]*$/i, '');

      // 3. Remove LaTeX math dollar signs ($...$ or $$...$$) unless followed by pure currency digits like $25
      cleaned = cleaned.replace(/\$\$([^$]+)\$\$/g, '$1');
      cleaned = cleaned.replace(/\$([A-Za-z0-9_+\-*\/=^()\\ ]+)\$/g, '$1');

      // 4. Remove emojis to ensure clean reading and TTS compatibility
      cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

      // 5. Ensure title starts with "# [x]" (without "Vidya: " prefix)
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

    // =========================================================================
    // STEP 1: Text Extraction (PDFParse -> Client Text -> Multimodal Gemini OCR)
    // =========================================================================
    let extractedDetails = '';

    // Step 1A: Extract embedded text with PDFParse directly from the PDF buffer
    if (pdfBase64 && pdfBase64.length > 0) {
      try {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        if (pdfBuffer.length > 0) {
          console.log(`[Vidya Step 1A] Extracting text with PDFParse from ${pdfBuffer.length} bytes...`);
          const parser = new PDFParse({ data: pdfBuffer });
          const parseResult = await parser.getText();
          if (parseResult?.text && parseResult.text.trim().length > 40) {
            extractedDetails = parseResult.text.trim();
            console.log(`[Vidya Step 1A] PDFParse successfully extracted ${extractedDetails.length} characters from ${parseResult.total || 1} pages.`);
          }
        }
      } catch (parseErr: any) {
        console.warn('[Vidya Step 1A] PDFParse notice:', parseErr?.message || parseErr);
      }
    }

    // Step 1B: If PDFParse yielded insufficient text, check client-extracted text
    if (!extractedDetails || extractedDetails.length < 50) {
      if (extractedText && typeof extractedText === 'string' && extractedText.trim().length > 40) {
        extractedDetails = extractedText.trim();
        console.log(`[Vidya Step 1B] Used client extracted text (${extractedDetails.length} characters).`);
      }
    }

    // Step 1C: If still insufficient text (scanned PDF or visual-only), run Gemini multimodal OCR
    if ((!extractedDetails || extractedDetails.length < 50) && pdfBase64 && pdfBase64.length > 0) {
      if (pdfBase64.length <= 25 * 1024 * 1024) {
        const ocrPrompt = `You are an expert document OCR engine and scientific diagram interpreter.
Analyze this textbook chapter PDF in complete, exhaustive detail.
Perform two essential tasks across all pages:
1. COMPREHENSIVE TEXT AND CONTENT EXTRACTION:
   - Extract and transcribe ALL text, chapter sections, subheadings, scientific concepts, explanations, experiments, procedures, observations, physical laws, chemical equations/reactions, formulas, and terminology across all pages of this PDF.
   - Do NOT abbreviate, condense, or omit any paragraphs or concepts.
2. THOROUGH DIAGRAM AND VISUAL MEANING EXPLANATION:
   - For every diagram, figure, illustration, schematic, flowchart, experimental apparatus setup, graph, or chart across all pages:
     * State its caption/title and topic.
     * Describe all visual elements (components, labeled parts, arrows, directions, states of matter, apparatus).
     * Explain the scientific mechanism, process, or conceptual principle depicted in the visual and what it demonstrates.`;

        // Try gemini-3.8-flash for multimodal OCR
        try {
          console.log(`[Vidya Step 1C] Extracting text & diagram meanings with Gemini 3.5 Flash-Lite...`);
          const ocrPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64,
                },
              },
              ocrPrompt,
            ],
            config: {
              maxOutputTokens: 8192,
            },
          });
          const ocrResponse = await callWithTimeout(ocrPromise, 45000, 'Gemini 3.5 Flash-Lite OCR');
          if (ocrResponse.text && ocrResponse.text.trim().length > 40) {
            extractedDetails = ocrResponse.text.trim();
            console.log(`[Vidya Step 1C] Gemini 3.5 Flash-Lite OCR successful (${extractedDetails.length} characters)`);
          }
        } catch (ocrErr: any) {
          console.warn('[Vidya Step 1C] Gemini 3.5 Flash-Lite OCR notice:', ocrErr?.message || ocrErr);
          // Fallback to Gemini 3.1 Flash-Lite
          try {
            console.log(`[Vidya Step 1C Fallback] Retrying OCR with Gemini 3.1 Flash-Lite...`);
            const ocrLitePromise = ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: pdfBase64,
                  },
                },
                ocrPrompt,
              ],
              config: {
                maxOutputTokens: 8192,
              },
            });
            const ocrLiteResponse = await callWithTimeout(ocrLitePromise, 45000, 'Gemini 3.1 Flash-Lite OCR');
            if (ocrLiteResponse.text && ocrLiteResponse.text.trim().length > 40) {
              extractedDetails = ocrLiteResponse.text.trim();
              console.log(`[Vidya Step 1C Fallback] Gemini 3.1 Flash-Lite OCR successful (${extractedDetails.length} characters)`);
            }
          } catch (ocrLiteErr: any) {
            console.warn('[Vidya Step 1C Fallback] Gemini 3.1 Flash-Lite OCR notice:', ocrLiteErr?.message || ocrLiteErr);
          }
        }
      }
    }

    // Step 1D: Fallback to ASCII stream extraction from buffer if still empty
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
    // STEP 2: Chapter Summariser & Title Creator (Gemini 3.5 Flash-Lite)
    // =========================================================================
    const summarizerPrompt = `You are a distinguished academic educator writing a high-yield, 5-minute chapter revision summary titled "Vidya" for students.
Students will use this as their core chapter revision and audio narration text.

Below is the complete textbook chapter text and diagram explanations extracted from the PDF:
---
${extractedDetails.slice(0, 150000)}
---

CRITICAL REQUIREMENTS:

1. TITLE FORMAT:
   - The very first line of your response MUST be in this exact format:
     # [x]
   - Replace [x] with the definitive, specific chapter title based on the material (e.g., "# Acids, Bases and Salts", "# Chemical Reactions and Equations", "# Motion and Measurement of Distances").
   - Absolutely NO text, greetings, pleasantries, or preamble before this line.

2. 5-MINUTE TARGET LENGTH (650 - 750 WORDS):
   - The total summary MUST be calibrated to be completely read or listened to in approximately 5 minutes (strictly ~650 to 750 words total; do NOT exceed 800 words).
   - PRESERVE ALL KEY CONCEPTS: Cover every essential curriculum point, key mechanism, scientific law, formula, and definition. Do NOT drop important academic facts.
   - Achieve this 5-minute length through high-yield density and crisp synthesis: avoid long-winded narrative padding, repetitive phrasing, and conversational fluff. Every sentence must deliver clear, actionable knowledge.
   - Strictly NO generic study tips, revision tricks, or study advice (no "make flashcards", "review notes", "test yourself"). Focus 100% on the academic subject matter.

3. REQUIRED STRUCTURED SECTIONS:
   Structure your 5-minute summary with these exact headings:

   ## Chapter Overview
   A concise, 1-paragraph synthesis (approx. 60-80 words) explaining the core theme of this chapter, its foundational principles, and why it matters in science.

   ## Core Concept Breakdown
   Go through every key topic and sub-topic concisely (approx. 300-350 words):
   - State each core concept with its essential scientific mechanism or principle.
   - Include key observations, cause-and-effect relationships, and practical real-world examples.
   - Use direct, packed sentences so no essential topic is missed while remaining tight and fast to read.

   ## Key Diagrams & Visual Insights
   For each key diagram, apparatus setup, chart, or figure in the chapter (approx. 80-100 words):
   - State the diagram topic.
   - State what the visual illustrates and the scientific principle it proves in 1-2 sharp sentences.

   ## Laws, Equations & Core Definitions
   Provide a bulleted list of essential formulas, scientific laws, and key definitions (approx. 120-150 words):
   - State each law or formula in plain keyboard text (e.g., Force = Mass * Acceleration; NO LaTeX dollar signs).
   - Provide clear, 1-line definitions of key technical vocabulary.

   ## Summary Takeaways
   A bulleted list of 3-5 high-impact takeaway conclusions that summarize the chapter's most critical facts for exam mastery (approx. 50-70 words).

4. FORMATTING RULES:
   - Clean, well-structured markdown.
   - Standard keyboard characters only (NO LaTeX math signs like "$" or "$$").
   - NO emojis.
   - NO questions, quizzes, or Q&A sections.
   - NO conversational greetings or remarks.`;

    let summary = '';

    // Primary: Gemini 3.5 Flash-Lite as the Summariser
    try {
      console.log(`[Vidya Step 2] Generating 5-minute chapter summary with Gemini 3.5 Flash-Lite...`);
      const lite35Promise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [summarizerPrompt],
        config: {
          maxOutputTokens: 2048,
        },
      });
      const lite35Response = await callWithTimeout(lite35Promise, 45000, 'Gemini 3.5 Flash-Lite Summariser');
      if (lite35Response.text && lite35Response.text.trim().length > 80) {
        summary = sanitizeVidya(lite35Response.text, fileName || 'Chapter Summary');
        console.log(`[Vidya Step 2] Gemini 3.5 Flash-Lite summarization successful (${summary.length} characters)!`);
      }
    } catch (lite35Err: any) {
      console.warn('[Vidya Step 2] Gemini 3.5 Flash-Lite notice:', lite35Err?.message || lite35Err);
      // Fallback: Gemini 3.1 Flash-Lite
      try {
        console.log(`[Vidya Step 2 Fallback] Summarizing with Gemini 3.1 Flash-Lite...`);
        const litePromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [summarizerPrompt],
          config: {
            maxOutputTokens: 2048,
          },
        });
        const liteResponse = await callWithTimeout(litePromise, 40000, 'Gemini 3.1 Flash-Lite Summariser');
        if (liteResponse.text && liteResponse.text.trim().length > 80) {
          summary = sanitizeVidya(liteResponse.text, fileName || 'Chapter Summary');
          console.log(`[Vidya Step 2 Fallback] Gemini 3.1 Flash-Lite summarization successful (${summary.length} characters)!`);
        }
      } catch (liteErr: any) {
        console.error('[Vidya Step 2 Fallback] Gemini 3.1 Flash-Lite notice:', liteErr?.message || liteErr);
      }
    }

    if (!summary || summary.trim().length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate chapter summary from the extracted content. Please try again.',
      });
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

// Helper to chunk text into sections of roughly 3,000 to 4,000 words for TTS
function chunkTextByWords(text: string, targetChunkWords = 3200): string[] {
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  // If the total text is within a single chunk size (<= 3,800 words), keep as 1 chunk
  if (totalWords <= 3800) {
    return [text.trim()];
  }

  // Split by markdown headings or double-newline paragraph breaks
  const sections = text.split(/\n(?=##+ )|\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWords = 0;

  for (const sec of sections) {
    const trimmed = sec.trim();
    if (!trimmed) continue;
    const wordsInSec = trimmed.split(/\s+/).filter(Boolean).length;

    if (currentWords + wordsInSec > 3800 && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [trimmed];
      currentWords = wordsInSec;
    } else {
      currentChunk.push(trimmed);
      currentWords += wordsInSec;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  // Fallback safety: If any single chunk exceeds 4,000 words, split at sentence boundaries
  const finalChunks: string[] = [];
  for (const c of chunks) {
    const wCount = c.split(/\s+/).filter(Boolean).length;
    if (wCount > 4000) {
      const sentences = c.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [c];
      let subChunk: string[] = [];
      let subWords = 0;
      for (const sent of sentences) {
        const sw = sent.split(/\s+/).filter(Boolean).length;
        if (subWords + sw > 3500 && subChunk.length > 0) {
          finalChunks.push(subChunk.join(''));
          subChunk = [sent];
          subWords = sw;
        } else {
          subChunk.push(sent);
          subWords += sw;
        }
      }
      if (subChunk.length > 0) {
        finalChunks.push(subChunk.join(''));
      }
    } else {
      finalChunks.push(c);
    }
  }

  return finalChunks.filter(c => c.trim().length > 0);
}

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
// Shravan TTS: Natural Indian Guru Voice Engine
// 4-Model Fallback Chain:
//   1. Primary:        gemini-3.8-flash-tts
//   2. First Fallback: gemini-3.8-flash-lite-tts
//   3. Second Fallback: gemini-3.1-flash-tts-preview
//   4. Third Fallback:  gemini-2.5-flash-preview-tts
// ============================================================================

const GURU_SPEECH_DIRECTION = `Speak in authentic, contemporary Indian English with a strong, distinctive Indian accent as a warm, knowledgeable Indian teacher explaining a school textbook chapter to a student. Sound friendly, confident, patient, and genuinely interested in the subject. Use clear, rich Indian English intonation and rhythm.

Deliver the explanation with a moderate, conversational pace and natural variations in pitch, rhythm, and emphasis. Give important facts and key concepts a little extra emphasis so they stand out and are easier to remember. Use natural pauses between ideas and slightly more energy when introducing an interesting discovery, example, or surprising fact.

Maintain a steady, engaging presence throughout the lesson. Be expressive enough to prevent the narration from sounding flat, but restrained enough that it remains comfortable to listen to for several minutes.

Avoid robotic rhythm, monotonous pitch, excessively uniform sentence endings, and mechanical textbook-reading delivery. Also avoid theatrical acting, booming declarations, exaggerated excitement, forced cheerfulness, dramatic suspense, artificial gravitas, and movie-trailer narration.

Do not sound like a newsreader, advertisement, meditation narrator, or fictional fantasy guru. Sound like a real, friendly Indian teacher who understands the subject and enjoys helping students learn.

Pronounce all Indian names, Sanskrit terminology, and unfamiliar textbook vocabulary with accurate and strong Indian English pronunciation.`;

const TTS_FALLBACK_MODELS = [
  'gemini-3.8-flash-tts',          // 1. Primary: Gemini 3.8 Flash TTS
  'gemini-3.8-flash-lite-tts',     // 2. First fallback: Gemini 3.8 Flash-Lite TTS
  'gemini-3.1-flash-tts-preview',  // 3. Second fallback: Gemini 3.1 Flash TTS Preview
  'gemini-2.5-flash-preview-tts',  // 4. Third fallback: Gemini 2.5 Flash Preview TTS
] as const;

// Disk caching configuration (.cache/tts)
const TTS_CACHE_DIR = path.join(process.cwd(), '.cache', 'tts');
if (!fs.existsSync(TTS_CACHE_DIR)) {
  fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}

function getTtsCacheKey(text: string, voice: string): string {
  return crypto
    .createHash('sha256')
    .update(`${text.trim()}|${voice}|v1-indian-guru`)
    .digest('hex');
}

// In-memory model status and rate-limit tracking
interface ModelTrackerStatus {
  cooldownUntil: number;
  lastError?: string;
  quotaExhausted: boolean;
  totalCalls: number;
  totalFailures: number;
}
const modelTracker = new Map<string, ModelTrackerStatus>();

async function synthesizeGuruSpeech(
  cleanText: string,
  requestedVoice: string = 'Puck'
): Promise<{
  audioBuffer: Buffer;
  modelUsed: string;
  fromCache: boolean;
  voiceUsed: string;
}> {
  // Voice selection: valid male voices are Puck (default), Charon, Fenrir
  const validVoices = ['Puck', 'Charon', 'Fenrir'];
  const voice = validVoices.includes(requestedVoice) ? requestedVoice : 'Puck';

  // 1. Check disk cache first
  const cacheKey = getTtsCacheKey(cleanText, voice);
  const cacheFilePath = path.join(TTS_CACHE_DIR, `${cacheKey}.wav`);
  const cacheMetaPath = path.join(TTS_CACHE_DIR, `${cacheKey}.json`);

  if (fs.existsSync(cacheFilePath)) {
    try {
      const cachedBuffer = fs.readFileSync(cacheFilePath);
      if (cachedBuffer.length > 100) {
        console.log(`[Shravan TTS] Cache HIT for key ${cacheKey.slice(0, 8)} (${cachedBuffer.length} bytes, voice: ${voice})`);
        let meta: any = {};
        if (fs.existsSync(cacheMetaPath)) {
          meta = JSON.parse(fs.readFileSync(cacheMetaPath, 'utf8'));
        }
        return {
          audioBuffer: cachedBuffer,
          modelUsed: meta.model || 'cached',
          fromCache: true,
          voiceUsed: voice,
        };
      }
    } catch (cacheReadErr) {
      console.warn('[Shravan TTS] Error reading cache file:', cacheReadErr);
    }
  }

  // 2. Iterate through 4-model fallback chain in exact order
  const errors: { model: string; error: string }[] = [];
  const now = Date.now();
  const dbExceededModels = await getServerExceededModels();

  for (let i = 0; i < TTS_FALLBACK_MODELS.length; i++) {
    const model = TTS_FALLBACK_MODELS[i];

    if (dbExceededModels.includes(model)) {
      console.warn(`[Shravan TTS] Skipping ${model} (exceeded quota for today per Firestore database)`);
      errors.push({ model, error: 'Exceeded quota for today in Firestore' });
      continue;
    }

    const status = modelTracker.get(model) || {
      cooldownUntil: 0,
      quotaExhausted: false,
      totalCalls: 0,
      totalFailures: 0,
    };

    // If model is in cooldown due to recent 429/quota exhaustion, check if cooldown expired
    if (status.cooldownUntil > now) {
      const remainingSec = Math.ceil((status.cooldownUntil - now) / 1000);
      console.warn(`[Shravan TTS] Skipping ${model} (in cooldown for another ${remainingSec}s due to quota)`);
      errors.push({ model, error: `In cooldown (${remainingSec}s remaining): ${status.lastError}` });
      continue;
    }

    console.log(`[Shravan TTS] Attempting synthesis with fallback level ${i + 1}/${TTS_FALLBACK_MODELS.length}: ${model} (Voice: ${voice})...`);
    status.totalCalls++;

    try {
      const ttsPromise = ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
              },
            ],
          },
        ] as any,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      // 45 second timeout per call
      const ttsResponse = await callWithTimeout(ttsPromise, 45000, `${model} TTS`);
      const rawBase64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';

      if (!rawBase64Audio) {
        throw new Error(`Model ${model} returned empty audio data.`);
      }

      const audioBuffer = Buffer.from(rawBase64Audio, 'base64');
      console.log(`[Shravan TTS] Successfully generated audio with ${model} (${audioBuffer.length} bytes, voice: ${voice})`);

      // Reset failure state on success
      status.quotaExhausted = false;
      modelTracker.set(model, status);

      // Save to disk cache for repeat plays and other students
      try {
        fs.writeFileSync(cacheFilePath, audioBuffer);
        fs.writeFileSync(
          cacheMetaPath,
          JSON.stringify(
            {
              model,
              voice,
              createdAt: new Date().toISOString(),
              textLength: cleanText.length,
              audioBytes: audioBuffer.length,
            },
            null,
            2
          )
        );
        console.log(`[Shravan TTS] Saved audio to cache (.cache/tts/${cacheKey.slice(0, 8)}.wav)`);
      } catch (cacheWriteErr) {
        console.warn('[Shravan TTS] Notice writing to cache:', cacheWriteErr);
      }

      return {
        audioBuffer,
        modelUsed: model,
        fromCache: false,
        voiceUsed: voice,
      };
    } catch (err: any) {
      status.totalFailures++;
      const errMsg = err?.message || String(err);
      console.warn(`[Shravan TTS Fallback Notice] Model ${model} failed: ${errMsg}`);

      const isQuota =
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('Quota exceeded');

      if (isQuota) {
        status.quotaExhausted = true;
        // 60-second cooldown on quota exhaustion
        status.cooldownUntil = Date.now() + 60000;
        status.lastError = 'Rate limit / quota exhausted';
        await recordServerExceededModel(model);
        console.warn(`[Shravan TTS Quota] Model ${model} marked in cooldown for 60 seconds and recorded in Firestore.`);
      } else {
        status.lastError = errMsg;
      }
      modelTracker.set(model, status);

      errors.push({ model, error: errMsg });

      // Fast fail on unrecoverable authentication errors
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401') || errMsg.includes('PERMISSION_DENIED')) {
        throw new Error(`Authentication error on Gemini API: ${errMsg}. Please verify your API key.`);
      }

      // Continue to next model in the four-model chain
    }
  }

  // All 4 models failed
  const errorDetails = errors.map((e) => `[${e.model}: ${e.error}]`).join('; ');
  throw new Error(`All 4 TTS fallback models failed. Details: ${errorDetails}. Please try again later.`);
}

// Health probe endpoint for TTS and API status
app.get(['/api/health', '/api/tts/health'], (req, res) => {
  return res.json({
    status: 'ok',
    service: 'GyanQuest Indian Guru TTS Engine',
    models: TTS_FALLBACK_MODELS,
    defaultVoice: 'Puck (Natural Indian Guru)',
  });
});

// Status endpoint to check fallback chain health and cache stats
app.get('/api/tts/status', (req, res) => {
  const modelStats: Record<string, any> = {};
  for (const m of TTS_FALLBACK_MODELS) {
    modelStats[m] = modelTracker.get(m) || {
      cooldownUntil: 0,
      quotaExhausted: false,
      totalCalls: 0,
      totalFailures: 0,
    };
  }

  let cachedFilesCount = 0;
  try {
    cachedFilesCount = fs.readdirSync(TTS_CACHE_DIR).filter(f => f.endsWith('.wav')).length;
  } catch (_) {}

  return res.json({
    status: 'ok',
    primaryModel: TTS_FALLBACK_MODELS[0],
    fallbackChain: TTS_FALLBACK_MODELS,
    defaultVoice: 'Puck',
    alternativeVoice: 'Charon',
    cachedAudioItems: cachedFilesCount,
    models: modelStats,
  });
});

// Shravan Indian Guru TTS Endpoint
// Accepts POST { text, voice } and returns audio/wav directly or JSON
app.post(['/api/tts', '/api/generate-audio'], async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No text provided for audio narration.' });
    }

    let cleanText = text.replace(/[*_#>`~]/g, '').trim();
    // Strip any accidental instruction or prompt preamble
    cleanText = cleanText.replace(/^(Speak in|Please narrate|Instructions:|Prompt:|System:)[^\n]*(\n+|$)/gi, '').trim();
    const result = await synthesizeGuruSpeech(cleanText, voice);

    // If client expects binary blob (like ShravanPage's response.blob())
    const acceptHeader = req.headers.accept || '';
    if (req.path === '/api/tts' || acceptHeader.includes('audio/')) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', result.audioBuffer.length);
      res.setHeader('X-TTS-Model', result.modelUsed);
      res.setHeader('X-TTS-Voice', result.voiceUsed);
      res.setHeader('X-TTS-Cached', result.fromCache ? 'true' : 'false');
      return res.send(result.audioBuffer);
    }

    // Default JSON response
    return res.json({
      success: true,
      model: result.modelUsed,
      voice: result.voiceUsed,
      fromCache: result.fromCache,
      audioBase64: result.audioBuffer.toString('base64'),
    });
  } catch (error: any) {
    console.error('[Shravan TTS Error]:', error);
    const userMsg = error?.message || 'Failed to synthesize speech audio with Indian Guru voice.';
    return res.status(500).json({
      success: false,
      error: userMsg,
    });
  }
});

// Helper to strip any markdown symbols from Guru's reply to ensure pure plain text
function cleanPlainTextGuruReply(raw: string): string {
  let cleaned = raw;
  // Strip bold/italics markers (***text***, **text**, *text*, ___text___, __text__, _text_)
  cleaned = cleaned.replace(/(\*{1,3}|_{1,3})([^*_\n]+)\1/g, '$2');
  // Strip inline code backticks `code` -> code
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/`/g, '');
  // Strip heading markers (#, ##, ###, etc.) at line start
  cleaned = cleaned.replace(/^[ \t]*#+[ \t]*/gm, '');
  // Strip bullet markers (-, *, +) at line start and replace with clean plain bullet or dash
  cleaned = cleaned.replace(/^[ \t]*[\*\+\-][ \t]+/gm, '• ');
  // Strip blockquotes
  cleaned = cleaned.replace(/^[ \t]*>[ \t]*/gm, '');
  // Strip LaTeX dollar signs
  cleaned = cleaned.replace(/\$\$([^$]+)\$\$/g, '$1');
  cleaned = cleaned.replace(/\$([A-Za-z0-9_+\-*\/=^()\\ ]+)\$/g, '$1');
  // Remove remaining stray asterisks, underscores, or tildes
  cleaned = cleaned.replace(/[*_~]/g, '');
  // Normalize whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  return cleaned.trim();
}

// =========================================================================
// GURU AI CHATBOT ENDPOINT (Gemini Flash-Lite 3.5 with 3.1 Fallback)
// =========================================================================
app.post('/api/guru-chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const systemInstruction = `You are Guru, a revered, warm, wise, scholarly, and encouraging educational mentor, guide, and acharya on Gyan Quest.
Your sacred purpose is to help the student achieve deep intellectual clarity, master academic concepts, and explore the vast wealth of knowledge.

KNOWLEDGE DOMAINS & EXPERTISE:
1. ACADEMIC & SCIENTIFIC MASTERY:
   You possess comprehensive mastery over school and college curricula, mathematics, sciences (physics, chemistry, biology), humanities, history, and literature. You explain complex concepts with intuitive analogies, first principles, and clarity.
2. INDIAN CULTURE, TRADITIONS & PHILOSOPHY:
   You have profound, scholarly knowledge of Indian culture, traditions, festivals, customs, heritage, ethics, and philosophical systems (such as Vedanta, Samkhya, Nyaya, Vaisheshika, Mimamsa, and Yoga).
3. HINDU MYTHOLOGY & SACRED TEXTS:
   You possess exhaustive knowledge of Hindu mythology, Itihasas (Ramayana, Mahabharata, Bhagavad Gita), Vedas, Upanishads, Puranas, folklore, epics, deities (Shiva, Vishnu, Devi, Ganesha, Hanuman, Krishna, Rama, etc.), avatars, rishis, symbols, allegories, and core concepts (Dharma, Karma, Samsara, Moksha, Bhakti, Jnana, Ahimsa).
4. SANSKRIT EXPLANATIONS & ETYMOLOGY:
   You are an adept scholar of the Sanskrit language. You can translate, explain grammatical structures, break down root words (dhatus), explain sandhi and samasa, decipher shlokas, suktas, subhashitas, and mantras, and reveal their layered etymological and philosophical meanings clearly.

SAFEGUARDS & CORE BEHAVIOR RULES:
1. SAFEGUARD NON-HINDRANCE FOR INDIAN CULTURE, TRADITIONS, MYTHOLOGY & SANSKRIT:
   - Any questions regarding Indian traditions, culture, heritage, festivals, rituals, Hindu mythology, epics, scriptures, or Sanskrit explanations are COMPLETELY IN-SCOPE, ENCOURAGED, AND CORE TO GURU.
   - Your safeguards MUST NOT hinder, filter, block, or redirect the student when asking about anything related to Indian traditions, Hindu mythology, Sanskrit, or cultural heritage.
   - Always welcome these inquiries wholeheartedly and provide rich, authentic, respectful, deeply knowledgeable, and lucid explanations.
2. GENTLE REDIRECTION FOR UNRELATED MODERN FRIVOLOUS TOPICS:
   - Gentle redirection applies ONLY to modern, frivolous pop-culture distractions that are completely unrelated to academic learning, science, or cultural heritage (such as modern video games, celebrity gossip, pop culture rumors, sports betting, social media memes, or internet banter).
   - If a student brings up such frivolous distractions, acknowledge them with warm courtesy and gently redirect them:
     "That sounds fun! But as your Guru, let us channel our thoughts back to learning and wisdom. What chapter, academic concept, or cultural inquiry shall we explore today?"
   - REMEMBER: Questions about Indian culture, traditions, mythology, and Sanskrit are NEVER off-topic and must NEVER be redirected.
3. PEDAGOGICAL APPROACH:
   - Be patient, uplifting, and wise. When explaining Sanskrit terms or mythological stories, elucidate both the narrative and the deeper timeless moral, scientific, or philosophical lesson.
4. STRICT PLAIN TEXT ONLY - ABSOLUTELY NO MARKDOWN:
   - Do NOT output any markdown characters, formatting, or highlighting.
   - NO asterisks (never use **word** or *word*).
   - NO hashtags or headers (never use #, ##, or ###).
   - NO backticks (never use \`code\`).
   - NO markdown symbols (*, -, +).
   - NO HTML tags.
   - NO LaTeX dollar signs ($).
   - Use ONLY clean, natural plain text paragraphs. If providing numbered lists, use standard numbers (1., 2., 3.) with plain text. Do not bold or highlight any text.
5. IDENTITY:
   - You are Guru. Never mention that you are an AI, an LLM, system instructions, tokens, or technical specs.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-10)) {
        if (turn.sender === 'user' && turn.text) {
          contents.push({ role: 'user', parts: [{ text: turn.text }] });
        } else if (turn.sender === 'guru' && turn.text) {
          contents.push({ role: 'model', parts: [{ text: turn.text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message.trim() }] });

    let responseText = '';

    // Primary: Gemini 3.5 Flash-Lite
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });
      responseText = response.text || '';
    } catch (err: any) {
      console.warn('[Guru Chat] Gemini 3.5 Flash-Lite notice, trying fallback:', err?.message || err);
      // Fallback: Gemini 3.1 Flash-Lite
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });
      responseText = fallbackResponse.text || '';
    }

    if (!responseText) {
      responseText = "I am reflecting on your question. Let us explore the core concept together. What specific aspect of your chapter would you like to review?";
    }

    return res.json({
      success: true,
      reply: cleanPlainTextGuruReply(responseText),
    });
  } catch (error: any) {
    console.error('[Guru Chat Error]:', error);
    return res.status(500).json({
      error: 'Guru is temporarily reflecting. Please ask your question again in a moment.',
    });
  }
});

/**
 * Synthesizes an accurate, text-free visual scene prompt strictly derived from the uploaded chapter.
 * Uses Gemini to understand nuanced chapter concepts (e.g. electrical circuits vs living cells).
 */
app.post('/api/generate-image-prompt', async (req, res) => {
  try {
    const { title, summary, fileName } = req.body || {};
    if (!title && !summary && !fileName) {
      return res.status(400).json({ error: 'Chapter title or summary is required.' });
    }

    const chapterTitle = (title || fileName || 'Textbook Chapter').trim();
    const chapterSnippet = (summary || '').slice(0, 3500).trim();

    const promptInstruction = `You are an expert prompt engineer for educational visual illustrations.
A student uploaded a textbook chapter for an interactive learning puzzle.

CHAPTER DETAILS:
Title: "${chapterTitle}"
Key Summary / Concepts:
"${chapterSnippet || 'Core concepts of ' + chapterTitle}"

MISSION:
Write a single, highly specific, vivid visual prompt for an image generator (Krea 2 Turbo).

CRITICAL REQUIREMENTS:
1. STRICT SUBJECT ACCURACY:
   - The scene must depict ONLY the genuine subject matter and concepts of this chapter.
   - Disambiguate overloaded terms: For example, if the chapter is about Electricity or Circuits, depict an electric circuit with a glowing incandescent light bulb, copper wires, a battery/dry cell, a knife switch, and meters on a physics laboratory bench. NEVER depict living biological cells (no mitochondria, amoebas, or cell membranes).
   - If the chapter is about Ancient Gurukulas or Vedic Education, depict a peaceful ancient Indian Gurukul hermitage with guru and students in a serene forest under a banyan tree by a river.
   - If the chapter is about Biology / Living Cells, depict cellular organelles and biological structures.
   - If the chapter is about Chemistry, depict chemistry glassware, beakers with colorful reaction fluids, and crystals.
   - If the chapter is about Astronomy, depict planets, stars, and celestial bodies.
   - If the chapter is about History, depict authentic classical architecture and scenery of that specific era.
2. COMPLETELY TEXT-FREE:
   - The scene must contain ZERO text, no words, no letters, no numbers, no labels, no equations, no diagrams with writing, no typography, and no watermarks.
3. VISUAL STYLE:
   - Colorful, atmospheric digital art or realistic educational painting, clear illumination, rich storytelling.

Output format: Return ONLY a valid JSON object:
{
  "prompt": "A vivid educational illustration depicting [highly detailed scene strictly matching the chapter concepts]... Completely text-free, strictly no text, no words, no letters, no labels, no watermarks."
}`;

    let generatedPrompt = '';
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptInstruction,
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1024,
            temperature: 0.4,
          },
        }),
        12000,
        'Gemini 3.5 Flash-Lite Prompt Synthesis'
      );
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.prompt && typeof parsed.prompt === 'string') {
        generatedPrompt = parsed.prompt.trim();
      }
    } catch (err: any) {
      console.warn('[Gemini 3.5 Prompt Synthesis notice]:', err?.message || err);
      // Fallback to gemini-3.1-flash-lite
      try {
        const fallbackRes = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: promptInstruction,
            config: {
              responseMimeType: 'application/json',
              maxOutputTokens: 1024,
              temperature: 0.4,
            },
          }),
          12000,
          'Gemini 3.1 Flash-Lite Prompt Synthesis'
        );
        const parsed = JSON.parse(fallbackRes.text || '{}');
        if (parsed.prompt && typeof parsed.prompt === 'string') {
          generatedPrompt = parsed.prompt.trim();
        }
      } catch (fbErr: any) {
        console.warn('[Gemini 3.1 Prompt Synthesis notice]:', fbErr?.message || fbErr);
      }
    }

    if (!generatedPrompt) {
      return res.status(502).json({ error: 'Failed to synthesize prompt from AI model.' });
    }

    return res.json({ success: true, prompt: generatedPrompt });
  } catch (error: any) {
    console.error('[Generate Image Prompt Error]:', error);
    return res.status(500).json({ error: error?.message || 'Server error generating prompt.' });
  }
});

// Sample Crosswords endpoint identical to gyanquest-crossword.ai.studio
const DEFAULT_SAMPLE_CROSSWORDS = [
  {
    id: 'gita-6-17',
    title: 'Bhagavad Gita: Dhyana Yoga (Verse 6.17)',
    theme: 'Timeless wisdom on prioritization, balanced habits, eating, sleeping, and mindful work.',
    summary: 'Exploration of Bhagavad Gita Chapter 6 Verse 6.17 emphasizing how regulated habits in eating, sleeping, recreation, and work eliminate stress and bring success.',
    gridSize: 12,
    words: [
      { id: '1_down', number: 1, direction: 'down', answer: 'AHARA', clue: 'Diet and food consumption habits', row: 0, col: 7 },
      { id: '2_across', number: 2, direction: 'across', answer: 'FOCUS', clue: 'Mental concentration without distractions', row: 1, col: 0 },
      { id: '3_down', number: 3, direction: 'down', answer: 'SLEEP', clue: 'Rest and circadian rhythm required for cognitive clarity', row: 1, col: 4 },
      { id: '4_across', number: 4, direction: 'across', answer: 'HABIT', clue: 'Behavior formed by repeating tasks consistently for 21 days', row: 1, col: 7 },
      { id: '5_across', number: 5, direction: 'across', answer: 'ENERGY', clue: 'Vital fuel produced in the body through healthy routine', row: 3, col: 4 },
      { id: '6_down', number: 6, direction: 'down', answer: 'YUKTA', clue: 'Regulated, balanced, and disciplined in habits', row: 3, col: 9 },
      { id: '7_down', number: 7, direction: 'down', answer: 'WORK', clue: 'Discharging duties and studies with full devotion and focus', row: 6, col: 7 },
      { id: '8_across', number: 8, direction: 'across', answer: 'YOGA', clue: 'Spiritual practice and disciplined union of mind and action', row: 7, col: 6 },
    ],
    glossary: [
      { term: 'Yukta', definition: 'Regulated and balanced in habits of eating, sleeping, and work.' },
      { term: 'Ahara', definition: 'Nutritious diet that fuels the body like clean fuel for a machine.' },
      { term: 'Yoga', definition: 'Unified practice of discipline that diminishes pain and mental clutter.' },
      { term: 'Habit', definition: 'Formed by repeating conscious positive routines for 21 days.' },
    ],
  },
  {
    id: 'student-success',
    title: 'Student Success & Timeless Wisdom',
    theme: 'Architecting your own success through balance, study habits, and mental rejuvenation.',
    summary: 'A guide for students to manage homework, avoid burnout through healthy breaks, and cultivate gratitude and memory.',
    gridSize: 11,
    words: [
      { id: '1_down', number: 1, direction: 'down', answer: 'BALANCE', clue: 'Equilibrium between effort, rest, and recreation', row: 0, col: 3 },
      { id: '2_across', number: 2, direction: 'across', answer: 'HEALTH', clue: 'Physical and mental vitality maintained by proper habits', row: 1, col: 1 },
      { id: '3_down', number: 3, direction: 'down', answer: 'WISDOM', clue: 'Timeless ancient knowledge guiding life decisions', row: 3, col: 5 },
      { id: '4_across', number: 4, direction: 'across', answer: 'SUCCESS', clue: 'Achievement resulting from balanced discipline and focus', row: 5, col: 0 },
      { id: '4_down', number: 4, direction: 'down', answer: 'STUDY', clue: 'Acquiring knowledge and completing academic duties', row: 5, col: 0 },
    ],
    glossary: [
      { term: 'Balance', definition: 'Maintaining equilibrium between study duties and rest.' },
      { term: 'Wisdom', definition: 'Ancient teachings applied to modern student life.' },
      { term: 'Break', definition: 'Recreational hobbies that refresh the mind and prevent burnout.' },
    ],
  },
];

app.get('/api/sample-crosswords', (_req, res) => {
  return res.json(DEFAULT_SAMPLE_CROSSWORDS);
});

app.post('/api/generate-crossword', async (req, res) => {
  const { topic, summary, pdfData, fileName, difficulty } = req.body;
  console.log(`[Crossword] Request received for topic: "${topic || ''}", file: "${fileName || ''}"`);

  // Fast Gemini generation directly based on uploaded content
  try {
    let sourceContent = (summary && typeof summary === 'string' && summary.trim().length > 0) ? (topic ? (topic + '\n\n' + summary) : summary) : (topic || fileName || 'Indian Learning & Timeless Wisdom');
    if (pdfData && typeof pdfData === 'string' && pdfData.length > 0) {
      try {
        const buf = Buffer.from(pdfData, 'base64');
        const extracted = extractAsciiFromPdfBuffer(buf);
        if (extracted.length > 50) {
          sourceContent = extracted.slice(0, 10000);
        }
      } catch (_) {}
    }

    const promptText = `You are Guru AI, a master educational crossword generator.
Create an authentic, valid intersecting crossword puzzle based on this content/topic:
"${sourceContent.slice(0, 4000)}"
Difficulty: "${difficulty || 'medium'}"

Requirements:
1. Provide between 6 and 12 words with concise educational clues based strictly on the uploaded text.
2. Every answer must be single-word English, uppercase [A-Z], strictly 3 to 12 letters without punctuation.
3. Compute valid grid coordinates (row, col) within gridSize (between 11 and 16) where intersecting words share matching letters.
4. Direction must be either "across" or "down".
5. Provide a title, theme, concise 2-sentence summary, and a key terms glossary.

Return JSON in this exact structure:
{
  "title": "string",
  "theme": "string",
  "summary": "string",
  "gridSize": 12,
  "words": [
    {
      "id": "1_across",
      "number": 1,
      "direction": "across",
      "answer": "ANSWER",
      "clue": "Clear definition clue",
      "row": 1,
      "col": 2
    }
  ],
  "glossary": [
    {
      "term": "Term",
      "definition": "Definition"
    }
  ]
}`;

    let parsedCrossword: any = null;
    try {
      const geminiRes = await callWithTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
        15000,
        'Gemini 3.5 Flash-Lite Crossword Generation'
      );
      parsedCrossword = JSON.parse(geminiRes.text || '{}');
    } catch (cwErr: any) {
      console.warn('[Crossword] Gemini 3.5 Flash-Lite notice, retrying with Gemini 3.1 Flash-Lite:', cwErr?.message || cwErr);
      try {
        const fallbackRes = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: promptText,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
          15000,
          'Gemini 3.1 Flash-Lite Crossword Generation'
        );
        parsedCrossword = JSON.parse(fallbackRes.text || '{}');
      } catch (fbErr: any) {
        console.error('[Crossword] Gemini 3.1 Flash-Lite notice:', fbErr?.message || fbErr);
      }
    }

    if (parsedCrossword && Array.isArray(parsedCrossword.words) && parsedCrossword.words.length > 0) {
      // Re-layout words using deterministic engine to eliminate any letter collisions
      const rawWords = parsedCrossword.words.map((w: any) => ({
        answer: String(w.answer || ''),
        clue: String(w.clue || 'Concept from document'),
      }));
      const cleanPuzzle = buildValidCrosswordLayout(rawWords, {
        title: parsedCrossword.title || topic || 'Chapter Crossword',
        theme: parsedCrossword.theme || 'Key Concepts',
        summary: parsedCrossword.summary || 'Interactive chapter crossword puzzle with guaranteed intersecting clues.',
        glossary: parsedCrossword.glossary || [],
      });
      if (cleanPuzzle.words.length >= 4) {
        return res.json(cleanPuzzle);
      }
      return res.json(parsedCrossword);
    }
  } catch (geminiErr: any) {
    console.error('[Crossword] Local generation failed:', geminiErr?.message);
  }

  // Fallback to sample puzzle
  return res.json(DEFAULT_SAMPLE_CROSSWORDS[0]);
});

// Endpoint for Gyan Quest Wordle / Question Deck generation based strictly on uploaded chapter
app.post('/api/generate-questions', async (req, res) => {
  const { text, title } = req.body;
  const sourceText = (text && typeof text === 'string' && text.trim().length > 0)
    ? text
    : (title || 'Ancient wisdom, philosophy, and mindful reflection');

  console.log(`[Wordle Questions] Generating questions for chapter: "${title || 'Uploaded Document'}" (${sourceText.length} chars)`);

  try {
    const prompt = `You are Guru AI, creator of the Gyan Quest Wordle reflection game.
Generate a deck of 6 to 8 educational Wordle questions based STRICTLY on this uploaded chapter/manuscript:
"${sourceText.slice(0, 5000)}"

Rules:
1. Each answer MUST be a single English word between 3 and 10 letters, uppercase [A-Z], strictly found in or directly describing the provided chapter text.
2. The question must state the letter count and ask a clear riddle or conceptual prompt. Example format: "What 5-letter term in this chapter represents...?"
3. The hint must follow this pattern: "Directly relates to [context from chapter] — begins with [FIRST_LETTER] and ends with [LAST_LETTER] ([N] letters)."
4. Lore should be a 1-sentence reflective insight based on the chapter teachings.

Return JSON in this exact structure:
{
  "questions": [
    {
      "question": "What 5-letter vital principle in this chapter represents...?",
      "answer": "PRANA",
      "hint": "Directly relates to vital energy — begins with P and ends with A (5 letters).",
      "lore": "One sentence philosophical takeaway."
    }
  ]
}`;

    let parsedQuestions: any = null;
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
        15000,
        'Gemini 3.5 Flash-Lite Wordle Question Generation'
      );
      parsedQuestions = JSON.parse(response.text || '{}');
    } catch (wErr: any) {
      console.warn('[Wordle Questions] Gemini 3.5 Flash-Lite notice, retrying with Gemini 3.1 Flash-Lite:', wErr?.message || wErr);
      try {
        const fbResponse = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
          15000,
          'Gemini 3.1 Flash-Lite Wordle Question Generation'
        );
        parsedQuestions = JSON.parse(fbResponse.text || '{}');
      } catch (fbErr: any) {
        console.warn('[Wordle Questions] Gemini 3.1 Flash-Lite notice:', fbErr?.message || fbErr);
      }
    }

    if (parsedQuestions && Array.isArray(parsedQuestions.questions) && parsedQuestions.questions.length > 0) {
      const validQuestions = parsedQuestions.questions.filter(
        (q: any) =>
          q &&
          typeof q.question === 'string' &&
          typeof q.answer === 'string' &&
          q.answer.trim().replace(/[^A-Za-z]/g, '').length >= 3 &&
          q.answer.trim().replace(/[^A-Za-z]/g, '').length <= 10
      ).map((q: any) => ({
        question: q.question,
        answer: q.answer.trim().toUpperCase().replace(/[^A-Z]/g, ''),
        hint: q.hint || `Begins with ${q.answer[0]} and ends with ${q.answer[q.answer.length - 1]} (${q.answer.length} letters).`,
        lore: q.lore || 'A foundational concept from this chapter.',
      }));

      if (validQuestions.length > 0) {
        return res.json({ questions: validQuestions });
      }
    }
  } catch (err: any) {
    console.warn('[Wordle Questions] Gemini generation failed, using fallback:', err?.message);
  }

  // Fallback term extractor from chapter text
  const words = sourceText.toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/);
  const stopwords = new Set([
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'ANY', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR',
    'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO',
    'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'THAT', 'WITH', 'HAVE', 'THIS', 'FROM',
    'THEY', 'WENT', 'WERE', 'WHAT', 'WHEN', 'SOME', 'THEM', 'THEN', 'LIKE', 'TIME', 'JUST', 'KNOW', 'TAKE',
    'INTO', 'YEAR', 'YOUR', 'GOOD', 'COULD', 'WOULD', 'THERE', 'THESE', 'OTHER', 'AFTER', 'FIRST', 'ABOUT',
    'THEIR', 'WHICH', 'WHERE', 'EVERY', 'BECAUSE', 'THROUGH', 'BEFORE', 'SHOULD', 'PEOPLE', 'LITTLE', 'WILL',
    'OVER', 'SUCH', 'EVEN', 'MOST', 'MADE', 'ALSO', 'BACK', 'WELL', 'MUCH', 'ONLY', 'VERY', 'SOME'
  ]);
  const candidates = [...new Set(words.filter(w => w.length >= 3 && w.length <= 10 && !stopwords.has(w)))];
  const templates = [
    (len: number) => `What ${len}-letter core concept highlighted in this chapter represents a foundational principle?`,
    (len: number) => `According to this chapter, which ${len}-letter keyword signifies a key insight or truth?`,
    (len: number) => `What ${len}-letter term in the passage guides the reader toward greater understanding?`,
    (len: number) => `Which ${len}-letter essential term is emphasized as central in this text?`,
  ];

  let fallbackQuestions: any[] = [];
  if (candidates.length >= 2) {
    const selected = candidates.slice(0, 6);
    fallbackQuestions = selected.map((word: string, idx: number) => {
      const len = word.length;
      return {
        question: templates[idx % templates.length](len),
        answer: word,
        hint: `Directly related to chapter — begins with '${word[0]}' and ends with '${word[len - 1]}' (${len} letters).`,
        lore: `A key concept identified within ${title || 'this chapter'}.`
      };
    });
  }

  if (fallbackQuestions.length === 0) {
    fallbackQuestions = [
      {
        question: "What 5-letter vital breath is celebrated in ancient scripture as the invisible life current?",
        answer: "PRANA",
        hint: "Directly relates to breath and vital life energy — begins with P and ends with A (5 letters).",
        lore: "In Yogic philosophy, prana animates all living beings."
      },
      {
        question: "What 6-letter universal law of cosmic duty and righteousness sustains the entire cosmos?",
        answer: "DHARMA",
        hint: "Directly relates to universal duty — begins with D and ends with A (6 letters).",
        lore: "Dharma upholds cosmic harmony and right action."
      },
      {
        question: "What 5-letter universal law of action teaches that every intention shapes destiny?",
        answer: "KARMA",
        hint: "Directly relates to action and consequence — begins with K and ends with A (5 letters).",
        lore: "Selfless action without attachment yields liberation."
      }
    ];
  }

  return res.json({ questions: fallbackQuestions });
});

// Endpoint for Pariksha 25-Question Comprehensive Examination generation
app.post('/api/generate-pariksha', async (req, res) => {
  const { fileName, chapterSummary, pdfBase64, difficulty } = req.body;
  const sourceText = (chapterSummary && typeof chapterSummary === 'string' && chapterSummary.trim().length > 0)
    ? chapterSummary
    : (fileName || 'Ancient wisdom, philosophy, and mindful reflection');

  const title = (fileName || 'Chapter').replace(/\.pdf$/i, '').replace(/^Vidya:\s*/i, '');
  console.log(`[Pariksha API] Generating 25-question exam for: "${title}" (${sourceText.length} chars)`);

  const prompt = `You are the master assessment architect for GyanQuest Pariksha (Stage 05).
Generate a comprehensive, rigorous 25-Question adaptive examination strictly based on this chapter text:
"${sourceText.slice(0, 10000)}"

Structure:
- Stage 1 (Q1 to Q5): Foundation Warmup (Key definitions, direct terms, foundational facts). 100 points each.
- Stage 2 (Q6 to Q10): Conceptual Depth (Mechanisms, principles, explanations). 150 points each.
- Stage 3 (Q11 to Q15): Analytical Arena (Cause and effect, comparing concepts, distinctions). 200 points each.
- Stage 4 (Q16 to Q20): Mastery Crucible (Challenging scenarios, counter-intuitive nuances, applications). 250 points each.
- Stage 5 (Q21 to Q25): Grand Boss Round (Capstone synthesis, multi-concept integration). 350 points each.

Rules:
1. Exactly 25 questions in the array.
2. Each question MUST have exactly 4 plausible options, with correctIndex (0, 1, 2, or 3).
3. Each question must include a helpful 1-sentence hint (for the hint lifeline) and a clear, factual explanation grounded in the text.
4. Also generate 3 high-yield summaryFlashcards ({ concept, takeaway }).
5. Topics covered: 3-5 major topic tags.

Return JSON in this exact structure:
{
  "testTitle": "${title} Pariksha",
  "sourceFileName": "${fileName || title}",
  "topicsCovered": ["Topic 1", "Topic 2", "Topic 3"],
  "questions": [
    {
      "id": "1",
      "stage": 1,
      "stageName": "Foundation Warmup",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "points": 100,
      "hint": "Clue for the student.",
      "explanation": "Detailed explanation of why Option A is correct according to the chapter.",
      "topic": "Core Definition",
      "difficulty": "easy"
    }
  ],
  "summaryFlashcards": [
    {
      "concept": "Core Principle",
      "takeaway": "Essential high-yield insight."
    }
  ]
}`;

  try {
    let parsedData: any = null;
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.25,
          },
        }),
        30000,
        'Gemini 3.5 Flash-Lite Pariksha Exam Generation'
      );
      parsedData = JSON.parse(response.text || '{}');
    } catch (gErr: any) {
      console.warn('[Pariksha API] Gemini 3.5 Flash-Lite notice, retrying with Gemini 3.1 Flash-Lite:', gErr?.message || gErr);
      try {
        const fbResponse = await callWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.25,
            },
          }),
          30000,
          'Gemini 3.1 Flash-Lite Pariksha Exam Generation'
        );
        parsedData = JSON.parse(fbResponse.text || '{}');
      } catch (fbErr: any) {
        console.warn('[Pariksha API] Gemini 3.1 Flash-Lite notice:', fbErr?.message || fbErr);
      }
    }

    if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length >= 10) {
      return res.json(parsedData);
    }
  } catch (err: any) {
    console.warn('[Pariksha API] Gemini exam generation failed, generating synthesized local exam:', err?.message);
  }

  // Synthesized fallback exam based on chapter text
  const rawLines = sourceText
    .split('\n')
    .map((l: string) => l.replace(/^[*#\-•\s]+/, '').trim())
    .filter((l: string) => l.length > 25 && l.length < 240);

  const stageNames: Record<number, string> = {
    1: 'Foundation Warmup',
    2: 'Conceptual Depth',
    3: 'Analytical Arena',
    4: 'Mastery Crucible',
    5: 'Grand Boss Round',
  };
  const stagePoints: Record<number, number> = {
    1: 100, 2: 150, 3: 200, 4: 250, 5: 350,
  };
  const stageDiff: Record<number, 'easy' | 'medium' | 'hard' | 'boss'> = {
    1: 'easy', 2: 'medium', 3: 'medium', 4: 'hard', 5: 'boss',
  };

  const questions: any[] = [];
  for (let i = 0; i < 25; i++) {
    const stage = Math.min(5, Math.floor(i / 5) + 1);
    const fact = rawLines[i % (rawLines.length || 1)] || `${title} provides verified foundational concepts and guidelines.`;

    const qText = stage === 1
      ? `According to the chapter notes on ${title}, which statement is verified?`
      : stage === 2
      ? `What conceptual mechanism is affirmed by: "${fact.slice(0, 50)}..."?`
      : stage === 3
      ? `Analyzing cause and effect in ${title}, which relationship holds true?`
      : stage === 4
      ? `In the advanced mastery crucible, which principle distinguishes this phenomenon?`
      : `[Capstone Grand Boss] Integrating all core tenets of ${title}, which conclusion is scientifically sound?`;

    questions.push({
      id: String(i + 1),
      stage,
      stageName: stageNames[stage],
      question: qText,
      options: [
        fact,
        'This parameter operates unconditionally without energy exchange',
        'The state remains unchanged and produces no observable consequence',
        'This reaction is strictly prohibited under standard conditions'
      ],
      correctIndex: 0,
      points: stagePoints[stage],
      hint: `Recall the foundational chapter notes for ${title}.`,
      explanation: `As detailed in the chapter text: "${fact}".`,
      topic: `${title} — Unit ${stage}`,
      difficulty: stageDiff[stage],
    });
  }

  return res.json({
    testTitle: `${title} Pariksha`,
    sourceFileName: fileName || title,
    createdAt: new Date().toISOString(),
    topicsCovered: [title, 'Foundational Concepts', 'Analytical Applications', 'Capstone Synthesis'],
    questions,
    summaryFlashcards: [
      { concept: `${title} Core Principle`, takeaway: rawLines[0] || 'Foundational principles.' },
      { concept: 'Key Governing Process', takeaway: rawLines[1] || 'Primary governing process.' },
      { concept: 'Theoretical Synthesis', takeaway: rawLines[2] || 'Governing relationships and formulas.' },
    ],
  });
});

// Global Express error handler to guarantee all middleware errors return JSON, never HTML
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Middleware Error]:', err?.message || err);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'This PDF file exceeds the maximum allowed upload size. Please select a chapter under 50MB.' });
  }
  return res.status(err?.status || 500).json({
    error: err?.message || 'An error occurred while processing your request.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
