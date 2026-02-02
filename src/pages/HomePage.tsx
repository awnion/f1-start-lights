// CRITICAL RULE: NEVER add telemetry/sync/buffer/version/status UI/text/comments. Keep UI minimal/clean—no extras.
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RotateCcw, Zap, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { Semaphore } from '@/components/Semaphore';
import { RetroCard } from '@/components/RetroCard';
import { Button } from '@/components/ui/button';
const STORAGE_KEY = 'f1_start_lights_v2';
const INPUT_DEBOUNCE_MS = 100;
const RESULT_COOLDOWN_MS = 800;
type GameState = 'IDLE' | 'COUNTDOWN' | 'WAITING' | 'RESULT' | 'JUMP_START';
interface Attempt {
  id: string;
  time: number;
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
  const [isNewRecord, setIsNewRecord] = useState(false);
  const lightsOutTimeRef = useRef<number>(0);
  const activeTimersRef = useRef<number[]>([]);
  const processingRef = useRef<boolean>(false);
  const lastActionTimeRef = useRef<number>(0);
  const expectedLightsOutRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.title = "F1 START LIGHTS | High-Precision Reflex";
    // Ensure the container gets focus for keyboard events
    containerRef.current?.focus();
  }, []);
  const [history, setHistory] = useState<Attempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
      }
    } catch (e) {
      console.error("Failed to load records:", e);
    }
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save records:", e);
    }
  }, [history]);
  const clearAllTimers = useCallback(() => {
    activeTimersRef.current.forEach(timer => window.clearTimeout(timer));
    activeTimersRef.current = [];
  }, []);
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);
  const bestTime = useMemo(() => {
    const validTimes = history.filter(a => a.time > 0).map(a => a.time);
    return validTimes.length > 0 ? Math.min(...validTimes) : Infinity;
  }, [history]);
  const topTimes = useMemo(() => {
    return history
      .filter(a => a.time > 0)
      .sort((a, b) => a.time - b.time)
      .slice(0, 5);
  }, [history]);
  const startSequence = useCallback(() => {
    clearAllTimers();
    processingRef.current = false;
    lightsOutTimeRef.current = 0;
    expectedLightsOutRef.current = 0;
    setGameState('COUNTDOWN');
    setActiveLights(0);
    setLastReaction(null);
    setIsNewRecord(false);
    // Sequential lighting (1-5 seconds)
    for (let i = 1; i <= 5; i++) {
      const timer = window.setTimeout(() => {
        setActiveLights(i);
      }, i * 1000);
      activeTimersRef.current.push(timer);
    }
    // Randomized hold (0.5s - 3.0s as per F1 procedures)
    const holdTriggerTimer = window.setTimeout(() => {
      const randomHold = Math.random() * 2500 + 500; 
      expectedLightsOutRef.current = performance.now() + randomHold;
      const goTimer = window.setTimeout(() => {
        const now = performance.now();
        lightsOutTimeRef.current = now;
        setGameState('WAITING');
        setActiveLights(0);
      }, randomHold);
      activeTimersRef.current.push(goTimer);
    }, 5000);
    activeTimersRef.current.push(holdTriggerTimer);
  }, [clearAllTimers]);
  const resetToIdle = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      if ('preventDefault' in e) e.preventDefault();
    }
    clearAllTimers();
    processingRef.current = false;
    lightsOutTimeRef.current = 0;
    expectedLightsOutRef.current = 0; // CRITICAL: Reset timing ref
    setGameState('IDLE');
    setActiveLights(0);
    setLastReaction(null);
    setIsNewRecord(false);
    containerRef.current?.focus();
  }, [clearAllTimers]);
  const handleTrigger = useCallback(() => {
    const now = performance.now();
    if (now - lastActionTimeRef.current < INPUT_DEBOUNCE_MS) return;
    const previousActionTime = lastActionTimeRef.current;
    lastActionTimeRef.current = now;
    if (processingRef.current) return;
    if (gameState === 'IDLE') {
      startSequence();
      return;
    }
    if (gameState === 'RESULT' || gameState === 'JUMP_START') {
      if (now - previousActionTime < RESULT_COOLDOWN_MS) return;
      startSequence();
      return;
    }
    if (gameState === 'COUNTDOWN') {
      processingRef.current = true;
      clearAllTimers();
      const jumpTime = expectedLightsOutRef.current > 0
        ? (now - expectedLightsOutRef.current) / 1000
        : -1.0;
      setGameState('JUMP_START');
      setLastReaction(jumpTime);
      setHistory(prev => [{ id: crypto.randomUUID(), time: jumpTime, timestamp: Date.now() }, ...prev].slice(0, 50));
      return;
    }
    if (gameState === 'WAITING') {
      processingRef.current = true;
      const reaction = (now - lightsOutTimeRef.current) / 1000;
      const isPB = reaction > 0 && reaction < bestTime;
      const isElite = reaction > 0 && reaction < 0.200;
      setLastReaction(reaction);
      setIsNewRecord(isPB);
      setGameState('RESULT');
      if (isPB || isElite) {
        confetti({
          particleCount: reaction < 0.180 ? 400 : 200,
          spread: reaction < 0.180 ? 120 : 80,
          origin: { y: 0.6 },
          colors: ['#ff0033', '#39ff14', '#ffffff', '#fbbf24'],
          gravity: 1.2
        });
      }
      setHistory(prev => [{ id: crypto.randomUUID(), time: reaction, timestamp: Date.now() }, ...prev].slice(0, 50));
      return;
    }
  }, [gameState, startSequence, clearAllTimers, bestTime]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTrigger]);
  const getPerformanceMessage = (time: number) => {
    if (time <= 0) return { label: 'JUMP START', color: 'text-red-500' };
    if (time < 0.180) return { label: 'GODLIKE REFLEXES', color: 'text-emerald-400' };
    if (time < 0.230) return { label: 'F1 LEVEL', color: 'text-green-400' };
    if (time < 0.300) return { label: 'EXCELLENT', color: 'text-blue-400' };
    return { label: 'KEEP TRAINING', color: 'text-neutral-500' };
  };
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="min-h-screen bg-neutral-950 flex flex-col items-center relative select-none outline-none focus:outline-none"
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('[data-no-trigger="true"]')) return;
        handleTrigger();
      }}
    >
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1 py-8 md:py-10 lg:py-12 relative z-10">
        <header className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="bg-primary p-2 glow-red transform -skew-x-12">
              <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-white transform skew-x-12" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white italic leading-none uppercase">
              F1 START LIGHTS
            </h1>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-start gap-8 sm:gap-12 md:gap-16">
          <div className="w-full flex justify-center items-start">
            <Semaphore lightsActive={activeLights} />
          </div>
          <div className="text-center min-h-[16rem] sm:min-h-[20rem] flex flex-col items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {gameState === 'IDLE' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="text-neutral-400 font-bold tracking-[0.5em] uppercase text-xs sm:text-lg animate-pulse">
                    Tap or Press Space to Start Sequence
                  </p>
                </motion.div>
              )}
              {gameState === 'COUNTDOWN' && (
                <motion.div
                  key="countdown"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <p className={cn(
                    "font-black text-xl sm:text-3xl tracking-[0.6em] uppercase transition-colors duration-500",
                    activeLights === 5 ? "text-neutral-700" : "text-neutral-400"
                  )}>
                    STAND BY
                  </p>
                </motion.div>
              )}
              {(gameState === 'RESULT' || gameState === 'JUMP_START') && (
                <motion.div
                  key="result"
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-4 sm:gap-6 w-full"
                >
                  <div className="relative inline-block" data-no-trigger="true">
                    <p className={cn(
                      "text-5xl sm:text-7xl lg:text-9xl font-black tabular-nums tracking-tighter leading-none px-4 uppercase font-mono transition-all duration-300",
                      gameState === 'JUMP_START' ? 'text-red-500 animate-glitch whitespace-nowrap' : 'text-accent glow-green',
                      isNewRecord && "text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                    )}>
                      {gameState === 'JUMP_START'
                        ? 'JUMP START'
                        : `${lastReaction?.toFixed(3)}s`
                      }
                    </p>
                    {isNewRecord && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 12 }}
                        className="absolute -top-3 -right-2 sm:-top-8 sm:-right-10 bg-amber-500 text-black text-[10px] sm:text-xs px-2 sm:px-4 py-1 sm:py-2 font-black uppercase shadow-glow z-20 border-2 border-black transform whitespace-nowrap"
                      >
                        NEW BEST
                      </motion.div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-3 sm:gap-5 w-full px-4" data-no-trigger="true">
                    {gameState !== 'JUMP_START' && (
                      <p className={cn("text-sm sm:text-2xl font-black uppercase tracking-[0.25em] sm:tracking-[0.5em] text-center italic", getPerformanceMessage(lastReaction ?? 0).color)}>
                        {getPerformanceMessage(lastReaction ?? 0).label}
                      </p>
                    )}
                    <Button
                      onClick={resetToIdle}
                      className="bg-primary hover:bg-red-600 text-white font-black uppercase tracking-[0.3em] px-8 sm:px-12 py-4 sm:py-6 rounded-none glow-red h-auto text-sm sm:text-xl group w-full sm:w-auto mt-4 transition-all duration-300 active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6 mr-3 sm:mr-4 group-hover:rotate-180 transition-transform duration-700" />
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <div className="mt-8 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8" data-no-trigger="true">
          <RetroCard title="F1 Driver Benchmarks">
            <div className="space-y-0 min-h-[300px]">
              {PRO_BENCHMARKS.map((pro, idx) => (
                <div key={idx} className="flex justify-between items-center py-5 border-b border-neutral-800/40 last:border-0 hover:bg-white/[0.02] transition-colors group px-1">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 flex-shrink-0 flex items-center justify-center opacity-20">
                      <Zap className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-neutral-200 font-bold uppercase text-sm sm:text-base leading-tight truncate">
                        {pro.name}
                      </span>
                      <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-black truncate">
                        {pro.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className={cn(
                      "font-black tabular-nums font-mono text-xl sm:text-2xl tracking-tighter leading-none w-24 text-right",
                      bestTime <= pro.time ? "text-accent" : "text-neutral-600"
                    )}>
                      {pro.time.toFixed(3)}s
                    </span>
                    <div className="w-8 flex-shrink-0 flex items-center justify-center">
                      {bestTime <= pro.time && <Zap className="w-4 h-4 text-amber-500 animate-pulse" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RetroCard>
          <RetroCard title="Personal Top 5">
            <div className="space-y-0 min-h-[300px] flex flex-col">
              {topTimes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-800">
                  <p className="text-xs uppercase font-bold tracking-[0.4em] opacity-40">Awaiting Results</p>
                </div>
              ) : (
                topTimes.map((attempt, idx) => {
                  const perf = getPerformanceMessage(attempt.time);
                  return (
                    <div key={attempt.id} className="flex items-center justify-between py-5 border-b border-neutral-800/40 last:border-0 hover:bg-white/[0.02] transition-colors group px-1">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className={cn(
                          "text-xl sm:text-2xl font-black italic w-8 flex-shrink-0 text-center leading-none",
                          idx === 0 ? "text-amber-500" : "text-neutral-800"
                        )}>
                          #{idx + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className={cn("font-black text-sm sm:text-base uppercase tracking-wider leading-tight truncate", perf.color)}>
                            {perf.label}
                          </span>
                          <span className="text-[10px] text-neutral-600 uppercase font-black tracking-widest truncate">
                            {new Date(attempt.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span className={cn(
                          "font-black tabular-nums font-mono text-xl sm:text-2xl tracking-tighter leading-none w-24 text-right",
                          idx === 0 ? "text-accent" : "text-white"
                        )}>
                          {attempt.time.toFixed(3)}s
                        </span>
                        <div className="w-8 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </RetroCard>
        </div>
      </div>
      {/* Screen Effects Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.1),rgba(0,255,0,0.05),rgba(0,0,255,0.1))] bg-[length:100%_3px,2px_100%]" />
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      </div>
    </div>
  );
}