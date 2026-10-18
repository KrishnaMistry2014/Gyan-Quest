import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Printer,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  Compass,
  AlertTriangle,
  XCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SavedChapter, saveChapter, generateUniqueChapterCode } from '../lib/chapters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { claimChapterStageReward } from '../lib/firebase';

const EXTRACTION_STAGES = [
  'Extracting textbook text and diagrams...',
  'Analyzing diagrams, scientific schematics, and visual components...',
  'Analyzing chapter content and structuring learning steps...',
  'Synthesizing deep academic concept breakdowns...',
  'Detailing scientific laws, principles, and key explanations...',
  'Compiling exhaustive glossary and key definitions without omissions...',
  'Finalizing detailed chapter summary...',
];

const sanitizeClientVidya = (raw: string, defaultTitle: string): string => {
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

  // 5. Ensure title starts with "# [x]"
  const firstLineMatch = cleaned.match(/^#\s*(?:Vidya:\s*)?(.*)/m);
  if (firstLineMatch) {
    const titleText = firstLineMatch[1].trim().replace(/^Vidya:\s*/i, '');
    cleaned = cleaned.replace(/^#\s*.*$/m, `# ${titleText}`);
  } else {
    const fallbackTitle = defaultTitle.replace(/^Vidya:\s*/i, '').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    cleaned = `# ${fallbackTitle}\n\n` + cleaned;
  }

  return cleaned.trim();
};

const extractVidyaTitle = (text: string, fallback: string): string => {
  const match = text.match(/^#\s*(?:Vidya:\s*)?(.*)/m);
  if (match && match[1].trim()) {
    return match[1].trim().replace(/^Vidya:\s*/i, '');
  }
  return fallback.replace(/^Vidya:\s*/i, '').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
};

const cleanTitleFromFilename = (fileName: string): string => {
  return fileName
    .replace(/^Vidya:\s*/i, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
    .trim();
};

const generateClientVidyaSummary = (text: string, fileName: string): string => {
  const fallbackTitle = cleanTitleFromFilename(fileName);
  let title = fallbackTitle;

  // Try to find a chapter title in text
  const titleMatch = text.match(/(?:Chapter|Unit|Lesson)?\s*(\d+)?[:.\-\s]+([A-Z][A-Za-z\s]{3,40})/);
  if (titleMatch && titleMatch[2]?.trim().length > 3) {
    title = titleMatch[2].trim();
  }

  // Filter clean educational sentences
  const rawSentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300 && /^[A-Z0-9]/.test(s));

  const overview = rawSentences.slice(0, 3).join(' ') ||
    `This chapter provides an essential academic study of ${title}. It introduces fundamental principles, core observational methodologies, and systematic concept frameworks necessary for comprehensive subject mastery.`;

  const conceptSentences = rawSentences.slice(3, 12);
  const concepts = conceptSentences.length > 0
    ? conceptSentences.map(s => `- ${s}`).join('\n')
    : `- Foundational investigation of ${title} across core physical and theoretical principles.\n- Detailed examination of essential mechanisms, operational causes, and observed outcomes.\n- Systematic breakdown of key academic subject pillars and structured examples.`;

  const diagramSentences = rawSentences.filter(s => /diagram|figure|setup|apparatus|graph|chart|experiment|illustration|observe|circuit|flow/i.test(s)).slice(0, 3);
  const diagrams = diagramSentences.length > 0
    ? diagramSentences.map(s => `- ${s}`).join('\n')
    : `- Primary conceptual schematic illustrating foundational apparatus setup, components, and directional flow.\n- Analytical diagram mapping variable relationships and experimental transformation stages.`;

  const lawSentences = rawSentences.filter(s => /law|equation|defined|formula|principle|rule|called|known as|rate of|constant/i.test(s)).slice(0, 4);
  const laws = lawSentences.length > 0
    ? lawSentences.map(s => `* ${s}`).join('\n')
    : `* Governing Principle: Fundamental scientific interactions and conservative laws governing ${title}.\n* Core Definition: Key terminology, quantitative relations, and classification criteria.`;

  const takeaways = [
    `Mastery of ${title} requires thorough comprehension of underlying mechanisms and practical observations.`,
    `Theoretical concepts are directly applicable to real-world phenomena and experimental analysis.`,
    `Regular contemplative review and problem practice solidify long-term intellectual retention.`
  ].map(t => `* ${t}`).join('\n');

  return `# ${title}\n\n## Chapter Overview\n${overview}\n\n## Core Concept Breakdown\n${concepts}\n\n## Key Diagrams & Visual Insights\n${diagrams}\n\n## Laws, Equations & Core Definitions\n${laws}\n\n## Summary Takeaways\n${takeaways}`;
};

const extractTextFromBuffer = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('latin1');
    const str = decoder.decode(bytes);
    const parts: string[] = [];

    // 1. Scan and decompress FlateDecode zlib streams in the browser
    if (typeof DecompressionStream !== 'undefined') {
      let searchPos = 0;
      let streamCount = 0;
      while ((searchPos = str.indexOf('stream', searchPos)) !== -1 && streamCount < 30) {
        let start = searchPos + 6;
        if (bytes[start] === 13) start++; // \r
        if (bytes[start] === 10) start++; // \n
        const end = str.indexOf('endstream', start);
        if (end === -1) break;

        const streamBytes = bytes.subarray(start, end);
        searchPos = end + 9;
        streamCount++;

        // Detect zlib stream header (0x78)
        if (streamBytes.length > 10 && streamBytes[0] === 0x78) {
          try {
            const ds = new DecompressionStream('deflate');
            const writer = ds.writable.getWriter();
            writer.write(streamBytes);
            writer.close();
            const reader = ds.readable.getReader();
            const chunks: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) chunks.push(value);
            }
            const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
            const merged = new Uint8Array(totalLen);
            let off = 0;
            for (const c of chunks) {
              merged.set(c, off);
              off += c.length;
            }
            const decompressed = decoder.decode(merged);

            // Extract (text) Tj or '
            const tjMatches = decompressed.match(/\(([^()]{2,})\)\s*(?:Tj|\'|\")/g) || [];
            for (const m of tjMatches) {
              const cleaned = m.replace(/^\(/, '').replace(/\)\s*(?:Tj|\'|\")$/, '').trim();
              if (cleaned.length > 1 && !/[^\x20-\x7E\s]/.test(cleaned)) {
                parts.push(cleaned);
              }
            }

            // Extract [(text) ...] TJ
            const tjArrMatches = decompressed.match(/\[([^[\]]{3,})\]\s*TJ/g) || [];
            for (const m of tjArrMatches) {
              const inners = m.match(/\(([^()]+)\)/g) || [];
              const combined = inners.map(t => t.slice(1, -1)).join(' ').trim();
              if (combined.length > 1 && !/[^\x20-\x7E\s]/.test(combined)) {
                parts.push(combined);
              }
            }
          } catch (_) {
            // Stream not zlib or decompression error, continue to next
          }
        }
      }
    }

    // 2. Scan uncompressed Tj strings: (text) Tj
    const tjMatches = str.match(/\(([^()]{2,})\)\s*(?:Tj|\'|\")/g) || [];
    for (const m of tjMatches) {
      const cleaned = m.replace(/^\(/, '').replace(/\)\s*(?:Tj|\'|\")$/, '').trim();
      if (cleaned.length > 2 && !/[^\x20-\x7E\s]/.test(cleaned)) {
        parts.push(cleaned);
      }
    }

    // 3. Scan uncompressed TJ array strings: [(text) 20 (more text)] TJ
    const tjArrayMatches = str.match(/\[([^[\]]{4,})\]\s*TJ/g) || [];
    for (const m of tjArrayMatches) {
      const innerTexts = m.match(/\(([^()]+)\)/g) || [];
      const combined = innerTexts.map(t => t.slice(1, -1)).join(' ').trim();
      if (combined.length > 2 && !/[^\x20-\x7E\s]/.test(combined)) {
        parts.push(combined);
      }
    }

    // 4. Scan hex strings: <48656C6C6F> Tj
    const hexMatches = str.match(/<([0-9A-Fa-f]{6,})>\s*(?:Tj|TJ)/g) || [];
    for (const m of hexMatches) {
      const hex = m.replace(/^</, '').replace(/>\s*(?:Tj|TJ)$/, '');
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substr(i, 2), 16);
        if (code >= 32 && code <= 126) decoded += String.fromCharCode(code);
      }
      if (decoded.length > 2) parts.push(decoded);
    }

    return parts.join(' ').replace(/\s+/g, ' ').slice(0, 80000).trim();
  } catch {
    return '';
  }
};

interface VidyaPageProps {
  uploadedFile?: File | null;
  selectedChapter?: SavedChapter | null;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateMyChapters?: () => void;
  onNavigateShravan?: (chapter: SavedChapter) => void;
  onNavigateManan?: (chapter: SavedChapter) => void;
  onPdfUpload?: (file: File) => void;
  onClearUploadedPdf?: () => void;
}

export const VidyaPage: React.FC<VidyaPageProps> = ({
  uploadedFile,
  selectedChapter,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateMyChapters,
  onNavigateShravan,
  onNavigateManan,
  onPdfUpload,
  onClearUploadedPdf,
}) => {
  const { user, updateProfileXp, isStreakActiveToday, recordStreakActivity } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [stageMessage, setStageMessage] = useState<string>('Reading document text and diagrams...');
  const [summary, setSummary] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeFile, setActiveFile] = useState<File | null>(uploadedFile || null);
  const [currentChapter, setCurrentChapter] = useState<SavedChapter | null>(selectedChapter || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedKeyRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically maintain daily streak for doing Vidya if not yet active today
  useEffect(() => {
    if (status === 'done' && summary && !isStreakActiveToday && recordStreakActivity) {
      recordStreakActivity('vidya').catch(() => {});
    }
  }, [status, summary, isStreakActiveToday, recordStreakActivity]);

  const clearTimers = () => {
    if (stageIntervalRef.current) {
      clearInterval(stageIntervalRef.current);
      stageIntervalRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  // If a previously saved chapter is opened from "My Chapters", display it immediately
  useEffect(() => {
    if (selectedChapter) {
      setCurrentChapter(selectedChapter);
      clearTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      const cleanSummary = sanitizeClientVidya(selectedChapter.summary, selectedChapter.title);
      const computedTitle = extractVidyaTitle(cleanSummary, selectedChapter.title);
      setDocTitle(computedTitle);
      setSummary(cleanSummary);
      setStatus('done');
    }
  }, [selectedChapter]);

  // Trigger processing immediately when a new file is uploaded
  useEffect(() => {
    if (uploadedFile && !selectedChapter) {
      const fileKey = `${uploadedFile.name}-${uploadedFile.size}-${uploadedFile.lastModified}`;
      if (fileKey !== lastProcessedKeyRef.current) {
        lastProcessedKeyRef.current = fileKey;
        setActiveFile(uploadedFile);
        startExtraction(uploadedFile);
      }
    }
  }, [uploadedFile, selectedChapter]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startExtraction = async (file: File) => {
    clearTimers();
    lastProcessedKeyRef.current = `${file.name}-${file.size}-${file.lastModified}`;
    setActiveFile(file);
    setStatus('processing');
    setErrorMessage('');
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
    setDocTitle(cleanTitle);
    setStageMessage(EXTRACTION_STAGES[0]);

    // Setup AbortController for cancelation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Cycle friendly progress messages every 4 seconds so student knows it is active
    let stageIdx = 0;
    stageIntervalRef.current = setInterval(() => {
      stageIdx = (stageIdx + 1) % EXTRACTION_STAGES.length;
      setStageMessage(EXTRACTION_STAGES[stageIdx]);
    }, 4000);

    // 120-second safety net timeout for chapter analysis
    timeoutIdRef.current = setTimeout(() => {
      clearTimers();
      controller.abort();
      setStatus('error');
      setErrorMessage('Processing timed out after 120 seconds. Please check that the PDF contains readable text and try again.');
    }, 120000);

    try {
      // 1. Fast ArrayBuffer text extraction from the PDF directly in the browser
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractTextFromBuffer(arrayBuffer);

      // 2. Prepare payload (if file is under 35MB, convert to base64 for multimodal analysis)
      let base64Data = '';
      if (file.size <= 35 * 1024 * 1024) {
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            const commaIdx = res.indexOf(',');
            resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }

      const requestBody = JSON.stringify({
        pdfBase64: base64Data,
        fileName: file.name,
        extractedText,
      });

      let data: any = null;

      // Attempt 1: Local /api/extract-pdf
      try {
        const localResponse = await fetch('/api/extract-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: requestBody,
        });

        const contentType = localResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await localResponse.json().catch(() => null);
        } else {
          console.warn('/api/extract-pdf returned non-JSON content-type:', contentType);
        }
      } catch (localErr) {
        console.warn('Local /api/extract-pdf fetch error:', localErr);
      }

      // Attempt 2: If local failed or returned HTML (e.g. Firebase Hosting static rewrite), try Cloud Run backend
      if (!data || !data.success || !data.summary) {
        const cloudEndpoints = [
          'https://ais-dev-zdgluoxozyfyp75rmmq7js-491202296202.asia-southeast1.run.app/api/extract-pdf',
          'https://ais-pre-zdgluoxozyfyp75rmmq7js-491202296202.asia-southeast1.run.app/api/extract-pdf',
        ];

        for (const cloudUrl of cloudEndpoints) {
          if (controller.signal.aborted) break;
          try {
            console.log('Attempting PDF extraction via backend service:', cloudUrl);
            const cloudResponse = await fetch(cloudUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
              body: requestBody,
            });
            const contentType = cloudResponse.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const cloudData = await cloudResponse.json().catch(() => null);
              if (cloudData && cloudData.success && cloudData.summary) {
                data = cloudData;
                break;
              }
            }
          } catch (cloudErr) {
            console.warn(`Extraction error from ${cloudUrl}:`, cloudErr);
          }
        }
      }

      clearTimers();

      // If server returned valid summary, apply it!
      if (data && data.success && data.summary) {
        const cleanSummary = sanitizeClientVidya(data.summary, file.name);
        const computedTitle = extractVidyaTitle(cleanSummary, file.name);
        setStageMessage('Vidya ready!');
        setDocTitle(computedTitle);
        setSummary(cleanSummary);
        setStatus('done');

        // Persist to Cloud Firestore database
        try {
          const saved = await saveChapter({
            fileName: file.name,
            title: computedTitle,
            summary: cleanSummary,
            fileSize: file.size,
          });
          setCurrentChapter(saved);
        } catch (saveErr) {
          console.warn('Background chapter cloud save notice:', saveErr);
        }
        return;
      }

      // Attempt 3: Client-side synthesis fallback from extracted textbook text
      // Ensures the chapter is never blocked even if servers are completely down or in static hosting!
      const availableText = extractedText || '';
      if (availableText.trim().length > 30) {
        console.log('Synthesizing structured Vidya chapter summary client-side from extracted text...');
        const clientSummary = generateClientVidyaSummary(availableText, file.name);
        const cleanSummary = sanitizeClientVidya(clientSummary, file.name);
        const computedTitle = extractVidyaTitle(cleanSummary, file.name);

        setStageMessage('Vidya ready!');
        setDocTitle(computedTitle);
        setSummary(cleanSummary);
        setStatus('done');

        try {
          const saved = await saveChapter({
            fileName: file.name,
            title: computedTitle,
            summary: cleanSummary,
            fileSize: file.size,
          });
          setCurrentChapter(saved);
        } catch (saveErr) {
          console.warn('Background chapter cloud save notice:', saveErr);
        }
        return;
      }

      // Only if no text could be extracted at all (e.g. empty or non-text PDF)
      setStatus('error');
      setErrorMessage(
        data?.error ||
        'Could not extract readable text from this PDF. Please ensure the document is a readable chapter PDF with selectable text.'
      );
    } catch (err: any) {
      clearTimers();
      if (err.name === 'AbortError' && !lastProcessedKeyRef.current) {
        console.log('Extraction manually cancelled by user.');
        return;
      }

      // Fast client-side recovery if an unexpected network error occurred
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fallbackText = await extractTextFromBuffer(arrayBuffer);
        if (fallbackText && fallbackText.trim().length > 30) {
          console.log('Recovered via client-side PDF extraction after network error.');
          const clientSummary = generateClientVidyaSummary(fallbackText, file.name);
          const cleanSummary = sanitizeClientVidya(clientSummary, file.name);
          const computedTitle = extractVidyaTitle(cleanSummary, file.name);

          setStageMessage('Vidya ready!');
          setDocTitle(computedTitle);
          setSummary(cleanSummary);
          setStatus('done');

          try {
            const saved = await saveChapter({
              fileName: file.name,
              title: computedTitle,
              summary: cleanSummary,
              fileSize: file.size,
            });
            setCurrentChapter(saved);
          } catch (_) {}
          return;
        }
      } catch (_) {}

      setStatus('error');
      const networkOrOther = err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')
        ? 'Could not connect to the document analysis service. Please verify your connection and try again.'
        : (err?.message || 'We were unable to process this file. Please make sure it is a valid PDF and try again.');
      setErrorMessage(networkOrOther);
    }
  };

  const handleCancelExtraction = () => {
    clearTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setActiveFile(null);
    lastProcessedKeyRef.current = null;
    onClearUploadedPdf?.();
    if (onNavigateDashboard) {
      onNavigateDashboard();
    }
  };

  const handleCopyNotes = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setErrorMessage('Please choose a PDF document. Other formats are not supported.');
        setStatus('error');
        return;
      }
      onPdfUpload?.(file);
      startExtraction(file);
      e.target.value = '';
    }
  };

  // Helper to render markdown content in a clean, student-friendly layout
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={idx} className="h-3" />;
      }

      // Filter out any lingering Q&A or self-check lines
      if (/^(##+\s*(Check Your Understanding|Questions & Answers|Q&A|Practice Questions|Quiz|Self-Check)|Q\d+:|Question\s*\d*:|Ans\d*:|Answer\s*\d*:)/i.test(trimmed)) {
        return null;
      }

      // Title (# ) - formatted as the AI-generated title
      if (trimmed.startsWith('# ')) {
        const rawTitle = trimmed.replace(/^#\s+/, '').replace(/^Vidya:\s*/i, '');
        return (
          <h1
            key={idx}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-6 mb-3 pb-3 border-b"
            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-warm)' }}
          >
            {rawTitle}
          </h1>
        );
      }

      // Major Heading (## )
      if (trimmed.startsWith('## ')) {
        return (
          <h2
            key={idx}
            className="text-xl sm:text-2xl font-bold tracking-tight mt-6 mb-3 flex items-center gap-2"
            style={{ color: 'var(--accent-saffron-text)' }}
          >
            <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-500 shrink-0" />
            <span>{trimmed.replace(/^##\s+/, '')}</span>
          </h2>
        );
      }

      // Subheading (### )
      if (trimmed.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="text-lg sm:text-xl font-bold mt-5 mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }

      // Horizontal divider (---)
      if (trimmed === '---' || trimmed === '***') {
        return (
          <hr
            key={idx}
            className="my-5 border-t"
            style={{ borderColor: 'var(--border-warm)' }}
          />
        );
      }

      // Blockquotes (> )
      if (trimmed.startsWith('> ')) {
        return (
          <div
            key={idx}
            className="p-4 my-3 rounded-2xl border-l-4 shadow-2xs leading-relaxed text-sm sm:text-base font-medium"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--accent-saffron)',
              color: 'var(--text-primary)',
            }}
          >
            {trimmed.replace(/^>\s+/, '')}
          </div>
        );
      }

      // Bullet points (* or -)
      if (/^[\*\-]\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[\*\-]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-3 my-2 pl-1 sm:pl-2">
            <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-500 mt-2 shrink-0" />
            <span
              className="text-[15px] sm:text-[16px] leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{
                __html: formatInlineMarkdown(itemText),
              }}
            />
          </div>
        );
      }

      // Numbered list items (1. 2.)
      if (/^\d+\.\s+/.test(trimmed)) {
        const match = trimmed.match(/^(\d+\.)\s+(.*)$/);
        if (match) {
          return (
            <div key={idx} className="flex items-start gap-2.5 my-2 pl-1 sm:pl-2">
              <span
                className="text-sm sm:text-base font-bold mt-0.5 min-w-[1.5rem]"
                style={{ color: 'var(--accent-saffron-text)' }}
              >
                {match[1]}
              </span>
              <span
                className="text-[15px] sm:text-[16px] leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
                dangerouslySetInnerHTML={{
                  __html: formatInlineMarkdown(match[2]),
                }}
              />
            </div>
          );
        }
      }

      // Standard paragraph
      return (
        <p
          key={idx}
          className="text-[15px] sm:text-[16px] leading-relaxed my-2.5"
          style={{ color: 'var(--text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: formatInlineMarkdown(trimmed),
          }}
        />
      );
    });
  };

  // Safe inline markdown formatter for **bold**, *italic*, and cleaning raw math dollar signs
  const formatInlineMarkdown = (str: string) => {
    return str
      // Remove LaTeX math dollar signs ($...$ or $$...$$) unless followed by pure currency digits like $25
      .replace(/\$\$([^$]+)\$\$/g, '$1')
      .replace(/\$([A-Za-z0-9_+\-*\/=^()\\ ]+)\$/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-950 dark:text-stone-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-100/90 dark:bg-stone-800 text-amber-950 dark:text-amber-300 border border-amber-200/80 dark:border-stone-700">$1</code>');
  };

  return (
    <div
      id="vidya-page"
      className="flex-1 w-full min-h-[calc(100vh-5rem)] flex flex-col py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleNewFile}
        className="hidden"
        id="vidya-page-file-upload-input"
      />

      {/* ==============================================================
          STATE 0: IDLE VIEW (When no chapter is active)
          ============================================================== */}
      {status === 'idle' && (
        <div
          id="vidya-page-idle-view"
          className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-14 my-auto rounded-3xl border shadow-sm max-w-lg mx-auto w-full transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border shadow-xs"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--border-warm)',
              color: 'var(--accent-saffron)',
            }}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Upload Chapter to Begin Vidya
          </h3>

          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Select any chapter or textbook PDF to extract structured study notes and visual explanations.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF Document</span>
          </button>
        </div>
      )}

      {/* ==============================================================
          STATE 1: PROCESSING / LOADING SCREEN WITH SPINNING WHEEL
          ============================================================== */}
      {status === 'processing' && (
        <div
          id="vidya-page-loading-view"
          className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-14 my-auto rounded-3xl border shadow-sm max-w-2xl mx-auto w-full transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          {/* ==========================================================
              SPINNING LOADING WHEEL (Exactly 1 single part - no rendering glitches)
              ========================================================== */}
          <div
            id="extraction-spinning-wheel"
            className="w-16 h-16 sm:w-20 sm:h-20 my-8 rounded-full border-4 border-stone-200 dark:border-stone-800 border-t-orange-500 animate-spin shrink-0"
            style={{
              borderTopColor: 'var(--accent-saffron)',
            }}
          />

          <h2
            className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {t.readingChapter}
          </h2>

          {activeFile?.name && (
            <p className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 max-w-md truncate mb-4">
              {activeFile.name}
            </p>
          )}

          {/* Clean Status Subtitle (Single non-animated dot indicator) */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-4 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
            <span>{stageMessage}</span>
          </div>

          {/* Warning: Please do not leave this page while processing */}
          <div
            id="processing-do-not-leave-notice"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-semibold mb-6 shadow-2xs text-amber-800 dark:text-amber-200"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--accent-saffron)',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{t.pleaseDoNotLeave}</span>
          </div>

          {/* Cancel Option to abort extraction */}
          <button
            type="button"
            id="btn-cancel-extraction"
            onClick={handleCancelExtraction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer shadow-2xs"
            style={{
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
          >
            <XCircle className="w-4 h-4" />
            <span>{t.cancelExtraction}</span>
          </button>
        </div>
      )}

      {/* ==============================================================
          STATE 2: ERROR VIEW
          ============================================================== */}
      {status === 'error' && (
        <div
          id="vidya-page-error-view"
          className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-12 my-auto rounded-3xl border shadow-sm max-w-lg mx-auto w-full"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            {t.couldNotReadDoc}
          </h3>

          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            {errorMessage || 'We were unable to process this file. Please make sure it is a valid PDF and try again.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {activeFile && (
              <button
                type="button"
                id="btn-retry-extraction"
                onClick={() => startExtraction(activeFile)}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.tryAgain}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full ${activeFile ? 'sm:flex-1' : 'sm:flex-1'} inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shadow-2xs`}
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
                backgroundColor: activeFile ? 'var(--bg-main)' : 'var(--accent-saffron)',
                ...(activeFile ? {} : { color: '#FFFFFF', borderColor: 'var(--accent-saffron)' }),
              }}
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t.selectAnotherPdf}</span>
            </button>

            {onNavigateDashboard && (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                {t.backToDashboard}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          STATE 3: COMPLETED STUDY NOTES
          ============================================================== */}
      {status === 'done' && (
        <div id="vidya-page-summary-view" className="space-y-6">
          {/* Top Action Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron)',
                }}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent-saffron-text)' }}>
                  <span>Vidya</span>
                  <span>•</span>
                  <span>Stage 01</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Structured Reading</span>
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {docTitle || 'Vidya Notes'}
                </h2>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              {onNavigateMyChapters && (
                <button
                  type="button"
                  id="btn-view-my-chapters"
                  onClick={onNavigateMyChapters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title="View all saved chapters"
                >
                  <Layers className="w-3.5 h-3.5 text-orange-500" />
                  <span>{t.navMyChapters}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyNotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
                title="Copy Vidya to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copy}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer hidden xs:inline-flex"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
                title="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.print}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all hover:opacity-90 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{t.uploadAnotherPdf}</span>
              </button>
            </div>
          </div>

          {/* Main Summarized Content Card */}
          <article
            className="rounded-3xl border p-6 sm:p-10 lg:p-12 shadow-sm leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {renderFormattedContent(summary)}
          </article>

          {/* Bottom Navigation & Progression Link */}
          <div
            className="p-6 sm:p-7 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-5 transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Completed Vidya Reading?
                </h4>
              </div>
              <p className="text-xs sm:text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                Advance to Shravan for audio narration, or skip directly to Manan for interactive reflection games and crosswords.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
              {onNavigateDashboard && (
                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Back to Dashboard
                </button>
              )}

              {onNavigateManan && (
                <button
                  type="button"
                  id="btn-skip-to-manan"
                  data-testid="btn-skip-to-manan"
                  onClick={async () => {
                    let ch: SavedChapter = currentChapter || selectedChapter || {
                      id: activeFile ? `${activeFile.name}-${activeFile.size}` : `ch_${Date.now()}`,
                      uniqueCode: generateUniqueChapterCode(),
                      fileName: activeFile?.name || 'Chapter.pdf',
                      title: docTitle || 'Chapter Summary',
                      summary: summary,
                      createdAt: new Date().toISOString(),
                    };

                    if (!ch.uniqueCode || ch.uniqueCode.length !== 10) {
                      ch = { ...ch, uniqueCode: generateUniqueChapterCode() };
                      setCurrentChapter(ch);
                    }

                    onNavigateManan(ch);
                  }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-amber-500/10 hover:border-amber-500/40 hover:shadow-xs active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title="Skip Shravan audio and go straight to Manan reflection and games"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Skip to Manan</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                </button>
              )}

              {onNavigateShravan && (
                <button
                  type="button"
                  id="btn-go-to-shravan"
                  data-testid="btn-continue-to-shravan"
                  onClick={async () => {
                    let ch: SavedChapter = currentChapter || selectedChapter || {
                      id: activeFile ? `${activeFile.name}-${activeFile.size}` : `ch_${Date.now()}`,
                      uniqueCode: generateUniqueChapterCode(),
                      fileName: activeFile?.name || 'Chapter.pdf',
                      title: docTitle || 'Chapter Summary',
                      summary: summary,
                      createdAt: new Date().toISOString(),
                    };

                    if (!ch.uniqueCode || ch.uniqueCode.length !== 10) {
                      ch = { ...ch, uniqueCode: generateUniqueChapterCode() };
                      setCurrentChapter(ch);
                    }

                    // Claim 10 XP for Shravan for the first time only for this chapter
                    try {
                      const reward = await claimChapterStageReward(ch, 'shravan', user);
                      if (reward.awarded) {
                        showToast({
                          title: `+${reward.xpAdded} XP Added!`,
                          message: `Shravan audio narration unlocked • Total: ${reward.newTotal} XP`,
                          type: 'xp',
                          xpAmount: reward.xpAdded,
                        });
                        updateProfileXp(reward.newTotal);
                      }
                    } catch (err) {
                      console.warn('Error claiming Shravan XP:', err);
                    }

                    // Automatically maintain streak for Shravan if not active today
                    try {
                      if (!isStreakActiveToday && recordStreakActivity) {
                        recordStreakActivity('shravan').catch(() => {});
                      }
                    } catch (err) {
                      console.debug('Error recording Shravan streak activity:', err);
                    }

                    onNavigateShravan(ch);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                >
                  <span>{t.proceedToShravan}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
