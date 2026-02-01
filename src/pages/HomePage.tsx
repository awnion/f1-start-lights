import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Timer, Trophy, RotateCcw, Zap, Cpu, Star, Gauge, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { Semaphore } from '@/components/Semaphore';
import { RetroCard } from '@/components/RetroCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
const STORAGE_KEY = 'f1_reflex_history_v2';
type GameState = 'IDLE' | 'COUNTDOWN' | 'WAITING' | 'RESULT' | 'JUMP_START';
interface Attempt {
  id: string;
  time: number; // 0 for jump start
  timestamp: number;
}
const PRO_BENCHMARKS = [
  { name: 'Graham Hill', time: 0.160, label: 'World Record' },
  { name: 'Lewis Hamilton', time: 0.165, label: '7x Champ' },
  { name: 'Max Verstappen', time: 0.180, label: 'Peak Performance' },
  { name: 'F1 Pole Average', time: 0.200, label: 'Elite' },
  { name: 'Avg F1 Driver', time: 0.220, label: 'Pro Standard' },
];
export function HomePage() {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [activeLights, setActiveLights] = useState(0);
  const [lastReaction, setLastReaction] = useState<number | null>(null);
  const lightsOutTimeRef = useRef<number>(0);
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  useEffect(() => {
    document.title = "F1 REFLEX | Pro Timing Engine";
  }, []);
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
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  }, [history]);
  const clearAllTimers = useCallback(() => {
    activeTimersRef.current.forEach(timer => clearTimeout(timer));
    activeTimersRef.current = [];
  }, []);
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);
  const bestTime = useMemo(() => {
    const validTimes = history.filter(a => a.time > 0).map(a => a.time);
    return validTimes.length > 0 ? Math.min(...validTimes) : Infinity;
  }, [history]);
  const isNewBest = useMemo(() => {
    // If it's the first attempt, it's technically a "best", 
    // but we usually want to celebrate if it's elite or beats a previous record.
    if (lastReaction === null || lastReaction <= 0) return false;
    if (history.length <= 1) return lastReaction <= 0.220; // Celebrate first time if pro-level
    return lastReaction <= bestTime;
  }, [lastReaction, bestTime, history.length]);
  const startSequence = useCallback(() => {
    clearAllTimers();
    setGameState('COUNTDOWN');
    setActiveLights(0);
    setLastReaction(null);
    // Sequence for 5 red light pairs: 1s, 2s, 3s, 4s, 5s
    for (let i = 1; i <= 5; i++) {
      const timer = setTimeout(() => {
        setActiveLights(i);
      }, i * 1000);
      activeTimersRef.current.push(timer);
    }
    // After the 5th light (at 5000ms), wait exactly 1 second (to 6000ms) 
    // before starting the randomized hold period (0.2s - 3.0s)
    const prepareTimer = setTimeout(() => {
      // Randomized hold period according to F1 simulator specs
      const randomHold = Math.random() * 2800 + 200; // 0.2s to 3.0s
      const holdTimer = setTimeout(() => {
        lightsOutTimeRef.current = performance.now();
        setGameState('WAITING');
        setActiveLights(0);
      }, randomHold);
      activeTimersRef.current.push(holdTimer);
    }, 6000); // 5s (last light) + 1s (cadence)
    activeTimersRef.current.push(prepareTimer);
  }, [clearAllTimers]);
  const resetToIdle = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearAllTimers();
    setGameState('IDLE');
    setActiveLights(0);
    setLastReaction(null);
  }, [clearAllTimers]);
  const handleTrigger = useCallback(() => {
    const now = performance.now();
    if (gameState === 'IDLE') {
      startSequence();
      return;
    }
    if (gameState === 'COUNTDOWN') {
      clearAllTimers();
      setGameState('JUMP_START');
      setLastReaction(0);
      setHistory(prev => [{ id: crypto.randomUUID(), time: 0, timestamp: Date.now() }, ...prev].slice(0, 15));
      return;
    }
    if (gameState === 'WAITING') {
      const reaction = (now - lightsOutTimeRef.current) / 1000;
      setLastReaction(reaction);
      setGameState('RESULT');
      const isRecord = (reaction <= bestTime && history.length > 0) || reaction < 0.200;
      if (isRecord) {
        confetti({
          particleCount: reaction < 0.180 ? 200 : 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff0033', '#39ff14', '#ffffff']
        });
      }
      setHistory(prev => [{ id: crypto.randomUUID(), time: reaction, timestamp: Date.now() }, ...prev].slice(0, 15));
      return;
    }
  }, [gameState, startSequence, clearAllTimers, bestTime, history.length]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle interaction keys if NOT in a terminal state (where only Reset button works)
      if (gameState === 'IDLE' || gameState === 'COUNTDOWN' || gameState === 'WAITING') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleTrigger();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTrigger, gameState]);
  const getPerformanceMessage = (time: number) => {
    if (time === 0) return { label: 'JUMP START', color: 'text-red-500' };
    if (time < 0.180) return { label: 'GODLIKE REFLEXES', color: 'text-emerald-400' };
    if (time < 0.230) return { label: 'F1 LEVEL', color: 'text-green-400' };
    if (time < 0.300) return { label: 'EXCELLENT', color: 'text-blue-400' };
    return { label: 'COULD BE BETTER', color: 'text-neutral-500' };
  };
  const clearData = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Reset all session data?")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      resetToIdle();
    }
  };
  const validAverage = useMemo(() => {
    const valid = history.filter(a => a.time > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((acc, curr) => acc + curr.time, 0) / valid.length;
  }, [history]);
  return (
    <div
      className="min-h-screen bg-neutral-950 flex flex-col items-center scanline touch-none overflow-hidden select-none"
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        // Prevent trigger if clicking UI buttons
        if (target.closest('button') || target.closest('a')) return;
        // Only trigger during active game phases
        if (gameState === 'IDLE' || gameState === 'COUNTDOWN' || gameState === 'WAITING') {
          handleTrigger();
        }
      }}
    >
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1 py-8 md:py-10 lg:py-12">
        <header className="flex items-center justify-between mb-8 sm:mb-16 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2 glow-red">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white italic leading-none uppercase">F1 REFLEX</h1>
              <span className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.3em] mt-1 ml-1">Professional Benchmark Edition</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-neutral-500 uppercase font-bold">Latency Mode</span>
            <span className="text-[10px] text-accent font-black uppercase tracking-widest">Ultra-Low Performance.now()</span>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center gap-12 sm:gap-16">
          <div className="w-full max-w-2xl transform scale-95 sm:scale-100 transition-transform">
            <Semaphore lightsActive={activeLights} />
          </div>
          <div className="text-center h-48 sm:h-64 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {gameState === 'IDLE' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="text-neutral-400 font-bold tracking-[0.4em] uppercase text-sm sm:text-base animate-pulse">Tap Screen or Press Space</p>
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest">to initiate start procedure</p>
                </motion.div>
              )}
              {gameState === 'COUNTDOWN' && (
                <motion.div
                  key="countdown"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <p className="text-neutral-500 font-black text-2xl tracking-[0.4em] uppercase">STAND BY</p>
                </motion.div>
              )}
              {gameState === 'WAITING' && (
                <motion.div key="waiting" className="h-full" />
              )}
              {(gameState === 'RESULT' || gameState === 'JUMP_START') && (
                <motion.div
                  key="result"
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative">
                    <p className={cn(
                      "text-7xl sm:text-9xl font-black tabular-nums tracking-tighter leading-none",
                      gameState === 'JUMP_START' ? 'text-red-500 animate-glitch' : 'text-accent',
                      isNewBest && gameState === 'RESULT' && "animate-glitch"
                    )}>
                      {gameState === 'JUMP_START' ? 'JUMP' : `${lastReaction?.toFixed(3)}s`}
                    </p>
                    {isNewBest && gameState === 'RESULT' && (
                      <div className="absolute -top-6 -right-12 bg-amber-500 text-black text-[10px] px-2 py-1 font-black uppercase shadow-glow z-20 border border-black transform rotate-12">
                        NEW BEST
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <p className={cn("text-sm sm:text-base font-bold uppercase tracking-[0.3em]", getPerformanceMessage(lastReaction ?? 0).color)}>
                      {getPerformanceMessage(lastReaction ?? 0).label}
                    </p>
                    <Button
                      onClick={resetToIdle}
                      className="bg-primary hover:bg-red-600 text-white font-black uppercase tracking-[0.2em] px-8 py-6 rounded-none glow-red h-auto text-lg group"
                    >
                      <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                      Retry
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <RetroCard title="Session Stats" className="md:col-span-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-neutral-950/50 p-3 border border-neutral-800/50">
                <span className="text-neutral-500 text-[10px] uppercase flex items-center gap-2">
                  <Star className="w-3 h-3 text-amber-500" /> Personal Best
                </span>
                <span className={cn(
                  "font-mono text-xl font-black tracking-tight",
                  bestTime === Infinity ? "text-neutral-800" : (bestTime <= 0.220 ? "text-accent" : "text-white")
                )}>
                  {bestTime === Infinity ? '--.---' : `${bestTime.toFixed(3)}s`}
                </span>
              </div>
              <div className="flex justify-between items-center px-3">
                <span className="text-neutral-500 text-[10px] uppercase flex items-center gap-2">
                  <Timer className="w-3 h-3 text-blue-500" /> Valid Average
                </span>
                <span className="text-white font-mono font-bold text-sm">
                  {validAverage > 0 ? validAverage.toFixed(3) : '0.000'}s
                </span>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-neutral-800 bg-neutral-900/50 text-neutral-600 hover:text-red-500 hover:border-red-900/50 transition-all uppercase text-[10px] tracking-[0.2em] h-10 rounded-none"
                  onClick={clearData}
                >
                  Reset History
                </Button>
              </div>
            </div>
          </RetroCard>
          <RetroCard title="Pro Benchmarks" className="md:col-span-1">
            <div className="space-y-2">
              {PRO_BENCHMARKS.map((pro, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] font-mono py-1 border-b border-neutral-800/30 last:border-0">
                  <div className="flex flex-col">
                    <span className="text-neutral-200 font-bold uppercase">{pro.name}</span>
                    <span className="text-[9px] text-neutral-600 uppercase tracking-tighter">{pro.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-black tabular-nums",
                      bestTime <= pro.time ? "text-accent" : "text-neutral-500"
                    )}>
                      {pro.time.toFixed(3)}s
                    </span>
                    {bestTime <= pro.time && (
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RetroCard>
          <RetroCard title="Telemetry Log" className="md:col-span-1">
            <ScrollArea className="h-44 pr-4">
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-neutral-700 text-[10px] uppercase font-bold tracking-widest">
                    Empty Buffer
                  </div>
                ) : (
                  history.map((attempt, idx) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between text-[10px] font-mono border-b border-neutral-800/30 pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-700 w-5">#{history.length - idx}</span>
                        {attempt.time === 0 ? (
                          <span className="text-red-500 font-black italic uppercase">Jump</span>
                        ) : (
                          <span className={cn(
                            "flex items-center gap-1 font-bold",
                            attempt.time <= bestTime && history.length > 1 ? "text-accent" : "text-neutral-400"
                          )}>
                            {attempt.time.toFixed(3)}s
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-700 text-[9px]">
                        {new Date(attempt.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
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