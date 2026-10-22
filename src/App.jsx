import React, { useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
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
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volume);
  const currentTrackIndex = useAudioStore((state) => state.currentTrackIndex);
  const tracks = useAudioStore((state) => state.tracks);
  const nextTrack = useAudioStore((state) => state.nextTrack);
  const pause = useAudioStore((state) => state.pause);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Sync play / pause state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay restriction encountered:", err);
          pause();
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex, pause]);

  // Sync volume level
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={nextTrack}
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/blog/:id" element={<ReadPage />} />
          <Route path="/codesphinx-portal" element={<AgencyPortal />} />
          {/* Entirely public dashboard accessible to guests and authors */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;