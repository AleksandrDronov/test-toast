import { useEffect, useCallback } from "react";
import { useToastTimer } from "./useToastTimer";
import { useToastPhase } from "./useToastPhase";
import { useToastVisibility } from "./useToastVisibility";

const DEFAULT_DURATION = 3000;

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
  const timer = useToastTimer(duration, onRemove, toastId);
  const phase = useToastPhase();
  const visibility = useToastVisibility();

  useEffect(() => {
    const loop = (now: number) => {
      const currentPhase = phase.getPhase();
      
      if (currentPhase === "paused") {
        requestAnimationFrame(loop);
        return;
      }

      switch (currentPhase) {
        case "entering":
          phase.setPhase("running");
          visibility.show();
          break;

        case "running":
          timer.startTimer(now);
          if (timer.isTimerExpired(now)) {
            phase.setPhase("exiting");
            visibility.hide();
            timer.startExitTimer(now);
          }
          break;

        case "exiting":
          if (timer.isExitExpired(now)) {
            timer.removeToast();
            return;
          }
          break;
      }

      if (!timer.isRemoved()) {
        requestAnimationFrame(loop);
      }
    };

    const rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [timer, phase, visibility]);

  const handleMouseEnter = useCallback(() => {
    if (!phase.canPause()) return;
    timer.pauseTimer();
    phase.setPhase("paused");
  }, [phase, timer]);

  const handleMouseLeave = useCallback(() => {
    if (!phase.canResume()) return;
    phase.setPhase("running");
  }, [phase]);

  const handleClose = useCallback(() => {
    if (!phase.canClose()) return;
    phase.setPhase("exiting");
    visibility.hide();
    timer.startExitTimer(performance.now());
  }, [phase, visibility, timer]);

  return {
    isVisible: visibility.isVisible,
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
  };
};
