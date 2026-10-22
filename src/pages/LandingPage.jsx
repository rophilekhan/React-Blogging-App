import React, { Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { useAuth } from "../contexts/AuthContext";
import Loader3D from "../components/ui/Loader3D";
import Navbar from "../components/ui/Navbar";

// Dynamic chunk-splitting for heavy GSAP Scroll Scene
const ScrollScene = lazy(() => import("../components/3d/ScrollScene"));

const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div
      id="landing-scroll-container"
      className="relative min-h-[300vh] bg-[#050714] text-white selection:bg-indigo-500 selection:text-white"
    >
      {/* ── Fixed Fullscreen 3D Canvas Background with GPU Optimizations ── */}
      <div
        className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
        style={{ width: "100%", height: "100%", position: "fixed", top: 0, left: 0 }}
      >
        <Canvas
          eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
          camera={{ position: [0, 0, 7], fov: 45 }}
          dpr={[1, 2]}
          gl={{ powerPreference: "high-performance", antialias: false, alpha: true, preserveDrawingBuffer: false }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Suspense fallback={null}>
            <ScrollScene />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Top Navigation Bar with Mobile-First Menu ──────────────────── */}
      <Navbar isDashboard={false} />

      {/* ── Section 1: Hero (0vh - 100vh) ─────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Next-Gen Spatial Blogging
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight font-display leading-[1.15] mb-6">
            Where Words{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Transcend
            </span>{" "}
            Dimensions
          </h1>

          {/* Description */}
          <p className="text-sm md:text-lg text-slate-300/80 max-w-xl mb-8 sm:mb-10 leading-relaxed px-2">
            Read, write, and explore stories within an interactive 3D digital canvas.
            Built with Three.js, React 19, and real-time cloud data.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto text-center px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] shadow-xl shadow-indigo-500/30 transition-all duration-200 truncate"
            >
              {user ? "Launch Dashboard →" : "Start Writing Free →"}
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto text-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-medium text-xs sm:text-sm text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-all truncate"
            >
              Explore Features ↓
            </a>
          </div>
        </motion.div>

        {/* Floating Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs text-slate-400/80 animate-bounce pointer-events-none">
          <span>Scroll to explore</span>
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ── Section 2: Features (100vh - 200vh) ───────────────────────────── */}
      <section id="features" className="min-h-screen flex flex-col items-center justify-center px-4 py-24">
        <div className="max-w-6xl w-full">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-purple-500/10 border border-purple-400/30 text-purple-300 mb-3">
              Spatial Architecture
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
              Engineered for Modern Storytellers
            </h2>
            <p className="text-sm md:text-base text-slate-400 mt-3 max-w-lg mx-auto">
              A high-performance convergence of 3D computer graphics, reactive interfaces, and real-time cloud data.
            </p>
          </div>

          {/* 3 Parallax Tilt Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              perspective={1000}
              scale={1.03}
              transitionSpeed={1000}
              className="h-full"
            >
              <div className="h-full p-8 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col justify-between hover:border-indigo-400/40 transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl mb-6">
                    🔮
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Reactive 3D Canvas
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300/80 leading-relaxed">
                    Interactive WebGL viewports powered by Three.js and React Three Fiber.
                    Smooth camera transitions dynamically respond to your scroll and mouse gestures.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-indigo-300 font-medium">
                  R3F & Drei & GSAP
                </div>
              </div>
            </Tilt>

            {/* Card 2 */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              perspective={1000}
              scale={1.03}
              transitionSpeed={1000}
              className="h-full"
            >
              <div className="h-full p-8 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col justify-between hover:border-purple-400/40 transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl mb-6">
                    ⚡
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Real-Time Cloud Feed
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300/80 leading-relaxed">
                    Publish articles instantly and watch engagement update in real time.
                    Integrated with Firebase Firestore for live posts, likes, and Cloud Storage for imagery.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-purple-300 font-medium">
                  Firebase Firestore & Storage
                </div>
              </div>
            </Tilt>

            {/* Card 3 */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              perspective={1000}
              scale={1.03}
              transitionSpeed={1000}
              className="h-full"
            >
              <div className="h-full p-8 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col justify-between hover:border-pink-400/40 transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-2xl mb-6">
                    💎
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Glassmorphic Aesthetics
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300/80 leading-relaxed">
                    Ultra-modern frosted glass UI layered seamlessly over 3D coordinates.
                    Zero visual clunkiness with fine-tuned typography and micro-interactions.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-pink-300 font-medium">
                  Tailwind CSS & Parallax Tilt
                </div>
              </div>
            </Tilt>
          </div>
        </div>
      </section>

      {/* ── Section 3: Call to Action (200vh - 300vh) ─────────────────────── */}
      <section id="cta" className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center">
        <Tilt
          tiltMaxAngleX={6}
          tiltMaxAngleY={6}
          perspective={1000}
          scale={1.01}
          transitionSpeed={1200}
          className="max-w-2xl w-full"
        >
          <div className="p-10 md:p-14 rounded-3xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] relative overflow-hidden">
            {/* Top Glow Ambient */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Global Creator Network
            </span>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display mb-4 bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              Step Into SynthScroll
            </h2>

            <p className="text-sm md:text-base text-slate-300/80 max-w-lg mx-auto mb-8 leading-relaxed">
              Experience the convergence of 3D spatial environments and modern digital journalism.
              Create your account or launch your dashboard now.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="px-8 py-3.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-[0.98] shadow-xl shadow-indigo-500/30 transition-all duration-200"
              >
                {user ? "Open Dashboard →" : "Create Free Account →"}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="px-7 py-3.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Tech Stack Pills */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">React 19</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">Three.js</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">R3F & Drei</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">GSAP ScrollTrigger</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">Firebase Firestore</span>
            </div>
          </div>
        </Tilt>
      </section>
    </div>
  );
};

export default LandingPage;
