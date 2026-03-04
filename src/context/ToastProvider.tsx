import React, { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Toast } from "../types/types";
import { ToastItem } from "../components/ToastItem";
import { ToastContext } from "./ToastContext";

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    // Анти-спам: проверяем на дубликаты
    const existingToast = toasts.find(
      (t) => t.message === toast.message && t.type === toast.type,
    );

    if (existingToast) {
      // Если тост с таким же сообщением и типом уже есть, обновляем его таймер,
      // не меняя id (ключ в DOM остаётся стабильным, тост не ремоунтится)
      const refreshKey = Date.now();
      setToasts((prev) =>
        prev.map((t) =>
          t.id === existingToast.id ? { ...t, refreshKey } : t,
        ),
      );
      return;
    }

    const id = Date.now().toString();
    const refreshKey = Date.now();
    setToasts((prev) => [...prev, { ...toast, id, refreshKey }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
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