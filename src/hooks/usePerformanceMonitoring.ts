import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceLogger, PerformanceSnapshot } from '../utils/performanceLogger';

export function usePerformanceMonitoring(componentName: string, meta?: Record<string, any>) {
  const renderStartTimeRef = useRef<number>(performance.now());
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const activeView = meta?.activeView;

  // Track initial mount and view transitions with an explicit dependency array
  useEffect(() => {
    const duration = performance.now() - renderStartTimeRef.current;
    performanceLogger.recordRender(componentName, duration, metaRef.current);
    renderStartTimeRef.current = performance.now();
  }, [componentName, activeView]);

  const measureTelemetryFetch = useCallback(
    <T>(
      endpoint: string,
      fetchPromise: () => Promise<Response | T>,
      options?: { source?: string; extractItemCount?: (data: any) => number }
    ) => {
      return performanceLogger.measureFetch<T>(endpoint, fetchPromise, options);
    },
    []
  );

  const recordTelemetryFetch = useCallback(
    (metric: Parameters<typeof performanceLogger.recordTelemetryFetch>[0]) => {
      return performanceLogger.recordTelemetryFetch(metric);
    },
    []
  );

  const getSnapshot = useCallback((): PerformanceSnapshot => {
    return performanceLogger.getSnapshot(componentName);
  }, [componentName]);

  return {
    getSnapshot,
    measureTelemetryFetch,
    recordTelemetryFetch,
  };
}

/**
 * Isolated hook for UI badges / HUD components that need periodic snapshot polling
 * without re-rendering parent tree components.
 */
export function usePerformanceSnapshot(componentName: string, pollIntervalMs = 4000) {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot>(() => performanceLogger.getSnapshot(componentName));

  useEffect(() => {
    const timer = setInterval(() => {
      setSnapshot(performanceLogger.getSnapshot(componentName));
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [componentName, pollIntervalMs]);

  const refreshSnapshot = useCallback(() => {
    setSnapshot(performanceLogger.getSnapshot(componentName));
  }, [componentName]);

  return { snapshot, refreshSnapshot };
}
