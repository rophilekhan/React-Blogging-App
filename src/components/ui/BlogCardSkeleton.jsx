import React from "react";

/**
 * YouTube-Style Shimmer Skeleton Loader for SynthScroll BlogCard
 * Mimics the exact layout, dimensions, and glassmorphic aesthetics of BlogCard.
 */
const BlogCardSkeleton = () => {
  return (
    <div className="relative rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden flex flex-col justify-between w-full h-full min-h-[460px] animate-pulse">
      {/* ── Continuous Sweeping Shimmer Sheen ────────────────────────────── */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none z-10" />

      <div>
        {/* Shimmer Cover Image Placeholder */}
        <div className="relative w-full h-48 bg-slate-900/80 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-3.5">
          {/* Header Metadata Pill & Date */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="w-20 h-5 rounded-lg bg-white/10" />
            <div className="w-16 h-3.5 rounded-md bg-white/5" />
          </div>

          {/* Title Lines */}
          <div className="space-y-2 mb-3">
            <div className="w-5/6 h-5 rounded-lg bg-white/10" />
            <div className="w-3/5 h-5 rounded-lg bg-white/10" />
          </div>

          {/* Snippet Lines */}
          <div className="space-y-2 mb-4 pt-1">
            <div className="w-full h-3 rounded bg-white/5" />
            <div className="w-11/12 h-3 rounded bg-white/5" />
            <div className="w-3/4 h-3 rounded bg-white/5" />
          </div>

          {/* Read story link placeholder */}
          <div className="w-32 h-4 rounded-md bg-indigo-500/15" />
        </div>
      </div>

      {/* Footer Info & Action Buttons Placeholder */}
      <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="w-24 h-3 rounded bg-white/5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-14 h-6 sm:w-16 sm:h-7 rounded-xl bg-white/5" />
          <div className="w-14 h-6 sm:w-16 sm:h-7 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
};

export default BlogCardSkeleton;
