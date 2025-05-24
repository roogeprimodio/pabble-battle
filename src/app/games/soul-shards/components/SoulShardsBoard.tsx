// src/app/games/soul-shards/components/SoulShardsBoard.tsx
"use client";

import React from 'react';
import type { BoardState, Player, Unit, SoulShard } from '@/lib/soul-shards-rules';
import { BOARD_ROWS, BOARD_COLS } from '@/lib/soul-shards-rules';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn'; // Reuse for now
import { Gem } from 'lucide-react'; // Removed Shield, Axe as they aren't used yet

interface SoulShardsBoardProps {
  board: BoardState;
  units: Unit[];
  shards: SoulShard[];
  onCellClick: (r: number, c: number) => void;
  selectedUnitId: string | null;
  currentPlayer: Player;
  disabled: boolean;
}

const SoulShardsBoard: React.FC<SoulShardsBoardProps> = ({
  board,
  units,
  shards,
  onCellClick,
  selectedUnitId,
  currentPlayer,
  disabled,
}) => {
  const getUnitAt = (r: number, c: number): Unit | undefined => {
    // Check the board state first for the unitId, then find the unit from the list
    const cellUnitId = board[r]?.[c]?.unitId;
    if (cellUnitId) {
      return units.find(u => u.id === cellUnitId);
    }
    // Fallback: check unit positions directly (though board.unitId should be canonical)
    return units.find(u => u.position.r === r && u.position.c === c);
  };

  const getShardAt = (r: number, c: number): SoulShard | undefined => {
    return shards.find(s => s.position.r === r && s.position.c === c);
  };

  return (
    <div 
      className="grid gap-0.5 p-1 bg-gradient-to-br from-secondary/10 via-secondary/20 to-secondary/10 rounded-lg shadow-inner w-full aspect-square max-w-md sm:max-w-lg md:max-w-xl"
      style={{ 
        gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${BOARD_ROWS}, minmax(0, 1fr))` 
      }}
    >
      {board.map((row, rIndex) =>
        row.map((cell, cIndex) => {
          const unit = getUnitAt(rIndex, cIndex);
          const shard = getShardAt(rIndex, cIndex); // This needs to be integrated with board state if shards are dynamic
          const isSelectedUnit = unit?.id === selectedUnitId;

          return (
            <button
              key={`${rIndex}-${cIndex}`}
              onClick={() => !disabled && onCellClick(rIndex, cIndex)}
              disabled={disabled || cell.terrain === 'impassable'}
              aria-label={`Cell ${rIndex},${cIndex}. Terrain: ${cell.terrain}. ${unit ? `Unit: ${unit.type} owned by Player ${unit.player}` : ''} ${shard ? `Shard present` : ''}`}
              className={`
                flex items-center justify-center aspect-square relative
                transition-all duration-150 ease-in-out focus:outline-none
                ${cell.terrain === 'plains' ? 'bg-card/80 hover:bg-muted/70 dark:hover:bg-muted/40' : ''}
                ${cell.terrain === 'difficult' ? 'bg-yellow-200/30 hover:bg-yellow-300/40 dark:bg-yellow-700/30 dark:hover:bg-yellow-600/40' : ''}
                ${cell.terrain === 'impassable' ? 'bg-slate-600/50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelectedUnit ? (unit?.player === 1 ? 'ring-2 ring-primary shadow-lg' : 'ring-2 ring-destructive shadow-lg') : ''}
                focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent
              `}
            >
              {shard && (
                <Gem className={`absolute w-1/3 h-1/3 text-accent/70 opacity-60 animate-pulse z-0 ${unit ? 'bottom-0 right-0' : '' }`} />
              )}
              {unit && (
                <div className={`transform scale-[0.6] sm:scale-[0.7] z-10 ${isSelectedUnit ? (unit.player === 1 ? 'animate-subtle-glow text-primary': 'animate-subtle-glow text-destructive') : ''}`}>
                  <PlayerPawnDisplay player={unit.player} size="normal" />
                </div>
              )}
               {/* Placeholder for future unit type indicators or actions */}
            </button>
          );
        })
      )}
    </div>
  );
};

export default SoulShardsBoard;
