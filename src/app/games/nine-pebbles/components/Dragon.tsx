// src/app/games/nine-pebbles/components/Dragon.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';

interface DragonProps {
  currentPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isMoving: boolean;
  animationDuration: number; // in ms
}

const Dragon: React.FC<DragonProps> = ({ currentPos, targetPos, isMoving, animationDuration }) => {
  const headScale = 2.2; // Scale factor for dragon parts
  const bodySegmentLength = headScale * 1.8;
  const bodySegmentWidth = headScale * 0.9;

  const [visualTransform, setVisualTransform] = useState(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(0deg)`);
  const [currentAngle, setCurrentAngle] = useState(0);
  
  const segmentCount = 4; // Head + 3 body segments
  const [segmentStyles, setSegmentStyles] = useState<React.CSSProperties[]>(
    Array(segmentCount).fill({}).map((_, i) => ({
      transform: `translateX(${-i * bodySegmentLength * 0.7}px) translateY(0px) rotate(0deg)`, // Initial alignment
      transformOrigin: '100% 50%', // Rotate around the connection point to the previous segment
      transition: `transform ${animationDuration * 0.3}ms cubic-bezier(0.4, 0, 0.2, 1)` // Faster individual segment transition
    }))
  );
  
  const animationFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Effect for overall dragon position and head orientation
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
  }, [currentPos, targetPos, isMoving, currentAngle, animationDuration]);


  // Effect for serpentine body movement
  useEffect(() => {
    if (isMoving && animationDuration > 0) {
      const windingAmplitudeBase = bodySegmentWidth * 0.3; // Max sideways movement
      const windingCycles = 2; // Number of S-curves during movement

      const animateWinding = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsedTime = timestamp - startTimeRef.current;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        if (progress < 1) {
          const newSegmentStyles = segmentStyles.map((_, i) => {
            if (i === 0) return segmentStyles[0]; // Head segment doesn't get offset this way
            
            // Increase amplitude for segments further from the head for more whip-like effect
            const amplitude = windingAmplitudeBase * (1 + i * 0.2);
            // Phase shift for each segment to create the wave
            const phaseShift = (Math.PI / (segmentCount -1)) * i * 0.8; 
            
            const waveAngle = windingCycles * progress * 2 * Math.PI;
            
            const offsetY = amplitude * Math.sin(waveAngle + phaseShift);
            // Add a slight rotation to segments to make them "turn" into the curve
            const segmentRotation = Math.sin(waveAngle + phaseShift + Math.PI/2) * 10 * (progress < 0.5 ? progress * 2 : (1-progress) * 2) ; // Degrees, more rotation at mid-movement

            return {
              ...segmentStyles[i],
              transform: `translateX(${-i * bodySegmentLength * 0.65}px) translateY(${offsetY}px) rotate(${segmentRotation}deg)`,
              transformOrigin: '100% 50%', // Connect to previous segment's "tail"
              transition: `transform ${animationDuration * 0.25}ms cubic-bezier(0.4, 0, 0.2, 1)`
            };
          });
          setSegmentStyles(newSegmentStyles);
          animationFrameIdRef.current = requestAnimationFrame(animateWinding);
        } else {
          // Reset to straight alignment after movement
          const finalStyles = Array(segmentCount).fill({}).map((_,i) => ({
              transform: `translateX(${-i * bodySegmentLength * 0.65}px) translateY(0px) rotate(0deg)`,
              transformOrigin: '100% 50%',
              transition: `transform ${animationDuration * 0.25}ms cubic-bezier(0.4, 0, 0.2, 1)`
          }));
          setSegmentStyles(finalStyles);
          startTimeRef.current = null;    
        }
      };
      animationFrameIdRef.current = requestAnimationFrame(animateWinding);
    } else if (!isMoving) {
        // Reset to straight alignment when not moving
         const finalStyles = Array(segmentCount).fill({}).map((_,i) => ({
            transform: `translateX(${-i * bodySegmentLength * 0.65}px) translateY(0px) rotate(0deg)`,
            transformOrigin: '100% 50%',
            transition: `transform ${animationDuration * 0.25}ms cubic-bezier(0.4, 0, 0.2, 1)`
        }));
        setSegmentStyles(finalStyles);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMoving, animationDuration, bodySegmentWidth, bodySegmentLength]);


  // Dragon Colors
  const primaryDragonColor = "fill-red-600 dark:fill-red-500";
  const secondaryDragonColor = "fill-yellow-400 dark:fill-yellow-300";
  const accentDragonColor = "fill-orange-500 dark:fill-orange-400";
  const eyeColor = "fill-green-400 dark:fill-green-300";
  const hornColor = "fill-neutral-300 dark:fill-neutral-400";

  return (
    <g
      style={{
        transform: visualTransform,
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none', 
        transformOrigin: '0 0', // The group rotates around the dragon's nose/target point
        pointerEvents: 'none',
      }}
    >
      {/* Segment 3 (Tail) */}
      <g style={segmentStyles[3]}>
        <path d={`M 0 0 
                  C ${-bodySegmentLength * 0.3} ${bodySegmentWidth * 0.3}, ${-bodySegmentLength * 0.6} ${bodySegmentWidth * 0.2}, ${-bodySegmentLength} 0
                  C ${-bodySegmentLength * 0.6} ${-bodySegmentWidth * 0.2}, ${-bodySegmentLength * 0.3} ${-bodySegmentWidth * 0.3}, 0 0 Z`} 
              className={`${primaryDragonColor} opacity-80 stroke-black/10 dark:stroke-black/30`} strokeWidth="0.1" />
        <path d={`M ${-bodySegmentLength * 0.8} 0 L ${-bodySegmentLength * 1.1} ${bodySegmentWidth * 0.25} L ${-bodySegmentLength * 1.1} ${-bodySegmentWidth * 0.25} Z`} 
              className={`${accentDragonColor} opacity-90`} />
      </g>

      {/* Segment 2 (Body) */}
      <g style={segmentStyles[2]}>
        <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.55} ry={bodySegmentWidth * 0.55} 
                 className={`${primaryDragonColor} opacity-90 stroke-black/10 dark:stroke-black/30`} strokeWidth="0.1"/>
        <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.4} ry={bodySegmentWidth * 0.35} 
                 className={`${secondaryDragonColor} opacity-60`}/>
      </g>

      {/* Segment 1 (Body near Head) */}
      <g style={segmentStyles[1]}>
         <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.58} ry={bodySegmentWidth * 0.6} 
                  className={`${primaryDragonColor} stroke-black/10 dark:stroke-black/30`} strokeWidth="0.1"/>
         <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.45} ry={bodySegmentWidth * 0.4} 
                  className={`${secondaryDragonColor} opacity-70`}/>
      </g>
      
      {/* Head (Segment 0) */}
      <g style={segmentStyles[0]}>
        {/* Horns */}
        <path d={`M ${headScale * -0.2} ${headScale * -0.3} C ${headScale * -0.8} ${headScale * -0.8}, ${headScale * -1.2} ${headScale * -0.5}, ${headScale * -1} 0.1`} className={`${hornColor} stroke-black/20`} strokeWidth="0.1"/>
        <path d={`M ${headScale * -0.2} ${headScale * 0.3} C ${headScale * -0.8} ${headScale * 0.8}, ${headScale * -1.2} ${headScale * 0.5}, ${headScale * -1} -0.1`} className={`${hornColor} stroke-black/20`} strokeWidth="0.1"/>

        {/* Head Shape */}
        <ellipse cx="0" cy="0" rx={headScale * 0.8} ry={headScale * 0.6} className={`${primaryDragonColor} stroke-black/20 dark:stroke-black/40`} strokeWidth="0.15" />
        {/* Snout */}
        <ellipse cx={headScale * 0.6} cy="0" rx={headScale * 0.5} ry={headScale * 0.4} className={`${primaryDragonColor} stroke-black/20 dark:stroke-black/40`} strokeWidth="0.1"/>
        
        {/* Eyes */}
        <circle cx={headScale * 0.3} cy={-headScale * 0.25} r={headScale * 0.18} className={eyeColor} />
        <circle cx={headScale * 0.32} cy={-headScale * 0.25} r={headScale * 0.08} className="fill-black" />
        <circle cx={headScale * 0.3} cy={headScale * 0.25} r={headScale * 0.18} className={eyeColor} />
        <circle cx={headScale * 0.32} cy={headScale * 0.25} r={headScale * 0.08} className="fill-black" />

        {/* Whiskers */}
        <path d={`M ${headScale * 0.8} ${headScale * 0.1} Q ${headScale * 1.5} ${headScale * 0.4}, ${headScale * 1.2} ${headScale * 0.8}`} strokeWidth="0.15" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        <path d={`M ${headScale * 0.8} ${-headScale * 0.1} Q ${headScale * 1.5} ${-headScale * 0.4}, ${headScale * 1.2} ${-headScale * 0.8}`} strokeWidth="0.15" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        
         {/* Mane/Frill */}
        <path d={`M ${headScale * -0.5} 0 
                   Q ${headScale * -0.8} ${headScale * -0.6}, ${headScale * -1.2} ${headScale * -0.8} 
                   L ${headScale * -1.4} ${headScale * -0.7}
                   Q ${headScale * -0.9} ${headScale * -0.4}, ${headScale * -0.5} 0 Z`} 
              className={`${accentDragonColor} opacity-70`}/>
         <path d={`M ${headScale * -0.5} 0 
                   Q ${headScale * -0.8} ${headScale * 0.6}, ${headScale * -1.2} ${headScale * 0.8} 
                   L ${headScale * -1.4} ${headScale * 0.7}
                   Q ${headScale * -0.9} ${headScale * 0.4}, ${headScale * -0.5} 0 Z`} 
              className={`${accentDragonColor} opacity-70`}/>
      </g>
    </g>
  );
};

export default Dragon;
