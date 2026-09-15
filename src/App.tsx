import React from 'react';
import { FerryProvider, useFerry } from './context/FerryContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SimulationBar } from './components/common/SimulationBar';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SystemStatusModal } from './components/common/SystemStatusModal';
import { AccessibilitySettingsModal } from './components/common/AccessibilitySettingsModal';
import { BoardingFlowGuideOverlay } from './components/passenger/BoardingFlowGuideOverlay';
import { ContextAwareFeedbackModal } from './components/passenger/ContextAwareFeedbackModal';
import { LandingPage } from './components/public/LandingPage';
import { LiveTrackingView } from './components/public/LiveTrackingView';
import { RoutesView } from './components/public/RoutesView';
import { PortsView } from './components/public/PortsView';
import { ServiceAlertsView } from './components/public/ServiceAlertsView';
import { BookingView } from './components/booking/BookingView';
import { PassengerDashboard } from './components/passenger/PassengerDashboard';
import { OperatorPortal } from './components/operator/OperatorPortal';
import { CaptainBridgeView } from './components/captain/CaptainBridgeView';
import { AdminPortal } from './components/admin/AdminPortal';
import { useProximityPushWatcher } from './hooks/useProximityPushWatcher';
import { usePerformanceMonitoring, usePerformanceSnapshot } from './hooks/usePerformanceMonitoring';
import { Ship, Loader2, Activity, Zap, Wifi, WifiOff } from 'lucide-react';

const PerformanceMonitoringHUD: React.FC<{ isOffline: boolean; activeView: string }> = ({
  isOffline,
  activeView,
}) => {
  const { snapshot } = usePerformanceSnapshot('AppContent', 3500);
  const [showPerfBadge, setShowPerfBadge] = React.useState<boolean>(false);

  return (
    <div className="fixed bottom-3 right-3 z-40 flex flex-col items-end gap-1.5 pointer-events-none">
      {isOffline && (
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/90 text-slate-950 font-semibold text-xs shadow-lg backdrop-blur-md animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Maritime Offline Mode: Cached Ferry Schedules Active</span>
        </div>
      )}

      <button
        id="btn-perf-monitor-toggle"
        type="button"
        onClick={() => setShowPerfBadge(!showPerfBadge)}
        className="pointer-events-auto flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-slate-300 shadow-md backdrop-blur-md transition-all hover:border-cyan-500/50"
        title="Click to view AppContent render and telemetry fetching performance metrics"
      >
        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>
          Render: <strong className="text-cyan-300">{snapshot.componentRenders.lastMs}ms</strong>
        </span>
        <span className="text-slate-500">•</span>
        <span>
          Telemetry: <strong className="text-emerald-400">{snapshot.telemetryFetches.lastMs > 0 ? `${snapshot.telemetryFetches.lastMs}ms` : 'synced'}</strong>
        </span>
      </button>

      {showPerfBadge && (
        <div className="pointer-events-auto w-80 p-3 rounded-xl bg-slate-900/95 border border-cyan-800/60 shadow-2xl backdrop-blur-md text-xs space-y-2 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>AppContent Performance Monitor</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Live Metrics
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <div className="text-slate-400 text-[10px]">Render Latency</div>
              <div className="text-sm font-bold text-cyan-300">{snapshot.componentRenders.lastMs} ms</div>
              <div className="text-[10px] text-slate-400">
                Avg: {snapshot.componentRenders.avgMs}ms | Max: {snapshot.componentRenders.maxMs}ms
              </div>
              <div className="text-[10px] text-slate-500">Renders: #{snapshot.componentRenders.count}</div>
            </div>

            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <div className="text-slate-400 text-[10px]">Telemetry Latency</div>
              <div className="text-sm font-bold text-emerald-400">{snapshot.telemetryFetches.lastMs || 0} ms</div>
              <div className="text-[10px] text-slate-400">Avg: {snapshot.telemetryFetches.avgMs || 0} ms</div>
              <div className="text-[10px] text-slate-500">Fetches: {snapshot.telemetryFetches.count}</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span>Status: {isOffline ? 'Offline (SW Cache)' : 'Online (Direct AIS)'}</span>
            <span className="font-mono text-cyan-400">View: {activeView}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeView, theme, isInitialized, setActiveView, routes, trips, ports, ferries } = useFerry();
  useProximityPushWatcher();

  // Performance monitoring: tracks component render times and active view
  const { measureTelemetryFetch } = usePerformanceMonitoring('AppContent', {
    activeView,
    theme,
    isInitialized,
    tripsCount: trips.length,
    ferriesCount: ferries.length,
  });

  const [isOffline, setIsOffline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  // Monitor network status
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Performance monitoring: track telemetry data fetching performance
  React.useEffect(() => {
    if (!isInitialized) return;

    const checkTelemetryPerformance = async () => {
      try {
        await measureTelemetryFetch(
          '/api/schedules',
          () => fetch('/api/schedules'),
          {
            source: isOffline ? 'service-worker-cache' : 'harbor-dispatch-api',
            extractItemCount: (data) => (data?.routes?.length || 0) + (data?.trips?.length || 0),
          }
        );
      } catch (err) {
        // Log handled by performance logger
      }
    };

    // Initial telemetry performance check
    checkTelemetryPerformance();

    // Periodic telemetry latency benchmark every 25 seconds
    const telemetryTimer = setInterval(checkTelemetryPerformance, 25000);
    return () => clearInterval(telemetryTimer);
  }, [isInitialized, isOffline, measureTelemetryFetch]);

  if (!isInitialized) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 animate-pulse">
            <Ship className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Mumbai FerryFlow Dispatch</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
              Initializing maritime telemetry & AIS radar network...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950' : 'light bg-slate-50 text-slate-900 selection:bg-cyan-600 selection:text-white'}`}>
      {/* 1. Simulation Control Bar (Top-most) */}
      <SimulationBar />

      {/* 2. Main Navigation Header */}
      <Navbar />

      {/* 3. Dynamic Application Content Body guarded by ErrorBoundary */}
      <main className="flex-1">
        <ErrorBoundary onReset={() => setActiveView('home')}>
          {activeView === 'home' && <LandingPage />}
          {activeView === 'live-tracking' && <LiveTrackingView />}
          {activeView === 'routes' && <RoutesView />}
          {activeView === 'ports' && <PortsView />}
          {activeView === 'alerts' && <ServiceAlertsView />}
          {activeView === 'book' && <BookingView />}
          {activeView === 'my-tickets' && <PassengerDashboard />}
          {activeView === 'operator' && <OperatorPortal />}
          {activeView === 'captain' && <CaptainBridgeView />}
          {activeView === 'admin' && <AdminPortal />}
        </ErrorBoundary>
      </main>

      {/* 4. Global Modals */}
      <GlobalSearchModal />
      <SystemStatusModal />
      <AccessibilitySettingsModal />
      <BoardingFlowGuideOverlay />
      <ContextAwareFeedbackModal />

      {/* 5. Maritime Operations Footer */}
      <Footer />

      {/* 6. Performance Monitoring & Telemetry Status HUD */}
      <PerformanceMonitoringHUD isOffline={isOffline} activeView={activeView} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <FerryProvider>
        <AppContent />
      </FerryProvider>
    </ErrorBoundary>
  );
}
