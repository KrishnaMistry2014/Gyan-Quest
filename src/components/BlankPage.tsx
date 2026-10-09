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
import { claimChapterStageReward } from '../lib/firebase';

const EXTRACTION_STAGES = [
  'Extracting textbook text and diagrams with Gemini Flash-Lite...',
  'Analyzing diagrams, scientific schematics, and visual components...',
  'Gemini 3.5 Flash-Lite is analyzing chapter content and naming the title...',
  'Gemini 3.5 Flash-Lite is synthesizing deep academic concept breakdowns...',
  'Detailing scientific laws, principles, and diagram explanations...',
  'Compiling exhaustive glossary and key definitions without omissions...',
  'Finalizing detailed Vidya chapter summary...',
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

const extractTextFromBuffer = (buffer: ArrayBuffer): string => {
  try {
    const bytes = new Uint8Array(buffer);
    const len = Math.min(bytes.length, 2 * 1024 * 1024);
    const decoder = new TextDecoder('latin1');
    const str = decoder.decode(bytes.subarray(0, len));
    const matches = str.match(/\(([^()]{3,})\)\s*(?:Tj|TJ|\'|\")/g) || [];
    const parts: string[] = [];
    for (const m of matches) {
      const cleaned = m.replace(/^\(/, '').replace(/\)\s*(?:Tj|TJ|\'|\")$/, '').trim();
      if (cleaned.length > 2 && !/[^\x20-\x7E\s]/.test(cleaned)) {
        parts.push(cleaned);
      }
    }
    return parts.join(' ').replace(/\s+/g, ' ').slice(0, 60000).trim();
  } catch {
    return '';
  }
};

interface BlankPageProps {
  uploadedFile?: File | null;
  selectedChapter?: SavedChapter | null;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateMyChapters?: () => void;
  onNavigateShravan?: (chapter: SavedChapter) => void;
  onPdfUpload?: (file: File) => void;
  onClearUploadedPdf?: () => void;
}

export const BlankPage: React.FC<BlankPageProps> = ({
  uploadedFile,
  selectedChapter,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateMyChapters,
  onNavigateShravan,
  onPdfUpload,
  onClearUploadedPdf,
}) => {
  const { user, updateProfileXp, isStreakActiveToday, recordStreakActivity } = useAuth();
  const { showToast } = useToast();
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

    // 120-second safety net timeout to allow deep Gemini 3.5 Flash-Lite chapter analysis
    timeoutIdRef.current = setTimeout(() => {
      clearTimers();
      controller.abort();
      setStatus('error');
      setErrorMessage('Processing timed out after 120 seconds. Please check that the PDF contains readable text and try again.');
    }, 120000);

    try {
      // 1. Fast ArrayBuffer text extraction from the PDF directly in the browser
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = extractTextFromBuffer(arrayBuffer);

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

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          pdfBase64: base64Data,
          fileName: file.name,
          extractedText,
        }),
      });

      clearTimers();

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      }

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
      } else {
        const errMsg = data?.error || (response.status !== 200 ? `Extraction failed (HTTP ${response.status})` : 'Could not generate chapter summary from this PDF.');
        setStatus('error');
        setErrorMessage(errMsg);
      }
    } catch (err: any) {
      clearTimers();
      if (err.name === 'AbortError' && !lastProcessedKeyRef.current) {
        console.log('Extraction manually cancelled by user.');
        return;
      }
      setStatus('error');
      setErrorMessage(err?.message || 'We were unable to process this file. Please make sure it is a valid PDF and try again.');
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
      id="blank-page"
      className="flex-1 w-full min-h-[calc(100vh-5rem)] flex flex-col py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleNewFile}
        className="hidden"
        id="blank-page-file-upload-input"
      />

      {/* ==============================================================
          STATE 0: IDLE VIEW (When no chapter is active)
          ============================================================== */}
      {status === 'idle' && (
        <div
          id="blank-page-idle-view"
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
            Upload Chapter to Begin
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
          id="blank-page-loading-view"
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
            Reading Your Chapter
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
            <span>Please do not leave this page while processing</span>
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
            <span>Cancel Extraction</span>
          </button>
        </div>
      )}

      {/* ==============================================================
          STATE 2: ERROR VIEW
          ============================================================== */}
      {status === 'error' && (
        <div
          id="blank-page-error-view"
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
            Could Not Read Document
          </h3>

          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            {errorMessage || 'We were unable to process this file. Please make sure it is a valid PDF and try again.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Select Another PDF</span>
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
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          STATE 3: COMPLETED STUDY NOTES
          ============================================================== */}
      {status === 'done' && (
        <div id="blank-page-summary-view" className="space-y-6">
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
                  <span>My Chapters</span>
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
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Vidya</span>
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
                <span>Print</span>
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
                <span>New PDF</span>
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
            className="p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="text-center sm:text-left">
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Completed Vidya Reading?
              </h4>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Advance to Shravan for concise audio explanation and conceptual synthesis.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onNavigateDashboard && (
                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Back to Dashboard
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
                  <span>Go to Shravan</span>
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
