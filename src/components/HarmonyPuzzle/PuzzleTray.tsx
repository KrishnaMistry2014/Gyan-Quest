import React from 'react';
import { PuzzleTile as TileType } from './types';
import { PuzzleTile } from './PuzzleTile';
import { Shuffle, Layers, Hand, CheckCircle2 } from 'lucide-react';

interface PuzzleTrayProps {
  unplacedTiles: TileType[];
  selectedTileId: number | null;
  draggedTileId: number | null;
  onSelectTile: (tileId: number) => void;
  onTilePointerDown: (tile: TileType, e: React.PointerEvent<HTMLDivElement>) => void;
  onShuffleTray: () => void;
}

export const PuzzleTray: React.FC<PuzzleTrayProps> = ({
  unplacedTiles,
  selectedTileId,
  draggedTileId,
  onSelectTile,
  onTilePointerDown,
  onShuffleTray,
}) => {
  return (
    <div
      className="w-full rounded-3xl p-4 sm:p-5 border shadow-sm flex flex-col transition-all"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-warm)',
      }}
    >
      {/* Tray Header */}
      <div className="flex items-center justify-between pb-3 border-b mb-3.5" style={{ borderColor: 'var(--border-warm)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Pieces Tray
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {unplacedTiles.length} {unplacedTiles.length === 1 ? 'piece' : 'pieces'} waiting to be placed
            </p>
          </div>
        </div>

        {unplacedTiles.length > 1 && (
          <button
            type="button"
            id="btn-shuffle-tray"
            onClick={onShuffleTray}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
            title="Shuffle remaining tray pieces"
          >
            <Shuffle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        )}
      </div>

      {/* Helpful Hint banner for touch/mouse */}
      <div
        className="mb-3 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-2"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <Hand className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          <strong className="text-amber-700 dark:text-amber-400">Drag & drop</strong> to slot, or <strong className="text-amber-700 dark:text-amber-400">tap piece then tap slot</strong>.
        </span>
      </div>

      {/* Pieces Grid Container */}
      {unplacedTiles.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            All Pieces On Board!
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Inspect your restored artwork on the puzzle board.
          </p>
        </div>
      ) : (
        <div
          id="puzzle-pieces-tray-grid"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 max-h-[480px] overflow-y-auto p-1 pr-1.5 custom-scrollbar"
        >
          {unplacedTiles.map((tile) => {
            const isSelected = selectedTileId === tile.id;
            const isDragging = draggedTileId === tile.id;

            return (
              <div
                key={`tray-tile-${tile.id}`}
                id={`tray-tile-${tile.id}`}
                className="transition-transform duration-150"
              >
                <PuzzleTile
                  tile={tile}
                  isSelected={isSelected}
                  isDragging={isDragging}
                  onSelect={() => onSelectTile(tile.id)}
                  onPointerDown={(e) => onTilePointerDown(tile, e)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
