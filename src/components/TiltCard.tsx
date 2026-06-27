import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltAmount?: number; // Maximum tilt angle in degrees
}

export const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', tiltAmount = 8 }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Motion values for tracking cursor position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Raw mouse position for the glare effect
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  // Apply a spring physics layer to smooth out the transition
  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });

  // Map the smooth coordinates (-0.5 to 0.5) to tilt angles
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${tiltAmount}deg`, `-${tiltAmount}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${tiltAmount}deg`, `${tiltAmount}deg`]);

  // Dynamic shadow based on tilt
  const shadowX = useTransform(mouseXSpring, [-0.5, 0.5], [20, -20]);
  const shadowY = useTransform(mouseYSpring, [-0.5, 0.5], [20, -20]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    // Convert to range [-0.5, 0.5]
    const xPct = (cursorX / width) - 0.5;
    const yPct = (cursorY / height) - 0.5;
    
    x.set(xPct);
    y.set(yPct);

    // Set mouse position as percentage for glare
    mouseX.set((cursorX / width) * 100);
    mouseY.set((cursorY / height) * 100);
  };

  const handleMouseLeave = () => {
    // Reset to flat
    x.set(0);
    y.set(0);
    mouseX.set(50);
    mouseY.set(50);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1200px",
      }}
      className={`tilt-card-wrapper relative w-full will-change-transform ${className}`}
    >
      {/* Dynamic shadow layer */}
      <motion.div
        className="absolute inset-0 rounded-2xl -z-10 opacity-40"
        style={{
          x: shadowX,
          y: shadowY,
          filter: "blur(30px)",
          background: "rgba(99, 102, 241, 0.12)",
        }}
      />
      
      {/* Card content with depth */}
      <div 
        style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} 
        className="tilt-card-content w-full h-full flex flex-col relative"
      >
        {children}
        
        {/* Glossy glare overlay */}
        <motion.div 
          className="tilt-card-glare absolute inset-0 rounded-2xl pointer-events-none z-50 opacity-0 transition-opacity duration-300"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([mx, my]: number[]) => 
                `radial-gradient(circle at ${mx}% ${my}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
            ),
          }}
        />
        
        {/* Edge light effect */}
        <motion.div 
          className="absolute inset-0 rounded-2xl pointer-events-none z-40 opacity-0 transition-opacity duration-300"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([mx, my]: number[]) =>
                `linear-gradient(${Math.atan2(my - 50, mx - 50) * (180 / Math.PI)}deg, rgba(139,92,246,0.15) 0%, transparent 50%)`
            ),
          }}
        />
      </div>
    </motion.div>
  );
};
