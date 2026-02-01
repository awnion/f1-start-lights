import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Timer, Trophy, RotateCcw, Zap, Cpu, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { Semaphore } from '@/components/Semaphore';
import { RetroCard } from '@/components/RetroCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
const STORAGE_KEY = 'f1_start_lights_v1';
const INPUT_DEBOUNCE_MS = 150;
const RESULT_COOLDOWN_MS = 600;
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
  const startSequence = useCallback(() => {
    clearAllTimers();
    processingRef.current = false;
    lightsOutTimeRef.current = 0;
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
    setGameState('IDLE');
    setActiveLights(0);
    setLastReaction(null);
    setIsNewRecord(false);
  }, [clearAllTimers]);
  const handleTrigger = useCallback(() => {
    const now = performance.now();
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
      const currentPB = bestTime;
      const isPB = reaction > 0 && reaction < currentPB;
      const isElite = reaction > 0 && reaction < 0.200;
      setLastReaction(reaction);
      setIsNewRecord(isPB && history.length > 0);
      setGameState('RESULT');
      if (isPB || isElite) {
        confetti({
          particleCount: reaction < 0.180 ? 300 : 150,
          spread: reaction < 0.180 ? 100 : 70,
          origin: { y: 0.6 },
          colors: ['#ff0033', '#39ff14', '#ffffff', '#fbbf24']
        });
      }
      setHistory(prev => [{ id: crypto.randomUUID(), time: reaction, timestamp: Date.now() }, ...prev].slice(0, 50));
      return;
    }
  }, [gameState, startSequence, clearAllTimers, history, bestTime]);
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
  const clearData = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("ARE YOU SURE? This will permanently wipe all session records.")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      resetToIdle();
    }
  };
  const validAverage = useMemo(() => {
    const valid = history.filter(a => a.time > 0);
    return valid.length === 0 ? 0 : valid.reduce((acc, curr) => acc + curr.time, 0) / valid.length;
  }, [history]);
  return (
    <div
      className="min-h-screen bg-neutral-950 flex flex-col items-center touch-none select-none relative"
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
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">System Status</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-[10px] text-neutral-400 font-mono">READY_FOR_START</span>
            </div>
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
                      "text-4xl sm:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter leading-none px-2 uppercase",
                      gameState === 'JUMP_START' ? 'text-red-500 animate-glitch whitespace-nowrap' : 'text-accent',
                      isNewRecord && "animate-glitch text-amber-400"
                    )}>
                      {gameState === 'JUMP_START'
                        ? 'JUMP START'
                        : `${lastReaction?.toFixed(3)}s`
                      }
                    </p>
                    {isNewRecord && (
                      <div className="absolute -top-3 -right-2 sm:-top-5 sm:-right-6 bg-amber-500 text-black text-[7px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-black uppercase shadow-glow z-20 border-2 border-black transform rotate-12 whitespace-nowrap animate-bounce">
                        NEW BEST
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-3 sm:gap-5 w-full px-4" data-no-trigger="true">
                    {gameState !== 'JUMP_START' && (
                      <p className={cn("text-[10px] sm:text-lg font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-center", getPerformanceMessage(lastReaction ?? 0).color)}>
                        {getPerformanceMessage(lastReaction ?? 0).label}
                      </p>
                    )}
                    <Button
                      onClick={resetToIdle}
                      className="bg-primary hover:bg-red-600 text-white font-black uppercase tracking-[0.3em] px-6 sm:px-10 py-3 sm:py-4 rounded-none glow-red h-auto text-xs sm:text-lg group w-full sm:w-auto mt-2"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 group-hover:rotate-180 transition-transform duration-500" />
                      Restart
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6" data-no-trigger="true">
          <RetroCard title="F1 Benchmarks">
            <div className="space-y-2">
              {PRO_BENCHMARKS.map((pro, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-800/30 last:border-0">
                  <div className="flex flex-col">
                    <span className="text-neutral-200 font-bold uppercase text-sm">{pro.name}</span>
                    <span className="text-[10px] text-neutral-600 uppercase tracking-tighter">{pro.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-black tabular-nums font-mono text-sm",
                      bestTime <= pro.time ? "text-accent" : "text-neutral-600"
                    )}>
                      {pro.time.toFixed(3)}s
                    </span>
                    {bestTime <= pro.time && <Zap className="w-3 h-3 text-amber-500" />}
                  </div>
                </div>
              ))}
            </div>
          </RetroCard>
          <RetroCard title="Session Statistics">
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-neutral-950/80 p-5 border border-neutral-800/50 relative overflow-hidden">
                <span className="text-neutral-500 text-xs uppercase flex items-center gap-2 relative z-10">
                  <Star className="w-3 h-3 text-amber-500" /> PB
                </span>
                <span className={cn(
                  "font-mono text-xl font-black tracking-tight relative z-10",
                  bestTime === Infinity ? "text-neutral-800" : (bestTime <= 0.220 ? "text-accent" : "text-white")
                )}>
                  {bestTime === Infinity ? '--.---' : `${bestTime.toFixed(3)}s`}
                </span>
              </div>
              <div className="flex justify-between items-center px-4">
                <span className="text-neutral-500 text-xs uppercase flex items-center gap-2">
                  <Timer className="w-3 h-3 text-blue-500" /> Avg
                </span>
                <span className="text-white font-mono font-bold text-sm">
                  {validAverage > 0 ? validAverage.toFixed(3) : '0.000'}s
                </span>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-neutral-800 bg-neutral-900/50 text-neutral-600 hover:text-red-500 hover:border-red-900/50 transition-all uppercase text-[10px] tracking-[0.2em] h-10 rounded-none font-bold"
                  onClick={clearData}
                >
                  Clear Session
                </Button>
              </div>
            </div>
          </RetroCard>
          <RetroCard title="Race History">
            <ScrollArea className="h-48 pr-4">
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-neutral-800 text-xs uppercase font-bold tracking-[0.3em]">
                    Standby
                  </div>
                ) : (
                  history.map((attempt, idx) => (
                    <div key={attempt.id} className="flex items-center justify-between font-mono border-b border-neutral-800/20 pb-3 last:border-0">
                      <div className="flex items-center gap-4">
                        <span className="text-neutral-700 w-6 text-sm">#{history.length - idx}</span>
                        {attempt.time <= 0 ? (
                          <span className="text-red-500 font-black italic uppercase text-sm">Jump</span>
                        ) : (
                          <span className={cn("font-bold text-sm", attempt.time <= bestTime && history.length > 1 ? "text-accent" : "text-neutral-400")}>
                            {attempt.time.toFixed(3)}s
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-800 text-xs">
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
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.2),rgba(0,255,0,0.1),rgba(0,0,255,0.2))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute inset-0 opacity-[0.01] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      </div>
    </div>
  );
}