import { useState, useEffect, useRef, useCallback } from "react";

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
  duration,
  onRemove,
  toastId,
}: UseToastAnimationProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const removeTimeoutRef = useRef<number | null>(null);

  /**
   * Очищает все активные таймеры для предотвращения утечек памяти
   */
  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
  }, []);

  /**
   * Запускает анимацию исчезновения и планирует удаление уведомления
   */
  const startExitAnimation = useCallback(() => {
    setIsVisible(false);
    removeTimeoutRef.current = setTimeout(
      () => onRemove(toastId),
      EXIT_ANIMATION_DURATION,
    );
  }, [onRemove, toastId]);

  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => {
      clearTimeout(mountTimer);
    };
  }, []);

  useEffect(() => {
    const toastDuration = duration ?? DEFAULT_DURATION;

    if (isPaused) {
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      clearAllTimeouts();
      return;
    }

    const elapsed = pausedTimeRef.current;
    const timeLeft = toastDuration - elapsed;

    if (timeLeft <= 0) {
      removeTimeoutRef.current = setTimeout(startExitAnimation, 0);
      return;
    }

    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(startExitAnimation, timeLeft);

    return clearAllTimeouts;
  }, [
    toastId,
    duration,
    isPaused,
    onRemove,
    clearAllTimeouts,
    startExitAnimation,
  ]);

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
   * Обрабатывает запрос ручного закрытия - запускает анимацию исчезновения немедленно
   */
  const handleClose = useCallback(() => {
    setIsVisible(false);
    removeTimeoutRef.current = setTimeout(() => onRemove(toastId), 300);
  }, [onRemove, toastId]);

  return {
    isVisible,
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
  };
};
