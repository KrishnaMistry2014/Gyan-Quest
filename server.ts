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

// Support large PDF payloads up to 100MB
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
    // STEP 1: Text Extractor (OCR) & Diagram Explainer (Gemini Flash-Lite 3.1 / 3.5)
    // =========================================================================
    let extractedDetails = '';

    if (pdfBase64 && pdfBase64.length > 0) {
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

      // Try gemini-3.1-flash-lite for OCR and diagram analysis
      try {
        console.log(`[Vidya Step 1] Extracting text & diagram meanings with Gemini 3.1 Flash-Lite...`);
        const ocrPromise = ai.models.generateContent({
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
        const ocrResponse = await callWithTimeout(ocrPromise, 45000, 'Gemini 3.1 Flash-Lite OCR');
        if (ocrResponse.text && ocrResponse.text.trim().length > 40) {
          extractedDetails = ocrResponse.text.trim();
          console.log(`[Vidya Step 1] OCR extraction successful (${extractedDetails.length} characters)`);
        }
      } catch (ocrErr: any) {
        console.warn('[Vidya Step 1] Gemini 3.1 Flash-Lite OCR notice:', ocrErr?.message || ocrErr);
        // Fallback to Gemini 3.5 Flash-Lite for OCR
        try {
          console.log(`[Vidya Step 1] Retrying OCR with Gemini 3.5 Flash-Lite...`);
          const ocr35Promise = ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
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
          const ocr35Response = await callWithTimeout(ocr35Promise, 45000, 'Gemini 3.5 Flash-Lite OCR');
          if (ocr35Response.text && ocr35Response.text.trim().length > 40) {
            extractedDetails = ocr35Response.text.trim();
            console.log(`[Vidya Step 1] Gemini 3.5 Flash-Lite OCR successful (${extractedDetails.length} characters)`);
          }
        } catch (ocr35Err: any) {
          console.warn('[Vidya Step 1] Gemini 3.5 Flash-Lite OCR notice:', ocr35Err?.message || ocr35Err);
        }
      }
    }

    // If multimodal OCR was unavailable or failed, merge buffer ASCII extraction with client extractedText
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
      if (extractedText && typeof extractedText === 'string' && extractedText.trim().length > (extractedDetails.length || 0)) {
        extractedDetails = extractedText.trim();
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
        model: 'gemini-3.5-flash-lite',
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

// Shravan Audio Generation Endpoint strictly using Gemini 3.1 Flash TTS ONLY
// Chunks text into 3,000-4,000 word sections, applies 65s timeout per chunk, and stitches resulting WAVs
app.post('/api/generate-audio', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No text provided for audio generation.' });
    }

    const totalWordCount = text.split(/\s+/).filter(Boolean).length;
    const chunks = chunkTextByWords(text);
    console.log(`[Shravan TTS] Starting audio generation strictly with Gemini 3.1 Flash TTS (gemini-3.1-flash-tts-preview)... total words: ${totalWordCount}, chunks: ${chunks.length}`);

    const pcmBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const chunkWordCount = chunkText.split(/\s+/).filter(Boolean).length;
      console.log(`[Shravan TTS] Synthesizing chunk ${i + 1}/${chunks.length} (~${chunkWordCount} words) with Gemini 3.1 Flash TTS (65s timeout)...`);

      // Strictly Gemini 3.1 Flash TTS ONLY with an Indian accent Female ~30 Years old voice
      const ttsPromise = ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an Indian female educator, approximately 30 years old, speaking with a warm, natural, and clear Indian accent at an educational pace. Please narrate the following chapter summary clearly and engagingly for students:\n\n${chunkText}`,
                speechMetadata: {
                  style: 'Indian accent female ~30 years old, warm, clear, educational pace',
                },
              },
            ],
          } as any,
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      // Strict 65s timeout per chunk
      const ttsResponse = await callWithTimeout(ttsPromise, 65000, `Gemini 3.1 Flash TTS (chunk ${i + 1} of ${chunks.length})`);
      const rawBase64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!rawBase64Audio) {
        throw new Error(`Gemini 3.1 Flash TTS did not return audio data for chunk ${i + 1} of ${chunks.length}.`);
      }

      const rawChunkBuffer = Buffer.from(rawBase64Audio, 'base64');
      // If the model chunk already has a 44-byte WAV header, strip it to extract pure PCM before stitching
      const pcmChunk = (rawChunkBuffer.length >= 44 && rawChunkBuffer.toString('ascii', 0, 4) === 'RIFF')
        ? rawChunkBuffer.subarray(44)
        : rawChunkBuffer;

      pcmBuffers.push(pcmChunk);
      console.log(`[Shravan TTS] Chunk ${i + 1}/${chunks.length} completed successfully (${pcmChunk.length} bytes PCM).`);
    }

    // Stitch all PCM chunks together seamlessly
    const completePcm = Buffer.concat(pcmBuffers);
    // Wrap the stitched audio track into a standard, universally playable WAV file
    const stitchedWavBuffer = pcmToWav(completePcm, 24000, 1, 16);
    const finalBase64Audio = stitchedWavBuffer.toString('base64');

    console.log(`[Shravan TTS] All ${chunks.length} chunks synthesized and stitched successfully into complete WAV (${stitchedWavBuffer.length} bytes, base64 length: ${finalBase64Audio.length})!`);

    return res.json({
      success: true,
      model: 'Gemini 3.1 Flash TTS',
      voice: 'Indian accent female (~30 years old)',
      chunksCount: chunks.length,
      audioBase64: finalBase64Audio,
    });
  } catch (error: any) {
    console.error('[Shravan TTS Error]:', error);
    let userMsg = error?.message || 'Failed to generate audio with Gemini 3.1 Flash TTS.';
    if (userMsg.includes('429') || userMsg.includes('RESOURCE_EXHAUSTED') || userMsg.includes('quota') || userMsg.includes('Quota exceeded')) {
      userMsg = 'Gemini 3.1 Flash TTS rate limit / quota exceeded (Free tier daily limit: 10 requests). Please try again later or configure billing for your Gemini API key.';
    }
    return res.status(500).json({
      success: false,
      error: userMsg,
    });
  }
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
