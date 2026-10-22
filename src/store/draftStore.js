import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

// ── Custom Async IndexedDB Storage Engine ────────────────────────────────────
const idbStorage = {
  getItem: async (name) => {
    try {
      const value = await get(name);
      return value ?? null;
    } catch (error) {
      console.warn(`[DraftStore] Failed to read '${name}' from IndexedDB:`, error);
      // Fallback to localStorage if IndexedDB is restricted (e.g. strict private window)
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },
  setItem: async (name, value) => {
    try {
      await set(name, value);
    } catch (error) {
      console.warn(`[DraftStore] Failed to write '${name}' to IndexedDB:`, error);
      try {
        localStorage.setItem(name, value);
      } catch {
        // quota exceeded or private browsing
      }
    }
  },
  removeItem: async (name) => {
    try {
      await del(name);
    } catch (error) {
      console.warn(`[DraftStore] Failed to remove '${name}' from IndexedDB:`, error);
      try {
        localStorage.removeItem(name);
      } catch {
        // ignore
      }
    }
  },
};

// ── Draft Store with Auto-Recovery ───────────────────────────────────────────
export const useDraftStore = create(
  persist(
    (set, get) => ({
      title: "",
      content: "",
      category: "Technology",
      lastSaved: null,

      setDraft: (newDraft) =>
        set((state) => ({
          ...state,
          ...newDraft,
          lastSaved: new Date().toISOString(),
        })),

      clearDraft: () =>
        set({
          title: "",
          content: "",
          category: "Technology",
          lastSaved: null,
        }),

      hasDraftContent: () => {
        const { title, content } = get();
        return Boolean((title && title.trim()) || (content && content.trim()));
      },
    }),
    {
      name: "blogverse_post_draft",
      storage: createJSONStorage(() => idbStorage),
      // Automatically rehydrates on load
    }
  )
);
