import React from 'react';
import { cn } from '@/lib/utils';
interface RetroCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}
export function RetroCard({ children, title, className }: RetroCardProps) {
  return (
    <div className={cn("relative group", className)}>
      {/* Corner accents */}
      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary z-20 transition-all group-hover:scale-110" />
      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary z-20 transition-all group-hover:scale-110" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary z-20 transition-all group-hover:scale-110" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary z-20 transition-all group-hover:scale-110" />
      <div className="bg-neutral-900/90 border border-neutral-800 p-4 relative overflow-hidden">
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-primary font-bold tracking-tighter uppercase text-sm">
                {title}
              </h3>
            </div>
          </div>
        )}
        <div className="relative z-10">
          {children}
        </div>
        {/* Decorative BG pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>
    </div>
  );
}