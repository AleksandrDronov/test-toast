import React from "react";
import type { Toast } from "../types/types";
import { useToastAnimation } from "../hooks/useToastAnimation";

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const { isVisible, handleMouseEnter, handleMouseLeave, handleClose } =
    useToastAnimation({
      duration: toast.duration,
      onRemove,
      toastId: toast.id,
    });

  return (
    <li
      className={`toast toast-${toast.type} ${isVisible ? "toast-enter" : "toast-exit"}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{toast.message}</span>
      <button onClick={handleClose}>×</button>
    </li>
  );
};
