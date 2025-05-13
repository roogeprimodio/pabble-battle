// src/app/games/nine-pebbles/components/GameBoard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { GameBoardArray, Player } from '@/lib/nine-pebbles-rules';
import PlayerPawnDisplay from './Pawn';
import { POINT_COORDINATES, ADJACENCY_LIST } from '@/lib/nine-pebbles-rules';
import Snake from './Snake';

interface GameBoardDisplayProps {
  board: GameBoardArray;
  onPointClick: (index: number) => void;
  selectedPawnIndex: number | null;
  gamePhase: string; 
  currentPlayer: Player;
  winner: Player | null; // Added winner prop
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

// Helper to find *any* valid empty spot for the snake, prioritizing current if valid.
function getSafeSnakeSpot(
  currentSnakeIdx: number | null,
  board: GameBoardArray
): number | null {
  const openSpots = board.map((p, i) => (p === null ? i : -1)).filter(i => i !== -1);
  if (openSpots.length === 0) return null;

  if (currentSnakeIdx !== null && board[currentSnakeIdx] === null) {
    return currentSnakeIdx; // Current spot is safe and empty
  }
  // Current spot is unsafe or null, pick any other open spot
  const randomIndex = Math.floor(Math.random() * openSpots.length);
  return openSpots[randomIndex];
}

// Helper to find the NEAREST *DIFFERENT* open spot for the snake to move to.
function findNearestNewTarget(
  currentSnakeIdx: number, // Assumed to be a valid, empty spot
  board: GameBoardArray,
  adjacencyList: number[][]
): number | null {
  // BFS starting from currentSnakeIdx to find nearest different open spot
  const q: { point: number; dist: number }[] = [];
  const visited = new Set<number>([currentSnakeIdx]); // Mark current as visited initially
  
  // Prime queue with direct neighbors
  for (const neighbor of adjacencyList[currentSnakeIdx]) {
    if (board[neighbor] === null) { // If neighbor is open
        q.push({ point: neighbor, dist: 1 }); // Add to queue
    }
    visited.add(neighbor); // Mark neighbor as visited to avoid re-processing at depth 1
  }

  const potentialTargets: {point: number, dist: number}[] = [];

  let head = 0; // Pointer for queue to avoid excessive shift() calls
  while(head < q.length) {
    const current = q[head++]; // Dequeue

    if (board[current.point] === null && current.point !== currentSnakeIdx) {
      potentialTargets.push(current);
      // Optimization: if we find any target, we can stop BFS for this level if we only want one.
      // To find all targets at this minimum distance, continue processing all elements with current.dist
    }
    
    // If we already have targets, and current item's distance is greater, stop.
    if(potentialTargets.length > 0 && current.dist > potentialTargets[0].dist) break;

    // Add its unvisited neighbors
    for (const neighbor of adjacencyList[current.point]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        q.push({ point: neighbor, dist: current.dist + 1 });
      }
    }
  }
  
  if (potentialTargets.length === 0) return null; // No different open spot found

  potentialTargets.sort((a,b) => { // Sort by distance, then by point index
      if(a.dist !== b.dist) return a.dist - b.dist;
      return a.point - b.point;
  });
  
  return potentialTargets[0].point; // Return the "best" (nearest, then lowest index)
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

  const [snakeCurrentBoardIndex, setSnakeCurrentBoardIndex] = useState<number | null>(null);
  const [snakeTargetBoardIndex, setSnakeTargetBoardIndex] = useState<number | null>(null);
  const [snakeIsMovingToNext, setSnakeIsMovingToNext] = useState(false);
  const [snakeVisible, setSnakeVisible] = useState(false);

  const SNAKE_ANIMATION_DURATION = 1200; // ms
  const SNAKE_WAIT_DURATION = 2500; // ms

  // Effect 1: Snake Placement/Correction
  // Ensures snake is on a valid spot or hidden.
  useEffect(() => {
    if (gamePhase === 'playerSelection' || winner !== null) {
      setSnakeVisible(false);
      return;
    }
    if (snakeIsMovingToNext) return; // Don't interfere if snake is already in transit

    const safeSpot = getSafeSnakeSpot(snakeCurrentBoardIndex, board);

    if (safeSpot !== null) {
      if (snakeCurrentBoardIndex !== safeSpot) {
        setSnakeCurrentBoardIndex(safeSpot); // Update current position if it changed
      }
      setSnakeVisible(true);
    } else {
      setSnakeVisible(false); // No safe spot, hide snake
    }
  }, [board, gamePhase, winner, snakeIsMovingToNext, snakeCurrentBoardIndex]);


  // Effect 2: Snake Movement Cycle
  // Manages the snake's decision to move and the animation timing.
  useEffect(() => {
    if (!snakeVisible || snakeCurrentBoardIndex === null || gamePhase === 'playerSelection' || winner !== null) {
      return; // Snake is not active or game conditions prevent movement
    }

    let waitTimer: NodeJS.Timeout;
    let animationEndTimer: NodeJS.Timeout;

    if (!snakeIsMovingToNext) { // Snake is resting, decide next move
      waitTimer = setTimeout(() => {
        const target = findNearestNewTarget(snakeCurrentBoardIndex, board, ADJACENCY_LIST);
        if (target !== null) { // target is guaranteed to be different from snakeCurrentBoardIndex
          setSnakeTargetBoardIndex(target);
          setSnakeIsMovingToNext(true);
        }
        // Else: no valid new target, snake stays put, timeout will re-evaluate on next cycle.
      }, SNAKE_WAIT_DURATION);
    } else { // Snake is moving
      if (snakeTargetBoardIndex === null) { // Should ideally not happen if isMoving is true
        setSnakeIsMovingToNext(false); // Reset state
        return;
      }
      animationEndTimer = setTimeout(() => {
        setSnakeCurrentBoardIndex(snakeTargetBoardIndex); // Arrived at target
        setSnakeTargetBoardIndex(null); // Clear target
        setSnakeIsMovingToNext(false);  // Stop moving state
      }, SNAKE_ANIMATION_DURATION);
    }

    return () => { // Cleanup timers
      clearTimeout(waitTimer);
      clearTimeout(animationEndTimer);
    };
  }, [snakeVisible, snakeCurrentBoardIndex, snakeIsMovingToNext, snakeTargetBoardIndex, board, gamePhase, winner, SNAKE_ANIMATION_DURATION, SNAKE_WAIT_DURATION]);


  const currentSnakeCoords = snakeCurrentBoardIndex !== null ? boardPoints[snakeCurrentBoardIndex] : null;
  // If target is not set yet (e.g. snake is waiting), use current for smooth transition start
  const targetSnakeCoords = snakeTargetBoardIndex !== null ? boardPoints[snakeTargetBoardIndex] : currentSnakeCoords;


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

        {/* Render Snake animation */}
        {snakeVisible && currentSnakeCoords && targetSnakeCoords && (
          <Snake
            currentPos={{ x: currentSnakeCoords.cx, y: currentSnakeCoords.cy }}
            targetPos={{ x: targetSnakeCoords.cx, y: targetSnakeCoords.cy }}
            isMoving={snakeIsMovingToNext}
            animationDuration={SNAKE_ANIMATION_DURATION}
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
