import { useState, useEffect, useRef, useCallback } from "react";
import { createRAFTimer } from "../utils/rafTimer";

const DEFAULT_DURATION = 3000;
const EXIT_ANIMATION_DURATION = 300;

interface UseToastAnimationProps {
  duration?: number;
  onRemove: (id: string) => void;
  toastId: string;
}

/**
 * Кастомный хук для управления жизненным циклом анимации уведомлений и взаимодействиями.
 *
 * Обрабатывает видимость уведомлений, авто-скрытие с паузой при наведении и ручное закрытие.
 * Предоставляет плавные анимации появления/исчезновения и корректную очистку таймеров.
 *
 * @param props - Параметры конфигурации для анимации уведомления
 * @param props.duration - Время в миллисекундах перед авто-скрытием (по умолчанию: 3000мс)
 * @param props.onRemove - Функция обратного вызова для удаления уведомления из DOM
 * @param props.toastId - Уникальный идентификатор экземпляра уведомления
 *
 * @returns Объект, содержащий состояние анимации и обработчики событий
 * @returns boolean isVisible - Видимо ли уведомление в данный момент (состояние анимации появления/исчезновения)
 * @returns function handleMouseEnter - Обработчик события наведения мыши (ставит на паузу авто-скрытие)
 * @returns function handleMouseLeave - Обработчик события ухода мыши (возобновляет авто-скрытие)
 * @returns function handleClose - Обработчик ручного закрытия уведомления
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
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  const removeTimeoutRef = useRef<number | null>(null);
  const mountTimerRef = useRef<number | null>(null);

  const wasPausedRef = useRef(false);

  /**
   * Создает таймер для удаления уведомления после завершения анимации исчезновения.
   * 
   * Использует RAF таймер для плавного удаления с задержкой EXIT_ANIMATION_DURATION,
   * что обеспечивает корректную анимацию перед полным удалением из DOM.
   */
  const removeToast = useCallback(() => {
    return createRAFTimer({
      delay: EXIT_ANIMATION_DURATION,
      callback: () => onRemove(toastId),
      ref: removeTimeoutRef,
    });
  }, [onRemove, toastId]);

  /**
   * Запускает анимацию исчезновения и планирует удаление уведомления
   */
  const startExitAnimation = useCallback(() => {
    return createRAFTimer({
      delay: 0,
      callback: () => {
        setIsVisible(false);
        removeToast();
      },
      ref: removeTimeoutRef,
    });
  }, [removeToast]);

  useEffect(() => {
    const cleanup = createRAFTimer({
      delay: 0,
      callback: () => setIsVisible(true),
      ref: mountTimerRef,
    });

    return () => {
      cleanup();
      removeToast();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isPaused && !wasPausedRef.current) {
      pausedTimeRef.current += performance.now() - startTimeRef.current;
    }

    if (!isPaused) {
      const elapsed = pausedTimeRef.current;
      const timeLeft = duration - elapsed;

      if (timeLeft <= 0) {
        cleanup = startExitAnimation();
      } else {
        startTimeRef.current = performance.now();

        cleanup = createRAFTimer({
          delay: timeLeft,
          callback: startExitAnimation,
          ref: removeTimeoutRef,
        });
      }
    }

    wasPausedRef.current = isPaused;

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [duration, isPaused, startExitAnimation]);

  /**
   * Обрабатывает событие наведения мыши - ставит на паузу таймер авто-скрытия
   */
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Обрабатывает событие ухода мыши - возобновляет таймер авто-скрытия
   */
  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);
  
  /**
   * Обрабатывает событие закрытия тоста - запускает анимацию исчезновения
   */
  const handleClose = useCallback(() => {
    startExitAnimation();
  }, [startExitAnimation]);

  return {
    isVisible,
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
  };
};
