'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'checkin:sound-enabled';

/**
 * P3.3: Hook to manage user sound preference
 * Stores preference in localStorage for persistence across sessions
 */
export function useSoundPreference() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false); // Track hydration to avoid SSR mismatch

  useEffect(() => {
    // Load preference from localStorage after hydration
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setSoundEnabled(stored === 'true');
    }
    setIsHydrated(true);
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return {
    soundEnabled,
    toggleSound,
    isHydrated, // Signal when localStorage is ready
  };
}
