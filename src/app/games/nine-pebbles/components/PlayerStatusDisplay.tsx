// src/app/games/nine-pebbles/components/PlayerStatusDisplay.tsx
"use client";

import React from 'react';
import type { Player } from '@/lib/nine-pebbles-rules';
import PlayerPawnDisplay from './Pawn';

interface PlayerStatusDisplayProps {
  player: Player;
  playerName: string;
  pawnsToPlace: number;
  pawnsOnBoard: number;
  isCurrentPlayer: boolean;
  winner: Player | null;
}

const PlayerStatusDisplay: React.FC<PlayerStatusDisplayProps> = ({
  player,
  playerName,
  pawnsToPlace,
  pawnsOnBoard,
  isCurrentPlayer,
  winner,
}) => {
  const baseClasses = "p-3 sm:p-4 rounded-lg border shadow-md transition-all duration-300 ease-in-out";
  const playerClass = player === 1 
    ? "bg-primary/10 border-primary/50 text-primary dark:bg-primary/20 dark:border-primary/60" 
    : "bg-destructive/10 border-destructive/50 text-destructive dark:bg-destructive/20 dark:border-destructive/60";
  
  const activeClass = isCurrentPlayer && !winner 
    ? `ring-2 ring-offset-background scale-105 shadow-lg ${player === 1 ? 'ring-primary' : 'ring-destructive'}` 
    : "opacity-75 hover:opacity-100";

  return (
    <div className={`${baseClasses} ${playerClass} ${activeClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold font-heading text-sm sm:text-base lg:text-lg">{playerName}</span>
        <PlayerPawnDisplay player={player} size="small" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs sm:text-sm">
          To Place: <span className="font-bold">{pawnsToPlace}</span>
        </p>
        <p className="text-xs sm:text-sm">
          On Board: <span className="font-bold">{pawnsOnBoard}</span>
        </p>
      </div>
    </div>
  );
};

export default PlayerStatusDisplay;
