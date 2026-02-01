import React from 'react';
import { cn } from '@/lib/utils';
interface SemaphoreProps {
  lightsActive: number; // 0 to 5
}
export function Semaphore({ lightsActive }: SemaphoreProps) {
  return (
    <div className="w-full flex flex-row items-center justify-center gap-2 xs:gap-4 sm:gap-8 md:gap-12 lg:gap-16 p-4 sm:p-10 md:p-14 bg-neutral-900/90 border-y-4 border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2 sm:gap-4">
          {/* Light Pod - Expanded dimensions for high-fidelity impact */}
          <div className="w-10 xs:w-14 sm:w-20 md:w-28 lg:w-32 h-24 xs:h-32 sm:h-44 md:h-56 lg:h-64 bg-neutral-950 rounded-sm sm:rounded-lg border-2 border-neutral-800 flex flex-col items-center justify-around py-2 sm:py-4 shadow-inner transition-none">
            {/* Top Light */}
            <div
              className={cn(
                "w-7 h-7 xs:w-10 xs:h-10 sm:w-16 sm:h-16 md:w-20 md:w-20 lg:w-24 lg:h-24 rounded-full transition-none",
                i < lightsActive
                  ? "bg-red-600 glow-red border-red-400 border-2"
                  : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
              )}
            />
            {/* Bottom Light */}
            <div
              className={cn(
                "w-7 h-7 xs:w-10 xs:h-10 sm:w-16 sm:h-16 md:w-20 md:w-20 lg:w-24 lg:h-24 rounded-full transition-none",
                i < lightsActive
                  ? "bg-red-600 glow-red border-red-400 border-2"
                  : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
              )}
            />
          </div>
          {/* Connector Rod Base */}
          <div className="h-4 sm:h-6 w-2 sm:w-3 bg-neutral-800 mx-auto rounded-b" />
        </div>
      ))}
      {/* Decorative vertical grid overlay - re-scaled for the larger gantry */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[linear-gradient(90deg,transparent_95%,rgba(255,255,255,0.1)_100%)] bg-[length:30px_100%] sm:bg-[length:40px_100%]" />
    </div>
  );
}