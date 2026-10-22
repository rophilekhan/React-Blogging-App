import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useAudioStore } from "../../store/audioStore";

// ── 3D Floating Vinyl Record Mesh ────────────────────────────────────────────
const VinylRecord = () => {
  const discRef = useRef();
  const auraRef = useRef();
  const [hovered, setHovered] = useState(false);

  const isPlaying = useAudioStore((state) => state.isPlaying);
  const togglePlay = useAudioStore((state) => state.togglePlay);

  useFrame((_, delta) => {
    if (!discRef.current) return;

    if (isPlaying) {
      // Continuous smooth spinning when playing
      discRef.current.rotation.y += delta * 3.0;

      // Dynamic bass pulse on the neon aura
      if (auraRef.current) {
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.12;
        auraRef.current.scale.set(pulse, pulse, pulse);
      }
    } else {
      // Gentle idle hover rotation
      discRef.current.rotation.y += delta * 0.2;
      if (auraRef.current) {
        auraRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.8}>
      <group
        rotation={[Math.PI / 3.5, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Pulsing Backlit Aura Ring */}
        <mesh ref={auraRef} position={[0, -0.06, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial
            color={isPlaying ? "#a855f7" : "#6366f1"}
            transparent
            opacity={hovered ? 0.9 : 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Vinyl Disc */}
        <group ref={discRef}>
          {/* Main Black Polyvinyl Body */}
          <mesh>
            <cylinderGeometry args={[1.2, 1.2, 0.04, 64]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>

          {/* Micro Grooves (Concentric rings) */}
          <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 1.15, 64]} />
            <meshStandardMaterial
              color="#1e293b"
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* Center Record Label */}
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.02, 32]} />
            <meshStandardMaterial
              color={isPlaying ? "#ec4899" : "#6366f1"}
              emissive={isPlaying ? "#be185d" : "#4338ca"}
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Center Spindle Hole */}
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
        </group>
      </group>
    </Float>
  );
};

// ── Global Floating Dock Component ───────────────────────────────────────────
const MusicPlayer3D = () => {
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const togglePlay = useAudioStore((state) => state.togglePlay);
  const volume = useAudioStore((state) => state.volume);
  const setVolume = useAudioStore((state) => state.setVolume);
  const currentTrackIndex = useAudioStore((state) => state.currentTrackIndex);
  const tracks = useAudioStore((state) => state.tracks);
  const nextTrack = useAudioStore((state) => state.nextTrack);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 select-none">
      {/* ── 3D Interactive Vinyl Canvas ──────────────────────────────────── */}
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 cursor-pointer relative group rounded-2xl bg-slate-950/40 backdrop-blur-md border border-white/10 hover:border-indigo-400/50 shadow-2xl transition-all"
        onClick={togglePlay}
        title={isPlaying ? "Click to Pause Music" : "Click to Play Music"}
      >
        <Canvas
          eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
          camera={{ position: [0, 0, 3], fov: 45 }}
          dpr={[1, 2]}
          gl={{ powerPreference: "high-performance", antialias: false, alpha: true, preserveDrawingBuffer: false }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
          }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[2, 4, 3]} intensity={2} />
          <VinylRecord />
        </Canvas>

        {/* Small Center Play Status Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-[10px] text-white">
            {isPlaying ? "❚❚" : "▶"}
          </span>
        </div>
      </div>

      {/* ── Glassmorphic Audio Controller Card ───────────────────────────── */}
      <div className="flex items-center gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-white">
        {/* Animated Soundwave Equalizer Bars */}
        <div className="flex items-end gap-0.5 h-4 w-4">
          {[0.4, 0.8, 0.5, 0.9].map((height, i) => (
            <span
              key={i}
              className={`w-0.5 bg-gradient-to-t from-indigo-400 to-pink-400 rounded-full transition-all ${
                isPlaying ? "animate-pulse" : "opacity-30"
              }`}
              style={{
                height: isPlaying ? `${height * 100}%` : "30%",
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>

        {/* Track Metadata */}
        <div className="hidden sm:block max-w-[120px] lg:max-w-[160px]">
          <div className="text-xs font-semibold truncate text-white">
            {currentTrack.title}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {currentTrack.artist}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white transition-all active:scale-95"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs text-slate-300 hover:text-white transition-all active:scale-95"
            title="Next Track"
          >
            ⏭
          </button>

          {/* Volume Slider Toggle */}
          <div className="relative group">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs text-slate-300 hover:text-white transition-all"
              title="Volume"
            >
              {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>

            {/* Volume Popout Slider */}
            {isExpanded && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 p-2.5 rounded-xl bg-slate-900/95 border border-white/20 shadow-xl backdrop-blur-xl flex flex-col items-center gap-1.5 w-8">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-indigo-500 cursor-pointer -rotate-90 my-8"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer3D;
