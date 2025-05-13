"use client";

import React from 'react';
import type { Player } from '@/lib/nine-pebbles-rules';

interface PlayerPawnDisplayProps {
  player: Player;
  cx?: number; 
  cy?: number; 
  radius?: number; 
  isSelected?: boolean;
  size?: 'small' | 'normal'; 
}

const PlayerPawnDisplay: React.FC<PlayerPawnDisplayProps> = ({ player, cx, cy, radius = 3, isSelected, size = 'normal' }) => {
  const player1Color = "fill-primary stroke-primary-foreground/70 dark:stroke-black/30";
  const player2Color = "fill-accent stroke-accent-foreground/70 dark:stroke-black/30";

  const colorClasses = player === 1 ? player1Color : player2Color;
  
  const selectedClasses = isSelected ? "stroke-[1px] dark:stroke-[0.8px] opacity-100 scale-110 ring-2 ring-offset-1 ring-foreground/50 dark:ring-background/50" : "stroke-[0.3px] dark:stroke-[0.2px]";
  const pawnDisplaySize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5'; // Adjusted for status panel

  if (cx !== undefined && cy !== undefined) { // SVG rendering for game board
    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        className={`${colorClasses} ${selectedClasses} transition-all duration-150 ease-in-out transform shadow-md`}
      />
    );
  }

  // Div rendering for status panel etc.
  return (
    <div className={`rounded-full ${pawnDisplaySize} ${player === 1 ? 'bg-primary' : 'bg-accent'} border ${player === 1 ? 'border-primary-foreground/50' : 'border-accent-foreground/50'} shadow-sm flex items-center justify-center`}>
      <span className="sr-only">Player {player} pawn</span>
    </div>
  );
};

export default PlayerPawnDisplay;
