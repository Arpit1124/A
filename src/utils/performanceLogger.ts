// High-precision Maritime Application Performance Monitoring
// Tracks React component render latency and real-time AIS/schedule telemetry data fetching performance

export interface ComponentRenderMetric {
  componentName: string;
  renderNumber: number;
  durationMs: number;
  timestamp: number;
  meta?: Record<string, any>;
}

export interface TelemetryFetchMetric {
  id: string;
  endpoint: string;
  durationMs: number;
  timestamp: number;
  status: number;
  source: string;
  cached: boolean;
  itemCount?: number;
  error?: string;
}

export interface PerformanceSnapshot {
  componentRenders: {
    count: number;
    lastMs: number;
    avgMs: number;
    maxMs: number;
    recentHistory: ComponentRenderMetric[];
  };
  telemetryFetches: {
    count: number;
    lastMs: number;
    avgMs: number;
    recentHistory: TelemetryFetchMetric[];
  };
}

class PerformanceLogger {
  private renderCounts: Map<string, number> = new Map();
  private renderDurations: Map<string, number[]> = new Map();
  private renderHistory: ComponentRenderMetric[] = [];

  private telemetryHistory: TelemetryFetchMetric[] = [];
  private listeners: Set<(snapshot: PerformanceSnapshot) => void> = new Set();

  // Log and record React component render timing
  recordRender(componentName: string, durationMs: number, meta?: Record<string, any>): ComponentRenderMetric {
    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);

    const durations = this.renderDurations.get(componentName) || [];
    durations.push(durationMs);
    if (durations.length > 50) durations.shift();
    this.renderDurations.set(componentName, durations);

    const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxMs = Math.max(...durations);

    const metric: ComponentRenderMetric = {
      componentName,
      renderNumber: count,
      durationMs: Number(durationMs.toFixed(2)),
      timestamp: Date.now(),
      meta,
    };

    this.renderHistory.push(metric);
    if (this.renderHistory.length > 50) this.renderHistory.shift();

    // High-visibility, structured console performance output
    const viewStr = meta?.activeView ? ` | View: "${meta.activeView}"` : '';
    const themeStr = meta?.theme ? ` | Theme: "${meta.theme}"` : '';
    const speedColor = durationMs < 8 ? '#10b981' : durationMs < 25 ? '#f59e0b' : '#ef4444';

    console.log(
      `%c[Perf:${componentName}]%c Render #${count} completed in %c${durationMs.toFixed(2)}ms%c (avg: ${avgMs.toFixed(2)}ms, max: ${maxMs.toFixed(2)}ms)${viewStr}${themeStr}`,
      'color: #06b6d4; font-weight: bold;',
      'color: inherit;',
      `color: ${speedColor}; font-weight: bold;`,
      'color: inherit;'
    );

    return metric;
  }

  // Log and record telemetry data fetching performance
  recordTelemetryFetch(metric: Omit<TelemetryFetchMetric, 'id' | 'timestamp'>): TelemetryFetchMetric {
    const fullMetric: TelemetryFetchMetric = {
      id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...metric,
      durationMs: Number(metric.durationMs.toFixed(2)),
    };

    this.telemetryHistory.push(fullMetric);
    if (this.telemetryHistory.length > 50) this.telemetryHistory.shift();

    const cacheLabel = metric.cached ? ' [CACHED VIEW]' : '';
    const statusColor = metric.status >= 200 && metric.status < 300 ? '#10b981' : '#ef4444';

    console.log(
      `%c[Perf:Telemetry]%c Fetched %c${metric.endpoint}%c in %c${metric.durationMs.toFixed(2)}ms%c (status: %c${metric.status}%c, source: "${metric.source}"${cacheLabel}${metric.itemCount !== undefined ? `, items: ${metric.itemCount}` : ''})`,
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;',
      'color: #06b6d4; font-weight: 600;',
      'color: inherit;',
      'color: #10b981; font-weight: bold;',
      'color: inherit;',
      `color: ${statusColor}; font-weight: bold;`,
      'color: inherit;'
    );

    return fullMetric;
  }

  // Wrapper utility to measure any telemetry network fetch operation
  async measureFetch<T>(
    endpoint: string,
    fetchPromise: () => Promise<Response | T>,
    options?: { source?: string; extractItemCount?: (data: any) => number }
  ): Promise<T> {
    const start = performance.now();
    let status = 200;
    let cached = false;
    let source = options?.source || 'network';
    let itemCount: number | undefined;

    try {
      const resOrData = await fetchPromise();
      const end = performance.now();
      const durationMs = end - start;

      let finalData: any;
      if (resOrData && typeof (resOrData as any).json === 'function') {
        const res = resOrData as Response;
        status = res.status;
        cached = res.headers?.get('X-FerryFlow-Cache')?.includes('HIT') ?? false;
        if (cached) source = 'service-worker-cache';
        finalData = await res.json();
      } else {
        finalData = resOrData;
      }

      if (options?.extractItemCount) {
        try {
          itemCount = options.extractItemCount(finalData);
        } catch {
          // ignore
        }
      }

      this.recordTelemetryFetch({
        endpoint,
        durationMs,
        status,
        source,
        cached,
        itemCount,
      });

      return finalData as T;
    } catch (err: any) {
      const durationMs = performance.now() - start;
      this.recordTelemetryFetch({
        endpoint,
        durationMs,
        status: 500,
        source,
        cached: false,
        error: err?.message || 'Fetch failed',
      });
      throw err;
    }
  }

  getSnapshot(componentName = 'AppContent'): PerformanceSnapshot {
    const durations = this.renderDurations.get(componentName) || [];
    const count = this.renderCounts.get(componentName) || 0;
    const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const maxMs = durations.length ? Math.max(...durations) : 0;
    const lastMs = durations.length ? durations[durations.length - 1] : 0;

    const telDurations = this.telemetryHistory.map((t) => t.durationMs);
    const telAvgMs = telDurations.length ? telDurations.reduce((a, b) => a + b, 0) / telDurations.length : 0;
    const telLastMs = telDurations.length ? telDurations[telDurations.length - 1] : 0;

    return {
      componentRenders: {
        count,
        lastMs: Number(lastMs.toFixed(2)),
        avgMs: Number(avgMs.toFixed(2)),
        maxMs: Number(maxMs.toFixed(2)),
        recentHistory: [...this.renderHistory],
      },
      telemetryFetches: {
        count: this.telemetryHistory.length,
        lastMs: Number(telLastMs.toFixed(2)),
        avgMs: Number(telAvgMs.toFixed(2)),
        recentHistory: [...this.telemetryHistory],
      },
    };
  }

  subscribe(listener: (snapshot: PerformanceSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.listeners.size === 0) return;
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const performanceLogger = new PerformanceLogger();
