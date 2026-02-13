import { type RefObject } from "react";

interface CreateRAFTimerParams {
  delay: number;
  callback: () => void;
  ref: RefObject<number | null>;
}

/**
 * Создает таймер на основе requestAnimationFrame для точной синхронизации с анимациями браузера.
 *
 * Использует requestAnimationFrame для выполнения callback после указанной задержки,
 * что обеспечивает более плавные анимации по сравнению с setTimeout.
 *
 * @param params - Объект с параметрами таймера
 * @param params.delay - Задержка в миллисекундах перед выполнением callback
 * @param params.callback - Функция обратного вызова, которая будет выполнена после задержки
 * @param params.ref - RefObject для хранения ID анимации, необходим для корректной очистки
 *
 * @example
 * ```tsx
 * const timerRef = useRef<number | null>(null);
 *
 * createRAFTimer({
 *   delay: 1000,
 *   callback: () => {
 *     console.log('Выполнено через 1 секунду');
 *   },
 *   ref: timerRef
 * });
 *
 * // Очистка
 * if (timerRef.current) {
 *   cancelAnimationFrame(timerRef.current);
 * }
 * ```
 */
export const createRAFTimer = ({
  delay,
  callback,
  ref,
}: CreateRAFTimerParams) => {
  if (ref.current) {
    cancelAnimationFrame(ref.current);
    ref.current = null;
  }

  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;

    if (elapsed >= delay) {
      callback();
      return;
    }

    ref.current = requestAnimationFrame(animate);
  };

  ref.current = requestAnimationFrame(animate);

  return () => {
    if (ref.current) {
      cancelAnimationFrame(ref.current);
      ref.current = null;
    }
  };
};
