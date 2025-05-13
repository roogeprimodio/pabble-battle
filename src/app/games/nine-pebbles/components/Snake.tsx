// src/app/games/nine-pebbles/components/Snake.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface SnakeProps {
  currentPos: { x: number; y: number }; // Where the snake is starting from for this move, or currently resting
  targetPos: { x: number; y: number };  // Where it's moving to
  isMoving: boolean;
  animationDuration: number; // in ms
}

const Snake: React.FC<SnakeProps> = ({ currentPos, targetPos, isMoving, animationDuration }) => {
  const headRadius = 1.5; // Scaled relative to viewBox units
  const segmentRadius = 1.1;

  // State to manage the visual transform string for CSS transitions
  const [visualTransform, setVisualTransform] = useState(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(0deg)`);
  // State to store the snake's current orientation angle
  const [currentAngle, setCurrentAngle] = useState(0);

  useEffect(() => {
    let angle = currentAngle;
    if (isMoving) {
      const dx = targetPos.x - currentPos.x;
      const dy = targetPos.y - currentPos.y;
      // Only update angle if there's a change in position to avoid NaN from atan2(0,0)
      if (dx !== 0 || dy !== 0) {
         angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
      // Set the target transform for the animation
      setVisualTransform(`translate(${targetPos.x}px, ${targetPos.y}px) rotate(${angle}deg)`);
      setCurrentAngle(angle); // Store the new angle
    } else {
      // When not moving, ensure the snake is at its current resting position with its last orientation
      setVisualTransform(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(${currentAngle}deg)`);
    }
  }, [currentPos, targetPos, isMoving, currentAngle]); // currentAngle added to deps

  return (
    <g
      style={{
        transform: visualTransform,
        // Apply CSS transition when isMoving is true
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.45, 0, 0.55, 1)` : 'none', 
        transformOrigin: '0 0', // Rotation origin is the head of the snake (cx=0, cy=0 of the first circle)
        pointerEvents: 'none',
      }}
    >
        {/* Snake body drawn with head at (0,0) of this group. Segments are behind the head along its local x-axis. */}
        {/* Using theme colors via CSS classes - ensure these are picked up by Tailwind JIT or use inline styles/CSS variables */}
        <circle cx={0} cy={0} r={headRadius} className="fill-green-600 dark:fill-green-400 opacity-95" />
        <circle cx={-headRadius * 1.3} cy={0} r={segmentRadius} className="fill-green-500 dark:fill-green-300 opacity-85" />
        <circle cx={-headRadius * 2.5} cy={0} r={segmentRadius * 0.9} className="fill-green-400 dark:fill-green-200 opacity-75" />
        {/* Eyes for a bit more character */}
        <circle cx={headRadius * 0.3} cy={-headRadius * 0.4} r={headRadius * 0.25} className="fill-background dark:fill-foreground" />
        <circle cx={headRadius * 0.3} cy={headRadius * 0.4} r={headRadius * 0.25} className="fill-background dark:fill-foreground" />
    </g>
  );
};

export default Snake;
