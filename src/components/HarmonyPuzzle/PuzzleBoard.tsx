import React from 'react';
import { BoardSlot, PuzzleTile as TileType } from './types';
import { PuzzleTile } from './PuzzleTile';
import { Sparkles, HelpCircle } from 'lucide-react';

interface PuzzleBoardProps {
  slots: BoardSlot[];
  allTiles: TileType[];
  boardAspectRatio: number;
  hoveredSlotIndex: number | null;
  selectedTileId: number | null;
  fullImageSrc: string;
  showGhostHint: boolean;
  recentlyPlacedId: number | null;
  onSlotClick: (slotIndex: number) => void;
  onSlotPointerEnter?: (slotIndex: number) => void;
  onSlotPointerLeave?: (slotIndex: number) => void;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  slots,
  allTiles,
  boardAspectRatio,
  hoveredSlotIndex,
  selectedTileId,
  fullImageSrc,
  showGhostHint,
  recentlyPlacedId,
  onSlotClick,
  onSlotPointerEnter,
  onSlotPointerLeave,
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Board Outer Container Card */}
      <div
        className="relative w-full max-w-[620px] rounded-3xl p-3 sm:p-4 border shadow-md overflow-hidden transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {/* Subtle Watermark Guide Background if enabled */}
        {showGhostHint && (
          <div className="absolute inset-3 sm:inset-4 rounded-2xl overflow-hidden pointer-events-none opacity-25 dark:opacity-20 z-0">
            <img
              src={fullImageSrc}
              alt="Faint image guide"
              className="w-full h-full object-cover filter blur-[0.5px]"
            />
          </div>
        )}

        {/* 4-column by 3-row Board Grid */}
        <div
          id="puzzle-board-grid"
          className="relative z-10 grid grid-cols-4 grid-rows-3 gap-[1px] w-full rounded-2xl overflow-hidden bg-stone-300 dark:bg-stone-700/80 p-[1px] border border-stone-300/80 dark:border-stone-700/80 shadow-inner"
          style={{
            aspectRatio: `${boardAspectRatio}`,
          }}
        >
          {slots.map((slot) => {
            const placedTile =
              slot.placedTileId !== null
                ? allTiles.find((t) => t.id === slot.placedTileId)
                : null;

            const isHovered = hoveredSlotIndex === slot.index;
            const isTargetOfSelection =
              selectedTileId !== null && slot.placedTileId === null;
            const isRecentlyPlaced =
              placedTile && placedTile.id === recentlyPlacedId;

            return (
              <div
                key={`slot-${slot.index}`}
                id={`puzzle-slot-${slot.index}`}
                data-slot-index={slot.index}
                onClick={() => onSlotClick(slot.index)}
                onPointerEnter={() => onSlotPointerEnter?.(slot.index)}
                onPointerLeave={() => onSlotPointerLeave?.(slot.index)}
                role="region"
                aria-label={`Slot ${slot.index + 1} of 12. ${
                  placedTile ? 'Occupied' : 'Empty. Click to place selected tile.'
                }`}
                tabIndex={placedTile ? -1 : 0}
                onKeyDown={(e) => {
                  if (!placedTile && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSlotClick(slot.index);
                  }
                }}
                className={`relative flex items-center justify-center transition-all duration-150 overflow-hidden select-none ${
                  placedTile
                    ? 'p-0 cursor-default rounded-none border-0 bg-transparent'
                    : 'border border-dashed cursor-pointer rounded-xs'
                } ${
                  isHovered
                    ? 'ring-2 ring-amber-400 border-amber-500 bg-amber-500/20 z-20 shadow-sm'
                    : isTargetOfSelection
                    ? 'border-amber-400/80 bg-amber-400/10 hover:bg-amber-400/20'
                    : placedTile
                    ? 'border-0 bg-transparent'
                    : 'border-stone-300/80 dark:border-stone-700/80 bg-stone-100/70 dark:bg-stone-900/50'
                }`}
              >
                {placedTile ? (
                  /* Correctly Placed Tile Locked on Board (Zero gap/rounding) */
                  <div className="w-full h-full">
                    <PuzzleTile
                      tile={placedTile}
                      isPlaced={true}
                      justPlaced={isRecentlyPlaced}
                    />
                  </div>
                ) : (
                  /* Empty Slot Placeholder */
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center pointer-events-none">
                    <span
                      className="text-[10px] sm:text-xs font-mono font-bold transition-opacity"
                      style={{
                        color: isHovered
                          ? 'var(--accent-saffron-text)'
                          : 'var(--text-muted)',
                        opacity: showGhostHint ? 0.3 : 0.6,
                      }}
                    >
                      {slot.index + 1}
                    </span>

                    {isHovered && (
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 animate-pulse mt-0.5">
                        Drop here
                      </span>
                    )}

                    {isTargetOfSelection && !isHovered && (
                      <span className="hidden sm:inline text-[8px] uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70">
                        Tap slot
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Board Bottom Caption */}
        <div className="mt-3 flex items-center justify-between text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>4 × 3 Grid • 12 Harmonious Pieces</span>
          </span>
          <span className="hidden sm:inline font-mono">
            {slots.filter((s) => s.placedTileId !== null).length} / 12 Placed
          </span>
        </div>
      </div>
    </div>
  );
};
