"use client";

import React from 'react';
import type { GameBoardArray, Player } from '@/lib/nine-pebbles-rules';
import PlayerPawnDisplay from './Pawn'; // Renamed for clarity
import { POINT_COORDINATES, ADJACENCY_LIST } from '@/lib/nine-pebbles-rules';

interface GameBoardDisplayProps {
  board: GameBoardArray;
  onPointClick: (index: number) => void;
  selectedPawnIndex: number | null;
  gamePhase: string; 
  currentPlayer: Player;
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
}) => {
  const pointRadius = 3; 
  const clickableRadius = 5; 

  return (
    <div className="w-full h-full bg-secondary/20 rounded-lg shadow-inner p-2 sm:p-4 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        {linesDef.map((line, i) => (
          <line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="stroke-foreground/30 dark:stroke-foreground/50"
            strokeWidth="0.8"
          />
        ))}

        {boardPoints.map((point) => {
          const playerAtPoint = board[point.id];
          const isSelected = selectedPawnIndex === point.id;
          
          let pointInteractionClass = "cursor-default";
          let hoverEffectClass = "";

          if (gamePhase === 'placement' && !playerAtPoint) {
            pointInteractionClass = "cursor-pointer";
            hoverEffectClass = "hover:fill-primary/50 dark:hover:fill-primary/70";
          } else if (gamePhase === 'movement') {
            if (playerAtPoint === currentPlayer) { // Can select own pawn
              pointInteractionClass = "cursor-pointer";
              hoverEffectClass = "group-hover:opacity-70";
            } else if (!playerAtPoint && selectedPawnIndex !== null && ADJACENCY_LIST[selectedPawnIndex].includes(point.id)) { // Can move to adjacent empty
              pointInteractionClass = "cursor-pointer";
              hoverEffectClass = "hover:fill-primary/50 dark:hover:fill-primary/70";
            }
          } else if (gamePhase === 'removing' && playerAtPoint && playerAtPoint !== currentPlayer) {
            pointInteractionClass = "cursor-pointer";
            hoverEffectClass = "hover:opacity-50 hover:fill-destructive/70";
          }
          
          return (
            <g key={`point-group-${point.id}`} onClick={() => onPointClick(point.id)} className={`group ${pointInteractionClass}`}>
              <circle
                cx={point.cx}
                cy={point.cy}
                r={clickableRadius}
                fill="transparent"
              />
              {playerAtPoint ? (
                <PlayerPawnDisplay player={playerAtPoint} cx={point.cx} cy={point.cy} radius={pointRadius} isSelected={isSelected} />
              ) : (
                <circle
                  cx={point.cx}
                  cy={point.cy}
                  r={pointRadius * 0.6}
                  className={`fill-foreground/20 dark:fill-foreground/30 transition-colors ${hoverEffectClass}`}
                />
              )}
               {isSelected && (
                 <circle
                    cx={point.cx}
                    cy={point.cy}
                    r={pointRadius + 1.5}
                    fill="none"
                    className="stroke-primary/70 dark:stroke-primary/90 animate-pulse"
                    strokeWidth="0.5"
                    strokeDasharray="1 1"
                  />
               )}
                {/* Highlight potential move target */}
                {gamePhase === 'movement' && selectedPawnIndex !== null && ADJACENCY_LIST[selectedPawnIndex].includes(point.id) && !board[point.id] && (
                    <circle
                        cx={point.cx}
                        cy={point.cy}
                        r={pointRadius * 0.8}
                        fill="transparent"
                        stroke="hsl(var(--primary))"
                        strokeWidth="0.5"
                        strokeDasharray="0.5 0.5"
                        className="opacity-70 pointer-events-none"
                    />
                )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GameBoardDisplay;

