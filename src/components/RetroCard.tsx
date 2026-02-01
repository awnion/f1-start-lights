import React from 'react';
import { cn } from '@/lib/utils';
interface RetroCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}
export function RetroCard({ children, title, className }: RetroCardProps) {
  return (
    <div className={cn("relative group h-full", className)}>
      {/* Corner accents */}
      <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-primary z-20 pointer-events-none" />
      <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2 border-primary z-20 pointer-events-none" />
      <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2 border-primary z-20 pointer-events-none" />
      <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-primary z-20 pointer-events-none" />
      <div className="bg-neutral-900/90 border border-neutral-800 p-6 h-full relative overflow-hidden">
        {title && (
          <div className="mb-6 flex items-center justify-between border-b border-neutral-800/60 pb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-primary font-bold tracking-[0.15em] uppercase text-sm">
                {title}
              </h3>
            </div>
            <div className="w-1.5 h-1.5 bg-primary/20 animate-pulse rounded-full" />
          </div>
        )}
        <div className="relative z-10">
          {children}
        </div>
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}