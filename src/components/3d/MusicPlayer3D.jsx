import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useAudioStore } from "../../store/audioStore";
import { fetchMusicTracks, fetchMusicByTaste } from "../../services/apiSeeder";

const TASTE_OPTIONS = [
  { id: "For You", label: "✨ For You" },
  { id: "Bollywood", label: "🎬 Bollywood" },
  { id: "Pakistani", label: "🇵🇰 Pakistani" },
  { id: "Hip Hop", label: "🎤 Hip Hop" },
  { id: "Lo-Fi", label: "☕ Lo-Fi" },
];

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
  const setTracks = useAudioStore((state) => state.setTracks);
  const setTasteTracks = useAudioStore((state) => state.setTasteTracks);
  const selectTrack = useAudioStore((state) => state.selectTrack);
  const nextTrack = useAudioStore((state) => state.nextTrack);
  const isPlaylistOpen = useAudioStore((state) => state.isPlaylistOpen);
  const togglePlaylist = useAudioStore((state) => state.togglePlaylist);
  const closePlaylist = useAudioStore((state) => state.closePlaylist);

  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [selectedTaste, setSelectedTaste] = useState("For You");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTasteLoading, setIsTasteLoading] = useState(false);

  // Click-away references
  const volumeControlRef = useRef(null);
  const playlistContainerRef = useRef(null);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Dynamic Taste Selector Handler
  const handleTasteSelect = async (taste) => {
    if (isTasteLoading) return;
    setSelectedTaste(taste);
    setIsTasteLoading(true);
    try {
      const freshTracks = await fetchMusicByTaste(taste, 20);
      if (freshTracks && freshTracks.length > 0) {
        setTasteTracks(freshTracks, true);
      }
    } catch (err) {
      console.warn("Taste selection fetch notice:", err);
    } finally {
      setIsTasteLoading(false);
    }
  };

  // Search Music Input Handler
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || isTasteLoading) return;
    setIsTasteLoading(true);
    setSelectedTaste(query);
    try {
      const freshTracks = await fetchMusicByTaste(query, 20);
      if (freshTracks && freshTracks.length > 0) {
        setTasteTracks(freshTracks, true);
      }
    } catch (err) {
      console.warn("Manual search music notice:", err);
    } finally {
      setIsTasteLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    handleTasteSelect("For You");
  };

  // Auto-fetch expanded 15-20 tracks from iTunes API if playlist has initial defaults
  useEffect(() => {
    let isMounted = true;
    const loadExpandedTracks = async () => {
      try {
        const liveTracks = await fetchMusicTracks(20);
        if (isMounted && Array.isArray(liveTracks) && liveTracks.length > 0) {
          setTracks(liveTracks);
        }
      } catch (err) {
        console.warn("Auto-load expanded tracks notice:", err);
      }
    };

    if (tracks.length <= 2) {
      loadExpandedTracks();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Volume Slider Click-Away Handler ───────────────────────────────────────
  useEffect(() => {
    if (!isVolumeOpen) return;

    const handleClickOutside = (event) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(event.target)
      ) {
        setIsVolumeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVolumeOpen]);

  // ── Playlist Click-Away Handler ────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaylistOpen) return;

    const handlePlaylistClickOutside = (event) => {
      if (
        playlistContainerRef.current &&
        !playlistContainerRef.current.contains(event.target) &&
        !event.target.closest("[data-playlist-trigger]")
      ) {
        closePlaylist();
      }
    };

    document.addEventListener("mousedown", handlePlaylistClickOutside);
    return () => {
      document.removeEventListener("mousedown", handlePlaylistClickOutside);
    };
  }, [isPlaylistOpen, closePlaylist]);

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
      <div className="relative flex items-center gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-white">
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

          {/* Playlist UI Toggle */}
          <button
            data-playlist-trigger="true"
            onClick={togglePlaylist}
            className={`px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPlaylistOpen
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
            }`}
            title="View Playlist"
          >
            <span>🎶</span>
            <span className="hidden md:inline">Playlist</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 text-white font-mono">
              {tracks.length}
            </span>
          </button>

          {/* Volume Slider with Click-Away Ref */}
          <div ref={volumeControlRef} className="relative">
            <button
              onClick={() => setIsVolumeOpen(!isVolumeOpen)}
              className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs text-slate-300 hover:text-white transition-all"
              title="Volume"
            >
              {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>

            {/* Volume Popout Slider */}
            {isVolumeOpen && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 p-2.5 rounded-xl bg-slate-900/95 border border-white/20 shadow-xl backdrop-blur-xl flex flex-col items-center gap-1.5 w-8 z-50">
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

        {/* ── Expanded Playlist UI Flyout ─────────────────────────────────── */}
        <AnimatePresence>
          {isPlaylistOpen && (
            <motion.div
              ref={playlistContainerRef}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-16 left-0 w-80 sm:w-96 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden z-50 text-white"
            >
              {/* Playlist Header */}
              <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide font-display">
                      SynthScroll Sonic Mesh
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isTasteLoading
                        ? "Curating regional sonic stream..."
                        : `${tracks.length} Tracks • ${selectedTaste}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePlaylist}
                  className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs text-slate-400 hover:text-white transition-all"
                  aria-label="Close playlist"
                >
                  ✕
                </button>
              </div>

              {/* Music Search Input Bar */}
              <form onSubmit={handleSearchSubmit} className="px-3 pt-3 pb-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Indian/Pakistani artists or tracks..."
                    className="w-full pl-8 pr-16 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/[0.09] transition-all"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-[10px]"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!searchQuery.trim() || isTasteLoading}
                      className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-[10px] font-semibold text-white transition-all shadow-sm"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {/* Music Taste Filter Pills */}
              <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none no-scrollbar">
                {TASTE_OPTIONS.map((taste) => {
                  const isActive =
                    selectedTaste.toLowerCase() === taste.id.toLowerCase();
                  return (
                    <button
                      key={taste.id}
                      type="button"
                      onClick={() => handleTasteSelect(taste.id)}
                      disabled={isTasteLoading}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-sm shadow-indigo-500/50 border border-white/20 font-semibold scale-[1.02]"
                          : "bg-white/[0.05] hover:bg-white/15 text-slate-300 hover:text-white border border-white/5"
                      }`}
                    >
                      {taste.label}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Tracks List or Shimmer Skeletons */}
              <div className="max-h-64 sm:max-h-72 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-indigo-500/40 min-h-[220px]">
                {isTasteLoading ? (
                  // Smooth Shimmer Skeleton Loader
                  <div className="space-y-2 py-1">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-2xl flex items-center justify-between gap-3 bg-white/[0.03] animate-pulse border border-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-slate-800/80 shrink-0" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div
                              className="h-3 bg-slate-800 rounded-md"
                              style={{ width: `${60 + (idx % 3) * 15}%` }}
                            />
                            <div className="h-2 bg-slate-800/60 rounded-md w-24" />
                          </div>
                        </div>
                        <div className="w-12 h-4 bg-slate-800/50 rounded-full shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : tracks.length === 0 ? (
                  // Empty State with suggestions
                  <div className="p-6 text-center text-slate-400 space-y-3">
                    <p className="text-xs">No tracks found for "{selectedTaste}".</p>
                    <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
                      <button
                        onClick={() => handleTasteSelect("Pakistani")}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-indigo-300 transition-all"
                      >
                        🇵🇰 Coke Studio
                      </button>
                      <button
                        onClick={() => handleTasteSelect("Bollywood")}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-indigo-300 transition-all"
                      >
                        🎬 Bollywood Top Hits
                      </button>
                      <button
                        onClick={() => handleTasteSelect("Hip Hop")}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-indigo-300 transition-all"
                      >
                        🎤 Desi Hip Hop
                      </button>
                    </div>
                  </div>
                ) : (
                  // Track List
                  tracks.map((track, idx) => {
                    const isCurrent = currentTrackIndex === idx;
                    return (
                      <button
                        key={track.id || track.url || idx}
                        onClick={() => selectTrack(idx)}
                        className={`w-full p-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
                          isCurrent
                            ? "bg-indigo-600/25 border border-indigo-400/40 text-white shadow-lg shadow-indigo-600/10"
                            : "hover:bg-white/5 text-slate-300 hover:text-white border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Artwork / Icon */}
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10 relative">
                            {track.artwork ? (
                              <img
                                src={track.artwork}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-indigo-400">
                                🎵
                              </div>
                            )}
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-indigo-950/60 flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div
                              className={`text-xs font-semibold truncate ${
                                isCurrent ? "text-indigo-200" : "text-white"
                              }`}
                            >
                              {track.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {track.artist}
                            </div>
                          </div>
                        </div>

                        {/* Right Indicator */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isCurrent && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {isPlaying ? "Playing" : "Active"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MusicPlayer3D;
