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
  const headScale = 2.0; 
  const bodySegmentBaseLength = headScale * 1.5; 
  const bodySegmentBaseWidth = headScale * 0.7; 

  const [visualTransform, setVisualTransform] = useState(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(0deg)`);
  const [currentAngle, setCurrentAngle] = useState(0);
  
  const segmentCount = 6; 
  const [segmentStyles, setSegmentStyles] = useState<React.CSSProperties[]>(
    Array(segmentCount).fill({}).map((_, i) => ({
      transform: `translateX(${-i * bodySegmentBaseLength * 0.55}px) translateY(0px) rotate(0deg)`, 
      transformOrigin: '100% 50%', 
      transition: `transform ${animationDuration * 0.35}ms cubic-bezier(0.45, 0.05, 0.55, 0.95)` 
    }))
  );
  
  const animationFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const turnDeltaAngleRef = useRef<number>(0);


  useEffect(() => {
    let newCalculatedHeadAngle = currentAngle; 
    if (isMoving && (currentPos.x !== targetPos.x || currentPos.y !== targetPos.y)) {
      const dx = targetPos.x - currentPos.x;
      const dy = targetPos.y - currentPos.y;
      newCalculatedHeadAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      let delta = newCalculatedHeadAngle - currentAngle; // currentAngle here is the angle *before* this move
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      turnDeltaAngleRef.current = delta;

      setVisualTransform(`translate(${targetPos.x}px, ${targetPos.y}px) rotate(${newCalculatedHeadAngle}deg)`);
      setCurrentAngle(newCalculatedHeadAngle); 
    } else {
      turnDeltaAngleRef.current = 0; 
      setVisualTransform(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(${currentAngle}deg)`);
    }
  }, [currentPos, targetPos, isMoving, currentAngle, animationDuration]);


  useEffect(() => {
    if (isMoving && animationDuration > 0) {
      const turnSeverity = Math.min(1, Math.abs(turnDeltaAngleRef.current) / 90); // 0 for straight, 1 for >=90deg turn
      const dynamicWindingAmplitudeBase = bodySegmentBaseWidth * (1 + turnSeverity * 0.75); // Increase amplitude for turns
      const dynamicMaxSegmentRotation = 18 + turnSeverity * 22; // Max segment S-wave rotation up to 40deg for sharp turns


      const animateWinding = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsedTime = timestamp - startTimeRef.current;
        const progress = Math.min(elapsedTime / animationDuration, 1);
        const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); 

        if (progress < 1) {
          const newSegmentStyles = segmentStyles.map((_, i) => {
            if (i === 0) return segmentStyles[0]; 
            
            const amplitudeFactor = 1 + (i / segmentCount) * 0.6; 
            const movementPhaseAmplitudeFactor = Math.sin(progress * Math.PI); 
            const amplitude = dynamicWindingAmplitudeBase * amplitudeFactor * movementPhaseAmplitudeFactor;
            
            const phaseShift = (Math.PI / (segmentCount -1)) * i * 0.8; 
            const waveAngle = 2.5 * easedProgress * 2 * Math.PI; // windingCycles = 2.5
            
            const offsetY = amplitude * Math.sin(waveAngle + phaseShift);
            
            const segmentRotationFactor = (i / segmentCount); 
            const baseSegmentWaveRotation = Math.cos(waveAngle + phaseShift + Math.PI/2) * dynamicMaxSegmentRotation * segmentRotationFactor * movementPhaseAmplitudeFactor;

            const dynamicLengthFactor = 0.55 - Math.sin(waveAngle + phaseShift) * 0.06 * (i/segmentCount) * movementPhaseAmplitudeFactor;

            return {
              ...segmentStyles[i],
              transform: `translateX(${-i * bodySegmentBaseLength * dynamicLengthFactor}px) translateY(${offsetY}px) rotate(${baseSegmentWaveRotation}deg)`,
              transformOrigin: '100% 50%', 
              transition: `transform ${animationDuration * 0.15}ms cubic-bezier(0.33, 1, 0.68, 1)`
            };
          });
          setSegmentStyles(newSegmentStyles);
          animationFrameIdRef.current = requestAnimationFrame(animateWinding);
        } else { 
          const finalStyles = Array(segmentCount).fill({}).map((_,i) => ({
              transform: `translateX(${-i * bodySegmentBaseLength * 0.55}px) translateY(0px) rotate(0deg)`,
              transformOrigin: '100% 50%',
              transition: `transform ${animationDuration * 0.25}ms cubic-bezier(0.25, 0.1, 0.25, 1)` 
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
            transition: `transform ${animationDuration * 0.25}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
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
  const shadowStroke = "stroke-black/15 dark:stroke-black/35"; 
  const detailStrokeWidth = "0.08"; 
  const mainStrokeWidth = "0.12";

  const createOvalPath = (cx: number, cy: number, rx: number, ry: number, rotation = 0) => {
    return `M ${cx - rx},${cy} 
            A ${rx},${ry} ${rotation} 0 1 ${cx + rx},${cy} 
            A ${rx},${ry} ${rotation} 0 1 ${cx - rx},${cy} Z`;
  };
  
  const segmentsRender: JSX.Element[] = [];

  for (let i = segmentCount - 1; i > 0; i--) { 
    const isTailEnd = i === segmentCount - 1;
    const segmentLength = bodySegmentBaseLength * (1 - (i / segmentCount) * 0.2); 
    const segmentWidth = bodySegmentBaseWidth * (1 - (i / segmentCount) * 0.3);

    segmentsRender.push(
      <g key={`segment-${i}`} style={segmentStyles[i]}>
        <ellipse 
          cx={-segmentLength * 0.4} 
          cy="0" 
          rx={segmentLength * 0.6} 
          ry={segmentWidth * 0.55} 
          className={`${primaryDragonColor} ${i % 2 === 0 ? 'opacity-90' : 'opacity-80'} ${shadowStroke}`} 
          strokeWidth={detailStrokeWidth} 
        />
        <ellipse 
          cx={-segmentLength * 0.35} 
          cy="0" 
          rx={segmentLength * 0.4} 
          ry={segmentWidth * 0.35} 
          className={`${secondaryDragonColor} opacity-60`} 
        />
        { i < segmentCount -1 && 
          <>
            <path d={`M ${-segmentLength * 0.1} ${-segmentWidth * 0.4} L ${-segmentLength * 0.15} ${-segmentWidth * 0.6} L ${-segmentLength * 0.2} ${-segmentWidth * 0.4} Z`} className={`${accentDragonColor} opacity-70`} />
            <path d={`M ${-segmentLength * 0.5} ${-segmentWidth * 0.4} L ${-segmentLength * 0.55} ${-segmentWidth * 0.6} L ${-segmentLength * 0.6} ${-segmentWidth * 0.4} Z`} className={`${accentDragonColor} opacity-70`} />
          </>
        }
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
        transition: isMoving ? `transform ${animationDuration}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none', 
        transformOrigin: '0 0', 
        pointerEvents: 'none',
      }}
    >
      {segmentsRender}
      
      <g style={segmentStyles[0]}>
        <path d={`M ${headScale * -0.2} ${headScale * -0.3} C ${headScale * -0.8} ${headScale * -0.9}, ${headScale * -1.3} ${headScale * -0.6}, ${headScale * -1.0} ${headScale * 0.1} L ${headScale * -1.1} ${headScale * -0.1} C ${headScale * -1.2} ${headScale * -0.5}, ${headScale * -0.6} ${headScale * -0.7}, ${headScale * -0.2} ${headScale * -0.35} Z`} className={`${hornColor} stroke-black/25`} strokeWidth={detailStrokeWidth}/>
        <path d={`M ${headScale * -0.2} ${headScale * 0.3} C ${headScale * -0.8} ${headScale * 0.9}, ${headScale * -1.3} ${headScale * 0.6}, ${headScale * -1.0} ${headScale * -0.1} L ${headScale * -1.1} ${headScale * 0.1} C ${headScale * -1.2} ${headScale * 0.5}, ${headScale * -0.6} ${headScale * 0.7}, ${headScale * -0.2} ${headScale * 0.35} Z`} className={`${hornColor} stroke-black/25`} strokeWidth={detailStrokeWidth}/>

        <path d={createOvalPath(0, 0, headScale * 0.75, headScale * 0.55)} className={`${primaryDragonColor} stroke-black/25 dark:stroke-black/45`} strokeWidth={mainStrokeWidth} />
        <path d={createOvalPath(headScale * 0.55, 0, headScale * 0.45, headScale * 0.35)} className={`${primaryDragonColor} stroke-black/25 dark:stroke-black/45`} strokeWidth={detailStrokeWidth}/>
        
        <path d={`M ${headScale * 0.75} ${headScale * 0.12} L ${headScale * 0.85} ${headScale * 0.25} L ${headScale * 0.95} ${headScale * 0.12} Z`} className="fill-neutral-100 dark:fill-neutral-300" />
        <path d={`M ${headScale * 0.75} ${-headScale * 0.12} L ${headScale * 0.85} ${-headScale * 0.25} L ${headScale * 0.95} ${-headScale * 0.12} Z`} className="fill-neutral-100 dark:fill-neutral-300" />

        <circle cx={headScale * 0.28} cy={-headScale * 0.23} r={headScale * 0.16} className={eyeColor} />
        <circle cx={headScale * 0.30} cy={-headScale * 0.23} r={headScale * 0.07} className="fill-black" />
        <circle cx={headScale * 0.29} cy={-headScale * 0.21} r={headScale * 0.025} className="fill-white/70 dark:fill-white/50" />

        <circle cx={headScale * 0.28} cy={headScale * 0.23} r={headScale * 0.16} className={eyeColor} />
        <circle cx={headScale * 0.30} cy={headScale * 0.23} r={headScale * 0.07} className="fill-black" />
        <circle cx={headScale * 0.29} cy={headScale * 0.25} r={headScale * 0.025} className="fill-white/70 dark:fill-white/50" />

        <ellipse cx={headScale * 0.9} cy={-headScale * 0.07} rx={headScale * 0.07} ry={headScale * 0.035} className="fill-black/35 dark:fill-black/55" transform={`rotate(15, ${headScale * 0.9}, ${-headScale * 0.07})`} />
        <ellipse cx={headScale * 0.9} cy={headScale * 0.07} rx={headScale * 0.07} ry={headScale * 0.035} className="fill-black/35 dark:fill-black/55" transform={`rotate(-15, ${headScale * 0.9}, ${headScale * 0.07})`} />

        <path d={`M ${headScale * 0.75} ${headScale * 0.09} Q ${headScale * 1.4} ${headScale * 0.4}, ${headScale * 1.15} ${headScale * 0.8} M ${headScale * 1.15} ${headScale * 0.8} Q ${headScale * 1.5} ${headScale * 1.0}, ${headScale * 1.25} ${headScale * 1.2}`} strokeWidth="0.12" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        <path d={`M ${headScale * 0.75} ${-headScale * 0.09} Q ${headScale * 1.4} ${-headScale * 0.4}, ${headScale * 1.15} ${-headScale * 0.8} M ${headScale * 1.15} ${-headScale * 0.8} Q ${headScale * 1.5} ${-headScale * 1.0}, ${headScale * 1.25} ${-headScale * 1.2}`} strokeWidth="0.12" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        
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
