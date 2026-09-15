import React, { useState, useEffect, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import {
  AlertTriangle,
  Clock,
  X,
  ArrowRight,
  Radio,
  Ship,
  Bell,
  Volume2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const ServiceDelayPushBanner: React.FC = () => {
  const {
    alerts,
    trips,
    ferries,
    routes,
    setActiveView,
    setSelectedFerryId,
    liveFeedEvents,
  } = useFerry();

  // Find all current active delay sources
  const delayAlerts = useMemo(() => {
    return alerts.filter(
      (a) => a.active && (a.category === 'Delay' || a.title.toLowerCase().includes('delay') || a.message.toLowerCase().includes('delay'))
    );
  }, [alerts]);

  const delayedTrips = useMemo(() => {
    return trips.filter((t) => t.status === 'delayed' || t.delayMinutes > 0);
  }, [trips]);

  const delayedFerries = useMemo(() => {
    return ferries.filter((f) => f.status === 'delayed');
  }, [ferries]);

  // Track the most recent delay notice
  const latestDelay = useMemo(() => {
    if (delayAlerts.length > 0) {
      const alert = delayAlerts[0];
      const ferry = alert.affectedFerryId ? ferries.find((f) => f.id === alert.affectedFerryId) : null;
      const route = alert.affectedRouteId ? routes.find((r) => r.id === alert.affectedRouteId) : null;
      return {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        ferryName: ferry ? ferry.name : undefined,
        ferryId: ferry ? ferry.id : undefined,
        routeName: route ? route.name : 'Harbor Transit Route',
        delayMinutes: 15,
        timestamp: alert.createdAt,
      };
    }

    if (delayedTrips.length > 0) {
      const trip = delayedTrips[0];
      const ferry = ferries.find((f) => f.id === trip.ferryId);
      const route = routes.find((r) => r.id === trip.routeId);
      return {
        id: `trip-delay-${trip.id}-${trip.delayMinutes}`,
        title: `Service Delay Logged: ${ferry?.name || 'Ferry'} (${trip.tripNumber})`,
        message: `Trip ${trip.tripNumber} is operating with a ${trip.delayMinutes}-minute delay. Harbor departure adjusted.`,
        severity: trip.delayMinutes > 20 ? 'high' : 'medium',
        ferryName: ferry?.name,
        ferryId: ferry?.id,
        routeName: route?.name || 'Gateway ⇄ Mandwa',
        delayMinutes: trip.delayMinutes,
        timestamp: 'Live AIS Status',
      };
    }

    if (delayedFerries.length > 0) {
      const ferry = delayedFerries[0];
      return {
        id: `ferry-delay-${ferry.id}`,
        title: `Operational Notice: ${ferry.name}`,
        message: `${ferry.name} reported operational headway delay. Speed restricted to ${ferry.speedKnots} kts.`,
        severity: 'medium',
        ferryName: ferry.name,
        ferryId: ferry.id,
        routeName: 'Commercial Route',
        delayMinutes: 10,
        timestamp: 'Live Feed',
      };
    }

    return null;
  }, [delayAlerts, delayedTrips, delayedFerries, ferries, routes]);

  const [isDismissed, setIsDismissed] = useState(false);
  const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  const latestDelayId = latestDelay?.id || null;

  // Automatically re-surface and trigger push notification when a NEW delay is logged
  useEffect(() => {
    if (latestDelayId && latestDelayId !== lastNotifiedId) {
      setIsDismissed(false);
      setLastNotifiedId(latestDelayId);
      setIsPulsing(true);

      // Play soft notification sound via Web Audio API
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state !== 'closed') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
            setTimeout(() => {
              ctx.close().catch(() => {});
            }, 500);
          }
        }
      } catch {
        // Silently ignore audio context restrictions
      }

      const pulseTimer = setTimeout(() => setIsPulsing(false), 3000);
      return () => clearTimeout(pulseTimer);
    }
  }, [latestDelayId, lastNotifiedId]);

  if (!latestDelay || isDismissed) {
    return null;
  }

  return (
    <div
      id="navbar-service-delay-push-banner"
      role="alert"
      className={`relative z-40 w-full transition-all duration-300 ${
        latestDelay.severity === 'critical' || latestDelay.severity === 'high'
          ? 'bg-gradient-to-r from-red-950 via-amber-950/90 to-red-950 border-b border-red-700/60 shadow-lg shadow-red-950/50'
          : 'bg-gradient-to-r from-amber-950/95 via-slate-900 to-amber-950/95 border-b border-amber-600/50 shadow-md shadow-amber-950/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Left: Push Notification Pill & Icon */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                latestDelay.severity === 'high' || latestDelay.severity === 'critical'
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
              } ${isPulsing ? 'scale-110 ring-2 ring-amber-400/50 transition-transform' : ''}`}
            >
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                SYSTEM DELAY LOGGED
              </span>

              <span className="font-semibold text-white truncate">
                {latestDelay.title}
              </span>

              <span className="hidden md:inline text-slate-400">•</span>

              <span className="text-slate-300 hidden lg:inline line-clamp-1 max-w-md">
                {latestDelay.message}
              </span>
            </div>
          </div>

          {/* Right: Actions (View Route / Alerts + Dismiss) */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950/80 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              +{latestDelay.delayMinutes}m
            </span>

            <button
              id="delay-banner-inspect-btn"
              onClick={() => {
                if (latestDelay.ferryId) {
                  setSelectedFerryId(latestDelay.ferryId);
                  setActiveView('live-tracking');
                } else {
                  setActiveView('alerts');
                }
              }}
              className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Track Disruption</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              id="delay-banner-dismiss-btn"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Dismiss push notification"
              aria-label="Dismiss delay notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
