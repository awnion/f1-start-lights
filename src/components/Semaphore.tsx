// CRITICAL RULE: NEVER add telemetry/sync/buffer/version/status UI/text/comments. Keep UI minimal/clean—no extras.
// CRITICAL F1 RULE: Top row ALWAYS off/black—no red/glow. Bottom only active (i < lightsActive). Never change top.
import React from 'react';
import { cn } from '@/lib/utils';
interface SemaphoreProps {
  lightsActive: number; // 0 to 5
}
export function Semaphore({ lightsActive }: SemaphoreProps) {
  return (
    <div className="w-full flex flex-row items-start justify-center gap-2 sm:gap-4 md:gap-6 px-4 sm:px-8 py-6 sm:py-12 bg-neutral-900/95 border-b-4 border-neutral-800 shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center flex-1 max-w-[140px] group">
          {/* Hanging Connector Rod - Centered Precisely */}
          <div className="h-8 sm:h-16 w-3 sm:w-6 bg-neutral-800 rounded-t-sm shadow-[inset_0_4px_15px_rgba(0,0,0,0.8),2px_2px_10px_rgba(0,0,0,0.5)] flex-shrink-0 relative z-10" />
          {/* Light Pod Wrapper */}
          <div className="w-full aspect-[4/9] min-h-[140px] sm:min-h-[220px] bg-neutral-950 rounded-sm sm:rounded-lg border-2 border-neutral-800 flex flex-col items-center justify-evenly shadow-[inset_0_0_50px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Top Light Unit (Permanently Inactive/Black) */}
            <div className="w-[65%] relative z-20">
              <div className="w-full aspect-square rounded-full bg-neutral-900 transition-none overflow-hidden" />
            </div>
            {/* Bottom Light Unit (Active Sequence) */}
            <div className="w-[65%] relative z-20">
              <div
                className={cn(
                  "w-full aspect-square rounded-full transition-all duration-75 ease-out flex items-center justify-center",
                  i < lightsActive
                    ? "bg-red-600 shadow-[0_0_30px_#ff0033,0_0_60px_#ff0033] border-red-400 border-[1px] sm:border-2"
                    : "bg-neutral-900/50 border-neutral-800 border-[1px] sm:border-2 shadow-none"
                )}
              >
                {i < lightsActive && (
                  <>
                    <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_80%)] opacity-80" />
                    <div className="absolute inset-0 rounded-full animate-pulse bg-red-500/20 mix-blend-screen" />
                  </>
                )}
              </div>
            </div>
            {/* Mesh scanline texture for the pod interior */}
            <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.2)_2px,rgba(255,255,255,0.2)_4px)]" />
            {/* Vertical shading to add curvature to the pod */}
            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
          </div>
        </div>
      ))}
      {/* Background Decor - Blueprint Grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(90deg,transparent_98%,white_100%),linear-gradient(0deg,transparent_98%,white_100%)] bg-[length:40px_40px]" />
      {/* Dynamic Ambient Glow */}
      <div className={cn(
        "absolute inset-0 transition-all duration-300 ease-in-out pointer-events-none",
        lightsActive > 0 ? "opacity-30 bg-red-900/40" : "opacity-0"
      )} />
      {/* Top Beam Decoration */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-neutral-800 shadow-md" />
    </div>
  );
}