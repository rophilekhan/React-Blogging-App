import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Edges, Sparkles, MeshDistortMaterial } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";

// ── 3D Tesseract Geometry (4D Hypercube Projection) ──────────────────────────
const TesseractMesh = ({ isWarping }) => {
  const outerCubeRef = useRef();
  const innerCubeRef = useRef();

  useFrame((_, delta) => {
    const speedMultiplier = isWarping ? 18 : 1;

    if (outerCubeRef.current) {
      outerCubeRef.current.rotation.x += delta * 0.4 * speedMultiplier;
      outerCubeRef.current.rotation.y += delta * 0.5 * speedMultiplier;
    }

    if (innerCubeRef.current) {
      innerCubeRef.current.rotation.x -= delta * 0.7 * speedMultiplier;
      innerCubeRef.current.rotation.z -= delta * 0.6 * speedMultiplier;
    }
  });

  return (
    <Float speed={isWarping ? 8 : 2.5} rotationIntensity={isWarping ? 4 : 1.2} floatIntensity={1.5}>
      <group>
        {/* Outer Hypercube */}
        <mesh ref={outerCubeRef}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshPhysicalMaterial
            color="#6366f1"
            transmission={0.8}
            roughness={0.15}
            thickness={1.2}
            transparent
            opacity={0.65}
          />
          <Edges scale={1.002} threshold={15} color="#818cf8" />
        </mesh>

        {/* Inner Counter-Rotating Core Cube */}
        <mesh ref={innerCubeRef} scale={isWarping ? 1.4 : 0.65}>
          <boxGeometry args={[1, 1, 1]} />
          <MeshDistortMaterial
            color="#ec4899"
            emissive="#be185d"
            emissiveIntensity={1}
            distort={0.3}
            speed={3}
            roughness={0.1}
          />
          <Edges scale={1.005} threshold={15} color="#f43f5e" />
        </mesh>

        {/* Energy Particle Cloud */}
        <Sparkles
          count={isWarping ? 120 : 35}
          scale={isWarping ? [6, 6, 6] : [2.5, 2.5, 2.5]}
          size={isWarping ? 4 : 2}
          speed={isWarping ? 4 : 1}
          color="#a855f7"
        />
      </group>
    </Float>
  );
};

// ── Easter Egg Artifact Trigger & Warp Screen ────────────────────────────────
const EasterEggArtifact = () => {
  const navigate = useNavigate();
  const [isWarping, setIsWarping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const warpOverlayRef = useRef();

  const handleTriggerPortal = () => {
    if (isWarping) return;
    setIsWarping(true);

    // GSAP Hyperspace Camera Zoom & Flash
    if (warpOverlayRef.current) {
      gsap.to(warpOverlayRef.current, {
        opacity: 1,
        duration: 1.2,
        ease: "power3.in",
        onComplete: () => {
          navigate("/codesphinx-portal");
        },
      });
    } else {
      setTimeout(() => {
        navigate("/codesphinx-portal");
      }, 1500);
    }
  };

  return (
    <>
      {/* ── Fixed Subtle Corner Artifact Widget ───────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <div
          onClick={handleTriggerPortal}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-20 h-20 sm:w-24 sm:h-24 cursor-pointer group flex items-center justify-center"
          title="Unknown Spatial Anomaly"
        >
          {/* Ambient Glow Aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl group-hover:scale-125 transition-transform duration-500" />

          {/* R3F Canvas with Tesseract */}
          <Canvas
            eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
            camera={{ position: [0, 0, 3.8], fov: 45 }}
            dpr={[1, 2]}
            gl={{ powerPreference: "high-performance", antialias: false, alpha: true, preserveDrawingBuffer: false }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
            }}
          >
            <ambientLight intensity={1.2} />
            <pointLight position={[3, 3, 3]} intensity={2.5} color="#818cf8" />
            <pointLight position={[-3, -3, 3]} intensity={2.5} color="#ec4899" />
            <TesseractMesh isWarping={isWarping} />
          </Canvas>

          {/* Tooltip on Hover */}
          <AnimatePresence>
            {isHovered && !isWarping && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                className="absolute -top-10 right-0 px-3 py-1 rounded-xl bg-slate-900/90 border border-purple-400/40 text-[10px] font-mono font-medium text-purple-300 shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                <span>Quantum Tesseract [Warp]</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fullscreen Warp-Speed WebGL Transition Overlay ────────────────── */}
      <div
        ref={warpOverlayRef}
        className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black transition-opacity ${
          isWarping ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: "0.2s" }}
      >
        {isWarping && (
          <div className="relative flex flex-col items-center justify-center text-center">
            {/* Hyperspace Radial Shockwave */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [1, 2.5, 6], opacity: [0.8, 1, 0] }}
              transition={{ duration: 1.4, ease: "easeIn" }}
              className="w-96 h-96 rounded-full border-4 border-indigo-400/80 shadow-[0_0_120px_#818cf8]"
            />

            {/* Warp Speed Text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1], scale: [0.8, 1.1, 1.4] }}
              transition={{ duration: 1.4 }}
              className="absolute text-center"
            >
              <div className="text-3xl sm:text-5xl font-extrabold tracking-widest font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.8)]">
                WARPING DIMENSIONS
              </div>
              <div className="text-xs sm:text-sm font-mono text-indigo-300 tracking-wider mt-2">
                TRANSITIONING TO CODESPHINX PORTAL...
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default EasterEggArtifact;
