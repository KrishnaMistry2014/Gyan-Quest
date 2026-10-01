import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Support large PDF payloads up to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  const reqStart = Date.now();
  console.log(`[${new Date().toISOString()}] POST /api/extract-pdf received`);

  try {
    let { pdfBase64, fileName } = req.body;
    console.log(`[Extraction] Incoming file: "${fileName}", base64 length: ${pdfBase64 ? pdfBase64.length : 0}`);
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ error: 'Please upload a valid PDF document.' });
    }

    // Clean up base64 prefix if present
    pdfBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');

    if (pdfBase64.length === 0) {
      return res.status(400).json({ error: 'The uploaded file is empty. Please choose a valid PDF.' });
    }

    if (pdfBase64.length > 28 * 1024 * 1024) {
      return res.status(400).json({
        error: 'This PDF file is too large for fast extraction. Please select a chapter under 20MB.',
      });
    }

    // Step 1: Main OCR & diagram explanation using Gemini 3.1 Flash-Lite, with 3.5 flash-lite fallback
    let extractionText = '';
    const extractionPrompt = `You are an educational study assistant. Analyze this PDF textbook or chapter notes thoroughly:
1. Read and transcribe all written content, definitions, formulas, and study sections accurately.
2. Carefully examine and explain all diagrams, charts, figures, and illustrations in clear, intuitive, student-friendly language.
3. Preserve the educational context and logical structure so students can grasp the concepts clearly.`;

    // Attempt 1: Gemini 3.1 Flash-Lite (with 30s timeout)
    try {
      console.log(`[Extraction] Analyzing "${fileName || 'document'}" with Gemini 3.1 Flash-Lite...`);
      const ocrPromise = ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          extractionPrompt,
        ],
      });
      const ocrResponse = await callWithTimeout(ocrPromise, 30000, 'Gemini 3.1 Flash-Lite OCR');
      extractionText = ocrResponse.text || '';
    } catch (primaryErr: any) {
      console.warn('[Extraction] Gemini 3.1 Flash-Lite issue:', primaryErr?.message || primaryErr);
      console.log('[Extraction] Falling back to Gemini 3.5 Flash-Lite...');
      
      // Attempt 2: Gemini 3.5 Flash-Lite fallback (with 25s timeout)
      try {
        const fallbackPromise = ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
            extractionPrompt,
          ],
        });
        const fallbackResponse = await callWithTimeout(fallbackPromise, 25000, 'Gemini 3.5 Flash-Lite OCR');
        extractionText = fallbackResponse.text || '';
      } catch (secondaryErr: any) {
        console.warn('[Extraction] Gemini 3.5 Flash-Lite issue:', secondaryErr?.message || secondaryErr);
        console.log('[Extraction] Falling back to Gemini Flash Lite Latest as safety net...');
        
        // Attempt 3: gemini-flash-lite-latest as safety net (with 25s timeout)
        const tertiaryPromise = ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
            extractionPrompt,
          ],
        });
        const tertiaryResponse = await callWithTimeout(tertiaryPromise, 25000, 'Gemini Flash Lite Latest OCR');
        extractionText = tertiaryResponse.text || '';
      }
    }

    if (!extractionText || extractionText.trim().length === 0) {
      return res.status(500).json({ error: 'Unable to extract text or diagrams from the uploaded file.' });
    }

    // Step 2: Summarization using Gemma 4 26B
    const summarizationPrompt = `You are a friendly, encouraging study mentor for students.
Create a neat, beautifully structured, and clear study summary from the following extracted textbook material:

${extractionText}

Formatting Instructions:
- Provide an inspiring chapter title and brief overview.
- Break down key concepts and explanations into simple, bite-sized sections.
- Include a dedicated "Visual Insights & Diagram Notes" section if figures, diagrams, or illustrations are present.
- List "Core Definitions & Takeaways" in clear bullet points.
- End with a quick 3-question "Check Your Understanding" self-check.
- Keep the language engaging, clear, and easy for students. Avoid all technical AI/OCR jargon or model references.`;

    let summary = '';
    try {
      console.log(`[Summarization] Summarizing with Gemma 4 26B...`);
      const summaryPromise = ai.models.generateContent({
        model: 'gemma-4-26b-a4b-it',
        contents: summarizationPrompt,
      });
      const summaryResponse = await callWithTimeout(summaryPromise, 25000, 'Gemma 4 26B Summarization');
      summary = summaryResponse.text || '';
    } catch (gemmaErr: any) {
      console.warn('[Summarization] Gemma 4 26B encountered an issue:', gemmaErr?.message || gemmaErr);
      console.log('[Summarization] Falling back to Gemini 3.5 Flash-Lite for summarization...');
      try {
        const fallbackSummaryPromise = ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: summarizationPrompt,
        });
        const fallbackSummary = await callWithTimeout(fallbackSummaryPromise, 20000, 'Gemini 3.5 Flash-Lite Summarization');
        summary = fallbackSummary.text || '';
      } catch (geminiSummaryErr) {
        console.warn('[Summarization] Fallback summarization issue, using direct extraction:', geminiSummaryErr);
        summary = extractionText;
      }
    }

    if (!summary) {
      summary = extractionText;
    }

    console.log(`[Extraction] Completed in ${(Date.now() - reqStart) / 1000}s`);

    return res.json({
      success: true,
      summary,
      fileName: fileName || 'Chapter Notes',
    });
  } catch (error: any) {
    console.error('PDF extraction processing error:', error);
    return res.status(500).json({
      error: 'We could not process this document. Please ensure it is a valid PDF and try again.',
    });
  }
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
