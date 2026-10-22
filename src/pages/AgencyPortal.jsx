import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, Sparkles, Preload } from "@react-three/drei";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import * as THREE from "three";

// ── 3D Cyber Shards & Grid Floor ─────────────────────────────────────────────
const CyberGridAndShards = () => {
  const gridRef = useRef();
  const shardsRef = useRef();

  // Generate 18 floating obsidian glass shards
  const shards = React.useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6 - 2,
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z = (gridRef.current.position.z + delta * 0.8) % 2;
    }
    if (shardsRef.current) {
      shardsRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <>
      {/* 3D Kinetic Cyber Grid Floor */}
      <group position={[0, -3.2, 0]} rotation={[-Math.PI / 2.2, 0, 0]}>
        <gridHelper
          ref={gridRef}
          args={[40, 40, "#a855f7", "#312e81"]}
          position={[0, 0, 0]}
        />
      </group>

      {/* Floating Obsidian & Crystal Shards */}
      <group ref={shardsRef}>
        {shards.map((s, idx) => (
          <Float key={idx} speed={2 + idx * 0.2} floatIntensity={1.5}>
            <mesh position={s.position} rotation={s.rotation} scale={s.scale}>
              <octahedronGeometry args={[1, 0]} />
              <meshPhysicalMaterial
                color="#0f172a"
                emissive="#6366f1"
                emissiveIntensity={0.3}
                roughness={0.1}
                metalness={0.9}
                transmission={0.6}
                thickness={0.5}
                transparent
                opacity={0.8}
              />
            </mesh>
          </Float>
        ))}
      </group>

      {/* 3D Monolithic Agency Typography */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <group position={[0, 2.2, -3]}>
          <Text
            fontSize={1.4}
            letterSpacing={0.18}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#a855f7"
          >
            CODESPHINX
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.9}
              roughness={0.1}
            />
          </Text>

          <Text
            position={[0, -0.9, 0]}
            fontSize={0.45}
            letterSpacing={0.25}
            anchorX="center"
            anchorY="middle"
          >
            INNOVATRIX TECH
            <meshBasicMaterial color="#38bdf8" />
          </Text>
        </group>
      </Float>

      <Sparkles count={120} scale={[14, 10, 10]} size={2.5} speed={0.6} color="#c084fc" />
      <Preload all />
    </>
  );
};

// ── Agency Portal Page ───────────────────────────────────────────────────────
const AgencyPortal = () => {
  return (
    <div className="relative min-h-screen bg-[#03050c] text-white select-none overflow-x-hidden">
      {/* ── Fixed Cyber WebGL Background ──────────────────────────────────── */}
      <div
        className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
        style={{ width: "100%", height: "100%", position: "fixed", top: 0, left: 0 }}
      >
        <Canvas
          eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
          camera={{ position: [0, 0, 6], fov: 50 }}
          dpr={[1, 2]}
          gl={{ powerPreference: "high-performance", antialias: false, alpha: true, preserveDrawingBuffer: false }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
          <pointLight position={[-6, 2, 3]} intensity={3} color="#a855f7" />
          <pointLight position={[6, -2, 3]} intensity={3} color="#06b6d4" />
          <CyberGridAndShards />
        </Canvas>
      </div>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-slate-950/60 border-b border-purple-500/20">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-400/30 text-purple-200 hover:text-white text-xs font-semibold shadow-lg shadow-purple-900/20 transition-all"
        >
          <span>←</span>
          <span>Exit Portal (Return to SynthScroll)</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CYBER_MATRIX_ONLINE</span>
        </div>
      </header>

      {/* ── Main Agency Showcase Overlay ─────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Parallax Tilt Agency Leadership Card */}
        <Tilt
          tiltMaxAngleX={6}
          tiltMaxAngleY={6}
          perspective={1200}
          scale={1.01}
          transitionSpeed={1000}
          className="w-full"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-12 rounded-3xl bg-slate-950/75 backdrop-blur-2xl border border-purple-500/30 shadow-[0_25px_80px_rgba(168,85,247,0.25)] relative overflow-hidden"
          >
            {/* Top Sheen Ambient */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide bg-purple-500/15 border border-purple-400/40 text-purple-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Executive Leadership & Architecture
              </span>
              <span className="text-xs font-mono text-slate-400">
                INNOVATRIX TECH GROUP
              </span>
            </div>

            {/* Identity Showcase */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-300">
                Rophile Ahmed Khan
              </h1>
              <div className="flex items-center gap-3 mt-2 text-base sm:text-lg font-semibold text-purple-300">
                <span>Founder & Chief Executive Officer</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-400">CodeSphinx</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300/80 mt-3 max-w-2xl leading-relaxed">
                Pioneering high-impact digital experiences, spatial computing platforms,
                and next-generation cloud architectures. Leading engineering and creative innovation at CodeSphinx.
              </p>
            </div>

            {/* Contact & Direct Channel Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {/* Official Website */}
              <a
                href="https://codesphinx.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-base group-hover:scale-105 transition-transform">
                  🌐
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Official Website
                  </div>
                  <div className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                    codesphinx.netlify.app
                  </div>
                </div>
              </a>

              {/* Direct Phone */}
              <a
                href="tel:03312699111"
                className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-400/40 transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-base group-hover:scale-105 transition-transform">
                  📞
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Direct Line
                  </div>
                  <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                    0331 2699111
                  </div>
                </div>
              </a>

              {/* Official Email */}
              <a
                href="mailto:contact.codesphinx@gmail.com"
                className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-pink-400/40 transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300 text-base group-hover:scale-105 transition-transform">
                  ✉️
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Corporate Email
                  </div>
                  <div className="text-xs font-semibold text-white truncate group-hover:text-pink-300 transition-colors">
                    contact.codesphinx
                  </div>
                </div>
              </a>
            </div>

            {/* Glowing Interactive Social Channels Launchpad */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
                <span>⚡ Connect Across Networks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/111702501/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-400 shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💼</span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        LinkedIn
                      </div>
                      <div className="text-[10px] text-slate-400">Company Page</div>
                    </div>
                  </div>
                  <span className="text-blue-400 group-hover:translate-x-1 transition-transform">
                    ↗
                  </span>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/codes.phinx/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-pink-600/10 hover:bg-pink-600/20 border border-pink-500/30 hover:border-pink-400 shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📸</span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                        Instagram
                      </div>
                      <div className="text-[10px] text-slate-400">@codes.phinx</div>
                    </div>
                  </div>
                  <span className="text-pink-400 group-hover:translate-x-1 transition-transform">
                    ↗
                  </span>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/profile.php?id=61582752347805"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-400 shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👥</span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        Facebook
                      </div>
                      <div className="text-[10px] text-slate-400">Official Profile</div>
                    </div>
                  </div>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                    ↗
                  </span>
                </a>
              </div>
            </div>

            {/* Footer Agency Mark */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
              <div>© 2026 CodeSphinx • Innovatrix Tech Group</div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Spatial Engine v2.4
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">
                  Encrypted
                </span>
              </div>
            </div>
          </motion.div>
        </Tilt>
      </main>
    </div>
  );
};

export default AgencyPortal;
