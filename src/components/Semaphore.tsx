import React from 'react';
import { cn } from '@/lib/utils';
interface SemaphoreProps {
  lightsActive: number; // 0 to 5
}
export function Semaphore({ lightsActive }: SemaphoreProps) {
  return (
    <div className="w-full flex flex-row items-center justify-center gap-2 sm:gap-4 md:gap-6 p-4 pt-6 sm:pb-10 md:pb-14 bg-neutral-900/95 border-y-4 border-neutral-800 shadow-[0_0_60px_rgba(0,0,0,0.7)] relative overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center flex-1 max-w-[140px]">
          {/* Light Pod - Proportional scaling using aspect ratio */}
          <div className="w-full aspect-[4/9] min-h-[120px] bg-neutral-950 rounded-sm sm:rounded-lg border-2 border-neutral-800 flex flex-col items-center justify-between py-[15%] sm:py-[20%] shadow-inner transition-none overflow-hidden relative">
            {/* Top Light */}
            <div
              className={cn(
                "w-[70%] aspect-square rounded-full transition-none flex-shrink-0 relative z-10",
                i < lightsActive
                  ? "bg-red-600 glow-red border-red-400 border-2"
                  : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
              )}
            />
            {/* Bottom Light */}
            <div
              className={cn(
                "w-[70%] aspect-square rounded-full transition-none flex-shrink-0 relative z-10",
                i < lightsActive
                  ? "bg-red-600 glow-red border-red-400 border-2"
                  : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
              )}
            />
            {/* Inner pod texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,white_2px,white_4px)]" />
          </div>
          {/* Connector Rod Base */}
          <div className="h-4 sm:h-8 w-2 sm:w-4 bg-neutral-800 rounded-b mt-0 shadow-lg" />
        </div>
      ))}
      {/* Decorative high-tech grid overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(90deg,transparent_98%,rgba(255,255,255,0.2)_100%),linear-gradient(0deg,transparent_98%,rgba(255,255,255,0.2)_100%)] bg-[length:40px_40px]" />
    </div>
  );
}