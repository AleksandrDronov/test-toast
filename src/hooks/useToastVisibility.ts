import { useState, useCallback } from "react";

export const useToastVisibility = () => {
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    show,
    hide,
  };
};
