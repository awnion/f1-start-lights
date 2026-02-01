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
  const [isPersisting, setIsPersisting] = useState(false);
  // Initialize history from localStorage with safety checks
  const [history, setHistory] = useState<Attempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
      }
    } catch (e) {
      console.error("Failed to load telemetry history:", e);
    }
    return [];
  });
  // Persist history whenever it changes
  useEffect(() => {
    try {
      setIsPersisting(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      const timeout = setTimeout(() => setIsPersisting(false), 500);
      return () => clearTimeout(timeout);
    } catch (e) {
      console.error("Failed to save telemetry history:", e);
      setIsPersisting(false);
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
          const randomHold = Math.random() * 2800 + 400; // Increased min hold slightly for tension
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
      setHistory(prev => [{ id: crypto.randomUUID(), time: 0, timestamp: Date.now() }, ...prev].slice(0, 10));
    } else if (gameState === 'WAITING') {
      const reaction = (now - lightsOutTimeRef.current) / 1000;
      setLastReaction(reaction);
      setGameState('RESULT');
      if (reaction <= bestTime) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff0033', '#39ff14', '#ffffff', '#ffd700']
        });
      }
      setHistory(prev => [{ id: crypto.randomUUID(), time: reaction, timestamp: Date.now() }, ...prev].slice(0, 10));
    }
  }, [gameState, startSequence, clearAllTimers, bestTime]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
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
  const clearData = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    setLastReaction(null);
  };
  return (
    <div
      className="min-h-screen bg-neutral-950 flex flex-col items-center scanline touch-none overflow-hidden"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        handleTrigger();
      }}
    >
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col flex-1 py-8 md:py-12">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 glow-red">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white italic">F1 REFLEX <span className="text-red-600">RETRO</span></h1>
              <p className="text-[10px] text-neutral-500 font-mono tracking-[0.2em] uppercase">Telemetry System v1.1.0_PRO</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-neutral-500">
              <div className={cn("w-2 h-2 rounded-full", isPersisting ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
              {isPersisting ? 'SYNCING_DATA' : 'STATION_READY'}
            </div>
            <div className="text-neutral-700">|</div>
            <div className="text-neutral-400 uppercase">Buffer: {history.length}/10</div>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="w-full max-w-2xl transform scale-90 sm:scale-100">
            <Semaphore lightsActive={activeLights} />
          </div>
          <div className="text-center h-32 sm:h-40 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {gameState === 'IDLE' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="animate-pulse space-y-2"
                >
                  <p className="text-neutral-400 font-bold tracking-widest uppercase">Tap Screen or Press Space</p>
                  <p className="text-xs text-neutral-600 uppercase">to start ignition sequence</p>
                </motion.div>
              )}
              {gameState === 'COUNTDOWN' && (
                <motion.p
                  key="countdown"
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-red-600 font-black text-xl sm:text-2xl tracking-[0.3em] uppercase glow-red/50"
                >
                  Prepare for Start
                </motion.p>
              )}
              {gameState === 'WAITING' && (
                <motion.p
                  key="waiting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-neutral-200 font-black text-2xl sm:text-4xl tracking-[0.1em] uppercase"
                >
                  WAIT FOR LIGHTS OUT...
                </motion.p>
              )}
              {(gameState === 'RESULT' || gameState === 'JUMP_START') && (
                <motion.div
                  key="result"
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="space-y-1"
                >
                  <div className="relative inline-block">
                    <p className={cn(
                      "text-5xl sm:text-7xl font-black tabular-nums tracking-tighter",
                      gameState === 'JUMP_START' ? 'text-red-500' : 'text-emerald-400',
                      isNewBest && history.length > 1 && "animate-glitch"
                    )}>
                      {gameState === 'JUMP_START' ? 'JUMP START' : `${lastReaction?.toFixed(3)}s`}
                    </p>
                    {isNewBest && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-6 -right-12 bg-amber-500 text-black text-[10px] px-2 py-0.5 font-black uppercase rotate-12 shadow-glow z-20"
                      >
                        NEW BEST
                      </motion.div>
                    )}
                  </div>
                  <p className={cn("text-sm font-bold uppercase tracking-widest mt-2", getPerformanceMessage(lastReaction ?? 0).color)}>
                    {getPerformanceMessage(lastReaction ?? 0).label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <RetroCard title="Sessional Stats" isSyncing={isPersisting} className="md:col-span-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-neutral-500 text-xs uppercase flex items-center gap-1">
                  <Star className="w-3 h-3" /> Personal Best
                </span>
                <span className={cn(
                  "font-mono text-lg font-bold transition-all duration-500",
                  bestTime === Infinity ? "text-neutral-700" : "text-emerald-400 glow-green"
                )}>
                  {bestTime === Infinity ? '--.---' : `${bestTime.toFixed(3)}s`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-xs uppercase">Avg. Reaction</span>
                <span className="text-white font-mono">
                  {history.length > 0
                    ? (history.filter(a => a.time > 0).reduce((acc, curr) => acc + curr.time, 0) / Math.max(1, history.filter(a => a.time > 0).length)).toFixed(3)
                    : '0.000'}s
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-neutral-800 text-neutral-500 hover:text-red-500 hover:border-red-900 transition-colors uppercase text-[10px] tracking-widest"
                onClick={clearData}
              >
                <RotateCcw className="w-3 h-3 mr-2" /> Purge Local Telemetry
              </Button>
            </div>
          </RetroCard>
          <RetroCard title="Live Feed" isSyncing={isPersisting} className="md:col-span-2">
            <ScrollArea className="h-32 pr-4">
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-700 text-xs uppercase italic py-8 gap-2">
                    <Cpu className="w-4 h-4 opacity-20" />
                    Waiting for telemetry data...
                  </div>
                ) : (
                  history.map((attempt, idx) => (
                    <motion.div
                      key={attempt.id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center justify-between text-xs font-mono border-b border-neutral-800/50 pb-1.5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-600 w-6">#{history.length - idx}</span>
                        {attempt.time === 0 ? (
                          <span className="text-red-500 flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3 h-3" /> FALSE_START
                          </span>
                        ) : (
                          <span className={cn("flex items-center gap-1", attempt.time <= bestTime && history.length > 1 ? "text-emerald-400 font-bold" : "text-neutral-300")}>
                            <Zap className={cn("w-3 h-3", attempt.time <= bestTime && history.length > 1 ? "text-amber-500" : "text-emerald-500")} />
                            {attempt.time.toFixed(3)}s {attempt.time <= bestTime && history.length > 1 && "[PB]"}
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-600 text-[10px]">
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