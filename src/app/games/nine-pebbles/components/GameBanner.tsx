// src/app/games/nine-pebbles/components/GameBanner.tsx
"use client";

import React from 'react';

const GameBanner: React.FC = () => {
  return (
    <div className="w-full my-2 sm:my-3">
      <div className="container mx-auto px-2 sm:px-0"> {/* Adjusted px for container consistency */}
        <div 
          className="py-2.5 px-3 sm:py-3 sm:px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 rounded-lg shadow-md flex items-center justify-center text-center border border-primary/20"
        >
          <h2 
            className="text-sm sm:text-base md:text-lg font-heading text-primary dark:text-primary-foreground/80 tracking-normal sm:tracking-wide"
            data-ai-hint="arena banner"
          >
            The Strategic Battle of 9 Pebbles Awaits!
          </h2>
        </div>
      </div>
    </div>
  );
};

export default GameBanner;
