// CRITICAL F1 RULE: Top row ALWAYS off/black—no red/glow. Bottom only active (i < lightsActive). Never change top.
import React from 'react';
import { cn } from '@/lib/utils';
interface SemaphoreProps {
  lightsActive: number; // 0 to 5
}
export function Semaphore({ lightsActive }: SemaphoreProps) {
  return (
    <div className="w-full flex flex-row items-start justify-center gap-2 sm:gap-4 md:gap-6 p-4 sm:p-8 bg-neutral-900/95 border-b-4 border-neutral-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center flex-1 max-w-[140px]">
          {/* Hanging Connector Rod */}
          <div className="h-6 sm:h-12 w-2 sm:w-5 bg-neutral-800 rounded-t-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex-shrink-0" />
          {/* Light Pod Wrapper */}
          <div className="w-full aspect-[4/9] min-h-[120px] sm:min-h-[160px] bg-neutral-950 rounded-sm sm:rounded-md border-2 border-neutral-800 flex flex-col items-center justify-evenly shadow-[inset_0_0_35px_rgba(0,0,0,1)] relative">
            {/* CRITICAL F1 RULE: Top row ALWAYS off/black—no red/glow. Bottom only active (i < lightsActive). Never change top. */}
            {/* Top Light Unit (Permanently Inactive/Black) */}
            <div className="w-[60%] relative z-20">
              <div className="w-full aspect-square rounded-full bg-neutral-800/40 border-neutral-800 border-2 shadow-none transition-none" />
            </div>
            {/* Bottom Light Unit (Active Sequence) */}
            <div className="w-[60%] relative z-20">
              <div
                className={cn(
                  "w-full aspect-square rounded-full transition-none",
                  i < lightsActive
                    ? "bg-red-600 shadow-[0_0_20px_#ff0033,0_0_40px_#ff0033] border-red-400 border-2"
                    : "bg-neutral-800/40 border-neutral-800 border-2 shadow-none"
                )}
              >
                {i < lightsActive && (
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] opacity-60" />
                )}
              </div>
            </div>
            {/* Mesh scanline texture for the pod interior */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.4)_2px,rgba(255,255,255,0.4)_4px)]" />
          </div>
        </div>
      ))}
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(90deg,transparent_98%,white_100%),linear-gradient(0deg,transparent_98%,white_100%)] bg-[length:40px_40px]" />
      {/* Dynamic Ambient Glow */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300 pointer-events-none",
        lightsActive > 0 ? "opacity-20 bg-red-900/30" : "opacity-0"
      )} />
    </div>
  );
}