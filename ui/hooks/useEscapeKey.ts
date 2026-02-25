import { useEffect } from 'react';

/**
 * Hook to handle Escape key press.
 * @param callback - Function to call when Escape is pressed.
 * @param isActive - Whether the listener should be active (default: true).
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, isActive]);
};
