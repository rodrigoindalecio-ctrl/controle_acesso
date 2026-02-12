'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSoundPreference } from './useSoundPreference';

interface AudioInstances {
  success: HTMLAudioElement | null;
  error: HTMLAudioElement | null;
}

/**
 * P3.2: Hook for check-in sound feedback
 * Preloads audio files and provides methods to play success/error sounds
 * Volume: 0.4 (professional, non-intrusive)
 * No external dependencies - uses native Web Audio API
 * P3.3: Respects user sound preference from localStorage
 */
export function useCheckInSounds() {
  const audioRef = useRef<AudioInstances>({ success: null, error: null });
  const isPlayingRef = useRef<boolean>(false);
  const { soundEnabled } = useSoundPreference();

  // Initialize audio elements on mount
  useEffect(() => {
    const loadAudio = (src: string): HTMLAudioElement | null => {
      try {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.4; // Professional, non-intrusive volume
        return audio;
      } catch (error) {
        console.warn(`Failed to load audio from ${src}:`, error);
        return null;
      }
    };

    // Preload both sounds
    audioRef.current.success = loadAudio('/sounds/checkin-success.mp3');
    audioRef.current.error = loadAudio('/sounds/checkin-error.mp3');

    return () => {
      // Cleanup: stop and reset audio elements
      if (audioRef.current.success) {
        audioRef.current.success.pause();
        audioRef.current.success.currentTime = 0;
      }
      if (audioRef.current.error) {
        audioRef.current.error.pause();
        audioRef.current.error.currentTime = 0;
      }
    };
  }, []);

  /**
   * Play success sound when check-in is confirmed
   * Respects user sound preference (P3.3)
   * Prevents multiple simultaneous plays
   */
  const playSuccess = useCallback(() => {
    if (!soundEnabled || isPlayingRef.current || !audioRef.current.success) return;

    try {
      isPlayingRef.current = true;
      audioRef.current.success.currentTime = 0;
      const playPromise = audioRef.current.success.play();

      // Handle async play() behavior
      if (playPromise !== undefined) {
        playPromise
          .catch((error) => {
            // Autoplay might be prevented by browser
            console.warn('Audio playback prevented:', error);
          })
          .finally(() => {
            isPlayingRef.current = false;
          });
      } else {
        isPlayingRef.current = false;
      }
    } catch (error) {
      console.warn('Failed to play success sound:', error);
      isPlayingRef.current = false;
    }
  }, [soundEnabled]);

  /**
   * Play error sound when check-in fails
   * Respects user sound preference (P3.3)
   * Prevents multiple simultaneous plays
   */
  const playError = useCallback(() => {
    if (!soundEnabled || isPlayingRef.current || !audioRef.current.error) return;

    try {
      isPlayingRef.current = true;
      audioRef.current.error.currentTime = 0;
      const playPromise = audioRef.current.error.play();

      // Handle async play() behavior
      if (playPromise !== undefined) {
        playPromise
          .catch((error) => {
            // Autoplay might be prevented by browser
            console.warn('Audio playback prevented:', error);
          })
          .finally(() => {
            isPlayingRef.current = false;
          });
      } else {
        isPlayingRef.current = false;
      }
    } catch (error) {
      console.warn('Failed to play error sound:', error);
      isPlayingRef.current = false;
    }
  }, [soundEnabled]);

  return {
    playSuccess,
    playError,
  };
}
