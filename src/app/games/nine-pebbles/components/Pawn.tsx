// src/app/games/nine-pebbles/components/Pawn.tsx
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

const PlayerPawnDisplay: React.FC<PlayerPawnDisplayProps> = ({
  player,
  cx,
  cy,
  radius = 3,
  isSelected,
  size = 'normal',
}) => {
  const displayRadius = size === 'small' ? 2.5 : radius;
  const scaleFactor = displayRadius / 3; // Original design details were based on radius ~3

  const player1ColorClasses = "fill-primary stroke-primary-foreground/50 dark:stroke-black/40";
  const player1DetailFill = "fill-primary-foreground";
  
  const player2ColorClasses = "fill-accent stroke-accent-foreground/50 dark:stroke-black/40";
  const player2DetailFill = "fill-accent-foreground";

  const commonPawnClasses = "transition-all duration-150 ease-in-out";
  // The drop-shadow for subtle-glow uses currentColor, set by text-primary/text-accent
  const selectionGlowClass = isSelected 
    ? (player === 1 ? "animate-subtle-glow text-primary" : "animate-subtle-glow text-accent") 
    : "";

  if (cx !== undefined && cy !== undefined) { // SVG rendering for game board
    return (
      <g transform={`translate(${cx}, ${cy})`} className={`${commonPawnClasses} ${selectionGlowClass}`}>
        {player === 1 ? ( // Angel design
          <g transform={`scale(${scaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player1ColorClasses} strokeWidth="0.15" />
            {/* Halo */}
            <ellipse cx="0" cy="-3.7" rx="2.1" ry="0.9" className={`${player1DetailFill} animate-halo-shimmer`} />
            <ellipse cx="0" cy="-3.7" rx="1.4" ry="0.5" className={`${player1ColorClasses} opacity-70`} /> {/* Inner halo part, kept original opacity, no shimmer */}
            {/* Simple Wings */}
            <g className="animate-angel-wings-float">
              <path d="M -1.5 0.5 Q -4 -1.5 -2.2 -3.2 L 0 -1.2 Z" className={`${player1DetailFill} opacity-50`} />
              <path d="M 1.5 0.5 Q 4 -1.5 2.2 -3.2 L 0 -1.2 Z" className={`${player1DetailFill} opacity-50`} />
            </g>
          </g>
        ) : ( // Demon design
          <g transform={`scale(${scaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player2ColorClasses} strokeWidth="0.15" />
            {/* Horns */}
            <path d="M -1.2 -2.5 C -2 -4.2 0.3 -3.8 0.2 -2.7 L -0.5 -2.4 Z" className={`${player2DetailFill} animate-demon-horns-opac`} transform="rotate(-15 0 0)" />
            <path d="M 1.2 -2.5 C 2 -4.2 -0.3 -3.8 -0.2 -2.7 L 0.5 -2.4 Z" className={`${player2DetailFill} animate-demon-horns-opac`} transform="rotate(15 0 0)" style={{animationDelay: '0.15s'}} />
             {/* Pointy Tail element at bottom */}
            <path d="M 0 3 Q 0.8 4.2 0 5 Q -0.8 4.2 0 3 Z" className={`${player2DetailFill} opacity-70 animate-demon-tail-flick`} style={{ transformOrigin: '0px 3px' }} />
          </g>
        )}
      </g>
    );
  }

  // Div rendering for status panel
  const statusPawnSizeClass = size === 'small' ? 'w-7 h-7' : 'w-9 h-9'; // Slightly larger for SVG details
  // Adjusted scale for status display; ensure details are visible but not overly large
  const statusScaleFactor = (size === 'small' ? 1.8 : 2.2) / 3.0; 

  return (
    <div className={`${statusPawnSizeClass} rounded-full shadow-sm flex items-center justify-center ${isSelected ? (player === 1 ? 'ring-2 ring-offset-1 ring-primary' : 'ring-2 ring-offset-1 ring-accent') : ''}`}>
      {/* Adjusted viewBox for better fit of details in status panel */}
      <svg viewBox="-4 -5 8 10" className="w-full h-full overflow-visible"> 
        {player === 1 ? ( // Angel
          <g transform={`scale(${statusScaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player1ColorClasses} strokeWidth="0.25"/>
            <ellipse cx="0" cy="-3.7" rx="2.1" ry="0.9" className={`${player1DetailFill} opacity-90`} />
            <ellipse cx="0" cy="-3.7" rx="1.4" ry="0.5" className={`${player1ColorClasses} opacity-70`} />
          </g>
        ) : ( // Demon
          <g transform={`scale(${statusScaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player2ColorClasses} strokeWidth="0.25"/>
            <path d="M -1.2 -2.5 C -2 -4.2 0.3 -3.8 0.2 -2.7 L -0.5 -2.4 Z" className={`${player2DetailFill} opacity-90`} transform="rotate(-15 0 0)" />
            <path d="M 1.2 -2.5 C 2 -4.2 -0.3 -3.8 -0.2 -2.7 L 0.5 -2.4 Z" className={`${player2DetailFill} opacity-90`} transform="rotate(15 0 0)" />
          </g>
        )}
      </svg>
      <span className="sr-only">Player {player} {player === 1 ? 'Angel' : 'Demon'} pawn</span>
    </div>
  );
};

export default PlayerPawnDisplay;
