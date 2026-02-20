import { useRef, useCallback } from "react";

const EXIT_ANIMATION_DURATION = 300;

export const useToastTimer = (duration: number, onRemove: (id: string) => void, toastId: string) => {
  const startRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const exitStartRef = useRef<number | null>(null);
  const removedRef = useRef(false);

  const startTimer = useCallback((now: number) => {
    if (startRef.current === null) {
      startRef.current = now;
    }
  }, []);

  const pauseTimer = useCallback(() => {
    if (startRef.current !== null) {
      const now = performance.now();
      elapsedRef.current += now - startRef.current;
      startRef.current = null;
    }
  }, []);

  const getElapsedTime = useCallback((now: number) => {
    if (startRef.current === null) return elapsedRef.current;
    return elapsedRef.current + (now - startRef.current);
  }, []);

  const isTimerExpired = useCallback((now: number) => {
    return getElapsedTime(now) >= duration;
  }, [duration, getElapsedTime]);

  const startExitTimer = useCallback((now: number) => {
    exitStartRef.current = now;
  }, []);

  const isExitExpired = useCallback((now: number) => {
    return (
      exitStartRef.current !== null &&
      now - exitStartRef.current >= EXIT_ANIMATION_DURATION
    );
  }, []);

  const removeToast = useCallback(() => {
    if (!removedRef.current) {
      removedRef.current = true;
      onRemove(toastId);
    }
  }, [onRemove, toastId]);

  const isRemoved = useCallback(() => removedRef.current, []);

  return {
    startTimer,
    pauseTimer,
    isTimerExpired,
    startExitTimer,
    isExitExpired,
    removeToast,
    isRemoved,
  };
};
