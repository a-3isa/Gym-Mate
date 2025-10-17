import { useCallback, useEffect, useRef, useState } from 'react';

export default function useTimer(
  initialDuration: number,
  onComplete?: () => void,
  onTick?: (remaining: number) => void,
) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialDuration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current as any);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setRemainingSeconds((prev) => {
      const next = Math.max(0, prev - 1);
      if (onTick) onTick(next);
      if (next === 0) {
        clear();
        setIsActive(false);
        setIsPaused(false);
        if (onComplete) onComplete();
      }
      return next;
    });
  }, [clear, onComplete, onTick]);

  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    clear();
    intervalRef.current = setInterval(tick, 1000) as unknown as NodeJS.Timer;
  }, [tick, clear]);

  const stop = useCallback(() => {
    clear();
    setIsActive(false);
    setIsPaused(false);
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setRemainingSeconds(initialDuration);
    setIsActive(false);
    setIsPaused(false);
  }, [clear, initialDuration]);

  const pause = useCallback(() => {
    if (!isActive) return;
    clear();
    setIsPaused(true);
  }, [isActive, clear]);

  const resume = useCallback(() => {
    if (!isActive || !isPaused) return;
    intervalRef.current = setInterval(tick, 1000) as unknown as NodeJS.Timer;
    setIsPaused(false);
  }, [isActive, isPaused, tick]);

  const sync = useCallback((newRemainingSeconds: number) => {
    setRemainingSeconds(Math.max(0, Math.floor(newRemainingSeconds)));
  }, []);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(remainingSeconds % 60)
    .toString()
    .padStart(2, '0');
  const formatted = `${minutes}:${seconds}`;

  return {
    remainingSeconds,
    isActive,
    isPaused,
    start,
    stop,
    reset,
    pause,
    resume,
    sync,
    formatted,
  };
}
