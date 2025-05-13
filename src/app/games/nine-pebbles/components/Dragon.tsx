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
  const headScale = 2.2; 
  const bodySegmentLength = headScale * 1.8;
  const bodySegmentWidth = headScale * 0.9;

  const [visualTransform, setVisualTransform] = useState(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(0deg)`);
  const [currentAngle, setCurrentAngle] = useState(0);
  
  const segmentCount = 4; 
  const [segmentStyles, setSegmentStyles] = useState<React.CSSProperties[]>(
    Array(segmentCount).fill({}).map((_, i) => ({
      transform: `translateX(${-i * bodySegmentLength * 0.7}px) translateY(0px) rotate(0deg)`, 
      transformOrigin: '100% 50%', 
      transition: `transform ${animationDuration * 0.3}ms cubic-bezier(0.4, 0, 0.2, 1)`
    }))
  );
  
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
  }, [currentPos, targetPos, isMoving, currentAngle, animationDuration]);


  useEffect(() => {
    if (isMoving && animationDuration > 0) {
      const windingAmplitudeBase = bodySegmentWidth * 0.3; 
      const windingCycles = 2; 

      const animateWinding = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsedTime = timestamp - startTimeRef.current;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        if (progress < 1) {
          const newSegmentStyles = segmentStyles.map((_, i) => {
            if (i === 0) return segmentStyles[0]; 
            
            const amplitude = windingAmplitudeBase * (1 + i * 0.2);
            const phaseShift = (Math.PI / (segmentCount -1)) * i * 0.8; 
            
            const waveAngle = windingCycles * progress * 2 * Math.PI;
            
            const offsetY = amplitude * Math.sin(waveAngle + phaseShift);
            const segmentRotation = Math.sin(waveAngle + phaseShift + Math.PI/2) * 10 * (progress < 0.5 ? progress * 2 : (1-progress) * 2) ; 

            return {
              ...segmentStyles[i],
              transform: `translateX(${-i * bodySegmentLength * 0.65}px) translateY(${offsetY}px) rotate(${segmentRotation}deg)`,
              transformOrigin: '100% 50%', 
              transition: `transform ${animationDuration * 0.25}ms cubic-bezier(0.4, 0, 0.2, 1)`
            };
          });
          setSegmentStyles(newSegmentStyles);
          animationFrameIdRef.current = requestAnimationFrame(animateWinding);
        } else {
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


  const primaryDragonColor = "fill-red-600 dark:fill-red-500";
  const secondaryDragonColor = "fill-yellow-400 dark:fill-yellow-300";
  const accentDragonColor = "fill-orange-500 dark:fill-orange-400";
  const eyeColor = "fill-green-400 dark:fill-green-300";
  const hornColor = "fill-neutral-300 dark:fill-neutral-400";
  const shadowStroke = "stroke-black/10 dark:stroke-black/30";
  const detailStrokeWidth = "0.1";
  const mainStrokeWidth = "0.15";

  return (
    <g
      style={{
        transform: visualTransform,
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none', 
        transformOrigin: '0 0', 
        pointerEvents: 'none',
      }}
    >
      {/* Segment 3 (Tail) */}
      <g style={segmentStyles[3]}>
        <path d={`M 0 0 
                  C ${-bodySegmentLength * 0.3} ${bodySegmentWidth * 0.3}, ${-bodySegmentLength * 0.6} ${bodySegmentWidth * 0.2}, ${-bodySegmentLength} 0
                  C ${-bodySegmentLength * 0.6} ${-bodySegmentWidth * 0.2}, ${-bodySegmentLength * 0.3} ${-bodySegmentWidth * 0.3}, 0 0 Z`} 
              className={`${primaryDragonColor} opacity-80 ${shadowStroke}`} strokeWidth={detailStrokeWidth} />
        {/* Elaborate Tail Fin */}
        <path d={`M ${-bodySegmentLength * 0.9} 0 
                   L ${-bodySegmentLength * 1.2} ${bodySegmentWidth * 0.3} 
                   L ${-bodySegmentLength * 1.1} 0
                   L ${-bodySegmentLength * 1.2} ${-bodySegmentWidth * 0.3} Z`} 
              className={`${accentDragonColor} opacity-90`} />
        <path d={`M ${-bodySegmentLength * 1.05} ${bodySegmentWidth * 0.15}
                   L ${-bodySegmentLength * 1.3} ${bodySegmentWidth * 0.4}
                   L ${-bodySegmentLength * 1.2} ${bodySegmentWidth * 0.15} Z`}
             className={`${accentDragonColor} opacity-70`} transform="rotate(15, -1.1, 0)" />
        <path d={`M ${-bodySegmentLength * 1.05} ${-bodySegmentWidth * 0.15}
                   L ${-bodySegmentLength * 1.3} ${-bodySegmentWidth * 0.4}
                   L ${-bodySegmentLength * 1.2} ${-bodySegmentWidth * 0.15} Z`}
             className={`${accentDragonColor} opacity-70`} transform="rotate(-15, -1.1, 0)" />
      </g>

      {/* Segment 2 (Body) */}
      <g style={segmentStyles[2]}>
        <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.55} ry={bodySegmentWidth * 0.55} 
                 className={`${primaryDragonColor} opacity-90 ${shadowStroke}`} strokeWidth={detailStrokeWidth}/>
        <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.4} ry={bodySegmentWidth * 0.35} 
                 className={`${secondaryDragonColor} opacity-60`}/>
        {/* Dorsal Spines */}
        <path d={`M ${-bodySegmentLength * 0.2} ${-bodySegmentWidth*0.45} L ${-bodySegmentLength * 0.3} ${-bodySegmentWidth*0.7} L ${-bodySegmentLength * 0.4} ${-bodySegmentWidth*0.45} Z`} className={`${accentDragonColor} opacity-80`} />
        <path d={`M ${-bodySegmentLength * 0.6} ${-bodySegmentWidth*0.45} L ${-bodySegmentLength * 0.7} ${-bodySegmentWidth*0.7} L ${-bodySegmentLength * 0.8} ${-bodySegmentWidth*0.45} Z`} className={`${accentDragonColor} opacity-80`} />
      </g>

      {/* Segment 1 (Body near Head) */}
      <g style={segmentStyles[1]}>
         <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.58} ry={bodySegmentWidth * 0.6} 
                  className={`${primaryDragonColor} ${shadowStroke}`} strokeWidth={detailStrokeWidth}/>
         <ellipse cx={-bodySegmentLength * 0.5} cy="0" rx={bodySegmentLength * 0.45} ry={bodySegmentWidth * 0.4} 
                  className={`${secondaryDragonColor} opacity-70`}/>
        {/* Underbelly Plates */}
        <path d={`M ${-bodySegmentLength * 0.2} ${bodySegmentWidth*0.1} 
                C ${-bodySegmentLength * 0.3} ${bodySegmentWidth*0.2}, ${-bodySegmentLength * 0.4} ${bodySegmentWidth*0.2}, ${-bodySegmentLength * 0.5} ${bodySegmentWidth*0.1}
                L ${-bodySegmentLength * 0.5} ${-bodySegmentWidth*0.1}
                C ${-bodySegmentLength * 0.4} ${-bodySegmentWidth*0.2}, ${-bodySegmentLength * 0.3} ${-bodySegmentWidth*0.2}, ${-bodySegmentLength * 0.2} ${-bodySegmentWidth*0.1} Z`}
              className={`${secondaryDragonColor} opacity-40`} />
         <path d={`M ${-bodySegmentLength * 0.55} ${bodySegmentWidth*0.08} 
                C ${-bodySegmentLength * 0.65} ${bodySegmentWidth*0.18}, ${-bodySegmentLength * 0.75} ${bodySegmentWidth*0.18}, ${-bodySegmentLength * 0.85} ${bodySegmentWidth*0.08}
                L ${-bodySegmentLength * 0.85} ${-bodySegmentWidth*0.08}
                C ${-bodySegmentLength * 0.75} ${-bodySegmentWidth*0.18}, ${-bodySegmentLength * 0.65} ${-bodySegmentWidth*0.18}, ${-bodySegmentLength * 0.55} ${-bodySegmentWidth*0.08} Z`}
              className={`${secondaryDragonColor} opacity-40`} />
        {/* Dorsal Spines */}
        <path d={`M ${-bodySegmentLength * 0.25} ${-bodySegmentWidth*0.5} L ${-bodySegmentLength * 0.35} ${-bodySegmentWidth*0.8} L ${-bodySegmentLength * 0.45} ${-bodySegmentWidth*0.5} Z`} className={`${accentDragonColor}`} />
        <path d={`M ${-bodySegmentLength * 0.65} ${-bodySegmentWidth*0.5} L ${-bodySegmentLength * 0.75} ${-bodySegmentWidth*0.8} L ${-bodySegmentLength * 0.85} ${-bodySegmentWidth*0.5} Z`} className={`${accentDragonColor}`} />

      </g>
      
      {/* Head (Segment 0) */}
      <g style={segmentStyles[0]}>
        {/* Horns - more detailed */}
        <path d={`M ${headScale * -0.2} ${headScale * -0.3} C ${headScale * -0.9} ${headScale * -1}, ${headScale * -1.5} ${headScale * -0.7}, ${headScale * -1.1} ${headScale * 0.1} L ${headScale * -1.2} ${headScale * -0.1} C ${headScale * -1.3} ${headScale * -0.6}, ${headScale * -0.7} ${headScale * -0.8}, ${headScale * -0.2} ${headScale * -0.35} Z`} className={`${hornColor} stroke-black/20`} strokeWidth={detailStrokeWidth}/>
        <path d={`M ${headScale * -0.2} ${headScale * 0.3} C ${headScale * -0.9} ${headScale * 1}, ${headScale * -1.5} ${headScale * 0.7}, ${headScale * -1.1} ${headScale * -0.1} L ${headScale * -1.2} ${headScale * 0.1} C ${headScale * -1.3} ${headScale * 0.6}, ${headScale * -0.7} ${headScale * 0.8}, ${headScale * -0.2} ${headScale * 0.35} Z`} className={`${hornColor} stroke-black/20`} strokeWidth={detailStrokeWidth}/>

        {/* Head Shape */}
        <ellipse cx="0" cy="0" rx={headScale * 0.8} ry={headScale * 0.6} className={`${primaryDragonColor} stroke-black/20 dark:stroke-black/40`} strokeWidth={mainStrokeWidth} />
        {/* Snout */}
        <ellipse cx={headScale * 0.6} cy="0" rx={headScale * 0.5} ry={headScale * 0.4} className={`${primaryDragonColor} stroke-black/20 dark:stroke-black/40`} strokeWidth={detailStrokeWidth}/>
        
        {/* Fangs */}
        <path d={`M ${headScale * 0.8} ${headScale * 0.15} L ${headScale * 0.9} ${headScale * 0.3} L ${headScale * 1} ${headScale * 0.15} Z`} className="fill-neutral-100 dark:fill-neutral-300" />
        <path d={`M ${headScale * 0.8} ${-headScale * 0.15} L ${headScale * 0.9} ${-headScale * 0.3} L ${headScale * 1} ${-headScale * 0.15} Z`} className="fill-neutral-100 dark:fill-neutral-300" />

        {/* Eyes */}
        <circle cx={headScale * 0.3} cy={-headScale * 0.25} r={headScale * 0.18} className={eyeColor} />
        <circle cx={headScale * 0.32} cy={-headScale * 0.25} r={headScale * 0.08} className="fill-black" />
        <circle cx={headScale * 0.31} cy={-headScale * 0.23} r={headScale * 0.03} className="fill-white/70 dark:fill-white/50" /> {/* Glint */}

        <circle cx={headScale * 0.3} cy={headScale * 0.25} r={headScale * 0.18} className={eyeColor} />
        <circle cx={headScale * 0.32} cy={headScale * 0.25} r={headScale * 0.08} className="fill-black" />
        <circle cx={headScale * 0.31} cy={headScale * 0.27} r={headScale * 0.03} className="fill-white/70 dark:fill-white/50" /> {/* Glint */}

        {/* Nostrils */}
        <ellipse cx={headScale * 0.95} cy={-headScale * 0.08} rx={headScale * 0.08} ry={headScale * 0.04} className="fill-black/30 dark:fill-black/50" transform={`rotate(15, ${headScale * 0.95}, ${-headScale * 0.08})`} />
        <ellipse cx={headScale * 0.95} cy={headScale * 0.08} rx={headScale * 0.08} ry={headScale * 0.04} className="fill-black/30 dark:fill-black/50" transform={`rotate(-15, ${headScale * 0.95}, ${headScale * 0.08})`} />


        {/* Whiskers */}
        <path d={`M ${headScale * 0.8} ${headScale * 0.1} Q ${headScale * 1.6} ${headScale * 0.5}, ${headScale * 1.3} ${headScale * 0.9} M ${headScale * 1.3} ${headScale * 0.9} Q ${headScale * 1.7} ${headScale * 1.1}, ${headScale * 1.4} ${headScale * 1.3}`} strokeWidth="0.15" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        <path d={`M ${headScale * 0.8} ${-headScale * 0.1} Q ${headScale * 1.6} ${-headScale * 0.5}, ${headScale * 1.3} ${-headScale * 0.9} M ${headScale * 1.3} ${-headScale * 0.9} Q ${headScale * 1.7} ${-headScale * 1.1}, ${headScale * 1.4} ${-headScale * 1.3}`} strokeWidth="0.15" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        
         {/* Mane/Frill - more detailed */}
        <path d={`M ${headScale * -0.5} 0 
                   Q ${headScale * -0.9} ${headScale * -0.7}, ${headScale * -1.3} ${headScale * -0.9} 
                   L ${headScale * -1.5} ${headScale * -0.8}
                   Q ${headScale * -1.0} ${headScale * -0.5}, ${headScale * -0.55} ${headScale * -0.1} Z`} 
              className={`${accentDragonColor} opacity-70`} />
        <path d={`M ${headScale * -0.6} -0.05
                   Q ${headScale * -0.95} ${headScale * -0.5}, ${headScale * -1.35} ${headScale * -0.7} 
                   L ${headScale * -1.45} ${headScale * -0.6}
                   Q ${headScale * -1.05} ${headScale * -0.3}, ${headScale * -0.65} ${headScale * -0.15} Z`} 
              className={`${primaryDragonColor} opacity-50`} />
         <path d={`M ${headScale * -0.5} 0 
                   Q ${headScale * -0.9} ${headScale * 0.7}, ${headScale * -1.3} ${headScale * 0.9} 
                   L ${headScale * -1.5} ${headScale * 0.8}
                   Q ${headScale * -1.0} ${headScale * 0.5}, ${headScale * -0.55} ${headScale * 0.1} Z`} 
              className={`${accentDragonColor} opacity-70`}/>
        <path d={`M ${headScale * -0.6} 0.05
                   Q ${headScale * -0.95} ${headScale * 0.5}, ${headScale * -1.35} ${headScale * 0.7} 
                   L ${headScale * -1.45} ${headScale * 0.6}
                   Q ${headScale * -1.05} ${headScale * 0.3}, ${headScale * -0.65} ${headScale * 0.15} Z`} 
              className={`${primaryDragonColor} opacity-50`} />
      </g>
    </g>
  );
};

export default Dragon;
