import { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_DURATION = 3000;
const EXIT_ANIMATION_DURATION = 300;

type Phase = "entering" | "running" | "paused" | "exiting";

interface UseToastAnimationProps {
  duration?: number;
  onRemove: (id: string) => void;
  toastId: string;
}

export const useToastAnimation = ({
  duration = DEFAULT_DURATION,
  onRemove,
  toastId,
}: UseToastAnimationProps) => {
  const phaseRef = useRef<Phase>("entering");

  // UI state — меняется только при смене фаз
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const exitStartRef = useRef<number>(0);

  const setPhase = (next: Phase) => {
    phaseRef.current = next;

    if (next === "running") {
      setIsVisible(true);
    }

    if (next === "exiting") {
      setIsExiting(true);
    }
  };

  useEffect(() => {
    const loop = (now: number) => {
      const phase = phaseRef.current;

      // --- ENTERING ---
      if (phase === "entering") {
        setPhase("running");
      }

      // --- RUNNING ---
      if (phase === "running") {
        if (!startRef.current) {
          startRef.current = now;
        }

        const total = elapsedRef.current + (now - startRef.current);

        if (total >= duration) {
          startRef.current = 0;
          exitStartRef.current = now;
          setPhase("exiting");
        }
      }

      // --- EXITING ---
      if (phase === "exiting") {
        if (!exitStartRef.current) {
          exitStartRef.current = now;
        }

        if (now - exitStartRef.current >= EXIT_ANIMATION_DURATION) {
          onRemove(toastId);
          return; // останавливаем loop
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [duration, onRemove, toastId]);

  const handleMouseEnter = useCallback(() => {
    if (phaseRef.current !== "running") return;

    const now = performance.now();
    elapsedRef.current += now - startRef.current;
    startRef.current = 0;

    phaseRef.current = "paused";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (phaseRef.current !== "paused") return;

    phaseRef.current = "running";
  }, []);

  const handleClose = useCallback(() => {
    if (phaseRef.current === "exiting") return;

    exitStartRef.current = performance.now();
    setPhase("exiting");
  }, []);

  return {
    isVisible,
    isExiting,
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
  };
};