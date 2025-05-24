// src/app/games/soul-shards/components/SoulShardsBoardPreview.tsx
"use client";

import React from 'react';
import Image from 'next/image';

const SoulShardsBoardPreview: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-card rounded-t-lg aspect-[16/10] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <Image
        src="https://placehold.co/600x400.png" // Placeholder image
        alt="Soul Shards Game Preview"
        width={600}
        height={400}
        className="object-cover w-full h-full opacity-70"
        data-ai-hint="fantasy battle strategy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <h3 className="text-xl font-bold text-white opacity-90 font-heading">Soul Shards</h3>
      </div>
    </div>
  );
};

export default SoulShardsBoardPreview;
