// src/app/games/nine-pebbles/components/GameBoard.tsx
"use client";

import React from 'react';
import type { GameBoardArray, Player } from '@/lib/nine-pebbles-rules';
import PlayerPawnDisplay from './Pawn';
import { POINT_COORDINATES, ADJACENCY_LIST, canRemovePawn } from '@/lib/nine-pebbles-rules';

interface GameBoardDisplayProps {
  board: GameBoardArray;
  onPointClick: (index: number) => void;
  selectedPawnIndex: number | null;
  gamePhase: string; 
  currentPlayer: Player;
  winner: Player | null;
  pawnToRemoveIndex: number | null; 
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

const cornerPointIds = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

const GameBoardDisplay: React.FC<GameBoardDisplayProps> = ({
  board,
  onPointClick,
  selectedPawnIndex,
  gamePhase,
  currentPlayer,
  winner,
  pawnToRemoveIndex,
}) => {
  const pointRadius = 3; 
  const clickableRadius = 5; 

  return (
    <div className="w-full h-full bg-gradient-to-br from-secondary/20 via-secondary/30 to-secondary/20 rounded-lg shadow-inner p-2 sm:p-4 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
        {/* Thematic background elements */}
        <defs>
          <radialGradient id="angelicGlow" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.1)" />
            <stop offset="60%" stopColor="hsl(var(--primary) / 0.05)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </radialGradient>
          <radialGradient id="demonicGlow" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="hsl(var(--destructive) / 0.1)" /> {/* Changed from accent to destructive */}
            <stop offset="60%" stopColor="hsl(var(--destructive) / 0.05)" /> {/* Changed from accent to destructive */}
            <stop offset="100%" stopColor="hsl(var(--destructive) / 0)" /> {/* Changed from accent to destructive */}
          </radialGradient>
           <filter id="holyShine" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant=".75" specularExponent="20" lightingColor="hsl(var(--primary))" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
          <filter id="hellfireGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
            <feFlood floodColor="hsl(var(--destructive))" floodOpacity="0.7" result="flood" />
            <feComposite in="flood" in2="blur" operator="in" result="colorBlur"/>
            <feMerge>
              <feMergeNode in="colorBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {currentPlayer === 1 && !winner && <rect width="100" height="100" fill="url(#angelicGlow)" className="transition-opacity duration-500" />}
        {currentPlayer === 2 && !winner && <rect width="100" height="100" fill="url(#demonicGlow)" className="transition-opacity duration-500" />}

        {linesDef.map((line, i) => (
          <line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="stroke-foreground/40 dark:stroke-foreground/60 transition-all duration-300"
            strokeWidth="0.7"
          />
        ))}

        {boardPoints.map((point) => {
          const playerAtPoint = board[point.id];
          const isCurrentlySelectedPawn = selectedPawnIndex === point.id;
          
          let pointInteractionClass = "cursor-default";
          let hoverEffectClass = "";
          let pointMarkerClass = "fill-foreground/20 dark:fill-foreground/30 transition-colors";
          let highlightForRemovable: Player | null = null;

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
          
          const isCorner = cornerPointIds.includes(point.id);
          const numberClassName = isCorner
            ? "fill-accent dark:fill-accent font-bold" // Highlighted class for corners
            : "fill-muted-foreground/70 dark:fill-muted-foreground/50"; // Default class

          return (
            <g key={`point-group-${point.id}`} onClick={() => onPointClick(point.id)} className={`group ${pointInteractionClass}`}>
              <circle 
                cx={point.cx}
                cy={point.cy}
                r={clickableRadius}
                fill="transparent"
              />
              {playerAtPoint ? (
                <PlayerPawnDisplay 
                  player={playerAtPoint} 
                  cx={point.cx} 
                  cy={point.cy} 
                  radius={pointRadius} 
                  isSelected={isCurrentlySelectedPawn && playerAtPoint === currentPlayer}
                  isBeingRemoved={pawnToRemoveIndex === point.id && gamePhase === 'animatingRemoval'} 
                  removalPlayer={pawnToRemoveIndex === point.id ? currentPlayer : null} 
                  highlightAsRemovableCandidateForPlayer={highlightForRemovable}
                />
              ) : ( 
                <>
                  <circle
                    cx={point.cx}
                    cy={point.cy}
                    r={pointRadius * 0.65} 
                    className={pointMarkerClass}
                  />
                </>
              )}
               {gamePhase === 'movement' && selectedPawnIndex !== null && ADJACENCY_LIST[selectedPawnIndex].includes(point.id) && !board[point.id] && (
                    <circle
                        cx={point.cx}
                        cy={point.cy}
                        r={pointRadius * 0.9} 
                        fill="transparent"
                        strokeDasharray="0.6 0.6" 
                        className={`pointer-events-none animate-pulse ${currentPlayer === 1 ? 'stroke-primary/70' : 'stroke-destructive/70'}`} // Changed from accent to destructive
                        strokeWidth="0.6"
                    />
                )}
                {!playerAtPoint && (
                  <text
                    x={point.cx}
                    y={point.cy + pointRadius + 2.5} 
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isCorner ? "2.2" : "1.8"} 
                    className={`${numberClassName} select-none pointer-events-none font-mono`}
                    style={{ userSelect: 'none' }} 
                  >
                    {point.id}
                  </text>
                )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GameBoardDisplay;

    