import { useState, useEffect } from 'react';

/**
 * Hook to ensure a minimum loading time
 * Prevents the loading indicator from disappearing too quickly
 * @param isLoading - Current loading state
 * @param minimumMs - Minimum time in milliseconds (default 1200ms to allow preloader animation to complete)
 * @returns Boolean indicating if loading should still be shown
 */
export function useMinimumLoadingTime(isLoading: boolean, minimumMs: number = 1200): boolean {
  const [shouldShowLoading, setShouldShowLoading] = useState(isLoading);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    // When loading starts, record the start time
    if (isLoading && startTime === null) {
      setStartTime(Date.now());
      setShouldShowLoading(true);
    }
    
    // When loading finishes
    if (!isLoading && startTime !== null) {
      const elapsed = Date.now() - startTime;
      const remaining = minimumMs - elapsed;
      
      if (remaining > 0) {
        // Wait for the remaining time before hiding the loader
        const timer = setTimeout(() => {
          setShouldShowLoading(false);
          setStartTime(null);
        }, remaining);
        
        return () => clearTimeout(timer);
      } else {
        // Minimum time has already passed
        setShouldShowLoading(false);
        setStartTime(null);
      }
    }
  }, [isLoading, startTime, minimumMs]);

  return shouldShowLoading;
}
