import React from "react";

const SkeletonBlogCard = () => {
  return (
    <div className="relative rounded-3xl bg-white/[0.04] border border-white/10 shadow-xl overflow-hidden flex flex-col justify-between animate-pulse">
      <div>
        {/* Shimmer Cover Image Placeholder */}
        <div className="relative w-full h-48 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Header Metadata Pill & Date */}
          <div className="flex items-center justify-between">
            <div className="w-16 h-5 rounded-lg bg-white/10" />
            <div className="w-20 h-4 rounded bg-white/5" />
          </div>

          {/* Title Lines */}
          <div className="space-y-2">
            <div className="w-4/5 h-6 rounded-lg bg-white/10" />
            <div className="w-1/2 h-6 rounded-lg bg-white/10" />
          </div>

          {/* Description Lines */}
          <div className="space-y-2 pt-1">
            <div className="w-full h-3 rounded bg-white/5" />
            <div className="w-5/6 h-3 rounded bg-white/5" />
            <div className="w-2/3 h-3 rounded bg-white/5" />
          </div>

          {/* Read link placeholder */}
          <div className="w-28 h-4 rounded bg-indigo-500/15" />
        </div>
      </div>

      {/* Footer Info & Action Placeholders */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-white/10 flex items-center justify-between bg-black/20">
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

export default SkeletonBlogCard;
