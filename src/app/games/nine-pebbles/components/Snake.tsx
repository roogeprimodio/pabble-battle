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
  const headRadius = 1.7; // Slightly larger head
  const segmentBaseRadius = 1.3; // Slightly larger segments

  const [visualTransform, setVisualTransform] = useState(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(0deg)`);
  const [currentAngle, setCurrentAngle] = useState(0);
  
  // State for individual segment y-offsets for winding animation (4 segments)
  const [segmentOffsets, setSegmentOffsets] = useState<[number, number, number, number]>([0, 0, 0, 0]);
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
      const windingAmplitude = headRadius * 0.4; 
      const windingCycles = 3; 

      const animateWinding = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsedTime = timestamp - startTimeRef.current;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        if (progress < 1) {
          const waveAngle = windingCycles * progress * 2 * Math.PI;
          
          const newOffsets: [number, number, number, number] = [
            windingAmplitude * Math.sin(waveAngle), 
            windingAmplitude * Math.sin(waveAngle - Math.PI / 2.8), 
            windingAmplitude * Math.sin(waveAngle - Math.PI / 1.8), 
            windingAmplitude * Math.sin(waveAngle - Math.PI / 1.2), 
          ];
          setSegmentOffsets(newOffsets);
          animationFrameIdRef.current = requestAnimationFrame(animateWinding);
        } else {
          setSegmentOffsets([0, 0, 0, 0]); 
          startTimeRef.current = null;    
        }
      };

      animationFrameIdRef.current = requestAnimationFrame(animateWinding);

    } else if (!isMoving) {
      setSegmentOffsets([0, 0, 0, 0]); 
      startTimeRef.current = null;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    }
    
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      startTimeRef.current = null;
    };
  }, [isMoving, animationDuration, headRadius]);


  return (
    <g
      style={{
        transform: visualTransform,
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none', 
        transformOrigin: '0 0', 
        pointerEvents: 'none',
      }}
    >
        {/* Segment 4 (Tail) - uses segmentOffsets[3] */}
        <ellipse 
            cx={-headRadius * 5.1} 
            cy={segmentOffsets[3]} 
            rx={segmentBaseRadius * 0.7} 
            ry={segmentBaseRadius * 0.55} 
            className="fill-emerald-500 dark:fill-emerald-400 opacity-80" 
        />
        {/* Segment 3 - uses segmentOffsets[2] */}
        <ellipse 
            cx={-headRadius * 4.0} 
            cy={segmentOffsets[2]} 
            rx={segmentBaseRadius * 0.8} 
            ry={segmentBaseRadius * 0.7} 
            className="fill-emerald-600 dark:fill-emerald-500 opacity-85" 
        />
        {/* Segment 2 - uses segmentOffsets[1] */}
        <ellipse 
            cx={-headRadius * 2.8} 
            cy={segmentOffsets[1]} 
            rx={segmentBaseRadius * 0.9} 
            ry={segmentBaseRadius * 0.8} 
            className="fill-emerald-500 dark:fill-emerald-400 opacity-90" 
        />
        {/* Segment 1 (Closest to head) - uses segmentOffsets[0] */}
        <ellipse 
            cx={-headRadius * 1.5} 
            cy={segmentOffsets[0]} 
            rx={segmentBaseRadius * 1.0} 
            ry={segmentBaseRadius * 0.9} 
            className="fill-emerald-600 dark:fill-emerald-500 opacity-95" 
        />
        
        {/* Head */}
        <ellipse 
            cx={0} 
            cy={0} 
            rx={headRadius} 
            ry={headRadius * 0.85} 
            className="fill-emerald-700 dark:fill-emerald-600 stroke-black/10 dark:stroke-black/30" 
            strokeWidth="0.1" 
        />
        {/* Eyes */}
        {/* Eye 1 (left when looking at screen if snake moves right) */}
        <circle cx={headRadius * 0.45} cy={-headRadius * 0.35} r={headRadius * 0.28} className="fill-yellow-400 dark:fill-yellow-500" />
        <circle cx={headRadius * 0.50} cy={-headRadius * 0.35} r={headRadius * 0.15} className="fill-black" />
        {/* Eye 2 (right) */}
        <circle cx={headRadius * 0.45} cy={headRadius * 0.35} r={headRadius * 0.28} className="fill-yellow-400 dark:fill-yellow-500" />
        <circle cx={headRadius * 0.50} cy={headRadius * 0.35} r={headRadius * 0.15} className="fill-black" />

        {/* Optional: Simple forked tongue, appears when moving or periodically */}
        {/* 
        {isMoving && (
           <path 
             d={`M ${headRadius*0.9} 0 L ${headRadius*1.5} 0 M ${headRadius*1.4} -0.3 L ${headRadius*1.8} -0.5 M ${headRadius*1.4} 0.3 L ${headRadius*1.8} 0.5`} 
             stroke="red" 
             strokeWidth="0.2" 
             className="opacity-70 animate-pulse"
           />
        )}
        */}
    </g>
  );
};

export default Snake;

