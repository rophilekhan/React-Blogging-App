import React from "react";
import { useProgress } from "@react-three/drei";

const Loader3D = ({ message = "Compiling Spatial Dimensions..." }) => {
  const { progress } = useProgress();
  const rounded = Math.round(progress || 0);

  return (
    <div className="fixed inset-0 z-0 flex flex-col items-center justify-center bg-[#050714] text-white select-none pointer-events-none">
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Glassmorphic Loader Container */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col items-center gap-4 max-w-xs text-center">
        {/* Futuristic Multi-Ring Spinner */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
          {/* Inner Reverse Ring */}
          <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin [animation-direction:reverse] [animation-duration:1.2s]" />
          {/* Core Pulsing Beacon */}
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-pink-400 animate-ping" />
        </div>

        {/* Status text */}
        <div>
          <div className="text-xs font-bold tracking-wider uppercase text-indigo-300 font-display">
            {message}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Optimizing GPU shaders & geometry
          </div>
        </div>

        {/* Progress bar if assets are downloading */}
        {rounded > 0 && (
          <div className="w-full">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                style={{ width: `${rounded}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
              {rounded}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loader3D;
