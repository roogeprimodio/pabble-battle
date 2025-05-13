// src/app/games/nine-pebbles/components/GameBanner.tsx
"use client";

import React from 'react';
import Image from 'next/image';

const GameBanner: React.FC = () => {
  return (
    <div className="w-full my-2 sm:my-3">
      <div className="container mx-auto px-2 sm:px-0">
        <div 
          className="py-2.5 px-3 sm:py-3 sm:px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between text-center sm:text-left border border-primary/20 gap-2"
        >
          <div className="flex-shrink-0 w-full sm:w-auto max-w-[120px] sm:max-w-[100px] md:max-w-[150px] aspect-[4/3] sm:aspect-square overflow-hidden rounded">
            <Image
              src="https://picsum.photos/150/150"
              alt="Dummy Banner Ad"
              width={150}
              height={150}
              className="object-cover w-full h-full"
              data-ai-hint="advertisement banner"
            />
          </div>
          <div className="flex-grow">
            <h2 
              className="text-xs sm:text-sm md:text-base font-heading text-primary dark:text-primary-foreground/80 tracking-normal sm:tracking-wide mb-0.5 sm:mb-1"
              data-ai-hint="arena banner"
            >
              The Strategic Battle of 9 Pebbles Awaits!
            </h2>
            <p className="text-xxs sm:text-xs text-muted-foreground">
              This is a placeholder for a dummy banner. Enjoy the game!
            </p>
          </div>
           <div className="flex-shrink-0 hidden lg:block w-full sm:w-auto max-w-[120px] sm:max-w-[100px] md:max-w-[150px] aspect-[4/3] sm:aspect-square overflow-hidden rounded">
            <Image
              src="https://picsum.photos/150/151" // Different image for variety
              alt="Dummy Banner Ad 2"
              width={150}
              height={150}
              className="object-cover w-full h-full"
              data-ai-hint="game promotion"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBanner;
