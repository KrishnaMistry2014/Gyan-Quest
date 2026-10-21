import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trophy,
  BookOpen,
  Headphones,
  Image as ImageIcon,
  X,
  LayoutGrid,
  ClipboardCheck,
  ArrowRight
} from 'lucide-react';
import { SavedChapter, generateUniqueChapterCode } from '../lib/chapters';
import { GyanQuestCrossword } from './GyanQuestCrossword';
import { GyanQuestWordle } from './GyanQuestWordle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { playMindfulChime } from '../lib/chime';
import { claimChapterStageReward } from '../lib/firebase';
import {
  generateChapterImage,
  buildEducationalImagePrompt,
  MananImageError,
  checkGradioSpaceStatus,
  checkRenderBackendStatus,
  GYANQUEST_IMAGE_API_URL,
} from '../lib/mananApi';
import {
  JigsawPiece,
  generateJigsawPuzzle,
  checkPieceSnap
} from '../lib/jigsawEngine';
import { getScriptureDefinition, ScriptureDefinition } from '../lib/scriptureData';

interface MananPageProps {
  chapter: SavedChapter;
  onBackToShravan: () => void;
  onBackToVidya?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateMyChapters?: () => void;
  onNavigatePariksha?: (chapter: SavedChapter) => void;
}

export const MananPage: React.FC<MananPageProps> = ({
  chapter,
  onBackToShravan,
  onBackToVidya,
  onNavigateDashboard,
  onNavigateMyChapters,
  onNavigatePariksha,
}) => {
  const scripture = getScriptureDefinition(chapter);
  const { user, profile, updateProfileXp, refreshUser, isStreakActiveToday, recordStreakActivity } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Active contemplation activity in fixed guided flow: Jigsaw -> Wordle -> Crossword
  const [activeActivity, setActiveActivity] = useState<'jigsaw' | 'wordle' | 'crossword'>('jigsaw');
  const [wordleCompleted, setWordleCompleted] = useState<boolean>(false);
  const [crosswordCompleted, setCrosswordCompleted] = useState<boolean>(false);

  const handleAdvanceToWordle = async () => {
    let ch = { ...chapter };
    if (!ch.uniqueCode || ch.uniqueCode.length !== 10) {
      ch.uniqueCode = generateUniqueChapterCode();
    }
    try {
      const reward = await claimChapterStageReward(ch, 'manan_jigsaw', user);
      if (reward.awarded) {
        updateProfileXp(reward.newTotal);
        showToast({
          title: '+5 XP Earned!',
          message: 'Jigsaw reflection mastered • +5 XP added!',
          type: 'xp',
          xpAmount: 5,
        });
        refreshUser?.();
      }
    } catch (err) {
      console.warn('Error claiming jigsaw reward:', err);
    }
    setActiveActivity('wordle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdvanceToCrossword = async () => {
    let ch = { ...chapter };
    if (!ch.uniqueCode || ch.uniqueCode.length !== 10) {
      ch.uniqueCode = generateUniqueChapterCode();
    }
    try {
      const reward = await claimChapterStageReward(ch, 'manan_wordle', user);
      if (reward.awarded) {
        updateProfileXp(reward.newTotal);
        showToast({
          title: '+5 XP Earned!',
          message: 'Word Quest mastered • +5 XP added!',
          type: 'xp',
          xpAmount: 5,
        });
        refreshUser?.();
      }
    } catch (err) {
      console.warn('Error claiming wordle reward:', err);
    }
    setActiveActivity('crossword');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToPariksha = async () => {
    let ch = { ...chapter };
    if (!ch.uniqueCode || ch.uniqueCode.length !== 10) {
      ch.uniqueCode = generateUniqueChapterCode();
    }
    try {
      const reward = await claimChapterStageReward(ch, 'manan_crossword', user);
      if (reward.awarded) {
        updateProfileXp(reward.newTotal);
        showToast({
          title: '+5 XP Earned!',
          message: 'Crossword contemplation mastered • +5 XP added!',
          type: 'xp',
          xpAmount: 5,
        });
        refreshUser?.();
      }
    } catch (err) {
      console.warn('Error claiming crossword reward:', err);
    }
    if (onNavigatePariksha) {
      onNavigatePariksha(ch);
    }
  };

  // Difficulty configuration (default 3x3 = 9 genuine jigsaw pieces)
  const [gridSize, setGridSize] = useState<3 | 4>(3);
  const rows = gridSize;
  const cols = gridSize;
  const totalPieces = rows * cols;

  // Board dimensions (responsive square)
  const [boardSize, setBoardSize] = useState<number>(400);

  // Game state
  const [status, setStatus] = useState<'generating' | 'ready' | 'error'>('generating');
  const [statusMessage, setStatusMessage] = useState<string>(
    'Crafting an educational illustration for your chapter...'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<MananImageError | null>(null);
  const [spaceHealth, setSpaceHealth] = useState<{ isOnline: boolean; statusText: string } | null>(null);
  const [backendHealth, setBackendHealth] = useState<{ isOnline: boolean; statusText: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(true);
  const [pieces, setPieces] = useState<JigsawPiece[]>([]);
  const [activePieceId, setActivePieceId] = useState<number | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // References
  const boardRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const rewardClaimedRef = useRef<boolean>(false);
  const maxZIndexRef = useRef<number>(100);
  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const boardSizeRef = useRef<number>(boardSize);
  boardSizeRef.current = boardSize;
  const gridSizeRef = useRef<3 | 4>(gridSize);
  gridSizeRef.current = gridSize;

  // Drag tracking state
  const dragInfoRef = useRef<{
    pieceId: number;
    startPointerX: number;
    startPointerY: number;
    startPieceX: number;
    startPieceY: number;
    hasMoved: boolean;
  } | null>(null);

  // Calculate responsive board size based on viewport
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 440) {
        setBoardSize(310);
      } else if (width < 768) {
        setBoardSize(360);
      } else {
        setBoardSize(420);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize and load the puzzle image (reuses session cached image if present)
  const loadPuzzleImage = useCallback(async (forceNew = false) => {
    // If a non-aborted request is actively generating and this is not a force-new/retry request, avoid duplicate calls
    if (isGeneratingRef.current && !forceNew && abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      return;
    }

    // Abort any existing in-flight controller before starting a replacement
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort('superseded');
      } catch (_) {}
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    // Check if chapter is a predefined scripture (single image like custom PDFs)
    if (scripture && scripture.scriptureImages.length > 0) {
      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
      isGeneratingRef.current = false;
      const activeImg = scripture.scriptureImages[0];
      setImageUrl(activeImg.url);
      setIsAiGenerated(false);
      setStatus('ready');
      setErrorMessage('');
      setErrorDetails(null);
      initPuzzlePieces(activeImg.url, gridSizeRef.current, boardSizeRef.current);
      return;
    }

    // Check session cache first to prevent duplicate API generation
    const sessionCacheKey = `gq_manan_v3_${chapter.id || chapter.uniqueCode}`;
    const legacyCacheKey = `gq_manan_img_${chapter.id || chapter.uniqueCode}`;
    try {
      sessionStorage.removeItem(legacyCacheKey);
    } catch (_) {}

    if (!forceNew) {
      const cachedUrl = sessionStorage.getItem(sessionCacheKey);
      if (cachedUrl) {
        if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
        isGeneratingRef.current = false;
        setImageUrl(cachedUrl);
        setIsAiGenerated(true);
        setStatus('ready');
        setErrorMessage('');
        setErrorDetails(null);
        initPuzzlePieces(cachedUrl, gridSizeRef.current, boardSizeRef.current);
        return;
      }
    }

    isGeneratingRef.current = true;
    setStatus('generating');
    setErrorMessage('');
    setErrorDetails(null);
    setStatusMessage('Preparing chapter illustration for jigsaw puzzle...');

    // 45-second reliable frontend request timeout
    let timedOut = false;
    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      try {
        controller.abort('timeout');
      } catch (_) {
        controller.abort();
      }
    }, 45000);

    let activePrompt = '';
    try {
      activePrompt = await buildEducationalImagePrompt(chapter, controller.signal);

      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;

      setStatusMessage('Synthesizing puzzle illustration with AI...');

      const result = await generateChapterImage(activePrompt, controller.signal, chapter);

      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;

      if (!result?.imageUrl) {
        throw new MananImageError({
          statusCode: 502,
          errorCode: 'ERR_EMPTY_IMAGE_RESULT',
          message: 'The image generation service did not return a valid image URL.',
          endpoint: GYANQUEST_IMAGE_API_URL,
          promptSent: activePrompt,
        });
      }

      if (result.isAiGenerated) {
        sessionStorage.setItem(sessionCacheKey, result.imageUrl);
      }

      setImageUrl(result.imageUrl);
      setIsAiGenerated(result.isAiGenerated);
      setStatus('ready');
      setErrorMessage('');
      setErrorDetails(null);
      initPuzzlePieces(result.imageUrl, gridSizeRef.current, boardSizeRef.current);
    } catch (err: any) {
      // If this request was superseded by a newer request or component unmounted, quietly exit
      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) {
        return;
      }

      const isTimeout =
        timedOut ||
        (err instanceof MananImageError && err.statusCode === 408) ||
        controller.signal.reason === 'timeout' ||
        String(err?.message || '').toLowerCase().includes('timeout');

      let errorObj: MananImageError;
      if (err instanceof MananImageError) {
        errorObj = err;
      } else if (isTimeout) {
        errorObj = new MananImageError({
          statusCode: 408,
          errorCode: 'ERR_REQUEST_TIMEOUT',
          message: 'The image generation request timed out after 45 seconds. The upstream service took too long to respond.',
          backendMessage: 'Frontend request timed out after 45000ms. The image backend is either waking up or experiencing high traffic. Please retry in a few moments.',
          endpoint: GYANQUEST_IMAGE_API_URL,
          promptSent: activePrompt,
        });
      } else {
        errorObj = new MananImageError({
          statusCode: err?.statusCode || 0,
          errorCode: err?.errorCode || 'ERR_GENERATION_FAILED',
          message: err?.message || 'An unexpected error occurred while generating the jigsaw puzzle image.',
          backendMessage: err?.backendMessage || err?.message || 'Generation failed',
          endpoint: GYANQUEST_IMAGE_API_URL,
          promptSent: activePrompt,
        });
      }

      console.error('Jigsaw image generation failed:', errorObj);
      setStatus('error');
      setErrorMessage(errorObj.message);
      setErrorDetails(errorObj);
    } finally {
      clearTimeout(timeoutTimer);
      if (currentRequestId === requestIdRef.current) {
        isGeneratingRef.current = false;
      }
    }
  }, [chapter, scripture]);

  // Manually re-check health of upstream services
  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const [space, render] = await Promise.all([
        checkGradioSpaceStatus(),
        checkRenderBackendStatus(),
      ]);
      setSpaceHealth(space);
      setBackendHealth(render);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Initializes piece geometry and scattered tray placement
  const initPuzzlePieces = (
    img: string,
    currentGridSize: 3 | 4,
    currentBoardSize: number
  ) => {
    const trayWidth = currentBoardSize;
    const trayHeight = currentBoardSize;
    const newPieces = generateJigsawPuzzle(
      currentGridSize,
      currentGridSize,
      currentBoardSize,
      currentBoardSize,
      trayWidth,
      trayHeight
    );
    setPieces(newPieces);
    setMoves(0);
    setIsCompleted(false);
  };

  // Re-generate pieces on image ready or board resize/difficulty change
  useEffect(() => {
    if (imageUrl && status === 'ready') {
      initPuzzlePieces(imageUrl, gridSize, boardSize);
    }
  }, [boardSize, gridSize]);

  // Initial load on mount & chapter changes with Strict Mode resilient cleanup
  useEffect(() => {
    isMountedRef.current = true;
    loadPuzzleImage(false);
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort('unmount');
        } catch (_) {}
      }
      isGeneratingRef.current = false;
    };
  }, [chapter.id, chapter.uniqueCode, loadPuzzleImage]);

  // Completion check
  useEffect(() => {
    if (pieces.length === 0) return;
    const allSnapped = pieces.every((p) => p.isSnapped);

    if (allSnapped && !isCompleted) {
      setIsCompleted(true);
      playMindfulChime();

      if (!rewardClaimedRef.current) {
        rewardClaimedRef.current = true;
        showToast({
          title: 'Puzzle Solved!',
          message: 'Excellent reflection! All pieces aligned.',
          type: 'success',
        });

        // Maintain daily streak for Manan
        if (!isStreakActiveToday && recordStreakActivity) {
          recordStreakActivity('manan').catch(() => {});
        }
      }
    }
  }, [pieces, isCompleted, isStreakActiveToday, recordStreakActivity, showToast]);

  // Reset current puzzle arrangement without re-generating the image
  const handleResetPuzzle = () => {
    if (!imageUrl) return;
    initPuzzlePieces(imageUrl, gridSize, boardSize);
  };

  // Switch difficulty
  const handleDifficultyChange = (size: 3 | 4) => {
    setGridSize(size);
    if (imageUrl) {
      initPuzzlePieces(imageUrl, size, boardSize);
    }
  };

  // --------------------------------------------------------------------------
  // POINTER EVENT DRAG & SNAP HANDLERS (FRONT-LAYER PRIORITY)
  // --------------------------------------------------------------------------
  const handlePointerDown = (
    e: React.PointerEvent,
    pieceId: number
  ) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece || piece.isSnapped) return;

    e.preventDefault();
    e.stopPropagation();

    // Dynamically elevate this piece to the front layer!
    maxZIndexRef.current += 1;
    const elevatedZ = maxZIndexRef.current;

    setActivePieceId(pieceId);
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, zIndex: elevatedZ } : p))
    );

    dragInfoRef.current = {
      pieceId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPieceX: piece.currentX,
      startPieceY: piece.currentY,
      hasMoved: false,
    };
  };

  // Global window listeners for drag & drop across all devices
  useEffect(() => {
    if (activePieceId === null) return;

    const onPointerMove = (e: PointerEvent) => {
      const info = dragInfoRef.current;
      if (!info) return;

      const deltaX = e.clientX - info.startPointerX;
      const deltaY = e.clientY - info.startPointerY;

      if (Math.hypot(deltaX, deltaY) > 3) {
        info.hasMoved = true;
      }

      setPieces((prev) =>
        prev.map((p) => {
          if (p.id === info.pieceId) {
            return {
              ...p,
              currentX: info.startPieceX + deltaX,
              currentY: info.startPieceY + deltaY,
            };
          }
          return p;
        })
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      const info = dragInfoRef.current;
      if (!info) {
        setActivePieceId(null);
        return;
      }

      const piece = pieces.find((p) => p.id === info.pieceId);
      if (!piece || piece.isSnapped) {
        dragInfoRef.current = null;
        setActivePieceId(null);
        return;
      }

      if (info.hasMoved) {
        setMoves((m) => m + 1);
      }

      // Check magnetic snapping relative to board
      if (boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const pieceEl = document.querySelector(`[data-piece-id="${piece.id}"]`);

        if (pieceEl) {
          const pieceRect = pieceEl.getBoundingClientRect();
          const boardCoordX = pieceRect.left - boardRect.left;
          const boardCoordY = pieceRect.top - boardRect.top;

          // Comfortable magnetic snapping tolerance (48px)
          const didSnap = checkPieceSnap(piece, boardCoordX, boardCoordY, 48);

          if (didSnap) {
            setPieces((prev) =>
              prev.map((p) =>
                p.id === piece.id
                  ? {
                      ...p,
                      currentX: p.targetX,
                      currentY: p.targetY,
                      isSnapped: true,
                    }
                  : p
              )
            );

            // Subtle chime feedback on successful snap
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
              gain.gain.setValueAtTime(0.08, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.16);
            } catch (_) {}
          }
        }
      }

      dragInfoRef.current = null;
      setActivePieceId(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [activePieceId, pieces]);

  const snappedCount = pieces.filter((p) => p.isSnapped).length;
  const progressPercent = totalPieces > 0 ? (snappedCount / totalPieces) * 100 : 0;

  return (
    <div
      id="manan-stage-page"
      className="min-h-screen py-6 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col space-y-6"
    >
      {/* Top Header & Stage Navigation */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 sm:pb-6" style={{ borderColor: 'var(--border-warm)' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-brass)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>STAGE 03 • MANAN (मनन)</span>
            </span>

            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-muted)',
              }}
            >
              Deep Reflection & Synthesis
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {chapter.title || 'Chapter Reflection'}
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Reconstruct the conceptual illustration of your chapter by fitting the interlocking jigsaw pieces into place.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onBackToShravan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToShravan}</span>
          </button>

          {onBackToVidya && (
            <button
              type="button"
              onClick={onBackToVidya}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs hidden md:inline-flex"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.chapterNotesTitle}</span>
            </button>
          )}

          {imageUrl && status === 'ready' && (
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border shadow-2xs transition-all hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
              title="View full reference image"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Image</span>
            </button>
          )}

          {/* Go to Pariksha button ONLY visible when all Manan activities are completed */}
          {crosswordCompleted && onNavigatePariksha && (
            <button
              type="button"
              id="btn-header-go-to-pariksha"
              data-testid="btn-go-to-pariksha"
              onClick={handleGoToPariksha}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 cursor-pointer animate-bounce"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
              title="Go to Stage 04: Pariksha (परीक्षा)"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{t.goToPariksha}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Guided Sequential Flow: Jigsaw > Wordle > Crossword */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b pb-4 pt-1" style={{ borderColor: 'var(--border-warm)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Activity 1: Jigsaw */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeActivity === 'jigsaw'
                ? 'shadow-xs'
                : isCompleted
                ? 'opacity-90'
                : 'opacity-60'
            }`}
            style={{
              backgroundColor: activeActivity === 'jigsaw' ? 'var(--accent-saffron)' : 'var(--bg-card)',
              color: activeActivity === 'jigsaw' ? '#FFFFFF' : 'var(--text-primary)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Brain className="w-4 h-4" />}
            <span>1. Jigsaw Reflection</span>
            {isCompleted && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                100%
              </span>
            )}
          </div>

          <ArrowRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

          {/* Activity 2: Wordle */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeActivity === 'wordle'
                ? 'shadow-xs'
                : wordleCompleted
                ? 'opacity-90'
                : 'opacity-60'
            }`}
            style={{
              backgroundColor: activeActivity === 'wordle' ? 'var(--accent-saffron)' : 'var(--bg-card)',
              color: activeActivity === 'wordle' ? '#FFFFFF' : 'var(--text-primary)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {wordleCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>2. Word Quest</span>
            {wordleCompleted && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                100%
              </span>
            )}
          </div>

          <ArrowRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

          {/* Activity 3: Crossword */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeActivity === 'crossword'
                ? 'shadow-xs'
                : crosswordCompleted
                ? 'opacity-90'
                : 'opacity-60'
            }`}
            style={{
              backgroundColor: activeActivity === 'crossword' ? 'var(--accent-saffron)' : 'var(--bg-card)',
              color: activeActivity === 'crossword' ? '#FFFFFF' : 'var(--text-primary)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {crosswordCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <LayoutGrid className="w-4 h-4" />}
            <span>3. Crossword Quest</span>
            {crosswordCompleted && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                100%
              </span>
            )}
          </div>
        </div>

        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {activeActivity === 'jigsaw'
            ? 'Assemble all puzzle pieces (100%) to unlock Next Activity'
            : activeActivity === 'wordle'
            ? 'Solve all words with 100% accuracy against the 60s timer to advance'
            : 'Solve Crossword 100% correctly to unlock Stage 04: Pariksha'}
        </div>
      </div>

      {activeActivity === 'crossword' ? (
        <div className="my-6">
          <GyanQuestCrossword
            initialChapter={chapter}
            isPariksha={false}
            onExit={() => onNavigateDashboard?.()}
            onComplete={() => {
              setCrosswordCompleted(true);
            }}
            onGoToPariksha={handleGoToPariksha}
          />
        </div>
      ) : activeActivity === 'wordle' ? (
        <div className="my-6 space-y-4">
          <GyanQuestWordle
            chapter={chapter}
            onExit={() => onNavigateDashboard?.()}
            onCompleteChapter={() => {
              setWordleCompleted(true);
              if (!isStreakActiveToday && recordStreakActivity) {
                recordStreakActivity('manan').catch(() => {});
              }
            }}
            onNextActivity={handleAdvanceToCrossword}
          />
          {wordleCompleted && (
            <div className="p-4 rounded-2xl border flex items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Word Quest 100% Solved! Ready for Crossword Quest.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAdvanceToCrossword}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <span>Next Activity: Crossword</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Main Stage Content: Jigsaw */
        status === 'generating' ? (
        /* Loading & Image Generation View */
        <div
          id="manan-loading-card"
          className="rounded-3xl border p-8 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center space-y-6 my-8"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse" style={{ backgroundColor: 'var(--accent-saffron-light)' }}>
            <Sparkles className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-saffron)', animationDuration: '3s' }} />
          </div>

          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Krea 2 Turbo</span>
            </div>
            <h3 className="text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Synthesizing Chapter Illustration
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {statusMessage}
            </p>
          </div>

          <div className="w-full max-w-xs h-2 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800">
            <div
              className="h-full rounded-full animate-pulse transition-all duration-700"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                width: '65%',
              }}
            />
          </div>

          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
            “Manan transforms heard words into internalized understanding through deliberate contemplation.”
          </p>
        </div>
      ) : status === 'error' ? (
        /* Transparent Error & Diagnostics View */
        <div
          id="manan-error-card"
          className="rounded-3xl border p-6 sm:p-10 shadow-md flex flex-col space-y-6 my-6 max-w-2xl mx-auto"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: '#F87171',
          }}
        >
          {/* Top Error Banner */}
          <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap border-b pb-4" style={{ borderColor: 'var(--border-warm)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/70 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 font-serif-heading">
                  Image Generation Service Error
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Failed to generate a custom chapter illustration from the image API
                </p>
              </div>
            </div>

            {/* Clear Error Code Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
                {errorDetails?.statusCode ? `HTTP ${errorDetails.statusCode}` : 'NETWORK_ERROR'} • {errorDetails?.errorCode || 'ERR_API_FAILED'}
              </span>
            </div>
          </div>

          {/* Backend Response Detail */}
          <div className="rounded-2xl p-4 border bg-stone-50 dark:bg-stone-900/50 space-y-2" style={{ borderColor: 'var(--border-warm)' }}>
            <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              <span>Server Response Message</span>
              <span className="font-mono text-[11px] text-red-600 dark:text-red-400">
                {errorDetails?.statusCode ? `Status Code: ${errorDetails.statusCode}` : 'Connection Refused'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-red-700 dark:text-red-300 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 break-all">
              {errorDetails?.backendMessage || errorDetails?.message || 'No response returned by server'}
            </p>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between pt-1 font-mono">
              <span>Endpoint:</span>
              <span>{errorDetails?.endpoint || GYANQUEST_IMAGE_API_URL}</span>
            </div>
          </div>

          {/* Live Space & API Diagnostic Checkers */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-saffron-text)' }}>
                Service Connectivity Diagnostics
              </span>
              <button
                type="button"
                onClick={handleCheckHealth}
                disabled={isCheckingHealth}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                <span>Re-check Services</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Upstream Hugging Face Space Card */}
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between gap-2 shadow-2xs"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Hugging Face Space
                  </div>
                  <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                    krea-krea-2.hf.space
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    spaceHealth?.isOnline !== false
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  {spaceHealth ? (spaceHealth.isOnline ? 'Online (Active)' : spaceHealth.statusText) : 'Checking...'}
                </span>
              </div>

              {/* Render Image API Card */}
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between gap-2 shadow-2xs"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Render Backend API
                  </div>
                  <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                    gyanquest-image-api
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    backendHealth?.isOnline
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {backendHealth ? (backendHealth.isOnline ? 'Online' : backendHealth.statusText) : 'Checking...'}
                </span>
              </div>
            </div>
          </div>

          {/* Chapter Specific Prompt Detail */}
          {errorDetails?.promptSent && (
            <div className="p-3.5 rounded-2xl border bg-stone-50 dark:bg-stone-900/40 space-y-1.5" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                <span>Chapter Educational Prompt Sent</span>
                <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                  Chapter: {chapter.title || 'Uploaded PDF'}
                </span>
              </div>
              <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                "{errorDetails.promptSent}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 flex-wrap border-t" style={{ borderColor: 'var(--border-warm)' }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBackToShravan}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Shravan</span>
              </button>

              {onBackToVidya && (
                <button
                  type="button"
                  onClick={onBackToVidya}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Vidya Notes</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => loadPuzzleImage(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Generation</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Jigsaw Puzzle Gameplay */
        <div className="space-y-6">
          {/* Game Stats & Controls Bar */}
          <div
            className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {/* Progress & Placed count */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                  <span>Pieces Placed:</span>
                  <span className="font-mono text-sm">
                    {snappedCount} / {totalPieces}
                  </span>
                </div>
                <div className="w-36 sm:w-48 h-2 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      backgroundColor: 'var(--accent-saffron)',
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-xs font-semibold hidden xs:block" style={{ color: 'var(--text-muted)' }}>
                Moves: <span className="font-mono">{moves}</span>
              </div>
            </div>

            {/* Difficulty, Model & Reset controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {!scripture && (
                isAiGenerated ? (
                  <div
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs"
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--accent-saffron-text)',
                    }}
                    title="AI Image Generator"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Powered by Krea 2 Turbo</span>
                  </div>
                ) : (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
                    title="Chapter Educational Concept Visual"
                  >
                    <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Chapter Visual</span>
                    <button
                      type="button"
                      onClick={() => loadPuzzleImage(true)}
                      className="ml-1 text-[11px] underline font-bold hover:text-amber-600 cursor-pointer"
                      title="Retry generating with Krea 2 Turbo"
                    >
                      Retry Krea 2 Turbo
                    </button>
                  </div>
                )
              )}

              <div className="inline-flex rounded-xl p-0.5 border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}>
                <button
                  type="button"
                  onClick={() => handleDifficultyChange(3)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    gridSize === 3 ? 'shadow-2xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: gridSize === 3 ? 'var(--accent-saffron)' : 'transparent',
                    color: gridSize === 3 ? '#FFFFFF' : 'var(--text-primary)',
                  }}
                >
                  3×3 (9 pcs)
                </button>
                <button
                  type="button"
                  onClick={() => handleDifficultyChange(4)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    gridSize === 4 ? 'shadow-2xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: gridSize === 4 ? 'var(--accent-saffron)' : 'transparent',
                    color: gridSize === 4 ? '#FFFFFF' : 'var(--text-primary)',
                  }}
                >
                  4×4 (16 pcs)
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetPuzzle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
                title="Reset pieces back to scattered tray"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Interactive Arena (Board on Left, Scattered Tray on Right) */}
          <div
            ref={arenaRef}
            id="jigsaw-play-arena"
            className="relative isolate flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 sm:gap-8 select-none"
          >
            {/* --------------------------------------------------------
               LEFT: PUZZLE TARGET BOARD (Layer z-10)
               -------------------------------------------------------- */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className="flex items-center justify-between w-full px-2 text-xs font-bold"
                style={{ color: 'var(--accent-saffron-text)' }}
              >
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Assembly Board</span>
                </div>
                <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                  Drag pieces near targets to snap
                </span>
              </div>

              <div
                ref={boardRef}
                id="jigsaw-board-container"
                className="relative rounded-2xl border shadow-lg overflow-hidden transition-all z-10"
                style={{
                  width: boardSize,
                  height: boardSize,
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: isCompleted ? 'var(--accent-saffron)' : 'var(--border-warm)',
                  boxShadow: isCompleted ? '0 0 25px rgba(180, 83, 9, 0.35)' : undefined,
                }}
              >
                {/* Board grid silhouettes & piece placeholder wireframes */}
                <svg
                  width={boardSize}
                  height={boardSize}
                  className="absolute inset-0 pointer-events-none opacity-40"
                >
                  {pieces.map((p) => {
                    const cellW = boardSize / cols;
                    const cellH = boardSize / rows;
                    return (
                      <g
                        key={`wireframe-${p.id}`}
                        transform={`translate(${p.targetX}, ${p.targetY})`}
                      >
                        <path
                          d={p.pathData}
                          fill="none"
                          stroke="rgba(180, 83, 9, 0.3)"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Snapped pieces locked securely in the board */}
                {pieces
                  .filter((p) => p.isSnapped)
                  .map((p) => (
                    <div
                      key={`snapped-${p.id}`}
                      className="absolute pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
                      style={{
                        left: p.targetX,
                        top: p.targetY,
                        width: p.width,
                        height: p.height,
                      }}
                    >
                      <svg width={p.width} height={p.height}>
                        <defs>
                          <clipPath id={`board-snapped-clip-${p.id}`}>
                            <path d={p.pathData} />
                          </clipPath>
                        </defs>
                        <image
                          href={imageUrl}
                          x={p.imageX}
                          y={p.imageY}
                          width={boardSize}
                          height={boardSize}
                          clipPath={`url(#board-snapped-clip-${p.id})`}
                          preserveAspectRatio="none"
                        />
                        <path
                          d={p.pathData}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.45)"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                  ))}

                {/* All Snapped Celebration Overlay */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-3xs flex items-center justify-center pointer-events-none animate-in fade-in duration-500">
                    <div className="px-4 py-2 rounded-full bg-white/90 dark:bg-black/90 shadow-lg border border-amber-500 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Jigsaw Mastered • 100% Complete</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------
               RIGHT: SCATTERED PIECES TRAY / WORKBENCH
               -------------------------------------------------------- */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className="flex items-center justify-between w-full px-2 text-xs font-bold"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Piece Workbench ({totalPieces - snappedCount} unplaced)
                  </span>
                </div>
                <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                  Touch or mouse drag
                </span>
              </div>

              <div
                id="jigsaw-piece-tray"
                className="relative rounded-2xl border shadow-xs overflow-visible z-30"
                style={{
                  width: boardSize,
                  height: boardSize,
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                {/* Background grid markings for tray */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border-warm)_1px,transparent_0)] [background-size:24px_24px] opacity-40 pointer-events-none rounded-2xl" />

                {/* Empty State when all pieces are on board */}
                {pieces.every((p) => p.isSnapped) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 pointer-events-none animate-in fade-in">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                      All Pieces Snapped!
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      You have synthesized the full illustration.
                    </p>
                  </div>
                )}

                {/* Unplaced scattered pieces - rendered on the front layer */}
                {pieces
                  .filter((p) => !p.isSnapped)
                  .map((p) => {
                    const isDraggingThis = activePieceId === p.id;
                    const pieceZ = isDraggingThis ? 9999 : (p.zIndex || 50);

                    return (
                      <div
                        key={`unplaced-${p.id}`}
                        data-piece-id={p.id}
                        className="absolute select-none pointer-events-none"
                        style={{
                          left: p.currentX,
                          top: p.currentY,
                          width: p.width,
                          height: p.height,
                          zIndex: pieceZ,
                          touchAction: 'none',
                          filter: isDraggingThis
                            ? 'drop-shadow(0 14px 24px rgba(0,0,0,0.45))'
                            : 'drop-shadow(0 3px 8px rgba(0,0,0,0.25))',
                        }}
                      >
                        <svg
                          width={p.width}
                          height={p.height}
                          className="overflow-visible"
                          style={{ pointerEvents: 'none' }}
                        >
                          <defs>
                            <clipPath id={`tray-clip-${p.id}`}>
                              <path d={p.pathData} />
                            </clipPath>
                          </defs>

                          {/* Interactive piece group - only the piece shape captures clicks */}
                          <g
                            style={{
                              pointerEvents: 'auto',
                              cursor: isDraggingThis ? 'grabbing' : 'grab',
                            }}
                            onPointerDown={(e) => handlePointerDown(e, p.id)}
                          >
                            {/* Image crop matching piece geometry */}
                            <image
                              href={imageUrl}
                              x={p.imageX}
                              y={p.imageY}
                              width={boardSize}
                              height={boardSize}
                              clipPath={`url(#tray-clip-${p.id})`}
                              preserveAspectRatio="none"
                            />

                            {/* Crisp outline */}
                            <path
                              d={p.pathData}
                              fill="transparent"
                              stroke={isDraggingThis ? '#F59E0B' : 'rgba(255,255,255,0.75)'}
                              strokeWidth={isDraggingThis ? 2.5 : 1.5}
                            />
                          </g>
                        </svg>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Completion Celebration Card */}
          {isCompleted && (
            <div
              id="manan-completion-card"
              className="p-6 sm:p-8 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--accent-saffron)',
              }}
            >
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                >
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Stage 03 Completed • Reflection Mastered</span>
                  </div>
                  <h3 className="text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    Reflection Puzzle Mastered!
                  </h3>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    You have successfully synthesized and reconstructed the chapter concepts through contemplation.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-3">
                {onNavigateDashboard && (
                  <button
                    type="button"
                    onClick={onNavigateDashboard}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Back to Dashboard
                  </button>
                )}

                {onNavigateMyChapters && (
                  <button
                    type="button"
                    onClick={onNavigateMyChapters}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    My Chapters
                  </button>
                )}

                {/* Next Activity button after Jigsaw 100% complete */}
                <button
                  type="button"
                  onClick={handleAdvanceToWordle}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 cursor-pointer text-white animate-pulse"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                  }}
                  title="Next Activity: Word Quest"
                >
                  <span>Next Activity: Word Quest</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetPuzzle}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Persistent Progression Footer Card (Strictly Flow-Driven) */}
      <div
        id="manan-to-pariksha-footer"
        className="p-6 sm:p-7 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-5 transition-all shadow-sm mt-8"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                crosswordCompleted ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <h4 className="text-base sm:text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {crosswordCompleted
                ? 'All Manan Activities Completed!'
                : activeActivity === 'jigsaw'
                ? 'Step 1 of 3: Jigsaw Reflection'
                : activeActivity === 'wordle'
                ? 'Step 2 of 3: Word Quest (60s)'
                : 'Step 3 of 3: Crossword Quest'}
            </h4>
          </div>
          <p className="text-xs sm:text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            {crosswordCompleted
              ? 'You have mastered all three reflections (Jigsaw, Word Quest, and Crossword). Ready to advance to Stage 04: Pariksha!'
              : activeActivity === 'jigsaw'
              ? 'Assemble all puzzle pieces 100% to unlock the Next Activity (Word Quest).'
              : activeActivity === 'wordle'
              ? 'Solve all words with 100% accuracy to unlock the Crossword Quest.'
              : 'Complete the Crossword with 100% accuracy to unlock Stage 04: Pariksha.'}
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

          {/* Conditional Advancement Buttons: Only visible when the current activity is 100% complete! */}
          {activeActivity === 'jigsaw' && isCompleted && (
            <button
              type="button"
              onClick={handleAdvanceToWordle}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 cursor-pointer text-white animate-pulse"
              style={{
                backgroundColor: 'var(--accent-saffron)',
              }}
            >
              <span>Next Activity: Word Quest</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {activeActivity === 'wordle' && wordleCompleted && (
            <button
              type="button"
              onClick={handleAdvanceToCrossword}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 cursor-pointer text-white animate-pulse"
              style={{
                backgroundColor: 'var(--accent-saffron)',
              }}
            >
              <span>Next Activity: Crossword</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Go to Pariksha appears ONLY when Crossword is 100% complete! */}
          {crosswordCompleted && onNavigatePariksha && (
            <button
              type="button"
              id="btn-footer-go-to-pariksha"
              data-testid="btn-footer-go-to-pariksha"
              onClick={handleGoToPariksha}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 cursor-pointer text-white animate-bounce"
              style={{
                backgroundColor: 'var(--accent-saffron)',
              }}
              title="Go to Pariksha 25-Question Examination"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Go to Pariksha</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Target Image Reference Modal */}
      {showPreviewModal && imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Target Image Reference"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border p-6 sm:p-8 space-y-4 shadow-2xl relative"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                  Target Illustration Reference
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border shadow-inner" style={{ borderColor: 'var(--border-warm)' }}>
              <img
                src={imageUrl}
                alt={chapter.title || 'Target educational illustration'}
                className="w-full h-auto max-h-[60vh] object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between text-xs px-1" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3 h-3" />
                <span>Powered by Krea 2 Turbo</span>
              </span>
              <span>1024 × 1024 AI Illustration</span>
            </div>

            <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Use this reference to identify where each curved interlocking piece belongs on the assembly board.
            </p>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
