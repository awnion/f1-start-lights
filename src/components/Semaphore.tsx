import React from 'react';
import { cn } from '@/lib/utils';
interface SemaphoreProps {
  lightsActive: number; // 0 to 5
}
export function Semaphore({ lightsActive }: SemaphoreProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-2 sm:gap-6 p-4 sm:p-8 bg-neutral-900/80 border-y-4 border-neutral-800 shadow-2xl">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          {/* Light Pod */}
          <div className="w-10 sm:w-16 h-24 sm:h-32 bg-neutral-950 rounded-md border-2 border-neutral-800 flex flex-col items-center justify-around py-2 shadow-inner">
            {/* Top Light */}
            <div 
              className={cn(
                "w-7 h-7 sm:w-12 sm:h-12 rounded-full transition-all duration-75",
                i < lightsActive 
                  ? "bg-red-600 glow-red border-red-400 border" 
                  : "bg-neutral-900 border-neutral-800 border shadow-none"
              )} 
            />
            {/* Bottom Light */}
            <div 
              className={cn(
                "w-7 h-7 sm:w-12 sm:h-12 rounded-full transition-all duration-75",
                i < lightsActive 
                  ? "bg-red-600 glow-red border-red-400 border" 
                  : "bg-neutral-900 border-neutral-800 border shadow-none"
              )} 
            />
          </div>
          {/* Connector Rod Base */}
          <div className="h-4 w-2 bg-neutral-800 mx-auto rounded-b" />
        </div>
      ))}
    </div>
  );
}