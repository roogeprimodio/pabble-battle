// src/app/games/nine-pebbles/components/Snake.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface SnakeProps {
  currentPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isMoving: boolean;
  animationDuration: number; // in ms
}

const Snake: React.FC<SnakeProps> = ({ currentPos, targetPos, isMoving, animationDuration }) => {
  const headRadius = 1.6; 
  const segmentBaseRadius = 1.2;

  const [visualTransform, setVisualTransform] = useState(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(0deg)`);
  const [currentAngle, setCurrentAngle] = useState(0);

  useEffect(() => {
    let angle = currentAngle;
    if (isMoving && (currentPos.x !== targetPos.x || currentPos.y !== targetPos.y)) {
      const dx = targetPos.x - currentPos.x;
      const dy = targetPos.y - currentPos.y;
      angle = Math.atan2(dy, dx) * (180 / Math.PI);
      setVisualTransform(`translate(${targetPos.x}px, ${targetPos.y}px) rotate(${angle}deg)`);
      setCurrentAngle(angle); 
    } else {
      // When not moving, or target is same as current, ensure snake is at its current resting position with its last orientation
      setVisualTransform(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(${angle}deg)`);
    }
  }, [currentPos, targetPos, isMoving, currentAngle]);

  return (
    <g
      style={{
        transform: visualTransform,
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none', 
        transformOrigin: '0 0', // Rotation origin is the center of the head (cx=0, cy=0 of the first circle)
        pointerEvents: 'none',
      }}
    >
        {/* Snake body drawn with head at (0,0) of this group. Segments are behind the head along its local negative x-axis. */}
        
        {/* Segment 3 (Tail) */}
        <ellipse cx={-headRadius * 3.8} cy={0} rx={segmentBaseRadius * 0.75} ry={segmentBaseRadius * 0.55} className="fill-emerald-400 dark:fill-emerald-300 opacity-80" />
        {/* Segment 2 */}
        <ellipse cx={-headRadius * 2.7} cy={0} rx={segmentBaseRadius * 0.9} ry={segmentBaseRadius * 0.75} className="fill-emerald-500 dark:fill-emerald-400 opacity-85" />
        {/* Segment 1 */}
        <ellipse cx={-headRadius * 1.5} cy={0} rx={segmentBaseRadius * 1.05} ry={segmentBaseRadius * 0.95} className="fill-emerald-600 dark:fill-emerald-500 opacity-90" />
        
        {/* Head */}
        <circle cx={0} cy={0} r={headRadius} className="fill-emerald-700 dark:fill-emerald-600 opacity-95 stroke-black/10 dark:stroke-black/30" strokeWidth="0.1" />
        {/* Eyes */}
        <circle cx={headRadius * 0.45} cy={-headRadius * 0.4} r={headRadius * 0.22} className="fill-background dark:fill-neutral-800" />
        <circle cx={headRadius * 0.45} cy={headRadius * 0.4} r={headRadius * 0.22} className="fill-background dark:fill-neutral-800" />
        <circle cx={headRadius * 0.5} cy={-headRadius * 0.4} r={headRadius * 0.1} className="fill-neutral-800 dark:fill-background" />
        <circle cx={headRadius * 0.5} cy={headRadius * 0.4} r={headRadius * 0.1} className="fill-neutral-800 dark:fill-background" />

    </g>
  );
};

export default Snake;
