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

      // 5. Ensure title starts with "# Vidya: [x]"
      const firstLineMatch = cleaned.match(/^#\s*(?:Vidya:\s*)?(.*)/m);
      if (firstLineMatch) {
        const titleText = firstLineMatch[1].trim();
        cleaned = cleaned.replace(/^#\s*.*$/m, `# Vidya: ${titleText}`);
      } else {
        const fallbackTitle = (defaultTitle || 'Chapter Study')
          .replace(/^Vidya:\s*/i, '')
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .trim();
        cleaned = `# Vidya: ${fallbackTitle}\n\n` + cleaned;
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
    // STEP 2: Chapter Summariser & Title Creator (Gemma 4 26B)
    // =========================================================================
    const summarizerPrompt = `You are a distinguished academic educator writing an exhaustive, highly detailed chapter summary titled "Vidya" for students.
Students will use this as their complete, definitive chapter revision text.

Below is the complete textbook chapter text and diagram explanations extracted from the PDF:
---
${extractedDetails.slice(0, 150000)}
---

CRITICAL REQUIREMENTS:

1. TITLE FORMAT:
   - The very first line of your response MUST be in this exact format:
     # Vidya: [x]
   - Replace [x] with the definitive, specific chapter title you decide to give it based on the actual material (e.g., "# Vidya: Acids, Bases and Salts", "# Vidya: Chemical Reactions and Equations", "# Vidya: Motion and Measurement of Distances").
   - Absolutely NO text, greetings, pleasantries, or preamble before this line.

2. DETAILED AND EXTENSIVE CHAPTER SUMMARY (NO STUDY TIPS):
   - This must be a DEEP, THOROUGH, LONG-FORM, and EXHAUSTIVE chapter summary.
   - Do NOT write a short or surface-level summary. The student specifically needs a comprehensive and long summary so that NO important points, definitions, or mechanisms are cut out.
   - Strictly NO generic study tips, revision tricks, or study advice (do NOT say "make flashcards", "review before exams", "take good notes", "test yourself"). Focus 100% on the academic subject matter of the chapter.
   - Explain all concepts thoroughly with multi-paragraph depth, intermediate steps, underlying theories, and real-world scientific examples.

3. REQUIRED STRUCTURED SECTIONS:
   Structure your comprehensive summary with these exact headings:

   ## Chapter Overview & Significance
   Provide a detailed, multi-paragraph introduction explaining the core theme of this chapter, its importance in science and the curriculum, foundational principles, and the scope of what is covered.

   ## Comprehensive Concept Breakdown
   Go through EVERY topic and sub-topic present in the chapter. For each topic:
   - Explain the concept in depth with clear, paragraph-by-paragraph explanations.
   - Explain the underlying scientific mechanism or principle step-by-step.
   - Include experimental observations, causes and effects, and practical real-world applications.
   - Do not cut out intermediate details or skip any subtopics from the text.

   ## Detailed Diagram, Schematic & Visual Explanations
   Provide an exhaustive breakdown of every diagram, schematic, figure, chart, experimental setup, or flowchart in the chapter:
   - State the diagram topic or title.
   - Visual Details: Thoroughly describe the components, labeled parts, arrows, directions, and physical arrangement depicted.
   - Conceptual Meaning: Deeply explain the scientific mechanism, reaction, physical law, or principle illustrated by the visual.

   ## Scientific Laws, Principles, and Equations
   Detail every scientific law, principle, chemical equation, and formula introduced in the chapter:
   - State each formula or law clearly in plain keyboard text (e.g., Force = Mass * Acceleration, Density = Mass / Volume, NO LaTeX dollar signs).
   - Define every single variable, symbol, and unit.
   - Explain the physical meaning of the formula and the conditions under which it holds true.

   ## Exhaustive Glossary & Key Definitions
   Provide an extensive, comprehensive bulleted list defining all scientific terms, keywords, and technical definitions introduced across the entire chapter so that no vocabulary or concept is left out.

   ## Core Takeaways & Summary Conclusions
   Provide a detailed, synthesized summary of the most essential concepts, laws, and conclusions students must master from this chapter.

4. FORMATTING RULES:
   - Clean, well-structured markdown.
   - Standard keyboard characters only (NO LaTeX math signs like "$" or "$$").
   - NO emojis.
   - NO questions, quizzes, or Q&A sections.
   - NO conversational greetings or remarks.`;

    let summary = '';

    // Primary: Gemma 4 26B as the Summariser
    try {
      console.log(`[Vidya Step 2] Generating chapter summary with Gemma 4 26B...`);
      const gemmaPromise = ai.models.generateContent({
        model: 'gemma-4-26b-a4b-it',
        contents: [summarizerPrompt],
        config: {
          maxOutputTokens: 8192,
        },
      });
      const gemmaResponse = await callWithTimeout(gemmaPromise, 65000, 'Gemma 4 26B Summariser');
      if (gemmaResponse.text && gemmaResponse.text.trim().length > 80) {
        summary = sanitizeVidya(gemmaResponse.text, fileName || 'Chapter Summary');
        console.log(`[Vidya Step 2] Gemma 4 26B summarization successful (${summary.length} characters)!`);
      }
    } catch (gemmaErr: any) {
      console.warn('[Vidya Step 2] Gemma 4 26B notice:', gemmaErr?.message || gemmaErr);
      // Fallback: Gemini 3.1 Flash-Lite (or 3.5 Flash-Lite) to summarize the extracted chapter content
      try {
        console.log(`[Vidya Step 2 Fallback] Summarizing with Gemini 3.1 Flash-Lite...`);
        const litePromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [summarizerPrompt],
          config: {
            maxOutputTokens: 8192,
          },
        });
        const liteResponse = await callWithTimeout(litePromise, 45000, 'Gemini 3.1 Flash-Lite Summariser');
        if (liteResponse.text && liteResponse.text.trim().length > 80) {
          summary = sanitizeVidya(liteResponse.text, fileName || 'Chapter Summary');
          console.log(`[Vidya Step 2 Fallback] Gemini 3.1 Flash-Lite summarization successful (${summary.length} characters)!`);
        }
      } catch (liteErr: any) {
        console.warn('[Vidya Step 2 Fallback] Gemini 3.1 Flash-Lite notice:', liteErr?.message || liteErr);
        try {
          console.log(`[Vidya Step 2 Fallback] Summarizing with Gemini 3.5 Flash-Lite...`);
          const lite35Promise = ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [summarizerPrompt],
            config: {
              maxOutputTokens: 8192,
            },
          });
          const lite35Response = await callWithTimeout(lite35Promise, 45000, 'Gemini 3.5 Flash-Lite Summariser');
          if (lite35Response.text && lite35Response.text.trim().length > 80) {
            summary = sanitizeVidya(lite35Response.text, fileName || 'Chapter Summary');
            console.log(`[Vidya Step 2 Fallback] Gemini 3.5 Flash-Lite summarization successful (${summary.length} characters)!`);
          }
        } catch (lite35Err: any) {
          console.error('[Vidya Step 2 Fallback] Gemini 3.5 Flash-Lite notice:', lite35Err?.message || lite35Err);
        }
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
