import React, { useState, useEffect, useRef, useCallback } from 'react';
import sacredLotusImg from '../../assets/images/gyanquest_sacred_lotus_1791870561244.jpg';
import heroDiyaImg from '../../assets/images/gyanquest_hero_diya_1791870559877.jpg';
import krishnaChariotImg from '../../assets/images/gyanquest_krishna_chariot_1791870561061.jpg';

import { PuzzleTile as TileType, BoardSlot, PuzzleImageTheme } from './types';
import { slicePuzzleImage, shuffleArray } from './imageProcessor';
import { PuzzleHeader } from './PuzzleHeader';
import { PuzzleBoard } from './PuzzleBoard';
import { PuzzleTray } from './PuzzleTray';
import { CompletionModal } from './CompletionModal';
import { vedicAudio } from '../../utils/gitaAudio';
import { useTheme } from '../../context/ThemeContext';
import { Image, Loader2, AlertCircle } from 'lucide-react';

const PUZZLE_THEMES: PuzzleImageTheme[] = [
  {
    id: 'sacred-lotus',
    name: 'Sacred Lotus of Harmony',
    subtitle: 'Balance in Every Day',
    src: sacredLotusImg,
    wisdomPillar: 'Circadian Equilibrium & Serene Mind',
    shlokaQuote: 'yuktāhāra-vihārasya yukta-ceṣṭasya karmasu (6.17)',
  },
  {
    id: 'hero-diya',
    name: 'Radiant Diya of Wisdom',
    subtitle: 'Inner Clarity & Knowledge',
    src: heroDiyaImg,
    wisdomPillar: 'Self-Discipline & Pure Focus',
    shlokaQuote: 'yathā dīpo nivāta-stho neṅgate sopamā smṛtā (6.19)',
  },
  {
    id: 'krishna-chariot',
    name: 'Chariot of Kurukshetra',
    subtitle: 'Direction of Mind & Senses',
    src: krishnaChariotImg,
    wisdomPillar: 'Mind Mastery & Devoted Action',
    shlokaQuote: 'manaḥ praśāntaṁ dhyāna-yogam (6.27)',
  },
];

interface HarmonyPuzzleGameProps {
  onHome: () => void;
  onOpenReader?: () => void;
  onNavigateGitaGame?: () => void;
}

export const HarmonyPuzzleGame: React.FC<HarmonyPuzzleGameProps> = ({
  onHome,
  onOpenReader,
  onNavigateGitaGame,
}) => {
  const { isDark } = useTheme();

  // Current selected puzzle theme image (defaults to Sacred Lotus: Harmony of Life)
  const [selectedTheme, setSelectedTheme] = useState<PuzzleImageTheme>(PUZZLE_THEMES[0]);

  // Loading & Generation State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // All 12 master tiles generated from current image
  const [allTiles, setAllTiles] = useState<TileType[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

  // Board Slots (12 slots, 4 cols x 3 rows)
  const [slots, setSlots] = useState<BoardSlot[]>([]);

  // Pieces waiting in the tray (shuffled)
  const [unplacedTiles, setUnplacedTiles] = useState<TileType[]>([]);

  // Selection state (for tap-to-place accessibility)
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);

  // Dragging state (native pointer drag)
  const [draggedTile, setDraggedTile] = useState<TileType | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);

  // Scoring & Completion
  const [scoreXP, setScoreXP] = useState<number>(0);
  const [recentlyPlacedId, setRecentlyPlacedId] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  // Guide hint toggle
  const [showGhostHint, setShowGhostHint] = useState<boolean>(false);

  // Drag avatar ref
  const dragContainerRef = useRef<HTMLDivElement>(null);

  // Sync acoustic theme mode
  useEffect(() => {
    vedicAudio.setTheme(isDark ? 'chandra' : 'surya');
  }, [isDark]);

  /**
   * Initializes the puzzle for a given image source
   */
  const initializePuzzle = useCallback(async (imageSrc: string) => {
    setIsLoading(true);
    setLoadError(null);
    setSelectedTileId(null);
    setDraggedTile(null);
    setPointerPos(null);
    setHoveredSlotIndex(null);
    setScoreXP(0);
    setRecentlyPlacedId(null);
    setShowCompletionModal(false);
    setHasCelebrated(false);

    try {
      // Divide image into 4 columns x 3 rows (12 pieces)
      const result = await slicePuzzleImage(imageSrc, 4, 3);

      setAllTiles(result.tiles);
      setImageAspectRatio(result.aspectRatio);

      // Create empty 12 slots
      const initialSlots: BoardSlot[] = Array.from({ length: 12 }, (_, i) => ({
        index: i,
        row: Math.floor(i / 4),
        col: i % 4,
        placedTileId: null,
      }));
      setSlots(initialSlots);

      // Shuffle pieces for the tray
      const shuffled = shuffleArray(result.tiles);
      setUnplacedTiles(shuffled);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize puzzle:', err);
      setLoadError('Failed to process puzzle image. Please try again.');
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount or when theme changes
  useEffect(() => {
    initializePuzzle(selectedTheme.src);
  }, [selectedTheme, initializePuzzle]);

  /**
   * Restart current game: resets score to 0 and reshuffles pieces
   */
  const handleRestart = () => {
    vedicAudio.playKeyType();
    setSelectedTileId(null);
    setDraggedTile(null);
    setPointerPos(null);
    setHoveredSlotIndex(null);
    setScoreXP(0);
    setRecentlyPlacedId(null);
    setShowCompletionModal(false);
    setHasCelebrated(false);

    // Reset board slots
    const resetSlots: BoardSlot[] = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      row: Math.floor(i / 4),
      col: i % 4,
      placedTileId: null,
    }));
    setSlots(resetSlots);

    // Reshuffle unplaced tiles
    setUnplacedTiles(shuffleArray(allTiles));
  };

  /**
   * Shuffle remaining tray pieces
   */
  const handleShuffleTray = () => {
    vedicAudio.playKeyType();
    setUnplacedTiles((prev) => shuffleArray(prev));
  };

  /**
   * Place piece into target slot if correct
   */
  const attemptPlaceTile = (tile: TileType, slotIndex: number): boolean => {
    const targetSlot = slots[slotIndex];

    // Slot is already occupied
    if (!targetSlot || targetSlot.placedTileId !== null) {
      vedicAudio.playPieceReturn();
      return false;
    }

    // Check if this slot matches the tile's exact original position
    if (tile.id === slotIndex) {
      // 1. Update Board Slot
      setSlots((prev) =>
        prev.map((s) => (s.index === slotIndex ? { ...s, placedTileId: tile.id } : s))
      );

      // 2. Remove tile from tray
      setUnplacedTiles((prev) => prev.filter((t) => t.id !== tile.id));

      // 3. Clear active selection
      setSelectedTileId(null);

      // 4. Award exactly 5 XP immediately (never twice)
      setScoreXP((prev) => prev + 5);

      // 5. Trigger snap sound & snap animation
      vedicAudio.playPieceSnap();
      setRecentlyPlacedId(tile.id);
      setTimeout(() => setRecentlyPlacedId(null), 800);

      return true;
    } else {
      // Incorrect slot -> piece returns to tray
      vedicAudio.playPieceReturn();
      return false;
    }
  };

  /**
   * Click / Tap selection handler
   */
  const handleSelectTile = (tileId: number) => {
    vedicAudio.playPiecePick();
    setSelectedTileId((prev) => (prev === tileId ? null : tileId));
  };

  /**
   * Board Slot Click Handler (for tap-to-place accessibility)
   */
  const handleSlotClick = (slotIndex: number) => {
    if (selectedTileId === null) return;

    const tile = allTiles.find((t) => t.id === selectedTileId);
    if (!tile) return;

    attemptPlaceTile(tile, slotIndex);
  };

  /**
   * Pointer Drag & Drop Engine
   */
  const handleTilePointerDown = (tile: TileType, e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button (left mouse) or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    vedicAudio.playPiecePick();

    setDraggedTile(tile);
    setSelectedTileId(null);
    setPointerPos({ x: e.clientX, y: e.clientY });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setPointerPos({ x: moveEvent.clientX, y: moveEvent.clientY });

      // Detect which slot is underneath pointer
      const elementUnder = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const slotElement = elementUnder?.closest('[data-slot-index]');

      if (slotElement) {
        const slotIdx = parseInt(slotElement.getAttribute('data-slot-index') || '-1', 10);
        if (slotIdx >= 0 && slotIdx < 12) {
          setHoveredSlotIndex(slotIdx);
          return;
        }
      }
      setHoveredSlotIndex(null);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Check drop target
      const elementUnder = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const slotElement = elementUnder?.closest('[data-slot-index]');

      if (slotElement) {
        const slotIdx = parseInt(slotElement.getAttribute('data-slot-index') || '-1', 10);
        if (slotIdx >= 0 && slotIdx < 12) {
          attemptPlaceTile(tile, slotIdx);
        } else {
          vedicAudio.playPieceReturn();
        }
      } else {
        // Dropped outside board -> return to tray
        vedicAudio.playPieceReturn();
      }

      setDraggedTile(null);
      setPointerPos(null);
      setHoveredSlotIndex(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Check for completion
  const placedCount = slots.filter((s) => s.placedTileId !== null).length;

  useEffect(() => {
    if (allTiles.length === 12 && placedCount === 12 && !hasCelebrated) {
      setHasCelebrated(true);
      const timer = setTimeout(() => {
        setShowCompletionModal(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [placedCount, allTiles.length, hasCelebrated]);

  return (
    <div
      ref={dragContainerRef}
      className="min-h-screen w-full py-6 px-3 sm:px-6 lg:px-8 space-y-6 transition-colors select-none"
      style={{
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PuzzleHeader
          scoreXP={scoreXP}
          placedCount={placedCount}
          totalPieces={allTiles.length || 12}
          showGhostHint={showGhostHint}
          onToggleGhostHint={() => setShowGhostHint(!showGhostHint)}
          onRestart={handleRestart}
          onHome={onHome}
          onOpenReader={onOpenReader}
        />

        {/* Artwork Selector Bar */}
        <div
          className="p-3 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-2xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Sacred Artwork Theme:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PUZZLE_THEMES.map((theme) => {
              const isSelected = selectedTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  id={`btn-theme-${theme.id}`}
                  onClick={() => {
                    if (selectedTheme.id !== theme.id) {
                      vedicAudio.playKeyType();
                      setSelectedTheme(theme);
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-500 shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--accent-saffron-light)'
                      : 'var(--bg-card-subtle)',
                    borderColor: isSelected
                      ? 'var(--accent-saffron)'
                      : 'var(--border-warm)',
                    color: isSelected
                      ? 'var(--accent-saffron-text)'
                      : 'var(--text-secondary)',
                  }}
                >
                  <img
                    src={theme.src}
                    alt={theme.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div
            className="p-16 rounded-3xl border flex flex-col items-center justify-center space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Processing sacred image tiles...
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Dividing image into 12 seamless pieces via Canvas
            </p>
          </div>
        ) : loadError ? (
          <div
            className="p-8 rounded-3xl border border-red-500/40 bg-red-500/10 flex flex-col items-center justify-center space-y-3 text-center"
          >
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{loadError}</p>
            <button
              type="button"
              onClick={() => initializePuzzle(selectedTheme.src)}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          /* Main Interactive Game Arena */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Puzzle Board (Takes 7 cols on large screens) */}
            <div className="lg:col-span-7 flex flex-col items-center w-full">
              <PuzzleBoard
                slots={slots}
                allTiles={allTiles}
                boardAspectRatio={imageAspectRatio}
                hoveredSlotIndex={hoveredSlotIndex}
                selectedTileId={selectedTileId}
                fullImageSrc={selectedTheme.src}
                showGhostHint={showGhostHint}
                recentlyPlacedId={recentlyPlacedId}
                onSlotClick={handleSlotClick}
                onSlotPointerEnter={(idx) => {
                  if (draggedTile) setHoveredSlotIndex(idx);
                }}
                onSlotPointerLeave={() => {
                  if (draggedTile) setHoveredSlotIndex(null);
                }}
              />
            </div>

            {/* Right Column: Shuffled Pieces Tray (Takes 5 cols on large screens) */}
            <div className="lg:col-span-5 w-full">
              <PuzzleTray
                unplacedTiles={unplacedTiles}
                selectedTileId={selectedTileId}
                draggedTileId={draggedTile?.id ?? null}
                onSelectTile={handleSelectTile}
                onTilePointerDown={handleTilePointerDown}
                onShuffleTray={handleShuffleTray}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Drag Avatar (Follows pointer) */}
      {draggedTile && pointerPos && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 w-28 sm:w-36 rounded-xl overflow-hidden shadow-2xl ring-4 ring-amber-400/80 scale-105 opacity-90 transition-transform"
          style={{
            left: `${pointerPos.x}px`,
            top: `${pointerPos.y}px`,
            aspectRatio: `${draggedTile.aspectRatio}`,
          }}
        >
          <img
            src={draggedTile.dataUrl}
            alt="Dragging piece"
            className="w-full h-full object-cover block"
          />
        </div>
      )}

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        scoreXP={scoreXP}
        totalPieces={12}
        completedImageSrc={selectedTheme.src}
        onPlayAgain={handleRestart}
        onHome={onHome}
        onOpenReader={onOpenReader}
      />
    </div>
  );
};
