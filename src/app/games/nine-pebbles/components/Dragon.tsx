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
  const headScale = 2.0; // Slightly reduced for finer details
  const bodySegmentBaseLength = headScale * 1.5; // Base length for segments
  const bodySegmentBaseWidth = headScale * 0.7; // Base width

  const [visualTransform, setVisualTransform] = useState(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(0deg)`);
  const [currentAngle, setCurrentAngle] = useState(0);
  
  const segmentCount = 6; // Increased segment count for more detail
  const [segmentStyles, setSegmentStyles] = useState<React.CSSProperties[]>(
    Array(segmentCount).fill({}).map((_, i) => ({
      transform: `translateX(${-i * bodySegmentBaseLength * 0.55}px) translateY(0px) rotate(0deg)`, 
      transformOrigin: '100% 50%', 
      transition: `transform ${animationDuration * 0.35}ms cubic-bezier(0.45, 0.05, 0.55, 0.95)` // Smoother bezier
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
      const windingAmplitudeBase = bodySegmentBaseWidth * 0.35; 
      const windingCycles = 2.5; // Increased cycles for more serpentine motion

      const animateWinding = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsedTime = timestamp - startTimeRef.current;
        const progress = Math.min(elapsedTime / animationDuration, 1);
        const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Ease in-out for progress

        if (progress < 1) {
          const newSegmentStyles = segmentStyles.map((_, i) => {
            if (i === 0) return segmentStyles[0]; // Head segment is controlled by main transform
            
            // Make tail segments wind more
            const amplitudeFactor = 1 + (i / segmentCount) * 0.5;
            const amplitude = windingAmplitudeBase * amplitudeFactor * (1 - Math.abs(0.5 - easedProgress) * 2 * 0.3); // Dampen at start/end of move
            
            const phaseShift = (Math.PI / (segmentCount -1)) * i * 0.7; 
            const waveAngle = windingCycles * easedProgress * 2 * Math.PI;
            
            const offsetY = amplitude * Math.sin(waveAngle + phaseShift);
            
            // Rotation effect to make segments "bend"
            const segmentRotationFactor = (i / segmentCount); // Tail segments rotate more
            const segmentRotation = Math.cos(waveAngle + phaseShift + Math.PI/2) * 15 * segmentRotationFactor * (easedProgress < 0.5 ? easedProgress * 2 : (1-easedProgress) * 2);

            // Adjust translateX to create more overlap and compression/extension
            const dynamicLengthFactor = 0.55 - Math.sin(waveAngle + phaseShift) * 0.05 * (i/segmentCount);

            return {
              ...segmentStyles[i],
              transform: `translateX(${-i * bodySegmentBaseLength * dynamicLengthFactor}px) translateY(${offsetY}px) rotate(${segmentRotation}deg)`,
              transformOrigin: '100% 50%', 
              transition: `transform ${animationDuration * 0.2}ms cubic-bezier(0.33, 1, 0.68, 1)` // Faster, more responsive segment transition
            };
          });
          setSegmentStyles(newSegmentStyles);
          animationFrameIdRef.current = requestAnimationFrame(animateWinding);
        } else {
          const finalStyles = Array(segmentCount).fill({}).map((_,i) => ({
              transform: `translateX(${-i * bodySegmentBaseLength * 0.55}px) translateY(0px) rotate(0deg)`,
              transformOrigin: '100% 50%',
              transition: `transform ${animationDuration * 0.3}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
          }));
          setSegmentStyles(finalStyles);
          startTimeRef.current = null;    
        }
      };
      animationFrameIdRef.current = requestAnimationFrame(animateWinding);
    } else if (!isMoving) {
         const finalStyles = Array(segmentCount).fill({}).map((_,i) => ({
            transform: `translateX(${-i * bodySegmentBaseLength * 0.55}px) translateY(0px) rotate(0deg)`,
            transformOrigin: '100% 50%',
            transition: `transform ${animationDuration * 0.3}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
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
  }, [isMoving, animationDuration, bodySegmentBaseWidth, bodySegmentBaseLength]);


  const primaryDragonColor = "fill-red-600 dark:fill-red-500";
  const secondaryDragonColor = "fill-yellow-400 dark:fill-yellow-300";
  const accentDragonColor = "fill-orange-500 dark:fill-orange-400";
  const eyeColor = "fill-green-400 dark:fill-green-300";
  const hornColor = "fill-neutral-300 dark:fill-neutral-400";
  const shadowStroke = "stroke-black/15 dark:stroke-black/35"; // Slightly darker shadow
  const detailStrokeWidth = "0.08"; // Thinner for more detailed look
  const mainStrokeWidth = "0.12";

  // Helper for creating oval paths
  const createOvalPath = (cx: number, cy: number, rx: number, ry: number, rotation = 0) => {
    return `M ${cx - rx},${cy} 
            A ${rx},${ry} ${rotation} 0 1 ${cx + rx},${cy} 
            A ${rx},${ry} ${rotation} 0 1 ${cx - rx},${cy} Z`;
  };
  
  const segmentsRender: JSX.Element[] = [];

  for (let i = segmentCount - 1; i > 0; i--) { // Render tail to body, head is separate
    const isTailEnd = i === segmentCount - 1;
    const segmentLength = bodySegmentBaseLength * (1 - (i / segmentCount) * 0.2); // Segments taper slightly
    const segmentWidth = bodySegmentBaseWidth * (1 - (i / segmentCount) * 0.3);

    segmentsRender.push(
      <g key={`segment-${i}`} style={segmentStyles[i]}>
        {/* Main segment oval */}
        <ellipse 
          cx={-segmentLength * 0.4} 
          cy="0" 
          rx={segmentLength * 0.6} 
          ry={segmentWidth * 0.55} 
          className={`${primaryDragonColor} ${i % 2 === 0 ? 'opacity-90' : 'opacity-80'} ${shadowStroke}`} 
          strokeWidth={detailStrokeWidth} 
        />
        {/* Smaller overlay oval for texture/detail */}
        <ellipse 
          cx={-segmentLength * 0.35} 
          cy="0" 
          rx={segmentLength * 0.4} 
          ry={segmentWidth * 0.35} 
          className={`${secondaryDragonColor} opacity-60`} 
        />
        {/* Dorsal scales/spikes - simplified for smaller segments */}
        { i < segmentCount -1 && // No scales on the very last tail segment if it's a fin
          <>
            <path d={`M ${-segmentLength * 0.1} ${-segmentWidth * 0.4} L ${-segmentLength * 0.15} ${-segmentWidth * 0.6} L ${-segmentLength * 0.2} ${-segmentWidth * 0.4} Z`} className={`${accentDragonColor} opacity-70`} />
            <path d={`M ${-segmentLength * 0.5} ${-segmentWidth * 0.4} L ${-segmentLength * 0.55} ${-segmentWidth * 0.6} L ${-segmentLength * 0.6} ${-segmentWidth * 0.4} Z`} className={`${accentDragonColor} opacity-70`} />
          </>
        }
         {/* Tail Fin for the last segment */}
        {isTailEnd && (
          <g transform={`translate(${-segmentLength * 0.8}, 0)`}>
            <path d={`M 0 0 
                       L ${-segmentLength * 0.4} ${segmentWidth * 0.4} 
                       L ${-segmentLength * 0.3} 0
                       L ${-segmentLength * 0.4} ${-segmentWidth * 0.4} Z`} 
                  className={`${accentDragonColor} opacity-90`} />
            <path d={`M ${-segmentLength * 0.35} ${segmentWidth * 0.15}
                       L ${-segmentLength * 0.6} ${segmentWidth * 0.5}
                       L ${-segmentLength * 0.5} ${segmentWidth * 0.15} Z`}
                 className={`${accentDragonColor} opacity-60`} transform="rotate(15, -0.4, 0)" />
          </g>
        )}
      </g>
    );
  }


  return (
    <g
      style={{
        transform: visualTransform,
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.55, 0.06, 0.68, 0.19)` : 'none',  // Adjusted cubic-bezier for head movement
        transformOrigin: '0 0', 
        pointerEvents: 'none',
      }}
    >
      {/* Render body segments */}
      {segmentsRender}
      
      {/* Head (Segment 0) */}
      <g style={segmentStyles[0]}>
        {/* Horns - more detailed */}
        <path d={`M ${headScale * -0.2} ${headScale * -0.3} C ${headScale * -0.8} ${headScale * -0.9}, ${headScale * -1.3} ${headScale * -0.6}, ${headScale * -1.0} ${headScale * 0.1} L ${headScale * -1.1} ${headScale * -0.1} C ${headScale * -1.2} ${headScale * -0.5}, ${headScale * -0.6} ${headScale * -0.7}, ${headScale * -0.2} ${headScale * -0.35} Z`} className={`${hornColor} stroke-black/25`} strokeWidth={detailStrokeWidth}/>
        <path d={`M ${headScale * -0.2} ${headScale * 0.3} C ${headScale * -0.8} ${headScale * 0.9}, ${headScale * -1.3} ${headScale * 0.6}, ${headScale * -1.0} ${headScale * -0.1} L ${headScale * -1.1} ${headScale * 0.1} C ${headScale * -1.2} ${headScale * 0.5}, ${headScale * -0.6} ${headScale * 0.7}, ${headScale * -0.2} ${headScale * 0.35} Z`} className={`${hornColor} stroke-black/25`} strokeWidth={detailStrokeWidth}/>

        {/* Head Shape using ovals*/}
        <path d={createOvalPath(0, 0, headScale * 0.75, headScale * 0.55)} className={`${primaryDragonColor} stroke-black/25 dark:stroke-black/45`} strokeWidth={mainStrokeWidth} />
        {/* Snout using ovals */}
        <path d={createOvalPath(headScale * 0.55, 0, headScale * 0.45, headScale * 0.35)} className={`${primaryDragonColor} stroke-black/25 dark:stroke-black/45`} strokeWidth={detailStrokeWidth}/>
        
        {/* Fangs */}
        <path d={`M ${headScale * 0.75} ${headScale * 0.12} L ${headScale * 0.85} ${headScale * 0.25} L ${headScale * 0.95} ${headScale * 0.12} Z`} className="fill-neutral-100 dark:fill-neutral-300" />
        <path d={`M ${headScale * 0.75} ${-headScale * 0.12} L ${headScale * 0.85} ${-headScale * 0.25} L ${headScale * 0.95} ${-headScale * 0.12} Z`} className="fill-neutral-100 dark:fill-neutral-300" />

        {/* Eyes */}
        <circle cx={headScale * 0.28} cy={-headScale * 0.23} r={headScale * 0.16} className={eyeColor} />
        <circle cx={headScale * 0.30} cy={-headScale * 0.23} r={headScale * 0.07} className="fill-black" />
        <circle cx={headScale * 0.29} cy={-headScale * 0.21} r={headScale * 0.025} className="fill-white/70 dark:fill-white/50" /> {/* Glint */}

        <circle cx={headScale * 0.28} cy={headScale * 0.23} r={headScale * 0.16} className={eyeColor} />
        <circle cx={headScale * 0.30} cy={headScale * 0.23} r={headScale * 0.07} className="fill-black" />
        <circle cx={headScale * 0.29} cy={headScale * 0.25} r={headScale * 0.025} className="fill-white/70 dark:fill-white/50" /> {/* Glint */}

        {/* Nostrils */}
        <ellipse cx={headScale * 0.9} cy={-headScale * 0.07} rx={headScale * 0.07} ry={headScale * 0.035} className="fill-black/35 dark:fill-black/55" transform={`rotate(15, ${headScale * 0.9}, ${-headScale * 0.07})`} />
        <ellipse cx={headScale * 0.9} cy={headScale * 0.07} rx={headScale * 0.07} ry={headScale * 0.035} className="fill-black/35 dark:fill-black/55" transform={`rotate(-15, ${headScale * 0.9}, ${headScale * 0.07})`} />

        {/* Whiskers */}
        <path d={`M ${headScale * 0.75} ${headScale * 0.09} Q ${headScale * 1.4} ${headScale * 0.4}, ${headScale * 1.15} ${headScale * 0.8} M ${headScale * 1.15} ${headScale * 0.8} Q ${headScale * 1.5} ${headScale * 1.0}, ${headScale * 1.25} ${headScale * 1.2}`} strokeWidth="0.12" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        <path d={`M ${headScale * 0.75} ${-headScale * 0.09} Q ${headScale * 1.4} ${-headScale * 0.4}, ${headScale * 1.15} ${-headScale * 0.8} M ${headScale * 1.15} ${-headScale * 0.8} Q ${headScale * 1.5} ${-headScale * 1.0}, ${headScale * 1.25} ${-headScale * 1.2}`} strokeWidth="0.12" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        
         {/* Mane/Frill - more detailed */}
        <path d={`M ${headScale * -0.45} 0 
                   Q ${headScale * -0.8} ${headScale * -0.6}, ${headScale * -1.2} ${headScale * -0.8} 
                   L ${headScale * -1.4} ${headScale * -0.7}
                   Q ${headScale * -0.9} ${headScale * -0.4}, ${headScale * -0.5} ${headScale * -0.1} Z`} 
              className={`${accentDragonColor} opacity-75`} />
        <path d={`M ${headScale * -0.55} -0.05
                   Q ${headScale * -0.85} ${headScale * -0.4}, ${headScale * -1.25} ${headScale * -0.6} 
                   L ${headScale * -1.35} ${headScale * -0.5}
                   Q ${headScale * -0.95} ${headScale * -0.2}, ${headScale * -0.6} ${headScale * -0.15} Z`} 
              className={`${primaryDragonColor} opacity-55`} />
         <path d={`M ${headScale * -0.45} 0 
                   Q ${headScale * -0.8} ${headScale * 0.6}, ${headScale * -1.2} ${headScale * 0.8} 
                   L ${headScale * -1.4} ${headScale * 0.7}
                   Q ${headScale * -0.9} ${headScale * 0.4}, ${headScale * -0.5} ${headScale * 0.1} Z`} 
              className={`${accentDragonColor} opacity-75`}/>
        <path d={`M ${headScale * -0.55} 0.05
                   Q ${headScale * -0.85} ${headScale * 0.4}, ${headScale * -1.25} ${headScale * 0.6} 
                   L ${headScale * -1.35} ${headScale * 0.5}
                   Q ${headScale * -0.95} ${headScale * 0.2}, ${headScale * -0.6} ${headScale * 0.15} Z`} 
              className={`${primaryDragonColor} opacity-55`} />
      </g>
    </g>
  );
};

export default Dragon;
