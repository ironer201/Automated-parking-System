// hooks/useMenu.ts
import { useState, useCallback } from 'react';

export const useMenu = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const openMenu = useCallback(() => {
    setIsMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuVisible(prev => !prev);
  }, []);

  return {
    isMenuVisible,
    openMenu,
    closeMenu,
    toggleMenu,
  };
};
