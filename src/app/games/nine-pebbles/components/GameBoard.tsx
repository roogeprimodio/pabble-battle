
// src/app/games/nine-pebbles/components/GameBoard.tsx
"use client";

import React, { useEffect, useState } from 'react';
import type { GameBoardArray, Player, GamePhase as LocalGamePhase } from '@/lib/nine-pebbles-rules';
import PlayerPawnDisplay from './Pawn';
import { POINT_COORDINATES, ADJACENCY_LIST, canRemovePawn } from '@/lib/nine-pebbles-rules';

interface GameBoardDisplayProps {
  board: GameBoardArray;
  onPointClick: (index: number) => void;
  selectedPawnIndex: number | null;
  gamePhase: LocalGamePhase; 
  currentPlayer: Player;
  winner: Player | null;
  pawnToRemoveIndex: number | null; 
  movingPawn?: { from: number; to: number; player: Player } | null;
  disabled?: boolean; // Added to disable board interaction
}

const boardPoints = POINT_COORDINATES.map(p => ({
  id: p.id,
  cx: p.x * (80/6) + 10, 
  cy: p.y * (80/6) + 10,
}));

const linesDef = [
  // Outer square
  { x1: boardPoints[0].cx, y1: boardPoints[0].cy, x2: boardPoints[2].cx, y2: boardPoints[2].cy }, 
  { x1: boardPoints[2].cx, y1: boardPoints[2].cy, x2: boardPoints[4].cx, y2: boardPoints[4].cy }, 
  { x1: boardPoints[4].cx, y1: boardPoints[4].cy, x2: boardPoints[6].cx, y2: boardPoints[6].cy }, 
  { x1: boardPoints[6].cx, y1: boardPoints[6].cy, x2: boardPoints[0].cx, y2: boardPoints[0].cy }, 
  // Middle square
  { x1: boardPoints[8].cx, y1: boardPoints[8].cy, x2: boardPoints[10].cx, y2: boardPoints[10].cy },
  { x1: boardPoints[10].cx, y1: boardPoints[10].cy, x2: boardPoints[12].cx, y2: boardPoints[12].cy },
  { x1: boardPoints[12].cx, y1: boardPoints[12].cy, x2: boardPoints[14].cx, y2: boardPoints[14].cy },
  { x1: boardPoints[14].cx, y1: boardPoints[14].cy, x2: boardPoints[8].cx, y2: boardPoints[8].cy },
  // Inner square
  { x1: boardPoints[16].cx, y1: boardPoints[16].cy, x2: boardPoints[18].cx, y2: boardPoints[18].cy },
  { x1: boardPoints[18].cx, y1: boardPoints[18].cy, x2: boardPoints[20].cx, y2: boardPoints[20].cy },
  { x1: boardPoints[20].cx, y1: boardPoints[20].cy, x2: boardPoints[22].cx, y2: boardPoints[22].cy },
  { x1: boardPoints[22].cx, y1: boardPoints[22].cy, x2: boardPoints[16].cx, y2: boardPoints[16].cy },
  // Connecting lines
  { x1: boardPoints[1].cx, y1: boardPoints[1].cy, x2: boardPoints[17].cx, y2: boardPoints[17].cy },
  { x1: boardPoints[3].cx, y1: boardPoints[3].cy, x2: boardPoints[19].cx, y2: boardPoints[19].cy },
  { x1: boardPoints[5].cx, y1: boardPoints[5].cy, x2: boardPoints[21].cx, y2: boardPoints[21].cy },
  { x1: boardPoints[7].cx, y1: boardPoints[7].cy, x2: boardPoints[23].cx, y2: boardPoints[23].cy },
];

const GameBoardDisplay: React.FC<GameBoardDisplayProps> = ({
  board,
  onPointClick,
  selectedPawnIndex,
  gamePhase,
  currentPlayer,
  winner,
  pawnToRemoveIndex,
  movingPawn,
  disabled = false,
}) => {
  const pointRadius = 3; 
  const clickableRadius = 6; 

  const [animatedPawn, setAnimatedPawn] = useState<{
    player: Player;
    currentCx: number;
    currentCy: number;
    targetCx: number;
    targetCy: number;
    trail: Array<{x: number, y: number}>;
  } | null>(null);

  useEffect(() => {
    if (movingPawn) {
      const fromPoint = boardPoints[movingPawn.from];
      const toPoint = boardPoints[movingPawn.to];
      setAnimatedPawn({
        player: movingPawn.player,
        currentCx: fromPoint.cx,
        currentCy: fromPoint.cy,
        targetCx: toPoint.cx,
        targetCy: toPoint.cy,
        trail: [{x: fromPoint.cx, y: fromPoint.cy}],
      });

      let start: number | null = null;
      const duration = 400; 

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        
        setAnimatedPawn(prev => {
          if (!prev) return null;
          const newCx = fromPoint.cx + (toPoint.cx - fromPoint.cx) * progress;
          const newCy = fromPoint.cy + (toPoint.cy - fromPoint.cy) * progress;
          
          const newTrail = [...prev.trail, {x: newCx, y: newCy}];
          if (newTrail.length > 8) newTrail.shift();

          return { ...prev, currentCx: newCx, currentCy: newCy, trail: newTrail };
        });

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setAnimatedPawn(null);
        }
      };
      requestAnimationFrame(step);
    }
  }, [movingPawn]);


  return (
    <div 
      className={`w-full h-full bg-gradient-to-br from-secondary/20 via-secondary/30 to-secondary/20 rounded-lg shadow-inner p-2 sm:p-4 flex items-center justify-center ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      onTouchStart={(e) => e.preventDefault()} 
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
        <defs>
          <radialGradient id="angelicGlow" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.1)" />
            <stop offset="60%" stopColor="hsl(var(--primary) / 0.05)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </radialGradient>
          <radialGradient id="demonicGlow" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="hsl(var(--destructive) / 0.1)" /> 
            <stop offset="60%" stopColor="hsl(var(--destructive) / 0.05)" /> 
            <stop offset="100%" stopColor="hsl(var(--destructive) / 0)" /> 
          </radialGradient>
        </defs>
        {currentPlayer === 1 && !winner && <rect width="100" height="100" fill="url(#angelicGlow)" className="transition-opacity duration-500" />}
        {currentPlayer === 2 && !winner && <rect width="100" height="100" fill="url(#demonicGlow)" className="transition-opacity duration-500" />}

        {linesDef.map((line, i) => (
          <line
            key={`line-${i}`}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            className="stroke-foreground/40 dark:stroke-foreground/60 transition-all duration-300"
            strokeWidth="0.7"
          />
        ))}

        {boardPoints.map((point) => {
          if (movingPawn && point.id === movingPawn.from) return null; 

          const playerAtPoint = board[point.id];
          const isCurrentlySelectedPawn = selectedPawnIndex === point.id;
          
          let pointInteractionClass = "cursor-default";
          let hoverEffectClass = "";
          let pointMarkerClass = "fill-foreground/20 dark:fill-foreground/30 transition-colors";
          let highlightForRemovable: Player | null = null;

          if (!disabled) {
            if (gamePhase === 'placement' && !playerAtPoint) {
              pointInteractionClass = "cursor-pointer";
              hoverEffectClass = "group-hover:fill-primary/60 dark:group-hover:fill-primary/70";
              pointMarkerClass = `fill-foreground/20 dark:fill-foreground/30 ${hoverEffectClass}`;
            } else if (gamePhase === 'movement') {
              if (playerAtPoint === currentPlayer) { 
                pointInteractionClass = "cursor-pointer";
              } else if (!playerAtPoint && selectedPawnIndex !== null && ADJACENCY_LIST[selectedPawnIndex].includes(point.id)) { 
                pointInteractionClass = "cursor-pointer";
                hoverEffectClass = "group-hover:fill-primary/60 dark:group-hover:fill-primary/70";
                pointMarkerClass = `fill-foreground/20 dark:fill-foreground/30 ${hoverEffectClass}`;
              }
            } else if (gamePhase === 'removing' && playerAtPoint && playerAtPoint !== currentPlayer) {
              pointInteractionClass = "cursor-pointer";
              const opponent = currentPlayer === 1 ? 2 : 1;
              if (playerAtPoint === opponent && canRemovePawn(board, point.id, opponent)) {
                highlightForRemovable = currentPlayer; 
              }
            }
          }
          
          return (
            <g 
              key={`point-group-${point.id}`} 
              onClick={() => !disabled && onPointClick(point.id)}
              onTouchEnd={(e) => { 
                if (disabled) return;
                e.preventDefault(); 
                onPointClick(point.id);
              }}
              className={`group ${disabled ? 'cursor-not-allowed' : pointInteractionClass}`}
            >
              <circle cx={point.cx} cy={point.cy} r={clickableRadius} fill="transparent" />
              {playerAtPoint ? (
                <PlayerPawnDisplay 
                  player={playerAtPoint} cx={point.cx} cy={point.cy} radius={pointRadius} 
                  isSelected={isCurrentlySelectedPawn && playerAtPoint === currentPlayer}
                  isBeingRemoved={pawnToRemoveIndex === point.id && gamePhase === 'animatingRemoval'} 
                  removalPlayer={pawnToRemoveIndex === point.id ? currentPlayer : null} 
                  highlightAsRemovableCandidateForPlayer={highlightForRemovable}
                />
              ) : ( 
                <circle cx={point.cx} cy={point.cy} r={pointRadius * 0.65} className={pointMarkerClass} />
              )}
               {!disabled && gamePhase === 'movement' && selectedPawnIndex !== null && ADJACENCY_LIST[selectedPawnIndex].includes(point.id) && !board[point.id] && (
                <circle
                    cx={point.cx} cy={point.cy} r={pointRadius * 0.9} 
                    fill="transparent" strokeDasharray="0.6 0.6" 
                    className={`pointer-events-none animate-pulse ${currentPlayer === 1 ? 'stroke-primary/70' : 'stroke-destructive/70'}`} 
                    strokeWidth="0.6"
                />
                )}
            </g>
          );
        })}

        {animatedPawn && (
          <g>
            {animatedPawn.trail.map((pos, index) => (
              <circle
                key={`trail-${index}`} cx={pos.x} cy={pos.y}
                r={pointRadius * 0.3 * (index / animatedPawn.trail.length)} 
                className={`${animatedPawn.player === 1 ? 'fill-primary/50' : 'fill-destructive/50'} opacity-${(index / animatedPawn.trail.length) * 50 + 20}`}
              />
            ))}
            <PlayerPawnDisplay
              player={animatedPawn.player} cx={animatedPawn.currentCx} cy={animatedPawn.currentCy}
              radius={pointRadius} isSelected={false} 
            />
          </g>
        )}
      </svg>
    </div>
  );
};

export default GameBoardDisplay;
