
// src/app/games/soul-shards/components/SoulShardsBoard.tsx
"use client";

import React from 'react';
import type { BoardState, Player, Unit, SoulShard } from '@/lib/soul-shards-rules';
import { BOARD_ROWS, BOARD_COLS, HARVESTER_MOVEMENT_RANGE, isValidMove, getPlayerDeploymentZone } from '@/lib/soul-shards-rules';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn'; // Reuse for now
import { Gem } from 'lucide-react'; 

interface SoulShardsBoardProps {
  board: BoardState;
  units: Unit[];
  shards: SoulShard[];
  onCellClick: (r: number, c: number) => void;
  selectedUnitId: string | null;
  currentPlayer: Player;
  disabled: boolean;
  gamePhase: string; // 'deployment' or 'playing'
}

const SoulShardsBoard: React.FC<SoulShardsBoardProps> = ({
  board,
  units,
  shards,
  onCellClick,
  selectedUnitId,
  currentPlayer,
  disabled,
  gamePhase,
}) => {
  const getUnitAt = (r: number, c: number): Unit | undefined => {
    const cellUnitId = board[r]?.[c]?.unitId;
    if (cellUnitId) {
      return units.find(u => u.id === cellUnitId);
    }
    return units.find(u => u.position.r === r && u.position.c === c);
  };

  const getShardAt = (r: number, c: number): SoulShard | undefined => {
    const cellShardId = board[r]?.[c]?.shardId;
    if (cellShardId) {
        return shards.find(s => s.id === cellShardId);
    }
    return undefined;
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
          const shard = getShardAt(rIndex, cIndex);
          const isSelectedUnitCell = unit?.id === selectedUnitId;
          
          let cellClass = "";
          let isPossibleMove = false;
          let isDeploymentCell = false;

          if (gamePhase === 'deployment') {
            const deploymentZone = getPlayerDeploymentZone(currentPlayer);
            if (rIndex >= deploymentZone.startRow && rIndex <= deploymentZone.endRow && !cell.unitId && cell.terrain !== 'impassable') {
              isDeploymentCell = true;
              cellClass = currentPlayer === 1 ? "bg-primary/10 hover:bg-primary/20" : "bg-destructive/10 hover:bg-destructive/20";
            }
          } else if (gamePhase === 'playing' && selectedUnitId) {
            const selectedUnit = units.find(u => u.id === selectedUnitId);
            if (selectedUnit && isValidMove(selectedUnit, rIndex, cIndex, board)) {
              isPossibleMove = true;
              cellClass = "bg-accent/20 hover:bg-accent/30 ring-1 ring-accent/50";
            }
          }

          return (
            <button
              key={`${rIndex}-${cIndex}`}
              onClick={() => !disabled && onCellClick(rIndex, cIndex)}
              disabled={disabled || cell.terrain === 'impassable'}
              aria-label={`Cell ${rIndex},${cIndex}. Terrain: ${cell.terrain}. ${unit ? `Unit: ${unit.type} owned by Player ${unit.player}` : ''} ${shard ? `Shard present` : ''}`}
              className={`
                flex items-center justify-center aspect-square relative
                transition-all duration-150 ease-in-out focus:outline-none
                ${cell.terrain === 'plains' ? (isDeploymentCell || isPossibleMove ? '' : 'bg-card/80 hover:bg-muted/70 dark:hover:bg-muted/40') : ''}
                ${cell.terrain === 'difficult' ? (isDeploymentCell || isPossibleMove ? '' : 'bg-yellow-200/30 hover:bg-yellow-300/40 dark:bg-yellow-700/30 dark:hover:bg-yellow-600/40') : ''}
                ${cell.terrain === 'impassable' ? 'bg-slate-600/50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelectedUnitCell ? (unit?.player === 1 ? 'ring-2 ring-primary shadow-lg' : 'ring-2 ring-destructive shadow-lg') : ''}
                ${cellClass}
                focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent
              `}
            >
              {shard && (
                <Gem className={`absolute w-1/2 h-1/2 text-accent/70 opacity-70 animate-pulse z-0 ${unit ? 'bottom-0 right-0 scale-75' : 'scale-100' }`} />
              )}
              {unit && (
                <div className={`transform scale-[0.7] sm:scale-[0.8] z-10 ${isSelectedUnitCell ? (unit.player === 1 ? 'animate-subtle-glow text-primary': 'animate-subtle-glow text-destructive') : ''}`}>
                  <PlayerPawnDisplay player={unit.player} size="normal" />
                </div>
              )}
            </button>
          );
        })
      )}
    </div>
  );
};

export default SoulShardsBoard;

