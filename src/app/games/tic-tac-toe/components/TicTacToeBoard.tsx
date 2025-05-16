
// src/app/games/tic-tac-toe/components/TicTacToeBoard.tsx
"use client";

import React from 'react';
import type { BoardState, Player } from '@/lib/tic-tac-toe-rules';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn'; // Reusing for visual consistency
import { cn } from '@/lib/utils';

interface TicTacToeBoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  disabled: boolean;
  winningCombination: number[] | null;
  currentPlayer: Player;
}

const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ board, onCellClick, disabled, winningCombination, currentPlayer }) => {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-br from-secondary/20 via-secondary/30 to-secondary/20 rounded-lg shadow-inner w-full aspect-square max-w-xs sm:max-w-sm md:max-w-md">
      {board.map((cell, index) => {
        const isWinningCell = winningCombination?.includes(index);
        const canClick = !cell && !disabled;
        
        return (
          <button
            key={index}
            onClick={() => canClick && onCellClick(index)}
            disabled={!canClick}
            aria-label={`Cell ${index + 1}, ${cell ? `Player ${cell} placed` : 'Empty'}`}
            className={cn(
              "flex items-center justify-center aspect-square rounded-md transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isWinningCell ? (cell === 1 ? 'bg-primary/30' : 'bg-destructive/30') : 'bg-card hover:bg-muted/70 dark:hover:bg-muted/40',
              canClick ? `cursor-pointer ${currentPlayer === 1 ? 'focus-visible:ring-primary' : 'focus-visible:ring-destructive'}` : 'cursor-not-allowed',
              cell && 'shadow-sm'
            )}
          >
            {cell && (
              <div className={cn(
                  "transform scale-50 sm:scale-60 md:scale-75 transition-transform duration-200 ease-out",
                  isWinningCell && "animate-subtle-glow scale-[0.6] sm:scale-[0.7] md:scale-[0.85]"
                )}
              >
                <PlayerPawnDisplay player={cell} size="normal" />
              </div>
            )}
            {!cell && !disabled && (
              <div className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                 <div className={cn(
                    "transform scale-50 sm:scale-60 md:scale-75 opacity-30",
                    currentPlayer === 1 ? 'text-primary' : 'text-destructive'
                  )}>
                    <PlayerPawnDisplay player={currentPlayer} size="normal"/>
                 </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TicTacToeBoard;
