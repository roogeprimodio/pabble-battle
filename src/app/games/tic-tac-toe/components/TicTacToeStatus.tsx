
// src/app/games/tic-tac-toe/components/TicTacToeStatus.tsx
"use client";

import React from 'react';
import type { Player, GamePhase } from '@/lib/tic-tac-toe-rules';
import { getPlayerThematicName } from '@/lib/tic-tac-toe-rules';
import { Swords, RotateCcw, Info, Sparkles, Skull } from 'lucide-react';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn';

interface TicTacToeStatusProps {
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  gamePhase: GamePhase;
  message: string;
}

const TicTacToeStatus: React.FC<TicTacToeStatusProps> = ({
  currentPlayer,
  winner,
  isDraw,
  gamePhase,
  message,
}) => {
  
  const PlayerInfo: React.FC<{ player: Player, name: string, isCurrent: boolean, isWinner: boolean }> = ({ player, name, isCurrent, isWinner }) => {
    const baseClasses = "p-2 sm:p-3 rounded-lg border-2 flex-1 text-center transition-all duration-300 ease-in-out min-w-[100px] sm:min-w-[120px]";
    const playerClass = player === 1 
      ? "border-primary/70 bg-primary/10 text-primary dark:bg-primary/20 dark:border-primary/60" 
      : "border-destructive/70 bg-destructive/10 text-destructive dark:bg-destructive/20 dark:border-destructive/60";
    
    const activeClass = isCurrent && !winner && !isDraw
      ? `ring-2 ring-offset-background scale-105 shadow-lg ${player === 1 ? 'ring-primary' : 'ring-destructive'}` 
      : "opacity-80 hover:opacity-100";
    
    const winnerClass = isWinner ? (player === 1 ? "ring-4 ring-accent shadow-accent/30" : "ring-4 ring-accent shadow-accent/30") : "";

    return (
      <div className={`${baseClasses} ${playerClass} ${activeClass} ${winnerClass}`}>
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2 mb-1.5">
          <PlayerPawnDisplay player={player} size="small" />
          <span className="font-semibold font-heading text-xs sm:text-sm truncate">{name}</span>
        </div>
        {isCurrent && !winner && !isDraw && <p className="text-xxs sm:text-xs font-medium">Your Turn</p>}
        {isWinner && <p className="text-xxs sm:text-xs font-bold text-accent">Victorious!</p>}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto mb-3 sm:mb-4">
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        <PlayerInfo 
          player={1} 
          name={getPlayerThematicName(1).split(' ')[0]} // "Angels"
          isCurrent={currentPlayer === 1 && gamePhase === 'playing'}
          isWinner={winner === 1}
        />
        <div className="flex flex-col items-center justify-center p-1 text-muted-foreground">
          <Swords className={`w-4 h-4 sm:w-5 sm:w-5 transition-colors duration-300 ${currentPlayer === 1 && gamePhase === 'playing' ? 'text-primary' : currentPlayer === 2 && gamePhase === 'playing' ? 'text-destructive' : 'text-muted-foreground/70'}`} />
        </div>
        <PlayerInfo 
          player={2} 
          name={getPlayerThematicName(2).split(' ')[0]} // "Demons"
          isCurrent={currentPlayer === 2 && gamePhase === 'playing'}
          isWinner={winner === 2}
        />
      </div>
      {message && gamePhase !== 'playerSelection' && (
         <div className={`mt-2 text-center text-xs sm:text-sm px-3 py-1.5 rounded-md shadow-sm ${
            winner === 1 ? 'bg-primary/10 text-primary' : 
            winner === 2 ? 'bg-destructive/10 text-destructive' : 
            isDraw ? 'bg-muted text-muted-foreground' : 
            currentPlayer === 1 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
          } font-medium`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default TicTacToeStatus;
