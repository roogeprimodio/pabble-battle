
// src/app/choose-game/components/TicTacToeBoardPreview.tsx
"use client";

import React from 'react';
import PlayerPawnDisplay from '@/app/games/nine-pebbles/components/Pawn'; // Reusing for consistency

const TicTacToeBoardPreview: React.FC = () => {
  const cellSize = "28%"; // Percentage for cell size relative to container
  const gap = "4%";      // Gap between cells

  // Example board state for preview
  const previewBoard: (1 | 2 | null)[] = [
    1, null, 2,
    null, 1, null,
    2, null, 1,
  ];

  return (
    <div className="w-full h-full bg-card rounded-t-lg aspect-[16/10] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div
        className="grid grid-cols-3 grid-rows-3 w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] border-2 border-muted-foreground/30 rounded-sm shadow-inner"
        style={{ gap: '2px', backgroundColor: 'hsl(var(--muted-foreground)/0.3)' }}
      >
        {previewBoard.map((player, index) => (
          <div
            key={`preview-cell-${index}`}
            className="flex items-center justify-center bg-card hover:bg-muted/50 transition-colors cursor-pointer"
          >
            {player && (
              <div className="transform scale-[0.4] sm:scale-[0.5]"> {/* Scale down pawn for preview */}
                <PlayerPawnDisplay player={player} size="small" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicTacToeBoardPreview;
