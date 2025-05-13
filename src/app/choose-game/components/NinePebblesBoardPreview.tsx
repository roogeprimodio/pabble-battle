
// src/app/choose-game/components/NinePebblesBoardPreview.tsx
"use client";

import React from 'react';
import { POINT_COORDINATES } from '@/lib/nine-pebbles-rules';

// Scaled board points for preview
const previewBoardPoints = POINT_COORDINATES.map(p => ({
  id: p.id,
  cx: p.x * (80 / 6) + 10, 
  cy: p.y * (80 / 6) + 10,
}));

// Lines definition for the preview board
const previewLinesDef = [
  // Outer square
  { x1: previewBoardPoints[0].cx, y1: previewBoardPoints[0].cy, x2: previewBoardPoints[2].cx, y2: previewBoardPoints[2].cy },
  { x1: previewBoardPoints[2].cx, y1: previewBoardPoints[2].cy, x2: previewBoardPoints[4].cx, y2: previewBoardPoints[4].cy },
  { x1: previewBoardPoints[4].cx, y1: previewBoardPoints[4].cy, x2: previewBoardPoints[6].cx, y2: previewBoardPoints[6].cy },
  { x1: previewBoardPoints[6].cx, y1: previewBoardPoints[6].cy, x2: previewBoardPoints[0].cx, y2: previewBoardPoints[0].cy },
  // Middle square
  { x1: previewBoardPoints[8].cx, y1: previewBoardPoints[8].cy, x2: previewBoardPoints[10].cx, y2: previewBoardPoints[10].cy },
  { x1: previewBoardPoints[10].cx, y1: previewBoardPoints[10].cy, x2: previewBoardPoints[12].cx, y2: previewBoardPoints[12].cy },
  { x1: previewBoardPoints[12].cx, y1: previewBoardPoints[12].cy, x2: previewBoardPoints[14].cx, y2: previewBoardPoints[14].cy },
  { x1: previewBoardPoints[14].cx, y1: previewBoardPoints[14].cy, x2: previewBoardPoints[8].cx, y2: previewBoardPoints[8].cy },
  // Inner square
  { x1: previewBoardPoints[16].cx, y1: previewBoardPoints[16].cy, x2: previewBoardPoints[18].cx, y2: previewBoardPoints[18].cy },
  { x1: previewBoardPoints[18].cx, y1: previewBoardPoints[18].cy, x2: previewBoardPoints[20].cx, y2: previewBoardPoints[20].cy },
  { x1: previewBoardPoints[20].cx, y1: previewBoardPoints[20].cy, x2: previewBoardPoints[22].cx, y2: previewBoardPoints[22].cy },
  { x1: previewBoardPoints[22].cx, y1: previewBoardPoints[22].cy, x2: previewBoardPoints[16].cx, y2: previewBoardPoints[16].cy },
  // Connecting lines
  { x1: previewBoardPoints[1].cx, y1: previewBoardPoints[1].cy, x2: previewBoardPoints[17].cx, y2: previewBoardPoints[17].cy },
  { x1: previewBoardPoints[3].cx, y1: previewBoardPoints[3].cy, x2: previewBoardPoints[19].cx, y2: previewBoardPoints[19].cy },
  { x1: previewBoardPoints[5].cx, y1: previewBoardPoints[5].cy, x2: previewBoardPoints[21].cx, y2: previewBoardPoints[21].cy },
  { x1: previewBoardPoints[7].cx, y1: previewBoardPoints[7].cy, x2: previewBoardPoints[23].cx, y2: previewBoardPoints[23].cy },
];

const pointRadius = 1.8; // Adjusted radius for preview aesthetics

const NinePebblesBoardPreview: React.FC = () => {
  // Define some pebble positions for the preview
  const player1Pebbles = [0, 2, 5, 9, 13];
  const player2Pebbles = [4, 6, 7, 11, 17];


  return (
    <div className="w-full h-full bg-card rounded-t-lg aspect-[16/10] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
        {/* Board Lines */}
        {previewLinesDef.map((line, i) => (
          <line
            key={`preview-line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="stroke-muted-foreground/60 dark:stroke-muted-foreground/40"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Empty Point Markers */}
        {previewBoardPoints.map((point) => {
          if (!player1Pebbles.includes(point.id) && !player2Pebbles.includes(point.id)) {
            return (
              <circle
                key={`preview-empty-point-${point.id}`}
                cx={point.cx}
                cy={point.cy}
                r={pointRadius * 0.5}
                className="fill-muted-foreground/40 dark:fill-muted-foreground/30"
              />
            );
          }
          return null;
        })}

        {/* Player 1 Pebbles (Primary Color) */}
        {player1Pebbles.map(id => {
          const point = previewBoardPoints[id];
          return (
            <circle
              key={`preview-pebble-p1-${id}`}
              cx={point.cx}
              cy={point.cy}
              r={pointRadius}
              className="fill-primary/70 dark:fill-primary/60"
              stroke="hsl(var(--primary-foreground))"
              strokeWidth="0.2"
            />
          );
        })}

        {/* Player 2 Pebbles (Accent Color) */}
        {player2Pebbles.map(id => {
          const point = previewBoardPoints[id];
          return (
            <circle
              key={`preview-pebble-p2-${id}`}
              cx={point.cx}
              cy={point.cy}
              r={pointRadius}
              className="fill-accent/70 dark:fill-accent/60"
              stroke="hsl(var(--accent-foreground))"
              strokeWidth="0.2"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default NinePebblesBoardPreview;
