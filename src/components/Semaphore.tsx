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
          {/* Light Pod Wrapper: Updated for mathematical vertical symmetry */}
          <div className="w-full aspect-[4/9] min-h-[120px] sm:min-h-[160px] bg-neutral-950 rounded-sm sm:rounded-md border-2 border-neutral-800 flex flex-col items-center justify-evenly shadow-[inset_0_0_25px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Top Light Unit: Now illuminates to match F1 "Double Red" configuration */}
            <div className="w-[70%] relative z-10">
              <div
                className={cn(
                  "w-full aspect-square rounded-full transition-none",
                  i < lightsActive
                    ? "bg-red-600 shadow-[0_0_25px_#ff0033,0_0_50px_#ff0033] border-red-400 border-2"
                    : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
                )}
              >
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] opacity-50" />
              </div>
            </div>
            {/* Bottom Light Unit */}
            <div className="w-[70%] relative z-10">
              <div
                className={cn(
                  "w-full aspect-square rounded-full transition-none",
                  i < lightsActive
                    ? "bg-red-600 shadow-[0_0_25px_#ff0033,0_0_50px_#ff0033] border-red-400 border-2"
                    : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
                )}
              >
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] opacity-50" />
              </div>
            </div>
            {/* Mesh scanline texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.4)_2px,rgba(255,255,255,0.4)_4px)]" />
          </div>
        </div>
      ))}
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(90deg,transparent_98%,white_100%),linear-gradient(0deg,transparent_98%,white_100%)] bg-[length:40px_40px]" />
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300 pointer-events-none",
        lightsActive > 0 ? "opacity-15 bg-red-900/30" : "opacity-0"
      )} />
    </div>
  );
}