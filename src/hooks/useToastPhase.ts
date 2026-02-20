import { useRef, useCallback } from "react";

type Phase = "entering" | "running" | "paused" | "exiting";

export const useToastPhase = () => {
  const phaseRef = useRef<Phase>("entering");

  const getPhase = useCallback(() => phaseRef.current, []);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
  }, []);

  const canPause = useCallback(() => {
    return phaseRef.current === "running";
  }, []);

  const canResume = useCallback(() => {
    return phaseRef.current === "paused";
  }, []);

  const canClose = useCallback(() => {
    return phaseRef.current !== "exiting";
  }, []);

  return {
    getPhase,
    setPhase,
    canPause,
    canResume,
    canClose,
  };
};
