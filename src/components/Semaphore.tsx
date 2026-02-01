import React from 'react';
import { cn } from '@/lib/utils';
interface SemaphoreProps {
  lightsActive: number; // 0 to 5
}
export function Semaphore({ lightsActive }: SemaphoreProps) {
  return (
    <div className="w-full flex flex-row items-end justify-center gap-2 sm:gap-4 md:gap-6 p-4 pt-8 bg-neutral-900/95 border-y-4 border-neutral-800 shadow-[0_0_60px_rgba(0,0,0,0.7)] relative overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center flex-1 max-w-[140px] h-full">
          {/* Light Pod Wrapper - Fixed aspect ratio here ensures all pods are identical height */}
          <div className="w-full aspect-[4/9] min-h-[140px] bg-neutral-950 rounded-sm sm:rounded-lg border-2 border-neutral-800 flex flex-col items-center justify-evenly py-0 shadow-inner relative overflow-hidden">
            {/* 
              'justify-evenly' ensures:
              space-above-top == space-between-lights == space-below-bottom 
            */}
            {/* Top Light */}
            <div className="w-[70%] relative z-10">
              <div
                className={cn(
                  "w-full aspect-square rounded-full transition-none",
                  i < lightsActive
                    ? "bg-red-600 glow-red border-red-400 border-2"
                    : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
                )}
              />
            </div>
            {/* Bottom Light */}
            <div className="w-[70%] relative z-10">
              <div
                className={cn(
                  "w-full aspect-square rounded-full transition-none",
                  i < lightsActive
                    ? "bg-red-600 glow-red border-red-400 border-2"
                    : "bg-neutral-900 border-neutral-800 border-2 shadow-none"
                )}
              />
            </div>
            {/* Inner pod texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,white_2px,white_4px)]" />
          </div>
          {/* Connector Rod - Fixed height prevents layout shifts */}
          <div className="h-6 sm:h-10 w-2 sm:w-4 bg-neutral-800 rounded-b shadow-lg flex-shrink-0" />
        </div>
      ))}
      {/* Decorative high-tech grid overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(90deg,transparent_98%,rgba(255,255,255,0.2)_100%),linear-gradient(0deg,transparent_98%,rgba(255,255,255,0.2)_100%)] bg-[length:40px_40px]" />
    </div>
  );
}