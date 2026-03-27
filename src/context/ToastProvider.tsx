import React, { useCallback, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Toast } from "../types/types";
import { ToastItem } from "../components/ToastItem";
import { ToastContext } from "./ToastContext";

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((prev) => {
      // Анти-спам: проверяем на дубликаты
      const existingToast = prev.find(
        (t) => t.message === toast.message && t.type === toast.type,
      );

      if (existingToast) {
        // Если тост с таким же сообщением и типом уже есть, обновляем его таймер,
        // не меняя id (ключ в DOM остаётся стабильным, тост не ремоунтится)
        const refreshKey = Date.now();
        return prev.map((t) =>
          t.id === existingToast.id ? { ...t, refreshKey } : t,
        );
      }

      const now = Date.now();
      const id = now.toString();
      const refreshKey = now;
      return [...prev, { ...toast, id, refreshKey }];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(
    () => ({ addToast, removeToast }),
    [addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
        {createPortal(
          <ul className="toast-list">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
          </ul>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};