import { motion } from 'framer-motion';

/**
 * Scene3D — Renders animated floating 3D shapes, glowing orbs, and a perspective grid
 * as a full-screen fixed background layer. All elements are significantly sized and
 * visible in both light and dark modes.
 */
export function Scene3D() {
  return (
    <div className="scene3d-container fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Perspective Grid Floor */}
      <div className="perspective-grid" />
      
      {/* ── Large floating 3D geometric shapes ── */}

      {/* Cube — top left */}
      <motion.div
        className="floating-shape shape-cube"
        animate={{
          y: [0, -35, 0],
          rotateX: [0, 360],
          rotateY: [0, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ top: '12%', left: '5%' }}
      />

      {/* Second cube — bottom right */}
      <motion.div
        className="floating-shape shape-cube shape-cube-sm"
        animate={{
          y: [0, 20, 0],
          rotateX: [0, -360],
          rotateZ: [0, 360],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        style={{ bottom: '12%', right: '8%' }}
      />
      
      {/* Octahedron (diamond) — bottom right area */}
      <motion.div
        className="floating-shape shape-octahedron"
        animate={{
          y: [0, 30, 0],
          rotateZ: [0, 360],
          rotateX: [0, 180],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{ top: '60%', right: '5%' }}
      />

      {/* Second octahedron — top center-right */}
      <motion.div
        className="floating-shape shape-octahedron shape-octahedron-lg"
        animate={{
          y: [0, -25, 0],
          rotateZ: [0, -360],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ top: '18%', right: '22%' }}
      />
      
      {/* Ring — right side */}
      <motion.div
        className="floating-shape shape-ring"
        animate={{
          y: [0, -25, 0],
          rotateY: [0, 360],
          rotateX: [0, 45, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        style={{ top: '30%', right: '10%' }}
      />

      {/* Second ring — left side */}
      <motion.div
        className="floating-shape shape-ring shape-ring-sm"
        animate={{
          y: [0, 20, 0],
          rotateX: [0, 360],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        style={{ top: '55%', left: '6%' }}
      />
      
      {/* Pyramid — bottom left */}
      <motion.div
        className="floating-shape shape-pyramid"
        animate={{
          y: [0, 25, 0],
          rotateY: [0, -360],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ bottom: '18%', left: '10%' }}
      />

      {/* Second pyramid — top right */}
      <motion.div
        className="floating-shape shape-pyramid shape-pyramid-sm"
        animate={{
          y: [0, -18, 0],
          rotateZ: [0, 360],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        style={{ top: '8%', right: '35%' }}
      />

      {/* Cross / Plus shape — mid left */}
      <motion.div
        className="floating-shape shape-cross"
        animate={{
          y: [0, -30, 0],
          rotateZ: [0, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ top: '42%', left: '18%' }}
      />

      {/* Hexagon — bottom center */}
      <motion.div
        className="floating-shape shape-hexagon"
        animate={{
          y: [0, 20, 0],
          rotateY: [0, 360],
          rotateZ: [0, 60, 0],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        style={{ bottom: '25%', left: '42%' }}
      />

      {/* ── Floating orbs with intense glow ── */}
      <motion.div
        className="floating-orb orb-1"
        animate={{
          y: [0, -50, 0],
          x: [0, 20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '20%', left: '72%' }}
      />
      
      <motion.div
        className="floating-orb orb-2"
        animate={{
          y: [0, 40, 0],
          x: [0, -25, 0],
          scale: [1, 0.85, 1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '65%', left: '22%' }}
      />
      
      <motion.div
        className="floating-orb orb-3"
        animate={{
          y: [0, -30, 0],
          x: [0, 15, 0],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '45%', left: '48%' }}
      />

      {/* Extra large ambient orb — background */}
      <motion.div
        className="floating-orb orb-ambient"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '30%', left: '60%' }}
      />

      {/* Small sparkle dots */}
      <motion.div
        className="floating-sparkle"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '20%', left: '40%' }}
      />
      <motion.div
        className="floating-sparkle"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        style={{ top: '50%', right: '30%' }}
      />
      <motion.div
        className="floating-sparkle"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
        style={{ bottom: '30%', left: '60%' }}
      />
      <motion.div
        className="floating-sparkle"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ top: '15%', right: '15%' }}
      />

      {/* Depth fog layers */}
      <div className="depth-fog depth-fog-top" />
      <div className="depth-fog depth-fog-bottom" />
    </div>
  );
}
