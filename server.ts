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
import { SAMPLE_CROSSWORDS } from './src/lib/sampleCrosswords.ts';

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
  return [];
}

async function recordServerExceededModel(model: string) {
  console.log(`[Server Quota] Bypassed Firestore block registration for ${model}`);
}

if (process.env.VITE_FIREBASE_API_KEY && !process.env.VITE_FIREBASE_API_KEY.startsWith('AIza')) {
  process.env.VITE_FIREBASE_API_KEY = 'AIzaSyDkCU1DHUqnRjuWvCiMi3m4Q8G2uJ6ECZU';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }

  app.post('/api/extract-pdf', async (req, res) => {
    try {
      let { pdfBase64, fileName, ocrPrompt } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ success: false, error: 'Missing PDF contents' });
      }

      pdfBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
      let extractedDetails = '';

      try {
        console.log(`[OCR Engine] Running with Gemini 3.5 Flash-Lite (Main Option: 500 RPD)`);
        const ocrPromise = ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: [
            { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
            ocrPrompt || 'Extract text from this file layout cleanly.',
          ],
          config: { maxOutputTokens: 8192 },
        });

        const ocrResponse = await callWithTimeout(ocrPromise, 45000, 'Gemini 3.5 Flash-Lite OCR');
        if (ocrResponse.text) {
          extractedDetails = ocrResponse.text.trim();
        }
      } catch (ocrErr: any) {
        console.warn('[OCR Fallback] Switching to secondary model line...', ocrErr?.message);
        
        const fallbackPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
            ocrPrompt || 'Extract text.',
          ],
          config: { maxOutputTokens: 8192 },
        });
        const fallbackResponse = await callWithTimeout(fallbackPromise, 45000, 'Gemini 3.8 Flash OCR');
        extractedDetails = fallbackResponse.text?.trim() || '';
      }

      return res.json({ success: true, text: extractedDetails });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/generate-tts', async (req, res) => {
    try {
      const { textToSpeak, voiceName } = req.body;
      if (!textToSpeak) {
        return res.status(400).json({ success: false, error: 'No text strings were provided.' });
      }

      let audioBase64 = '';
      let usedModel = '';

      try {
        usedModel = 'gemini-3.8-flash-tts';
        console.log(`[TTS Tier 1] Attempting speech synthesis with ${usedModel}...`);
        
        const interaction = await ai.interactions.create({
          model: usedModel,
          input: [{ type: 'user_input', content: [{ type: 'text', text: textToSpeak }] }],
          response_format: { type: 'audio' },
          generation_config: { speech_config: [{ voice: voiceName || 'Kore' }] },
        });

        audioBase64 = interaction.output_audio?.data || (interaction as any).inlineData?.data;

      } catch (tier1Err: any) {
        console.warn(`[TTS Tier 1 Failed]: ${tier1Err?.message || tier1Err}. Falling back to Tier 2...`);

        try {
          usedModel = 'gemini-3.8-flash-lite-tts';
          console.log(`[TTS Tier 2] Attempting fallback synthesis with ${usedModel}...`);

          const interaction = await ai.interactions.create({
            model: usedModel,
            input: [{ type: 'user_input', content: [{ type: 'text', text: textToSpeak }] }],
            response_format: { type: 'audio' },
            generation_config: { speech_config: [{ voice: voiceName || 'Kore' }] },
          });

          audioBase64 = interaction.output_audio?.data || (interaction as any).inlineData?.data;

        } catch (tier2Err: any) {
          console.warn(`[TTS Tier 2 Failed]: ${tier2Err?.message || tier2Err}. Falling back to Tier 3...`);

          try {
            usedModel = 'gemini-3.1-flash-tts';
            console.log(`[TTS Tier 3] Attempting fallback synthesis with ${usedModel}...`);

            const interaction = await ai.interactions.create({
              model: usedModel,
              input: [{ type: 'user_input', content: [{ type: 'text', text: textToSpeak }] }],
              response_format: { type: 'audio' },
              generation_config: { speech_config: [{ voice: voiceName || 'Kore' }] },
            });

            audioBase64 = interaction.output_audio?.data || (interaction as any).inlineData?.data;

          } catch (tier3Err: any) {
            console.warn(`[TTS Tier 3 Failed]: ${tier3Err?.message || tier3Err}. Falling back to Tier 4...`);

            try {
              usedModel = 'gemini-2.5-flash-tts';
              console.log(`[TTS Tier 4] Attempting final fallback synthesis with ${usedModel}...`);

              const interaction = await ai.interactions.create({
                model: usedModel,
                input: [{ type: 'user_input', content: [{ type: 'text', text: textToSpeak }] }],
                response_format: { type: 'audio' },
                generation_config: { speech_config: [{ voice: voiceName || 'Kore' }] },
              });

              audioBase64 = interaction.output_audio?.data || (interaction as any).inlineData?.data;

            } catch (tier4Err: any) {
              console.error(`[TTS Tier 4 Failed]: ${tier4Err?.message || tier4Err}`);
              throw new Error('All available backend text-to-speech engine tiers failed to process the request.');
            }
          }
        }
      }

      if (!audioBase64) {
        throw new Error(`Speech layout structure failed to extract valid data bytes for target model: ${usedModel}`);
      }

      console.log(`[TTS Engine Success] Audio successfully built using model context: ${usedModel}`);
      return res.json({ success: true, audioData: audioBase64, modelUsed: usedModel });

    } catch (error: any) {
      console.error('[TTS Global Failure]:', error.message || error);
      return res.status(500).json({ success: false, error: error.message || 'Internal Sound Matrix Breakdown' });
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
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
