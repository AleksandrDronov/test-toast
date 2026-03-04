export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  /**
   * Ключ, используемый для сброса таймера без ремаута компонента.
   * Меняется при повторной отправке одинакового тоста.
   */
  refreshKey?: number;
}
