import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  /**
   * Callback function to execute on each refresh
   */
  onRefresh: () => void | Promise<void>;

  /**
   * Interval in milliseconds (default: 30000 = 30 seconds)
   */
  interval?: number;

  /**
   * Whether auto-refresh is enabled (default: true)
   */
  enabled?: boolean;

  /**
   * Refresh when the window/tab becomes visible again (default: true)
   */
  refreshOnFocus?: boolean;
}

/**
 * Hook to automatically refresh data at regular intervals and when tab becomes visible
 *
 * @example
 * useAutoRefresh({
 *   onRefresh: loadTeamData,
 *   interval: 30000, // 30 seconds
 *   enabled: true
 * });
 */
export function useAutoRefresh({
  onRefresh,
  interval = 30000,
  enabled = true,
  refreshOnFocus = true
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up interval for regular refreshes
    intervalRef.current = setInterval(() => {
      onRefresh();
    }, interval);

    // Handle visibility change (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (refreshOnFocus && document.visibilityState === 'visible') {
        onRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onRefresh, interval, enabled, refreshOnFocus]);
}
