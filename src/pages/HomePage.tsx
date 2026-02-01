import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Timer, Trophy, RotateCcw, Zap, AlertTriangle, Cpu, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { Semaphore } from '@/components/Semaphore';
import { RetroCard } from '@/components/RetroCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
const STORAGE_KEY = 'f1_reflex_history_v1';
type GameState = 'IDLE' | 'COUNTDOWN' | 'WAITING' | 'RESULT' | 'JUMP_START';
interface Attempt {
  id: string;
  time: number; // positive for success, 0 for jump
  timestamp: number;
}
export function HomePage() {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [activeLights, setActiveLights] = useState(0);
  const [lastReaction, setLastReaction] = useState<number | null>(null);
  // Set browser document title on mount
  useEffect(() => {
    document.title = "F1 REFLEX | Retro Precision Simulator";
  }, []);
  // Initialize history from localStorage with safety checks
  const [history, setHistory] = useState<Attempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.slice(0, 15) : [];
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
    return [];
  });
  // Persist history whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  }, [history]);
  // High precision timing and timer lifecycle management
  const lightsOutTimeRef = useRef<number>(0);
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const clearAllTimers = useCallback(() => {
    activeTimersRef.current.forEach(timer => clearTimeout(timer));
    activeTimersRef.current = [];
  }, []);
  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);
  const bestTime = useMemo(() => {
    const validTimes = history.filter(a => a.time > 0).map(a => a.time);
    return validTimes.length > 0 ? Math.min(...validTimes) : Infinity;
  }, [history]);
  const isNewBest = lastReaction !== null && lastReaction > 0 && lastReaction <= bestTime;
  const startSequence = useCallback(() => {
    clearAllTimers();
    setGameState('COUNTDOWN');
    setActiveLights(0);
    setLastReaction(null);
    // Light up pairs one by one (1s intervals)
    for (let i = 1; i <= 5; i++) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          if (prev === 'COUNTDOWN') {
            setActiveLights(i);
            return 'COUNTDOWN';
          }
          return prev;
        });
      }, i * 1000);
      activeTimersRef.current.push(timer);
    }
    // After all 5 lights are on, wait random time
    const finalLightTimer = setTimeout(() => {
      setGameState(prev => {
        if (prev === 'COUNTDOWN') {
          const randomHold = Math.random() * 2600 + 400; // 0.4s to 3.0s total hold
          const holdTimer = setTimeout(() => {
            lightsOutTimeRef.current = performance.now();
            setGameState('WAITING');
            setActiveLights(0);
          }, randomHold);
          activeTimersRef.current.push(holdTimer);
          return 'COUNTDOWN';
        }
        return prev;
      });
    }, 5000);
    activeTimersRef.current.push(finalLightTimer);
  }, [clearAllTimers]);
  const handleTrigger = useCallback(() => {
    const now = performance.now();
    if (gameState === 'IDLE' || gameState === 'RESULT' || gameState === 'JUMP_START') {
      startSequence();
    } else if (gameState === 'COUNTDOWN') {
      clearAllTimers();
      setGameState('JUMP_START');
      setLastReaction(0);
      setHistory(prev => [{ id: crypto.randomUUID(), time: 0, timestamp: Date.now() }, ...prev].slice(0, 15));
    } else if (gameState === 'WAITING') {
      const reaction = (now - lightsOutTimeRef.current) / 1000;
      setLastReaction(reaction);
      setGameState('RESULT');
      // Feedback for high performance
      if (reaction <= bestTime || reaction < 0.200) {
        confetti({
          particleCount: reaction < 0.200 ? 200 : 100,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#ff0033', '#39ff14', '#ffffff', '#ffd700']
        });
      }
      setHistory(prev => [{ id: crypto.randomUUID(), time: reaction, timestamp: Date.now() }, ...prev].slice(0, 15));
    }
  }, [gameState, startSequence, clearAllTimers, bestTime]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space or Enter trigger the action
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTrigger]);
  const getPerformanceMessage = (time: number) => {
    if (time === 0) return { label: 'JUMP START', color: 'text-red-500' };
    if (time < 0.180) return { label: 'GODLIKE REFLEXES', color: 'text-emerald-400' };
    if (time < 0.230) return { label: 'F1 LEVEL', color: 'text-green-400' };
    if (time < 0.300) return { label: 'EXCELLENT', color: 'text-blue-400' };
    return { label: 'COULD BE BETTER', color: 'text-neutral-400' };
  };
  const clearData = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Reset all session data?")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      setLastReaction(null);
      setGameState('IDLE');
    }
  };
  return (
    <div
      className="min-h-screen bg-neutral-950 flex flex-col items-center scanline touch-none overflow-hidden select-none"
      onPointerDown={(e) => {
        // Essential: ignore if clicking a button to prevent unwanted game resets/starts
        if ((e.target as HTMLElement).closest('button')) return;
        handleTrigger();
      }}
    >
      {/* Visual Standards compliant wrapper: max-w-7xl, px-4-8, py-8-12 */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1 py-8 md:py-10 lg:py-12">
        <header className="flex items-center justify-between mb-8 sm:mb-16 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2 glow-red">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white italic leading-none">F1 REFLEX</h1>
              <span className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.3em] mt-1 ml-1">Precision Semaphore V1.0</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Telemetry Link Active
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center gap-12 sm:gap-16">
          {/* Light Gantry */}
          <div className="w-full max-w-2xl transform scale-95 sm:scale-100 transition-transform">
            <Semaphore lightsActive={activeLights} />
          </div>
          {/* Central Status/Reaction Display */}
          <div className="text-center h-40 sm:h-52 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {gameState === 'IDLE' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="animate-pulse space-y-3"
                >
                  <p className="text-neutral-400 font-bold tracking-[0.4em] uppercase text-sm sm:text-base">Tap Screen or Press Space</p>
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest">to initiate start procedure</p>
                </motion.div>
              )}
              {gameState === 'COUNTDOWN' && (
                <motion.div
                  key="countdown"
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <p className="text-primary font-black text-2xl sm:text-3xl tracking-[0.3em] uppercase glow-red/50">
                    STAND BY
                  </p>
                  <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">Awaiting sequential ignition</p>
                </motion.div>
              )}
              {gameState === 'WAITING' && (
                <motion.p
                  key="waiting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-neutral-200 font-black text-2xl sm:text-4xl tracking-[0.15em] uppercase"
                >
                  WAIT FOR LIGHTS OUT...
                </motion.p>
              )}
              {(gameState === 'RESULT' || gameState === 'JUMP_START') && (
                <motion.div
                  key="result"
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="relative inline-block">
                    <p className={cn(
                      "text-7xl sm:text-9xl font-black tabular-nums tracking-tighter leading-none transition-all",
                      gameState === 'JUMP_START' ? 'text-red-500' : 'text-accent',
                      isNewBest && history.length > 1 && "animate-glitch"
                    )}>
                      {gameState === 'JUMP_START' ? 'JUMP' : `${lastReaction?.toFixed(3)}s`}
                    </p>
                    {isNewBest && history.length > 1 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 12 }}
                        className="absolute -top-6 -right-16 bg-amber-500 text-black text-[10px] px-3 py-1 font-black uppercase shadow-glow z-20 border border-black"
                      >
                        NEW RECORD
                      </motion.div>
                    )}
                  </div>
                  <p className={cn("text-sm sm:text-base font-bold uppercase tracking-[0.3em] mt-2", getPerformanceMessage(lastReaction ?? 0).color)}>
                    {getPerformanceMessage(lastReaction ?? 0).label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        {/* Dashboard Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <RetroCard title="Session Statistics" className="md:col-span-1">
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-xs uppercase flex items-center gap-2">
                  <Star className="w-3 h-3 text-amber-500" /> Best Reflex
                </span>
                <span className={cn(
                  "font-mono text-xl font-black tracking-tight transition-all duration-500",
                  bestTime === Infinity ? "text-neutral-800" : "text-accent glow-green"
                )}>
                  {bestTime === Infinity ? '--.---' : `${bestTime.toFixed(3)}s`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-xs uppercase flex items-center gap-2">
                  <Timer className="w-3 h-3 text-blue-500" /> Session Avg
                </span>
                <span className="text-white font-mono font-bold">
                  {history.length > 0
                    ? (history.filter(a => a.time > 0).reduce((acc, curr) => acc + curr.time, 0) / Math.max(1, history.filter(a => a.time > 0).length)).toFixed(3)
                    : '0.000'}s
                </span>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:text-red-500 hover:border-red-900/50 transition-all uppercase text-[10px] tracking-[0.2em] h-10"
                  onClick={clearData}
                >
                  <RotateCcw className="w-3 h-3 mr-2" /> Reset Session Data
                </Button>
              </div>
            </div>
          </RetroCard>
          <RetroCard title="Telemetry Logs" className="md:col-span-2">
            <ScrollArea className="h-44 pr-4">
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-neutral-700 text-xs uppercase font-bold tracking-widest gap-2">
                    <AlertTriangle className="w-4 h-4 opacity-20" />
                    No Telemetry Recorded
                  </div>
                ) : (
                  history.map((attempt, idx) => (
                    <motion.div
                      key={attempt.id}
                      initial={{ x: -5, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center justify-between text-xs font-mono border-b border-neutral-800/30 pb-2 last:border-0 group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-neutral-600 w-8 font-bold">#{history.length - idx}</span>
                        {attempt.time === 0 ? (
                          <span className="text-red-500 flex items-center gap-2 font-black italic">
                            <AlertTriangle className="w-3 h-3" /> JUMP_START
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "flex items-center gap-2 font-bold",
                              attempt.time <= bestTime && history.length > 1 ? "text-accent" : "text-neutral-200"
                            )}>
                              <Zap className={cn("w-3 h-3", attempt.time <= bestTime && history.length > 1 ? "text-amber-400" : "text-accent/50")} />
                              {attempt.time.toFixed(3)}s
                            </span>
                            {attempt.time <= bestTime && history.length > 1 && (
                              <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 font-black uppercase">Personal Best</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-neutral-600 text-[10px] group-hover:text-neutral-400 transition-colors">
                        {new Date(attempt.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </RetroCard>
        </div>
      </div>
    </div>
  );
}