import { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_DURATION = 3000;
const EXIT_ANIMATION_DURATION = 300;

type Phase = "entering" | "running" | "paused" | "exiting";

interface UseToastAnimationProps {
  duration?: number;
  onRemove: (id: string) => void;
  toastId: string;
}

/**
 * Кастомный хук для управления жизненным циклом анимации и таймингом тоста.
 *
 * Этот хук обрабатывает полную машину состояний анимации для toast-уведомлений,
 * включая фазы: появление, выполнение, пауза (при наведении) и выход. Использует
 * requestAnimationFrame для плавных анимаций и точного контроля тайминга.
 *
 * @param props - Свойства конфигурации хука
 * @param props.duration - Длительность в миллисекундах, которую тост должен оставаться видимым перед авто-закрытием. По умолчанию 3000мс.
 * @param props.onRemove - Функция обратного вызова, вызываемая когда тост должен быть удалён из DOM
 * @param props.toastId - Уникальный идентификатор экземпляра тоста
 *
 * @returns Объект, содержащий состояние анимации и обработчики событий
 * @returns returns.isVisible - Булево значение, указывающее должен ли тост быть видимым
 * @returns returns.handleMouseEnter - Обработчик события наведения мыши, который приостанавливает таймер тоста
 * @returns returns.handleMouseLeave - Обработчик события ухода мыши, который возобновляет таймер тоста
 * @returns returns.handleClose - Обработчик клика для ручного закрытия тоста, который запускает анимацию выхода
 *
 * @example
 * ```tsx
 * const { isVisible, handleMouseEnter, handleMouseLeave, handleClose } = useToastAnimation({
 *   duration: 5000,
 *   onRemove: (id) => removeToast(id),
 *   toastId: 'toast-123'
 * });
 * ```
 */
export const useToastAnimation = ({
  duration = DEFAULT_DURATION,
  onRemove,
  toastId,
}: UseToastAnimationProps) => {
  const phaseRef = useRef<Phase>("entering");

  // UI state — меняется только при смене фаз
  const [isVisible, setIsVisible] = useState(false);

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
      setIsVisible(false);
    }
  };

  useEffect(() => {
    const loop = (now: number) => {
      const phase = phaseRef.current;
      let shouldContinue = true;

      // --- ENTERING ---
      if (phase === "entering") {
        setPhase("running");
      }

      // --- RUNNING ---
      if (phase === "running") {
        if (startRef.current === 0) {
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
        if (exitStartRef.current === 0) {
          exitStartRef.current = now;
        }

        if (now - exitStartRef.current >= EXIT_ANIMATION_DURATION) {
          shouldContinue = false;
          onRemove(toastId);
        }
      }

      if (shouldContinue) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
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
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
  };
};
