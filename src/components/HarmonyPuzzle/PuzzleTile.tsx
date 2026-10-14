import React from 'react';
import { PuzzleTile as TileType } from './types';
import { Check } from 'lucide-react';

interface PuzzleTileProps {
  tile: TileType;
  isPlaced?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  justPlaced?: boolean;
  onSelect?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const PuzzleTile: React.FC<PuzzleTileProps> = ({
  tile,
  isPlaced = false,
  isSelected = false,
  isDragging = false,
  justPlaced = false,
  onSelect,
  onPointerDown,
}) => {
  return (
    <div
      role="button"
      tabIndex={isPlaced ? -1 : 0}
      aria-label={
        isPlaced
          ? `Correctly placed puzzle tile`
          : `Puzzle tile. ${isSelected ? 'Selected. Tap a slot to place.' : 'Tap or drag to place.'}`
      }
      onKeyDown={(e) => {
        if (!isPlaced && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect?.();
        }
      }}
      onClick={!isPlaced ? onSelect : undefined}
      onPointerDown={!isPlaced ? onPointerDown : undefined}
      className={`relative overflow-hidden select-none transition-all duration-200 ${
        isPlaced
          ? 'w-full h-full rounded-none cursor-default shadow-none ring-0'
          : 'rounded-xl cursor-grab active:cursor-grabbing hover:scale-102 hover:shadow-md'
      } ${
        isSelected
          ? 'ring-3 ring-amber-500 shadow-lg scale-103 z-20 animate-pulse'
          : ''
      } ${
        isDragging
          ? 'opacity-40 grayscale-20 scale-95'
          : 'opacity-100'
      } ${
        justPlaced ? 'animate-pulse ring-2 ring-emerald-400 z-30' : ''
      }`}
      style={{
        touchAction: isPlaced ? 'auto' : 'none',
        aspectRatio: !isPlaced ? `${tile.aspectRatio}` : undefined,
        backgroundColor: 'var(--bg-card-subtle)',
      }}
    >
      {/* Sliced Image Section */}
      <img
        src={tile.dataUrl}
        alt="Puzzle piece"
        draggable={false}
        className="w-full h-full object-cover block pointer-events-none"
      />

      {/* Subtle Border Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors ${
          isPlaced
            ? 'border-0'
            : isSelected
            ? 'border-2 border-amber-500'
            : 'border border-white/20 dark:border-white/10'
        }`}
      />

      {/* Correct Snap Checkmark Badge */}
      {justPlaced && (
        <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
        </div>
      )}

      {/* Subtle selection ring indicator */}
      {isSelected && !isPlaced && (
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
          Selected
        </div>
      )}
    </div>
  );
};
