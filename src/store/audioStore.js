import { create } from "zustand";

export const TRACKS = [
  {
    id: 1,
    title: "Cosmic Lofi Chill",
    artist: "SynthScroll Radio",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
  },
  {
    id: 2,
    title: "Midnight Deep Focus",
    artist: "Aetheric Audio",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
  },
];

export const useAudioStore = create((set, get) => ({
  isPlaying: false,
  volume: 0.65,
  currentTrackIndex: 0,
  tracks: TRACKS,

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  nextTrack: () => {
    const { tracks, currentTrackIndex } = get();
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    set({ currentTrackIndex: nextIndex, isPlaying: true });
  },

  prevTrack: () => {
    const { tracks, currentTrackIndex } = get();
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    set({ currentTrackIndex: prevIndex, isPlaying: true });
  },
}));
