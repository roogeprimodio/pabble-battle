// src/app/games/nine-pebbles/components/Snake.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';

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
  
  // State for individual segment y-offsets for winding animation
  const [segmentOffsets, setSegmentOffsets] = useState<[number, number, number]>([0, 0, 0]);
  const animationFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);


  useEffect(() => {
    let angle = currentAngle;
    if (isMoving && (currentPos.x !== targetPos.x || currentPos.y !== targetPos.y)) {
      const dx = targetPos.x - currentPos.x;
      const dy = targetPos.y - currentPos.y;
      angle = Math.atan2(dy, dx) * (180 / Math.PI);
      setVisualTransform(`translate(${targetPos.x}px, ${targetPos.y}px) rotate(${angle}deg)`);
      setCurrentAngle(angle); 
    } else {
      setVisualTransform(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(${angle}deg)`);
    }
  }, [currentPos, targetPos, isMoving, currentAngle]);


  // Effect for winding animation of segments
  useEffect(() => {
    if (isMoving && animationDuration > 0) {
      const windingAmplitude = headRadius * 0.4; // Amplitude of the wiggle
      const windingCycles = 3; // Number of full sine wave cycles during the entire move

      const animateWinding = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsedTime = timestamp - startTimeRef.current;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        if (progress < 1) {
          // Calculate current angle for the sine wave based on overall progress
          const waveAngle = windingCycles * progress * 2 * Math.PI;
          
          // Apply phase shifts for each segment to create a traveling wave effect
          // Segment closest to head, middle segment, tail segment
          const newOffsets: [number, number, number] = [
            windingAmplitude * Math.sin(waveAngle), 
            windingAmplitude * Math.sin(waveAngle - Math.PI / 2.5), 
            windingAmplitude * Math.sin(waveAngle - Math.PI / 1.5), 
          ];
          setSegmentOffsets(newOffsets);
          animationFrameIdRef.current = requestAnimationFrame(animateWinding);
        } else {
          setSegmentOffsets([0, 0, 0]); // Reset to straight when movement completes
          startTimeRef.current = null;    // Reset start time for the next move
        }
      };

      animationFrameIdRef.current = requestAnimationFrame(animateWinding);

    } else if (!isMoving) {
      setSegmentOffsets([0, 0, 0]); // Reset if not moving or animation ends
      startTimeRef.current = null;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    }
    
    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      startTimeRef.current = null;
      // Setting offsets to 0 on unmount or dependency change might be desired
      // if the snake could become visible mid-state. For now, rely on isMoving.
    };
  }, [isMoving, animationDuration, headRadius]);


  return (
    <g
      style={{
        transform: visualTransform,
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none', 
        transformOrigin: '0 0', // Rotation origin is the center of the head (cx=0, cy=0 of the first circle)
        pointerEvents: 'none',
      }}
    >
        {/* Segment 3 (Tail) - uses segmentOffsets[2] */}
        <ellipse cx={-headRadius * 3.8} cy={segmentOffsets[2]} rx={segmentBaseRadius * 0.75} ry={segmentBaseRadius * 0.55} className="fill-emerald-400 dark:fill-emerald-300 opacity-80" />
        {/* Segment 2 - uses segmentOffsets[1] */}
        <ellipse cx={-headRadius * 2.7} cy={segmentOffsets[1]} rx={segmentBaseRadius * 0.9} ry={segmentBaseRadius * 0.75} className="fill-emerald-500 dark:fill-emerald-400 opacity-85" />
        {/* Segment 1 (Closest to head) - uses segmentOffsets[0] */}
        <ellipse cx={-headRadius * 1.5} cy={segmentOffsets[0]} rx={segmentBaseRadius * 1.05} ry={segmentBaseRadius * 0.95} className="fill-emerald-600 dark:fill-emerald-500 opacity-90" />
        
        {/* Head - remains centered in its local coordinate system for winding*/}
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
