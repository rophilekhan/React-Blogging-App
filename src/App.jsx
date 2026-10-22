import React, { useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ReadPage from "./pages/ReadPage";
import ProfilePage from "./pages/ProfilePage";
import AgencyPortal from "./pages/AgencyPortal";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import MusicPlayer3D from "./components/3d/MusicPlayer3D";
import { useAudioStore } from "./store/audioStore";

// ── Persistent Global Audio Controller ────────────────────────────────────────
// Mounted outside <Routes> to ensure continuous, uninterrupted music playback
const GlobalAudio = () => {
  const audioRef = useRef(null);
  const currentUrlRef = useRef("");
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volume);
  const currentTrackIndex = useAudioStore((state) => state.currentTrackIndex);
  const tracks = useAudioStore((state) => state.tracks);
  const nextTrack = useAudioStore((state) => state.nextTrack);
  const pause = useAudioStore((state) => state.pause);

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || {};
  const trackUrl = currentTrack.url || "";

  // 1. Source Synchronization: ONLY reload audio stream if the track URL actually changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (trackUrl && trackUrl !== currentUrlRef.current) {
      currentUrlRef.current = trackUrl;
      audio.src = trackUrl;
      audio.load();

      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Audio stream playback transition notice:", err);
          });
        }
      }
    }
  }, [trackUrl, isPlaying]);

  // 2. Play / Pause Control: Separated from URL loading to prevent reload on React state updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrlRef.current) return;

    if (isPlaying) {
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Autoplay restriction encountered:", err);
            pause();
          });
        }
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, pause]);

  // 3. Volume Level Synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 4. Natural Audio Completion Handler: Handles iTunes 30-second previews and full tracks
  const lastEndedTimestampRef = useRef(0);
  const handleAudioEnded = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Verify track naturally completed (handles iTunes 30s preview limit and normal tracks)
    const isNaturallyFinished =
      audio.ended ||
      (audio.duration > 0 && Math.abs(audio.currentTime - audio.duration) < 1.5) ||
      audio.currentTime >= 28;

    const now = Date.now();
    // Guard against rapid duplicate skip events
    if (isNaturallyFinished && now - lastEndedTimestampRef.current > 1500) {
      lastEndedTimestampRef.current = now;
      nextTrack();
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={(e) => {
          console.warn("Audio stream notice:", e?.message || "Stream decode notice");
        }}
        preload="auto"
      />
      <MusicPlayer3D />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global 3D Music Player & Audio Engine */}
        <GlobalAudio />

        <Routes>
          {/* Entirely public true homepage: DashboardPage with Guest Mode enabled */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/blog/:id" element={<ReadPage />} />
          <Route path="/codesphinx-portal" element={<AgencyPortal />} />
          <Route path="/agency" element={<AgencyPortal />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;