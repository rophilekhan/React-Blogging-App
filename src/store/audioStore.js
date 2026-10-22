import { create } from "zustand";

export const TRACKS = [
  {
    id: 1,
    title: "Cosmic Lofi Chill",
    artist: "SynthScroll Radio",
    album: "Spatial Ambience",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    artwork: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 2,
    title: "Midnight Deep Focus",
    artist: "Aetheric Audio",
    album: "Cyber Resonance",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
    artwork: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80",
  },
];

export const useAudioStore = create((set, get) => ({
  isPlaying: false,
  volume: 0.65,
  currentTrackIndex: 0,
  tracks: TRACKS,
  isPlaylistOpen: false,

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  setTracks: (newTracks) => {
    if (Array.isArray(newTracks) && newTracks.length > 0) {
      set((state) => {
        // Preserve existing initial tracks so currently playing track URL is never clobbered
        const existingUrls = new Set(state.tracks.map((t) => t.url));
        const fresh = newTracks.filter((t) => t && t.url && !existingUrls.has(t.url));
        return {
          tracks: [...state.tracks, ...fresh],
        };
      });
    }
  },

  setTasteTracks: (newTracks, keepCurrent = true) => {
    if (!Array.isArray(newTracks) || newTracks.length === 0) return;
    set((state) => {
      const currentTrack = state.tracks[state.currentTrackIndex];
      if (keepCurrent && currentTrack) {
        const matchIdx = newTracks.findIndex(
          (t) => t.url === currentTrack.url || String(t.id) === String(currentTrack.id)
        );
        if (matchIdx >= 0) {
          return { tracks: newTracks, currentTrackIndex: matchIdx };
        }
        return {
          tracks: [currentTrack, ...newTracks],
          currentTrackIndex: 0,
        };
      }
      return {
        tracks: newTracks,
        currentTrackIndex: 0,
      };
    });
  },

  selectTrack: (index) => {
    const { tracks } = get();
    if (index >= 0 && index < tracks.length) {
      set({ currentTrackIndex: index, isPlaying: true });
    }
  },

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

  togglePlaylist: (forced) =>
    set((state) => ({
      isPlaylistOpen: typeof forced === "boolean" ? forced : !state.isPlaylistOpen,
    })),
  closePlaylist: () => set({ isPlaylistOpen: false }),
}));
