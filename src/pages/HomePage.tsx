import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Trophy, RotateCcw, Zap, AlertTriangle, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Semaphore } from '@/components/Semaphore';
import { RetroCard } from '@/components/RetroCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [history, setHistory] = useState<Attempt[]>([]);
  // High precision timing refs
  const lightsOutTimeRef = useRef<number>(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const randomHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bestTime = history.length > 0 
    ? Math.min(...history.filter(a => a.time > 0).map(a => a.time)) 
    : Infinity;
  const resetTimers = () => {
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    if (randomHoldTimerRef.current) clearTimeout(randomHoldTimerRef.current);
  };
  const startSequence = useCallback(() => {
    resetTimers();
    setGameState('COUNTDOWN');
    setActiveLights(0);
    setLastReaction(null);
    // Light up pairs one by one (1s intervals)
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => {
        setGameState(prev => {
          if (prev === 'COUNTDOWN') {
            setActiveLights(i);
            return 'COUNTDOWN';
          }
          return prev;
        });
      }, i * 1000);
    }
    // After all 5 lights are on, wait random time between 0.2s and 3.0s
    setTimeout(() => {
      setGameState(prev => {
        if (prev === 'COUNTDOWN') {
          const randomHold = Math.random() * 2800 + 200;
          randomHoldTimerRef.current = setTimeout(() => {
            lightsOutTimeRef.current = performance.now();
            setGameState('WAITING');
            setActiveLights(0);
          }, randomHold);
          return 'COUNTDOWN';
        }
        return prev;
      });
    }, 5000);
  }, []);
  const handleTrigger = useCallback(() => {
    const now = performance.now();
    if (gameState === 'IDLE' || gameState === 'RESULT' || gameState === 'JUMP_START') {
      startSequence();
    } else if (gameState === 'COUNTDOWN') {
      // Jump start!
      resetTimers();
      setGameState('JUMP_START');
      setLastReaction(0);
      setHistory(prev => [{ id: crypto.randomUUID(), time: 0, timestamp: Date.now() }, ...prev].slice(0, 10));
    } else if (gameState === 'WAITING') {
      const reaction = (now - lightsOutTimeRef.current) / 1000;
      setLastReaction(reaction);
      setGameState('RESULT');
      setHistory(prev => [{ id: crypto.randomUUID(), time: reaction, timestamp: Date.now() }, ...prev].slice(0, 10));
    }
  }, [gameState, startSequence]);
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
  return (
    <div 
      className="min-h-screen bg-neutral-950 flex flex-col items-center scanline touch-none overflow-hidden"
      onPointerDown={(e) => {
        // Prevent trigger on scrollbars or UI elements if needed, but here we want full screen
        if ((e.target as HTMLElement).closest('button')) return;
        handleTrigger();
      }}
    >
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col flex-1 py-8 md:py-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 glow-red">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white italic">F1 REFLEX <span className="text-red-600">RETRO</span></h1>
              <p className="text-[10px] text-neutral-500 font-mono tracking-[0.2em] uppercase">Telemetry System v1.0.4</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-neutral-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              STATION_READY
            </div>
            <div className="text-neutral-700">|</div>
            <div className="text-neutral-400">LATENCY: 1.2ms</div>
          </div>
        </header>
        {/* Center Stage: Semaphore */}
        <main className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="w-full max-w-2xl transform scale-90 sm:scale-100">
            <Semaphore lightsActive={activeLights} />
          </div>
          <div className="text-center h-24 sm:h-32 flex flex-col items-center justify-center">
            {gameState === 'IDLE' && (
              <div className="animate-pulse space-y-2">
                <p className="text-neutral-400 font-bold tracking-widest uppercase">Tap Screen or Press Space</p>
                <p className="text-xs text-neutral-600 uppercase">to start ignition sequence</p>
              </div>
            )}
            {gameState === 'COUNTDOWN' && (
              <p className="text-red-600 font-black text-xl sm:text-2xl tracking-[0.3em] uppercase glow-red/50">Prepare for Start</p>
            )}
            {gameState === 'WAITING' && (
              <p className="text-neutral-200 font-black text-2xl sm:text-3xl tracking-[0.1em] uppercase">WAIT FOR LIGHTS OUT...</p>
            )}
            {(gameState === 'RESULT' || gameState === 'JUMP_START') && (
              <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                <p className={cn("text-3xl sm:text-5xl font-black tabular-nums", 
                  gameState === 'JUMP_START' ? 'text-red-500' : 'text-emerald-400'
                )}>
                  {gameState === 'JUMP_START' ? 'JUMP START' : `${lastReaction?.toFixed(3)}s`}
                </p>
                <p className={cn("text-xs font-bold uppercase tracking-widest", getPerformanceMessage(lastReaction ?? 0).color)}>
                  {getPerformanceMessage(lastReaction ?? 0).label}
                </p>
              </div>
            )}
          </div>
        </main>
        {/* Footer: Dashboard */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <RetroCard title="Sessional Stats" className="md:col-span-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-xs uppercase">Personal Best</span>
                <span className="text-emerald-400 font-mono text-lg font-bold">
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
                className="w-full border-neutral-800 text-neutral-400 hover:text-white"
                onClick={() => setHistory([])}
              >
                <RotateCcw className="w-3 h-3 mr-2" /> Reset Data
              </Button>
            </div>
          </RetroCard>
          <RetroCard title="Live Feed" className="md:col-span-2">
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-neutral-700 text-xs uppercase italic py-4">
                    Waiting for telemetry data...
                  </div>
                ) : (
                  history.map((attempt, idx) => (
                    <div key={attempt.id} className="flex items-center justify-between text-xs font-mono border-b border-neutral-800/50 pb-1 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-600">#{history.length - idx}</span>
                        {attempt.time === 0 ? (
                          <span className="text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> DISQUALIFIED (FALSE START)
                          </span>
                        ) : (
                          <span className="text-neutral-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-emerald-500" /> REACTION: {attempt.time.toFixed(3)}s
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-600">
                        {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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