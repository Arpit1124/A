import React, { useState, useEffect, useRef } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry, Route, Trip, ServiceAlert } from '../../types';
import {
  Bell,
  BellRing,
  AlertTriangle,
  Compass,
  Wrench,
  Navigation,
  Radio,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Flame,
  Zap,
  Clock,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface OperatorPushNotification {
  id: string;
  type: 'route_deviation' | 'mechanical_delay';
  severity: 'critical' | 'high' | 'warning';
  title: string;
  message: string;
  vesselId: string;
  vesselName: string;
  routeId?: string;
  routeName?: string;
  timestamp: string;
  telemetry: {
    currentSpeedKnots: number;
    expectedSpeedKnots: number;
    deviationDistanceMeters?: number;
    headingErrorDeg?: number;
    engineTempC?: number;
    engineRpm?: number;
    delayMinutesAdded: number;
  };
  acknowledged: boolean;
  actionTaken?: string;
}

export const OperatorPushAlertSystem: React.FC = () => {
  const { ferries, routes, trips, publishAlert, updateFerry, theme } = useFerry();
  const isDark = theme === 'dark';

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeAlerts, setActiveAlerts] = useState<OperatorPushNotification[]>([
    {
      id: 'op-alert-init-1',
      type: 'route_deviation',
      severity: 'critical',
      title: 'CRITICAL ROUTE DEVIATION: M.V. Mandwa Pride (FV-102)',
      message: 'Vessel deviated 850m south of designated shipping fairway into Karanja shallows. Heading offset 34° from route waypoint #3.',
      vesselId: 'ferry-102',
      vesselName: 'M.V. Mandwa Pride',
      routeId: 'route-1',
      routeName: 'Gateway of India ⇄ Mandwa Ro-Pax',
      timestamp: '2 mins ago',
      telemetry: {
        currentSpeedKnots: 11.2,
        expectedSpeedKnots: 16.5,
        deviationDistanceMeters: 850,
        headingErrorDeg: 34,
        delayMinutesAdded: 12,
      },
      acknowledged: false,
    },
    {
      id: 'op-alert-init-2',
      type: 'mechanical_delay',
      severity: 'high',
      title: 'MECHANICAL DELAY: Ocean Queen (FV-101) Port Turbine Temp Alert',
      message: 'Propulsion turbine manifold temperature exceeded 104°C. Captain throttled to 5.2 knots emergency cruising speed. Scheduled arrival delayed by +18 mins.',
      vesselId: 'ferry-101',
      vesselName: 'Ocean Queen',
      routeId: 'route-1',
      routeName: 'Gateway of India ⇄ Mandwa Ro-Pax',
      timestamp: '8 mins ago',
      telemetry: {
        currentSpeedKnots: 5.2,
        expectedSpeedKnots: 15.0,
        engineTempC: 106,
        engineRpm: 1100,
        delayMinutesAdded: 18,
      },
      acknowledged: false,
    },
  ]);

  const [toastNotification, setToastNotification] = useState<OperatorPushNotification | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'route_deviation' | 'mechanical_delay'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        if (res === 'granted') {
          dispatchPushNotification({
            id: `perm-${Date.now()}`,
            type: 'route_deviation',
            severity: 'warning',
            title: 'Operator Push System Activated',
            message: 'Port Operations will now receive push notifications for vessel route deviations and mechanical alerts.',
            vesselId: 'SYS',
            vesselName: 'Port Operations System',
            timestamp: 'Just now',
            telemetry: {
              currentSpeedKnots: 0,
              expectedSpeedKnots: 0,
              delayMinutesAdded: 0,
            },
            acknowledged: true,
          });
        }
      } catch (e) {
        console.error('Notification permission error', e);
      }
    }
  };

  const playNotificationChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const dispatchPushNotification = (notif: OperatorPushNotification) => {
    setActiveAlerts((prev) => [notif, ...prev]);
    setToastNotification(notif);
    playNotificationChime();

    // Auto-dismiss toast after 7s
    setTimeout(() => {
      setToastNotification((curr) => (curr?.id === notif.id ? null : curr));
    }, 7000);

    // Native Browser Web Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/vite.svg',
          tag: notif.id,
        });
      } catch (err) {
        console.error('Web push dispatch error:', err);
      }
    }
  };

  // Handlers to simulate route deviation
  const handleSimulateRouteDeviation = () => {
    const targetFerry = ferries[1] || ferries[0];
    const newAlert: OperatorPushNotification = {
      id: `dev-${Date.now()}`,
      type: 'route_deviation',
      severity: 'critical',
      title: `⚠️ ROUTE DEVIATION DETECTED: ${targetFerry.name} (${targetFerry.vesselId})`,
      message: `AIS Radar Alert: ${targetFerry.name} has crossed fairway boundaries by 940m toward Middle Ground shoals. Heading: ${targetFerry.heading}°. Cross-track limit exceeded!`,
      vesselId: targetFerry.id,
      vesselName: targetFerry.name,
      routeName: 'Gateway ⇄ Mandwa Channel',
      timestamp: 'Just now',
      telemetry: {
        currentSpeedKnots: targetFerry.speedKnots,
        expectedSpeedKnots: 15.8,
        deviationDistanceMeters: 940,
        headingErrorDeg: 42,
        delayMinutesAdded: 15,
      },
      acknowledged: false,
    };

    dispatchPushNotification(newAlert);

    // Also broadcast into system alerts
    publishAlert({
      title: `Fairway Deviation Warning: ${targetFerry.name}`,
      message: `AIS Navigational Warning: ${targetFerry.name} (${targetFerry.vesselId}) has deviated outside harbour channel fairway. Harbor Master escort requested.`,
      severity: 'high',
      category: 'Port Advisory',
      affectedFerryId: targetFerry.id,
      validUntil: new Date(Date.now() + 2 * 3600000).toISOString(),
      channels: ['Web', 'Push'],
    });
  };

  // Handlers to simulate mechanical delay
  const handleSimulateMechanicalDelay = () => {
    const targetFerry = ferries[0] || ferries[1];
    const newAlert: OperatorPushNotification = {
      id: `mech-${Date.now()}`,
      type: 'mechanical_delay',
      severity: 'critical',
      title: `⚙️ MECHANICAL DELAY: ${targetFerry.name} Propulsion Anomaly`,
      message: `Engine telemetry telemetry drop: Vessel speed dropped to 3.8 kts due to main coolant loop pressure drop. Trip arrival delayed by +25 minutes.`,
      vesselId: targetFerry.id,
      vesselName: targetFerry.name,
      routeName: 'Gateway ⇄ Elephanta Route',
      timestamp: 'Just now',
      telemetry: {
        currentSpeedKnots: 3.8,
        expectedSpeedKnots: 14.5,
        engineTempC: 108,
        engineRpm: 920,
        delayMinutesAdded: 25,
      },
      acknowledged: false,
    };

    dispatchPushNotification(newAlert);

    // Update ferry status to delayed
    updateFerry(targetFerry.id, {
      status: 'delayed',
      speedKnots: 3.8,
    });

    publishAlert({
      title: `Mechanical Service Delay: ${targetFerry.name}`,
      message: `Vessel ${targetFerry.name} (${targetFerry.vesselId}) operating under restricted engine power due to cooling fault. +25 min delay expected.`,
      severity: 'critical',
      category: 'Delay',
      affectedFerryId: targetFerry.id,
      validUntil: new Date(Date.now() + 3 * 3600000).toISOString(),
      channels: ['Web', 'Push', 'SMS'],
    });
  };

  const handleAcknowledge = (id: string, action: string) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true, actionTaken: action } : a))
    );
  };

  const unackCount = activeAlerts.filter((a) => !a.acknowledged).length;

  const filteredAlerts = activeAlerts.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  return (
    <div className={`rounded-2xl border shadow-xl p-5 space-y-5 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Floating Push Toast Alert Banner */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-lg w-full bg-slate-900/98 backdrop-blur-md border-2 border-rose-500 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-3 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
            {toastNotification.type === 'route_deviation' ? (
              <Compass className="w-6 h-6 animate-spin-slow" />
            ) : (
              <Wrench className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                SIMULATED PUSH NOTIFICATION
              </span>
              <button
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-sm font-bold text-white">{toastNotification.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{toastNotification.message}</p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-cyan-400">Delay: +{toastNotification.telemetry.delayMinutesAdded} min</span>
              <button
                onClick={() => {
                  handleAcknowledge(toastNotification.id, 'Acknowledged via Push Toast');
                  setToastNotification(null);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-800 flex items-center justify-center text-rose-400">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Vessel Deviation & Mechanical Push Notification System
              </h2>
              {unackCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500 text-white animate-pulse">
                  {unackCount} Unacknowledged
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated maritime safety telemetry detector — broadcasts real-time push alerts for channel off-track anomalies and propulsion engine failures
            </p>
          </div>
        </div>

        {/* Browser Push & Sound Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-slate-800 text-cyan-300 border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="Toggle Alert Audio Chime"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Chime On' : 'Chime Muted'}</span>
          </button>

          {permission !== 'granted' ? (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Browser Push</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Web Push Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Simulator Quick Action Triggers */}
      <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Simulate Live Vessel Incidents & Dispatch Alerts</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Real-time AIS Telemetry Pipeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Route Deviation Simulator Button */}
          <button
            type="button"
            onClick={handleSimulateRouteDeviation}
            className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-rose-950/60 hover:from-amber-900/80 hover:to-rose-900/80 border border-amber-600/50 hover:border-amber-500 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                <span>Simulate Vessel Route Deviation</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Off-Fairway
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Triggers an immediate off-track warning when a vessel veers &gt;800m away from fairway corridor into sandbanks.
            </p>
          </button>

          {/* Mechanical Delay Simulator Button */}
          <button
            type="button"
            onClick={handleSimulateMechanicalDelay}
            className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/60 to-red-950/60 hover:from-rose-900/80 hover:to-red-900/80 border border-rose-600/50 hover:border-rose-500 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Simulate Mechanical Delay</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                Propulsion Drop
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Simulates a main engine turbine cooling drop, forcing speed to drop from 16 kts to 4 kts with a +25 min delay alert.
            </p>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Log Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Alert Feeds ({activeAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('route_deviation')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              filterType === 'route_deviation'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Route Deviations ({activeAlerts.filter((a) => a.type === 'route_deviation').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('mechanical_delay')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              filterType === 'mechanical_delay'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Mechanical Delays ({activeAlerts.filter((a) => a.type === 'mechanical_delay').length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveAlerts([])}
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Feed</span>
        </button>
      </div>

      {/* Dispatched Notification Cards List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.acknowledged
                  ? 'bg-slate-950/60 border-slate-800 opacity-75'
                  : alert.type === 'route_deviation'
                  ? 'bg-amber-950/25 border-amber-800/80 shadow-lg shadow-amber-950/20'
                  : 'bg-rose-950/25 border-rose-800/80 shadow-lg shadow-rose-950/20'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`p-2 rounded-lg ${
                      alert.type === 'route_deviation'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {alert.type === 'route_deviation' ? (
                      <Compass className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          alert.severity === 'critical'
                            ? 'bg-rose-900 text-rose-200'
                            : 'bg-amber-900 text-amber-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Vessel: <span className="text-slate-200 font-semibold">{alert.vesselName}</span> • Route: {alert.routeName || 'Mumbai Harbour Fairway'} • {alert.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alert.acknowledged ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alert.id, 'Confirmed by Duty Operator')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {alert.message}
              </p>

              {/* Telemetry Snapshot Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono border border-slate-800">
                <div>
                  <span className="text-slate-500 block">AIS Speed</span>
                  <span className="text-cyan-300 font-bold">{alert.telemetry.currentSpeedKnots} kts</span>{' '}
                  <span className="text-slate-500 text-[10px]">(Exp: {alert.telemetry.expectedSpeedKnots})</span>
                </div>
                {alert.telemetry.deviationDistanceMeters !== undefined && (
                  <div>
                    <span className="text-slate-500 block">Cross-Track Error</span>
                    <span className="text-amber-400 font-bold">{alert.telemetry.deviationDistanceMeters} m</span>
                  </div>
                )}
                {alert.telemetry.engineTempC !== undefined && (
                  <div>
                    <span className="text-slate-500 block">Turbine Temp</span>
                    <span className="text-rose-400 font-bold">{alert.telemetry.engineTempC}°C</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Schedule Impact</span>
                  <span className="text-rose-400 font-bold">+{alert.telemetry.delayMinutesAdded} min delay</span>
                </div>
              </div>

              {/* Quick Response Actions */}
              {!alert.acknowledged && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80 mt-3 text-xs">
                  <span className="text-slate-400 text-[11px]">Operator Actions:</span>
                  <button
                    onClick={() => handleAcknowledge(alert.id, 'VHF Hail on Ch 16 executed')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <PhoneCall className="w-3 h-3 text-cyan-400" />
                    <span>Hail Captain on VHF 16</span>
                  </button>
                  <button
                    onClick={() => handleAcknowledge(alert.id, 'Port Tug Escort Dispatched')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Dispatch Harbor Tug</span>
                  </button>
                  <button
                    onClick={() => handleAcknowledge(alert.id, 'Passenger SMS Alert Triggered')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Bell className="w-3 h-3 text-rose-400" />
                    <span>Broadcast Passenger Delay</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No vessel route deviations or mechanical alerts logged in current session.
          </div>
        )}
      </div>
    </div>
  );
};
