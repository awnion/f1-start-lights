import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RotateCcw, Zap, Cpu, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { Semaphore } from '@/components/Semaphore';
import { RetroCard } from '@/components/RetroCard';
import { Button } from '@/components/ui/button';
const STORAGE_KEY = 'f1_start_lights_v1';
const INPUT_DEBOUNCE_MS = 100;
const RESULT_COOLDOWN_MS = 500;
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
  useEffect(() => {
    document.title = "F1 START LIGHTS";
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
    for (let i = 1; i <= 5; i++) {
      const timer = window.setTimeout(() => {
        setActiveLights(i);
      }, i * 1000);
      activeTimersRef.current.push(timer);
    }
    const holdTriggerTimer = window.setTimeout(() => {
      const randomHold = Math.random() * 2800 + 200;
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
    expectedLightsOutRef.current = 0;
    setGameState('IDLE');
    setActiveLights(0);
    setLastReaction(null);
    setIsNewRecord(false);
  }, [clearAllTimers]);
  const handleTrigger = useCallback(() => {
    const now = performance.now();
    // Immediate lock check and update to prevent re-entrant calls
    if (now - lastActionTimeRef.current < INPUT_DEBOUNCE_MS) return;
    if (processingRef.current) return;
    if (gameState === 'IDLE') {
      lastActionTimeRef.current = now;
      startSequence();
      return;
    }
    if (gameState === 'RESULT' || gameState === 'JUMP_START') {
      if (now - lastActionTimeRef.current < RESULT_COOLDOWN_MS) return;
      lastActionTimeRef.current = now;
      startSequence();
      return;
    }
    if (gameState === 'COUNTDOWN') {
      lastActionTimeRef.current = now;
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
      lastActionTimeRef.current = now;
      processingRef.current = true;
      const reaction = (now - lightsOutTimeRef.current) / 1000;
      // Achievement logic: first valid run OR beating current best
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
      className="min-h-screen bg-neutral-950 flex flex-col items-center touch-none select-none relative overflow-x-hidden"
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
          <div className="text-center h-48 sm:h-64 flex flex-col items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {gameState === 'IDLE' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="text-neutral-400 font-bold tracking-[0.5em] uppercase text-xs sm:text-lg animate-pulse">
                    Tap or Press Space to Start
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
                      "text-4xl sm:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter leading-none px-4 uppercase",
                      gameState === 'JUMP_START' ? 'text-red-500 animate-glitch whitespace-nowrap' : 'text-accent glow-green',
                      isNewRecord && "animate-glitch text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                    )}>
                      {gameState === 'JUMP_START'
                        ? 'JUMP START'
                        : `${lastReaction?.toFixed(3)}s`
                      }
                    </p>
                    {isNewRecord && (
                      <div className="absolute -top-3 -right-2 sm:-top-5 sm:-right-8 bg-amber-500 text-black text-[8px] sm:text-[10px] px-2 sm:px-3 py-1 sm:py-1.5 font-black uppercase shadow-glow z-20 border-2 border-black transform rotate-12 whitespace-nowrap animate-bounce">
                        NEW BEST
                      </div>
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
            <div className="space-y-4">
              {PRO_BENCHMARKS.map((pro, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-neutral-800/40 last:border-0 group">
                  <div className="flex flex-col">
                    <span className="text-neutral-200 font-bold uppercase text-base group-hover:text-primary transition-colors">{pro.name}</span>
                    <span className="text-[10px] text-neutral-600 uppercase tracking-widest">{pro.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-black tabular-nums font-mono text-lg",
                      bestTime <= pro.time ? "text-accent" : "text-neutral-600"
                    )}>
                      {pro.time.toFixed(3)}s
                    </span>
                    {bestTime <= pro.time && <Zap className="w-4 h-4 text-amber-500 animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>
          </RetroCard>
          <RetroCard title="Personal Top 5">
            <div className="space-y-4">
              {topTimes.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-neutral-800 gap-4">
                  <Trophy className="w-12 h-12 opacity-20" />
                  <p className="text-xs uppercase font-bold tracking-[0.4em] opacity-40">Awaiting your first run</p>
                </div>
              ) : (
                topTimes.map((attempt, idx) => {
                  const perf = getPerformanceMessage(attempt.time);
                  return (
                    <div key={attempt.id} className="flex items-center justify-between font-mono border-b border-neutral-800/40 pb-5 last:border-0 group">
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-2xl font-black italic w-10 text-center",
                          idx === 0 ? "text-amber-500" : "text-neutral-800 group-hover:text-neutral-600 transition-colors"
                        )}>
                          #{idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className={cn("font-black text-sm uppercase tracking-widest", perf.color)}>
                            {perf.label}
                          </span>
                          <span className="text-[10px] text-neutral-600 uppercase font-bold">
                            {new Date(attempt.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "font-black tabular-nums text-2xl tracking-tighter",
                          idx === 0 ? "text-accent" : "text-white"
                        )}>
                          {attempt.time.toFixed(3)}s
                        </span>
                        {idx === 0 && <Star className="w-6 h-6 text-amber-500 fill-amber-500 shadow-glow" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </RetroCard>
        </div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.1),rgba(0,255,0,0.05),rgba(0,0,255,0.1))] bg-[length:100%_3px,2px_100%]" />
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      </div>
    </div>
  );
}