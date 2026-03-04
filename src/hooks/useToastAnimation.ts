import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 3000;
const EXIT_ANIMATION_DURATION = 300;

interface UseToastAnimationProps {
  duration?: number;
  onRemove: (id: string) => void;
  toastId: string;
  /**
   * Ключ для сброса таймера без ремаута компонента.
   * При изменении этого значения таймер начинается заново.
   */
  resetKey?: number;
}

type TimeoutId = number | null;

/**
 * Упрощённый хук для управления жизненным циклом тоста
 * на основе setTimeout:
 * - авто‑закрытие через duration
 * - пауза таймера при наведении
 * - плавное скрытие через EXIT_ANIMATION_DURATION,
 *   после чего вызывается onRemove.
 */
export const useToastAnimation = ({
  duration = DEFAULT_DURATION,
  onRemove,
  toastId,
  resetKey,
}: UseToastAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const mainTimerIdRef = useRef<TimeoutId>(null);
  const exitTimerIdRef = useRef<TimeoutId>(null);
  const remainingRef = useRef<number>(duration);
  const lastStartRef = useRef<number | null>(null);

  const clearMainTimer = useCallback(() => {
    if (mainTimerIdRef.current !== null) {
      clearTimeout(mainTimerIdRef.current);
      mainTimerIdRef.current = null;
    }
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerIdRef.current !== null) {
      clearTimeout(exitTimerIdRef.current);
      exitTimerIdRef.current = null;
    }
  }, []);

  const clearAll = useCallback(() => {
    clearMainTimer();
    clearExitTimer();
  }, [clearMainTimer, clearExitTimer]);

  const finishAndRemove = useCallback(() => {
    onRemove(toastId);
  }, [onRemove, toastId]);

  const startExit = useCallback(() => {
    setIsVisible(false);
    clearExitTimer();

    exitTimerIdRef.current = window.setTimeout(
      finishAndRemove,
      EXIT_ANIMATION_DURATION,
    );
  }, [clearExitTimer, finishAndRemove]);

  const startMainTimer = useCallback(() => {
    clearMainTimer();
    if (remainingRef.current <= 0) {
      startExit();
      return;
    }

    lastStartRef.current = Date.now();
    mainTimerIdRef.current = window.setTimeout(() => {
      remainingRef.current = 0;
      startExit();
    }, remainingRef.current);
  }, [clearMainTimer, startExit]);

  useEffect(() => {
    remainingRef.current = duration;
    lastStartRef.current = null;

    const immediateId = window.setTimeout(() => {
      setIsVisible(true);
      startMainTimer();
    }, 0);

    return () => {
      clearTimeout(immediateId);
      clearAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleMouseEnter = useCallback(() => {
    if (isPaused) return;
    if (lastStartRef.current === null) return;

    const now = Date.now();
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (now - lastStartRef.current),
    );

    clearMainTimer();
    lastStartRef.current = null;
    setIsPaused(true);
  }, [clearMainTimer, isPaused]);

  const handleMouseLeave = useCallback(() => {
    if (!isPaused) return;
    setIsPaused(false);
    startMainTimer();
  }, [isPaused, startMainTimer]);

  const handleClose = useCallback(() => {
    clearAll();
    startExit();
  }, [clearAll, startExit]);

  return {
    isVisible,
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
  };
};
