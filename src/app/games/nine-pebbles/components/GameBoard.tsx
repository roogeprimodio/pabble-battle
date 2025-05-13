// src/app/games/nine-pebbles/components/GameBoard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { GameBoardArray, Player } from '@/lib/nine-pebbles-rules';
import PlayerPawnDisplay from './Pawn';
import { POINT_COORDINATES, ADJACENCY_LIST } from '@/lib/nine-pebbles-rules';
import Dragon from './Dragon'; // Changed from Snake to Dragon

interface GameBoardDisplayProps {
  board: GameBoardArray;
  onPointClick: (index: number) => void;
  selectedPawnIndex: number | null;
  gamePhase: string; 
  currentPlayer: Player;
  winner: Player | null;
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

// Helper to find *any* valid empty spot for the dragon, prioritizing current if valid.
function getSafeDragonSpot(
  currentDragonIdx: number | null,
  board: GameBoardArray
): number | null {
  const openSpots = board.map((p, i) => (p === null ? i : -1)).filter(i => i !== -1);
  if (openSpots.length === 0) return null;

  if (currentDragonIdx !== null && board[currentDragonIdx] === null) {
    return currentDragonIdx; // Current spot is safe and empty
  }
  // Current spot is unsafe or null, pick any other open spot
  const randomIndex = Math.floor(Math.random() * openSpots.length);
  return openSpots[randomIndex];
}

// Helper to find the NEAREST *DIFFERENT* open spot for the dragon to move to.
function findNearestNewTarget(
  currentDragonIdx: number, // Assumed to be a valid, empty spot
  board: GameBoardArray,
  adjacencyList: number[][]
): number | null {
  const q: { point: number; dist: number }[] = [];
  const visited = new Set<number>([currentDragonIdx]); 
  
  for (const neighbor of adjacencyList[currentDragonIdx]) {
    if (board[neighbor] === null) { 
        q.push({ point: neighbor, dist: 1 }); 
    }
    visited.add(neighbor); 
  }

  const potentialTargets: {point: number, dist: number}[] = [];

  let head = 0; 
  while(head < q.length) {
    const current = q[head++]; 

    if (board[current.point] === null && current.point !== currentDragonIdx) {
      potentialTargets.push(current);
    }
    
    if(potentialTargets.length > 0 && current.dist > potentialTargets[0].dist) break;

    for (const neighbor of adjacencyList[current.point]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        q.push({ point: neighbor, dist: current.dist + 1 });
      }
    }
  }
  
  if (potentialTargets.length === 0) return null; 

  potentialTargets.sort((a,b) => { 
      if(a.dist !== b.dist) return a.dist - b.dist;
      return a.point - b.point;
  });
  
  return potentialTargets[0].point; 
}


const GameBoardDisplay: React.FC<GameBoardDisplayProps> = ({
  board,
  onPointClick,
  selectedPawnIndex,
  gamePhase,
  currentPlayer,
  winner,
}) => {
  const pointRadius = 3; 
  const clickableRadius = 5; 

  const [dragonCurrentBoardIndex, setDragonCurrentBoardIndex] = useState<number | null>(null);
  const [dragonTargetBoardIndex, setDragonTargetBoardIndex] = useState<number | null>(null);
  const [dragonIsMovingToNext, setDragonIsMovingToNext] = useState(false);
  const [dragonVisible, setDragonVisible] = useState(false);

  const DRAGON_ANIMATION_DURATION = 1500; // ms, slightly longer for more elaborate movement
  const DRAGON_WAIT_DURATION = 3000; // ms

  // Effect 1: Dragon Placement/Correction
  useEffect(() => {
    if (gamePhase === 'playerSelection' || winner !== null) {
      setDragonVisible(false);
      return;
    }
    if (dragonIsMovingToNext) return;

    const safeSpot = getSafeDragonSpot(dragonCurrentBoardIndex, board);

    if (safeSpot !== null) {
      if (dragonCurrentBoardIndex !== safeSpot) {
        setDragonCurrentBoardIndex(safeSpot); 
      }
      setDragonVisible(true);
    } else {
      setDragonVisible(false); 
    }
  }, [board, gamePhase, winner, dragonIsMovingToNext, dragonCurrentBoardIndex]);


  // Effect 2: Dragon Movement Cycle
  useEffect(() => {
    if (!dragonVisible || dragonCurrentBoardIndex === null || gamePhase === 'playerSelection' || winner !== null) {
      return; 
    }

    let waitTimer: NodeJS.Timeout;
    let animationEndTimer: NodeJS.Timeout;

    if (!dragonIsMovingToNext) { 
      waitTimer = setTimeout(() => {
        const target = findNearestNewTarget(dragonCurrentBoardIndex, board, ADJACENCY_LIST);
        if (target !== null) { 
          setDragonTargetBoardIndex(target);
          setDragonIsMovingToNext(true);
        }
      }, DRAGON_WAIT_DURATION);
    } else { 
      if (dragonTargetBoardIndex === null) { 
        setDragonIsMovingToNext(false); 
        return;
      }
      animationEndTimer = setTimeout(() => {
        setDragonCurrentBoardIndex(dragonTargetBoardIndex); 
        setDragonTargetBoardIndex(null); 
        setDragonIsMovingToNext(false);  
      }, DRAGON_ANIMATION_DURATION);
    }

    return () => { 
      clearTimeout(waitTimer);
      clearTimeout(animationEndTimer);
    };
  }, [dragonVisible, dragonCurrentBoardIndex, dragonIsMovingToNext, dragonTargetBoardIndex, board, gamePhase, winner, DRAGON_ANIMATION_DURATION, DRAGON_WAIT_DURATION]);


  const currentDragonCoords = dragonCurrentBoardIndex !== null ? boardPoints[dragonCurrentBoardIndex] : null;
  const targetDragonCoords = dragonTargetBoardIndex !== null ? boardPoints[dragonTargetBoardIndex] : currentDragonCoords;


  return (
    <div className="w-full h-full bg-secondary/20 rounded-lg shadow-inner p-2 sm:p-4 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
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

        {dragonVisible && currentDragonCoords && targetDragonCoords && (
          <Dragon // Changed from Snake
            currentPos={{ x: currentDragonCoords.cx, y: currentDragonCoords.cy }}
            targetPos={{ x: targetDragonCoords.cx, y: targetDragonCoords.cy }}
            isMoving={dragonIsMovingToNext}
            animationDuration={DRAGON_ANIMATION_DURATION}
          />
        )}

        {boardPoints.map((point) => {
          const playerAtPoint = board[point.id];
          const isCurrentlySelectedPawn = selectedPawnIndex === point.id;
          
          let pointInteractionClass = "cursor-default";
          let hoverEffectClass = "";

          if (gamePhase === 'placement' && !playerAtPoint) {
            pointInteractionClass = "cursor-pointer";
            hoverEffectClass = "hover:fill-primary/50 dark:hover:fill-primary/70";
          } else if (gamePhase === 'movement') {
            if (playerAtPoint === currentPlayer) { 
              pointInteractionClass = "cursor-pointer";
            } else if (!playerAtPoint && selectedPawnIndex !== null && ADJACENCY_LIST[selectedPawnIndex].includes(point.id)) { 
              pointInteractionClass = "cursor-pointer";
              hoverEffectClass = "hover:fill-primary/50 dark:hover:fill-primary/70";
            }
          } else if (gamePhase === 'removing' && playerAtPoint && playerAtPoint !== currentPlayer) {
            pointInteractionClass = "cursor-pointer";
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
                <PlayerPawnDisplay 
                  player={playerAtPoint} 
                  cx={point.cx} 
                  cy={point.cy} 
                  radius={pointRadius} 
                  isSelected={isCurrentlySelectedPawn && playerAtPoint === currentPlayer}
                />
              ) : ( 
                <circle
                  cx={point.cx}
                  cy={point.cy}
                  r={pointRadius * 0.6}
                  className={`fill-foreground/20 dark:fill-foreground/30 transition-colors ${hoverEffectClass}`}
                />
              )}
               {gamePhase === 'movement' && selectedPawnIndex !== null && ADJACENCY_LIST[selectedPawnIndex].includes(point.id) && !board[point.id] && (
                    <circle
                        cx={point.cx}
                        cy={point.cy}
                        r={pointRadius * 0.8}
                        fill="transparent"
                        stroke="hsl(var(--primary))"
                        strokeWidth="0.5"
                        strokeDasharray="0.5 0.5"
                        className="opacity-70 pointer-events-none animate-pulse"
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
