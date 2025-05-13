// src/app/games/nine-pebbles/components/PlayerStatusDisplay.tsx
"use client";

import React from 'react';
import type { Player } from '@/lib/nine-pebbles-rules';
import PlayerPawnDisplay from './Pawn';
import { Swords } from 'lucide-react';

interface PlayerStats {
  pawnsToPlace: number;
  pawnsOnBoard: number;
}

interface CombinedPlayerStatusDisplayProps {
  player1Stats: PlayerStats;
  player2Stats: PlayerStats;
  player1Name: string;
  player2Name: string;
  currentPlayer: Player;
  winner: Player | null;
  message: string; // General game message or turn instruction
}

const PlayerInfo: React.FC<{
  player: Player;
  playerName: string;
  stats: PlayerStats;
  isCurrent: boolean;
  isWinner: boolean;
}> = ({ player, playerName, stats, isCurrent, isWinner }) => {
  const baseClasses = "p-2 sm:p-3 rounded-lg border-2 flex-1 text-center transition-all duration-300 ease-in-out";
  const playerClass = player === 1 
    ? "border-primary/70 bg-primary/10 text-primary dark:bg-primary/20 dark:border-primary/60" 
    : "border-destructive/70 bg-destructive/10 text-destructive dark:bg-destructive/20 dark:border-destructive/60";
  
  const activeClass = isCurrent && !isWinner 
    ? `ring-2 ring-offset-background scale-105 shadow-lg ${player === 1 ? 'ring-primary' : 'ring-destructive'}` 
    : "opacity-80 hover:opacity-100";
  
  const winnerClass = isWinner ? (player === 1 ? "ring-4 ring-accent shadow-accent/30" : "ring-4 ring-accent shadow-accent/30") : "";

  return (
    <div className={`${baseClasses} ${playerClass} ${activeClass} ${winnerClass}`}>
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2 mb-1.5">
        <PlayerPawnDisplay player={player} size="small" />
        <span className="font-semibold font-heading text-xs sm:text-sm truncate">{playerName}</span>
      </div>
      <div className="space-y-0 text-xxs sm:text-xs">
        <p>
          Place: <span className="font-bold">{stats.pawnsToPlace}</span> | Board: <span className="font-bold">{stats.pawnsOnBoard}</span>
        </p>
      </div>
    </div>
  );
};

const CombinedPlayerStatusDisplay: React.FC<CombinedPlayerStatusDisplayProps> = ({
  player1Stats,
  player2Stats,
  player1Name,
  player2Name,
  currentPlayer,
  winner,
  message,
}) => {
  return (
    <div className="w-full max-w-md mx-auto mb-3 sm:mb-4">
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        <PlayerInfo 
          player={1} 
          playerName={player1Name} 
          stats={player1Stats} 
          isCurrent={currentPlayer === 1 && !winner}
          isWinner={winner === 1}
        />
        <div className="flex flex-col items-center justify-center p-1 text-muted-foreground">
          <Swords className={`w-4 h-4 sm:w-5 sm:w-5 transition-colors duration-300 ${currentPlayer === 1 && !winner ? 'text-primary' : currentPlayer === 2 && !winner ? 'text-destructive' : 'text-muted-foreground/70'}`} />
        </div>
        <PlayerInfo 
          player={2} 
          playerName={player2Name} 
          stats={player2Stats} 
          isCurrent={currentPlayer === 2 && !winner}
          isWinner={winner === 2}
        />
      </div>
      {message && !winner && (
         <div className={`mt-2 text-center text-xs sm:text-sm px-3 py-1.5 rounded-md shadow-sm ${currentPlayer === 1 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'} font-medium`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CombinedPlayerStatusDisplay;
