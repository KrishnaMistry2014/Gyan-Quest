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
  ArrowRight,
  BookOpen,
  Headphones,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { SavedChapter } from '../lib/chapters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { claimChapterStageReward } from '../lib/firebase';
import { playMindfulChime } from '../lib/chime';
import {
  generateChapterImage,
  buildEducationalImagePrompt
} from '../lib/mananApi';
import {
  JigsawPiece,
  generateJigsawPuzzle,
  checkPieceSnap
} from '../lib/jigsawEngine';

interface MananPageProps {
  chapter: SavedChapter;
  onBackToShravan: () => void;
  onBackToVidya?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateMyChapters?: () => void;
}

export const MananPage: React.FC<MananPageProps> = ({
  chapter,
  onBackToShravan,
  onBackToVidya,
  onNavigateDashboard,
  onNavigateMyChapters,
}) => {
  const { user, updateProfileXp, refreshUser, isStreakActiveToday, recordStreakActivity } = useAuth();
  const { showToast } = useToast();

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
    if (isGeneratingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check session cache first to prevent duplicate API generation
    const sessionCacheKey = `gq_manan_img_${chapter.id || chapter.uniqueCode}`;
    if (!forceNew) {
      const cachedUrl = sessionStorage.getItem(sessionCacheKey);
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setStatus('ready');
        setErrorMessage('');
        initPuzzlePieces(cachedUrl, gridSize, boardSize);
        return;
      }
    }

    isGeneratingRef.current = true;
    setStatus('generating');
    setErrorMessage('');
    setStatusMessage('Formulating educational prompt from chapter concepts...');

    try {
      const prompt = buildEducationalImagePrompt(chapter);
      setStatusMessage('Sending request to image generation service (Render Turbo)...');

      const url = await generateChapterImage(prompt, controller.signal);
      sessionStorage.setItem(sessionCacheKey, url);

      setImageUrl(url);
      setStatus('ready');
      initPuzzlePieces(url, gridSize, boardSize);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Error generating Manan puzzle image:', err);
      setStatus('error');
      setErrorMessage(
        err?.message ||
          'Failed to generate chapter illustration. Please check your connection and retry.'
      );
    } finally {
      isGeneratingRef.current = false;
    }
  }, [chapter, gridSize, boardSize]);

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

  // Initial load on mount
  useEffect(() => {
    loadPuzzleImage(false);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Completion check and reward claiming
  useEffect(() => {
    if (pieces.length === 0) return;
    const allSnapped = pieces.every((p) => p.isSnapped);

    if (allSnapped && !isCompleted) {
      setIsCompleted(true);
      playMindfulChime();

      // Claim stage reward once per completed session
      if (!rewardClaimedRef.current) {
        rewardClaimedRef.current = true;
        claimChapterStageReward(chapter, 'manan', user)
          .then((reward) => {
            if (reward.awarded) {
              showToast({
                title: `+${reward.xpAdded} XP Added!`,
                message: 'Manan Reflection Puzzle Mastered!',
                type: 'xp',
                xpAmount: reward.xpAdded,
              });
              updateProfileXp(reward.newTotal);
              refreshUser?.();
            } else {
              showToast({
                title: 'Puzzle Solved!',
                message: 'Excellent reflection! All pieces aligned.',
                type: 'success',
              });
            }
          })
          .catch((err) => console.warn('Reward claim notification:', err));

        // Maintain daily streak for Manan
        if (!isStreakActiveToday && recordStreakActivity) {
          recordStreakActivity('manan').catch(() => {});
        }
      }
    }
  }, [pieces, isCompleted, chapter, user, isStreakActiveToday, recordStreakActivity, showToast, updateProfileXp, refreshUser]);

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
  // POINTER EVENT DRAG & SNAP HANDLERS
  // --------------------------------------------------------------------------
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    pieceId: number
  ) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece || piece.isSnapped) return;

    e.preventDefault();
    e.stopPropagation();

    const targetEl = e.currentTarget;
    targetEl.setPointerCapture(e.pointerId);

    setActivePieceId(pieceId);
    dragInfoRef.current = {
      pieceId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPieceX: piece.currentX,
      startPieceY: piece.currentY,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const info = dragInfoRef.current;
    if (!info || activePieceId === null) return;

    e.preventDefault();
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

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const info = dragInfoRef.current;
    if (!info || activePieceId === null) {
      dragInfoRef.current = null;
      setActivePieceId(null);
      return;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const piece = pieces.find((p) => p.id === info.pieceId);
    if (!piece || piece.isSnapped) {
      dragInfoRef.current = null;
      setActivePieceId(null);
      return;
    }

    if (info.hasMoved) {
      setMoves((m) => m + 1);
    }

    // Measure live coordinates relative to the board container
    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      // The current piece element's position on screen
      const pieceEl = e.currentTarget;
      const pieceRect = pieceEl.getBoundingClientRect();

      const boardCoordX = pieceRect.left - boardRect.left;
      const boardCoordY = pieceRect.top - boardRect.top;

      // Magnetic snap check
      const didSnap = checkPieceSnap(piece, boardCoordX, boardCoordY, 44);

      if (didSnap) {
        // Snap piece onto board accurately!
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

        // Gentle subtle chime feedback on snap
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

    dragInfoRef.current = null;
    setActivePieceId(null);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    dragInfoRef.current = null;
    setActivePieceId(null);
  };

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
            <span>Back to Shravan</span>
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
              <span>Vidya Notes</span>
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
        </div>
      </header>

      {/* Main Stage Content */}
      {status === 'generating' ? (
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
        /* Error & Retry View */
        <div
          id="manan-error-card"
          className="rounded-3xl border p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-5 my-8 max-w-xl mx-auto"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: '#EF4444',
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
              Image Generation Unavailable
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {errorMessage}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => loadPuzzleImage(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Generation</span>
            </button>

            <button
              type="button"
              onClick={onBackToShravan}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              Back to Shravan
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

            {/* Difficulty & Reset controls */}
            <div className="flex items-center gap-2 sm:gap-3">
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

              <button
                type="button"
                onClick={() => loadPuzzleImage(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
                title="Generate a fresh illustration for this chapter"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Image</span>
              </button>
            </div>
          </div>

          {/* Interactive Arena (Board on Left, Scattered Tray on Right) */}
          <div
            ref={arenaRef}
            id="jigsaw-play-arena"
            className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 sm:gap-8 select-none"
          >
            {/* --------------------------------------------------------
               LEFT: PUZZLE TARGET BOARD
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
                className="relative rounded-2xl border shadow-lg overflow-hidden transition-all"
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
                className="relative rounded-2xl border shadow-xs overflow-hidden"
                style={{
                  width: boardSize,
                  height: boardSize,
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                {/* Background grid markings for tray */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border-warm)_1px,transparent_0)] [background-size:24px_24px] opacity-40 pointer-events-none" />

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

                {/* Unplaced scattered pieces */}
                {pieces
                  .filter((p) => !p.isSnapped)
                  .map((p) => {
                    const isDraggingThis = activePieceId === p.id;
                    return (
                      <div
                        key={`unplaced-${p.id}`}
                        data-piece-id={p.id}
                        onPointerDown={(e) => handlePointerDown(e, p.id)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerCancel}
                        className={`absolute cursor-grab active:cursor-grabbing transition-transform select-none ${
                          isDraggingThis ? 'scale-105 z-50' : 'hover:scale-102 z-10'
                        }`}
                        style={{
                          left: p.currentX,
                          top: p.currentY,
                          width: p.width,
                          height: p.height,
                          touchAction: 'none',
                          filter: isDraggingThis
                            ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.35))'
                            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.22))',
                        }}
                      >
                        <svg width={p.width} height={p.height} className="pointer-events-none">
                          <defs>
                            <clipPath id={`tray-clip-${p.id}`}>
                              <path d={p.pathData} />
                            </clipPath>
                          </defs>

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

                          {/* Subtle highlight border */}
                          <path
                            d={p.pathData}
                            fill="none"
                            stroke={isDraggingThis ? 'var(--accent-saffron-bright)' : 'rgba(255,255,255,0.7)'}
                            strokeWidth={isDraggingThis ? 2.5 : 1.5}
                          />
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
                    <span>Stage 03 Completed • +5 XP Added</span>
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

                <button
                  type="button"
                  onClick={() => loadPuzzleImage(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                >
                  <span>New Reflection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
