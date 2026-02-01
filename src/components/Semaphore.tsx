import React from 'react';
import { cn } from '@/lib/utils';
interface SemaphoreProps {
  lightsActive: number; // 0 to 5
}
export function Semaphore({ lightsActive }: SemaphoreProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-1.5 xs:gap-3 sm:gap-6 p-3 sm:p-8 bg-neutral-900/80 border-y-4 border-neutral-800 shadow-2xl relative overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col gap-1 sm:gap-2">
          {/* Light Pod - Explicitly set transition-none to avoid inherited delays */}
          <div className="w-8 xs:w-10 sm:w-16 h-20 xs:h-24 sm:h-32 bg-neutral-950 rounded-sm sm:rounded-md border border-neutral-800 flex flex-col items-center justify-around py-1 sm:py-2 shadow-inner transition-none">
            {/* Top Light */}
            <div
              className={cn(
                "w-5 h-5 xs:w-7 xs:h-7 sm:w-12 sm:h-12 rounded-full transition-none",
                i < lightsActive
                  ? "bg-red-600 glow-red border-red-400 border"
                  : "bg-neutral-900 border-neutral-800 border shadow-none"
              )}
            />
            {/* Bottom Light */}
            <div
              className={cn(
                "w-5 h-5 xs:w-7 xs:h-7 sm:w-12 sm:h-12 rounded-full transition-none",
                i < lightsActive
                  ? "bg-red-600 glow-red border-red-400 border"
                  : "bg-neutral-900 border-neutral-800 border shadow-none"
              )}
            />
          </div>
          {/* Connector Rod Base */}
          <div className="h-3 sm:h-4 w-1 sm:w-2 bg-neutral-800 mx-auto rounded-b" />
        </div>
      ))}
      {/* Decorative vertical grid overlay - tuned for optimal contrast */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(90deg,transparent_95%,rgba(255,255,255,0.1)_100%)] bg-[length:15px_100%] sm:bg-[length:20px_100%]" />
    </div>
  );
}