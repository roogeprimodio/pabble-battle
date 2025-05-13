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
  const [currentAngle, setCurrentAngle] = useState(0); // Represents the settled angle of the head
  
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
  const turnDeltaAngleRef = useRef<number>(0); // Stores the change in angle for the current move


  // Effect 1: Determine target head angle, delta for the move, and initiate head animation.
  useEffect(() => {
    if (isMoving && (currentPos.x !== targetPos.x || currentPos.y !== targetPos.y)) {
      const dx = targetPos.x - currentPos.x;
      const dy = targetPos.y - currentPos.y;
      const targetHeadAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      let delta = targetHeadAngle - currentAngle; 
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      turnDeltaAngleRef.current = delta;

      setVisualTransform(`translate(${targetPos.x}px, ${targetPos.y}px) rotate(${targetHeadAngle}deg)`);
      setCurrentAngle(targetHeadAngle); 

    } else { 
      turnDeltaAngleRef.current = 0;
      if (!isMoving) {
          setVisualTransform(`translate(${currentPos.x}px, ${currentPos.y}px) rotate(${currentAngle}deg)`);
      }
    }
  }, [currentPos, targetPos, isMoving, currentAngle, animationDuration]);


  // Effect 2: Animate body segments winding and bending based on movement and turn delta.
  useEffect(() => {
    if (isMoving && animationDuration > 0) {
      const turnSeverity = Math.min(1, Math.abs(turnDeltaAngleRef.current) / 90); 
      // Reduced base amplitude and turn influence to reduce flicker
      const dynamicWindingAmplitudeBase = bodySegmentBaseWidth * (0.5 + turnSeverity * 0.15); 
      // Reduced max segment rotation, especially the turn-based addition
      const dynamicMaxSegmentRotation = 10 + turnSeverity * 10; 

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
            
            const amplitudeFactor = 1 + (i / segmentCount) * 0.5; // Keep some variation along the body
            const movementPhaseAmplitudeFactor = Math.sin(progress * Math.PI); 
            
            const sWaveDampening = 1 - (turnSeverity * 0.7); // Slightly increased dampening during turns

            const currentAmplitude = dynamicWindingAmplitudeBase * amplitudeFactor * movementPhaseAmplitudeFactor * sWaveDampening;
            
            const phaseShift = (Math.PI / (segmentCount -1)) * i * 0.8; 
            // Reduced wave frequency to make S-wave slower
            const waveAngle = 1.5 * easedProgress * 2 * Math.PI;  
            
            const offsetY = currentAmplitude * Math.sin(waveAngle + phaseShift);
            
            const segmentRotationFactor = (i / segmentCount); 
            const baseSegmentWaveRotation = Math.cos(waveAngle + phaseShift + Math.PI/2) * dynamicMaxSegmentRotation * segmentRotationFactor * movementPhaseAmplitudeFactor * sWaveDampening;

            let segmentOverallBendRotation = 0;
            if (Math.abs(turnDeltaAngleRef.current) > 1) { 
              const bendInfluenceFactor = (1 - Math.pow(i / (segmentCount + 1), 0.5));
              segmentOverallBendRotation = (turnDeltaAngleRef.current * bendInfluenceFactor * 0.50) * Math.sin(progress * Math.PI);
            }
            
            const finalSegmentRotation = baseSegmentWaveRotation + segmentOverallBendRotation;

            const dynamicLengthFactor = 0.55 - Math.sin(waveAngle + phaseShift) * 0.05 * (i/segmentCount) * movementPhaseAmplitudeFactor; // Reduced length variation

            return {
              transform: `translateX(${-i * bodySegmentBaseLength * dynamicLengthFactor}px) translateY(${offsetY}px) rotate(${finalSegmentRotation}deg)`,
              transformOrigin: '100% 50%', 
            };
          });
          setSegmentStyles(newSegmentStyles);
          animationFrameIdRef.current = requestAnimationFrame(animateWinding);
        } else { 
          const finalStyles = Array(segmentCount).fill({}).map((_,idx) => ({
              transform: `translateX(${-idx * bodySegmentBaseLength * 0.55}px) translateY(0px) rotate(0deg)`,
              transformOrigin: '100% 50%',
              transition: `transform ${animationDuration * 0.25}ms cubic-bezier(0.25, 0.1, 0.25, 1)` 
          }));
          setSegmentStyles(finalStyles);
          startTimeRef.current = null;    
        }
      };
      animationFrameIdRef.current = requestAnimationFrame(animateWinding);
    } else if (!isMoving) { 
         const finalStyles = Array(segmentCount).fill({}).map((_,idx) => ({
            transform: `translateX(${-idx * bodySegmentBaseLength * 0.55}px) translateY(0px) rotate(0deg)`,
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
  // Removed segmentStyles from dependencies to prevent potential re-triggering issues with rAF loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMoving, animationDuration, bodySegmentBaseWidth, bodySegmentBaseLength, segmentCount]);


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

  // Render segments from tail to head so head is on top
  for (let i = segmentCount - 1; i > 0; i--) { // i > 0 because head (segment 0) is rendered separately
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
        {/* Spikes/fins */}
        { i < segmentCount -1 && 
          <>
            <path d={`M ${-segmentLength * 0.1} ${-segmentWidth * 0.4} L ${-segmentLength * 0.15} ${-segmentWidth * 0.6} L ${-segmentLength * 0.2} ${-segmentWidth * 0.4} Z`} className={`${accentDragonColor} opacity-70`} />
            <path d={`M ${-segmentLength * 0.5} ${-segmentWidth * 0.4} L ${-segmentLength * 0.55} ${-segmentWidth * 0.6} L ${-segmentLength * 0.6} ${-segmentWidth * 0.4} Z`} className={`${accentDragonColor} opacity-70`} />
          </>
        }
        {/* Tail details */}
        {isTailEnd && (
          <g transform={`translate(${-segmentLength * 0.8}, 0)`}>
            <path d={`M 0 0 
                       L ${-segmentLength * 0.4} ${segmentWidth * 0.4} 
                       L ${-segmentLength * 0.3} 0
                       L ${-segmentLength * 0.4} ${-segmentWidth * 0.4} Z`} 
                  className={`${accentDragonColor} opacity-90`} />
            {/* Smaller fin for tail tip */}
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
      {/* Render body segments first */}
      {segmentsRender}
      
      {/* Head (segment 0), rendered on top */}
      <g style={segmentStyles[0]}> {/* segmentStyles[0] should ideally be a static transform if head anim is fully global */}
        {/* Horns */}
        <path d={`M ${headScale * -0.2} ${headScale * -0.3} C ${headScale * -0.8} ${headScale * -0.9}, ${headScale * -1.3} ${headScale * -0.6}, ${headScale * -1.0} ${headScale * 0.1} L ${headScale * -1.1} ${headScale * -0.1} C ${headScale * -1.2} ${headScale * -0.5}, ${headScale * -0.6} ${headScale * -0.7}, ${headScale * -0.2} ${headScale * -0.35} Z`} className={`${hornColor} stroke-black/25`} strokeWidth={detailStrokeWidth}/>
        <path d={`M ${headScale * -0.2} ${headScale * 0.3} C ${headScale * -0.8} ${headScale * 0.9}, ${headScale * -1.3} ${headScale * 0.6}, ${headScale * -1.0} ${headScale * -0.1} L ${headScale * -1.1} ${headScale * 0.1} C ${headScale * -1.2} ${headScale * 0.5}, ${headScale * -0.6} ${headScale * 0.7}, ${headScale * -0.2} ${headScale * 0.35} Z`} className={`${hornColor} stroke-black/25`} strokeWidth={detailStrokeWidth}/>

        {/* Main head shape */}
        <path d={createOvalPath(0, 0, headScale * 0.75, headScale * 0.55)} className={`${primaryDragonColor} stroke-black/25 dark:stroke-black/45`} strokeWidth={mainStrokeWidth} />
        {/* Snout */}
        <path d={createOvalPath(headScale * 0.55, 0, headScale * 0.45, headScale * 0.35)} className={`${primaryDragonColor} stroke-black/25 dark:stroke-black/45`} strokeWidth={detailStrokeWidth}/>
        
        {/* Teeth/Fangs (simple triangles) */}
        <path d={`M ${headScale * 0.75} ${headScale * 0.12} L ${headScale * 0.85} ${headScale * 0.25} L ${headScale * 0.95} ${headScale * 0.12} Z`} className="fill-neutral-100 dark:fill-neutral-300" />
        <path d={`M ${headScale * 0.75} ${-headScale * 0.12} L ${headScale * 0.85} ${-headScale * 0.25} L ${headScale * 0.95} ${-headScale * 0.12} Z`} className="fill-neutral-100 dark:fill-neutral-300" />

        {/* Eyes */}
        <circle cx={headScale * 0.28} cy={-headScale * 0.23} r={headScale * 0.16} className={eyeColor} />
        <circle cx={headScale * 0.30} cy={-headScale * 0.23} r={headScale * 0.07} className="fill-black" />
        <circle cx={headScale * 0.29} cy={-headScale * 0.21} r={headScale * 0.025} className="fill-white/70 dark:fill-white/50" /> {/* Eye highlight */}

        <circle cx={headScale * 0.28} cy={headScale * 0.23} r={headScale * 0.16} className={eyeColor} />
        <circle cx={headScale * 0.30} cy={headScale * 0.23} r={headScale * 0.07} className="fill-black" />
        <circle cx={headScale * 0.29} cy={headScale * 0.25} r={headScale * 0.025} className="fill-white/70 dark:fill-white/50" /> {/* Eye highlight */}

        {/* Nostrils */}
        <ellipse cx={headScale * 0.9} cy={-headScale * 0.07} rx={headScale * 0.07} ry={headScale * 0.035} className="fill-black/35 dark:fill-black/55" transform={`rotate(15, ${headScale * 0.9}, ${-headScale * 0.07})`} />
        <ellipse cx={headScale * 0.9} cy={headScale * 0.07} rx={headScale * 0.07} ry={headScale * 0.035} className="fill-black/35 dark:fill-black/55" transform={`rotate(-15, ${headScale * 0.9}, ${headScale * 0.07})`} />

        {/* Whiskers */}
        <path d={`M ${headScale * 0.75} ${headScale * 0.09} Q ${headScale * 1.4} ${headScale * 0.4}, ${headScale * 1.15} ${headScale * 0.8} M ${headScale * 1.15} ${headScale * 0.8} Q ${headScale * 1.5} ${headScale * 1.0}, ${headScale * 1.25} ${headScale * 1.2}`} strokeWidth="0.12" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        <path d={`M ${headScale * 0.75} ${-headScale * 0.09} Q ${headScale * 1.4} ${-headScale * 0.4}, ${headScale * 1.15} ${-headScale * 0.8} M ${headScale * 1.15} ${-headScale * 0.8} Q ${headScale * 1.5} ${-headScale * 1.0}, ${headScale * 1.25} ${-headScale * 1.2}`} strokeWidth="0.12" className={`${secondaryDragonColor} opacity-80 fill-none stroke-current`} />
        
        {/* Head Frills/Side details */}
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
