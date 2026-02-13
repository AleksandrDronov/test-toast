import React, { useState, type ReactNode } from "react";
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
      // Если тост с таким же сообщением и типом уже есть, обновляем его таймер
      // Создаем новый id, чтобы сбросить таймер в ToastItem
      const newId = Date.now().toString();
      setToasts((prev) =>
        prev.map((t) => (t.id === existingToast.id ? { ...t, id: newId } : t)),
      );
      return;
    }

    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ul className="toast-list">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </ul>
    </ToastContext.Provider>
  );
};