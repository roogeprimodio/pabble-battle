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
  isBeingRemoved?: boolean; // For holy/hellish removal animation
  removalPlayer?: Player | null; // To determine which animation to play for the final "poof"
  highlightAsRemovableCandidateForPlayer?: Player | null; // Player who *can* remove this pawn
}

const PlayerPawnDisplay: React.FC<PlayerPawnDisplayProps> = ({
  player,
  cx,
  cy,
  radius = 3,
  isSelected,
  size = 'normal',
  isBeingRemoved = false,
  removalPlayer = null,
  highlightAsRemovableCandidateForPlayer = null,
}) => {
  const displayRadius = size === 'small' ? 2.5 : radius;
  const scaleFactor = displayRadius / 3; // Original design details were based on radius ~3

  const player1ColorClasses = "fill-primary stroke-primary-foreground/70 dark:stroke-black/50"; // Angel: Primary color
  const player1DetailFill = "fill-primary-foreground/90";
  
  const player2ColorClasses = "fill-destructive stroke-destructive-foreground/70 dark:stroke-black/50"; // Demon: Destructive color
  const player2DetailFill = "fill-destructive-foreground/90";

  const commonPawnClasses = "transition-all duration-150 ease-in-out";
  const selectionGlowClass = isSelected 
    ? (player === 1 ? "animate-subtle-glow text-primary" : "animate-subtle-glow text-destructive")
    : "";

  let removalAnimationClass = "";
  if (isBeingRemoved) {
    if (removalPlayer === 1) { // Angel removing a demon pawn
      removalAnimationClass = player === 2 ? "animate-hellish-banish" : "";
    } else if (removalPlayer === 2) { // Demon removing an angel pawn
      removalAnimationClass = player === 1 ? "animate-holy-dispel" : "";
    }
  }

  let candidateHighlightClass = "";
  if (highlightAsRemovableCandidateForPlayer && player !== highlightAsRemovableCandidateForPlayer && !isBeingRemoved) {
    // This pawn is an opponent's pawn and is a candidate for removal
    if (highlightAsRemovableCandidateForPlayer === 1 && player === 2) { // Angel (1) can remove this Demon (2) pawn
      candidateHighlightClass = "animate-vulnerable-to-holy";
    } else if (highlightAsRemovableCandidateForPlayer === 2 && player === 1) { // Demon (2) can remove this Angel (1) pawn
      candidateHighlightClass = "animate-vulnerable-to-dark";
    }
  }


  if (cx !== undefined && cy !== undefined) { // SVG rendering for game board
    return (
      <g transform={`translate(${cx}, ${cy})`} className={`${commonPawnClasses} ${selectionGlowClass} ${removalAnimationClass} ${candidateHighlightClass}`}>
        {player === 1 ? ( // Angel design
          <g transform={`scale(${scaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player1ColorClasses} strokeWidth="0.2" />
            {/* Halo - Brighter and more defined */}
            <ellipse cx="0" cy="-3.9" rx="2.3" ry="1.0" className={`${player1DetailFill} opacity-90 animate-halo-pulse`} />
            <ellipse cx="0" cy="-3.9" rx="1.6" ry="0.6" className={`${player1ColorClasses} opacity-60`} />
            {/* More Detailed Wings - with feather-like strokes */}
            <g className="animate-angel-wings-gentle-flap">
              {/* Left Wing */}
              <path d="M -1.2 0.8 Q -4.5 -1.0 -2.5 -3.5 L 0 -1.5 Z" className={`${player1DetailFill} opacity-70`} />
              <path d="M -1.4 0.6 Q -3.8 -0.5 -2.8 -2.5 L -0.2 -1.2 Z" className={`${player1ColorClasses} opacity-40`} /> 
              {/* Right Wing */}
              <path d="M 1.2 0.8 Q 4.5 -1.0 2.5 -3.5 L 0 -1.5 Z" className={`${player1DetailFill} opacity-70`} />
              <path d="M 1.4 0.6 Q 3.8 -0.5 2.8 -2.5 L 0.2 -1.2 Z" className={`${player1ColorClasses} opacity-40`} />
            </g>
            {/* Subtle body hint */}
            <path d="M -0.8 2.5 Q 0 1.5 0.8 2.5 L 0 2.8 Z" className={`${player1DetailFill} opacity-30`} />
          </g>
        ) : ( // Demon design
          <g transform={`scale(${scaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player2ColorClasses} strokeWidth="0.25" />
            {/* Sharper Horns - with a subtle glow/pulse */}
            <g className="animate-demon-horns-glow">
              <path d="M -0.8 -2.5 C -1.5 -4.8 -0.2 -4.5 0.1 -2.7 L -0.5 -2.3 Z" className={`${player2DetailFill} opacity-90`} transform="rotate(-25 0 0)" />
              <path d="M 0.8 -2.5 C 1.5 -4.8 0.2 -4.5 -0.1 -2.7 L 0.5 -2.3 Z" className={`${player2DetailFill} opacity-90`} transform="rotate(25 0 0)" />
            </g>
            {/* Small Bat-like Wings */}
            <g className="animate-demon-wings-twitch">
                <path d="M -1.5 0.2 C -3.2 -1.2 -2.8 -2.5 -1.2 -1.8 L -1.0 -0.5 Z" className={`${player2DetailFill} opacity-70`} transform="rotate(15 -1 0)"/>
                <path d="M 1.5 0.2 C 3.2 -1.2 2.8 -2.5 1.2 -1.8 L 1.0 -0.5 Z" className={`${player2DetailFill} opacity-70`} transform="rotate(-15 1 0)"/>
            </g>
            {/* More Dynamic Pointy Tail */}
            <path d="M 0 2.9 Q 0.6 3.8 0.2 5.0 L 0 5.5 L -0.2 5.0 Q -0.6 3.8 0 2.9 Z" className={`${player2DetailFill} opacity-85 animate-demon-tail-whip`} style={{ transformOrigin: '0px 2.9px' }} />
          </g>
        )}
      </g>
    );
  }

  // Div rendering for status panel
  const statusPawnSizeClass = size === 'small' ? 'w-7 h-7' : 'w-9 h-9';
  const statusScaleFactor = (size === 'small' ? 1.9 : 2.3) / 3.0; 

  return (
    <div className={`${statusPawnSizeClass} rounded-full shadow-sm flex items-center justify-center ${isSelected ? (player === 1 ? 'ring-2 ring-offset-1 ring-primary' : 'ring-2 ring-offset-1 ring-destructive') : ''}`}>
      <svg viewBox="-4.5 -5.5 9 11" className="w-full h-full overflow-visible"> 
        {player === 1 ? ( // Angel (Simplified for status)
          <g transform={`scale(${statusScaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player1ColorClasses} strokeWidth="0.3"/>
            <ellipse cx="0" cy="-3.9" rx="2.3" ry="1.0" className={`${player1DetailFill} opacity-80`} />
             {/* Simplified Wings for status */}
            <path d="M -1.2 0.8 Q -4.0 -0.8 -2.2 -3.0 L 0 -1.5 Z" className={`${player1DetailFill} opacity-60`} />
            <path d="M 1.2 0.8 Q 4.0 -0.8 2.2 -3.0 L 0 -1.5 Z" className={`${player1DetailFill} opacity-60`} />
          </g>
        ) : ( // Demon (Simplified for status)
          <g transform={`scale(${statusScaleFactor})`}>
            <circle cx="0" cy="0" r="2.9" className={player2ColorClasses} strokeWidth="0.3"/>
             {/* Simplified Horns for status */}
            <path d="M -0.8 -2.5 C -1.5 -4.5 0.2 -4.2 0.1 -2.7 Z" className={`${player2DetailFill} opacity-80`} transform="rotate(-22 0 0)" />
            <path d="M 0.8 -2.5 C 1.5 -4.5 -0.2 -4.2 -0.1 -2.7 Z" className={`${player2DetailFill} opacity-80`} transform="rotate(22 0 0)" />
             {/* Simplified Tail for status */}
            <path d="M 0 2.9 Q 0.7 3.8 0 4.8 Q -0.7 3.8 0 2.9 Z" className={`${player2DetailFill} opacity-75`} />
          </g>
        )}
      </svg>
      <span className="sr-only">Player {player} {player === 1 ? 'Angel' : 'Demon'} pawn</span>
    </div>
  );
};

export default PlayerPawnDisplay;
