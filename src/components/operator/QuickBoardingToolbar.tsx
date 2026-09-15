import React, { useState } from 'react';
import { Trip, Ferry, Route, Port, TripStatus } from '../../types';
import {
  DoorClosed,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Anchor,
  Ship,
  BellRing,
  Check,
  RotateCcw,
  Zap,
  Radio,
  ArrowRight,
} from 'lucide-react';

interface QuickBoardingToolbarProps {
  trips: Trip[];
  ferries: Ferry[];
  routes: Route[];
  ports: Port[];
  onUpdateTripStatus: (tripId: string, status: TripStatus, delayMinutes?: number) => void;
  onPublishAlert?: (alert: any) => void;
}

export const QuickBoardingToolbar: React.FC<QuickBoardingToolbarProps> = ({
  trips,
  ferries,
  routes,
  ports,
  onUpdateTripStatus,
  onPublishAlert,
}) => {
  // Find imminent or active departures
  const activeOrUpcomingTrips = trips.filter(
    (t) => t.status === 'boarding' || t.status === 'scheduled' || t.status === 'delayed'
  );
  const defaultTripId = activeOrUpcomingTrips[0]?.id || trips[0]?.id;

  const [selectedTripId, setSelectedTripId] = useState<string>(defaultTripId);
  const [delayMinutesChoice, setDelayMinutesChoice] = useState<number>(15);
  const [autoBroadcast, setAutoBroadcast] = useState<boolean>(true);
  const [lastActionFeedback, setLastActionFeedback] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
    time: string;
  } | null>(null);

  const currentTrip = trips.find((t) => t.id === selectedTripId) || trips[0];
  const currentFerry = ferries.find((f) => f.id === currentTrip?.ferryId);
  const currentRoute = routes.find((r) => r.id === currentTrip?.routeId);

  const showFeedback = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastActionFeedback({ text, type, time: timeStr });
    setTimeout(() => {
      setLastActionFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Requirement Action: 'Gate Closed'
  const handleGateClosed = () => {
    if (!currentTrip) return;
    onUpdateTripStatus(currentTrip.id, 'departed', 0);

    if (autoBroadcast && onPublishAlert) {
      onPublishAlert({
        title: `Gate Closed — ${currentTrip.tripNumber}`,
        message: `Turnstiles at ${currentTrip.gateNumber} are now closed for ${currentFerry?.name || 'Vessel'}. Boarding manifest finalized.`,
        severity: 'medium',
        category: 'Boarding Gate',
        affectedRouteId: currentTrip.routeId,
        validUntil: new Date(Date.now() + 3600000).toISOString(),
        channels: ['Push', 'Web', 'SMS'],
      });
    }

    showFeedback(`Gate ${currentTrip.gateNumber} CLOSED for Trip ${currentTrip.tripNumber} (${currentFerry?.name}). Boarding manifest sealed.`, 'warning');
  };

  // Requirement Action: 'Delayed'
  const handleMarkDelayed = (customMinutes?: number) => {
    if (!currentTrip) return;
    const mins = customMinutes || delayMinutesChoice;
    onUpdateTripStatus(currentTrip.id, 'delayed', mins);

    if (autoBroadcast && onPublishAlert) {
      onPublishAlert({
        title: `Service Delay Notice: ${currentTrip.tripNumber} (+${mins} min)`,
        message: `${currentFerry?.name || 'Ferry'} departure from ${currentTrip.gateNumber} is delayed by approx. ${mins} minutes due to fairway traffic/operational turnaround.`,
        severity: 'high',
        category: 'Delay',
        affectedRouteId: currentTrip.routeId,
        validUntil: new Date(Date.now() + 7200000).toISOString(),
        channels: ['Push', 'Web', 'SMS'],
      });
    }

    showFeedback(`Trip ${currentTrip.tripNumber} marked as DELAYED (+${mins} min). Passenger push alert broadcasted.`, 'warning');
  };

  // Fast action: Open Boarding
  const handleOpenBoarding = () => {
    if (!currentTrip) return;
    onUpdateTripStatus(currentTrip.id, 'boarding', 0);

    if (autoBroadcast && onPublishAlert) {
      onPublishAlert({
        title: `Boarding Commenced — ${currentTrip.tripNumber}`,
        message: `Now boarding for ${currentFerry?.name || 'vessel'} at Gate ${currentTrip.gateNumber}. Please have your digital QR ticket ready.`,
        severity: 'low',
        category: 'Boarding Gate',
        affectedRouteId: currentTrip.routeId,
        validUntil: new Date(Date.now() + 3600000).toISOString(),
        channels: ['Push', 'Web'],
      });
    }

    showFeedback(`Boarding ACTIVATED for ${currentTrip.tripNumber} at Gate ${currentTrip.gateNumber}. Turnstiles open.`, 'success');
  };

  // Fast action: Departed / In Transit
  const handleCastOff = () => {
    if (!currentTrip) return;
    onUpdateTripStatus(currentTrip.id, 'in_transit', 0);
    showFeedback(`${currentFerry?.name} (Trip ${currentTrip.tripNumber}) CAST OFF — Underway in fairway transit.`, 'info');
  };

  // Reset to Scheduled / On Time
  const handleResetScheduled = () => {
    if (!currentTrip) return;
    onUpdateTripStatus(currentTrip.id, 'scheduled', 0);
    showFeedback(`Trip ${currentTrip.tripNumber} reset to Scheduled (On-Time status).`, 'info');
  };

  return (
    <div
      id="quick-boarding-toolbar"
      className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/40 border-2 border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Title & Trip Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-xs tracking-wide uppercase">
                  Quick Boarding & Dispatch Toolbar
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  STAFF DISPATCH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Trigger rapid status changes, close gates, or broadcast delays directly from the main operations desk
              </p>
            </div>
          </div>

          {/* Target Trip Picker */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-400">Target Voyage:</span>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {trips.map((t) => {
                const ferry = ferries.find((f) => f.id === t.ferryId);
                return (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.tripNumber} • {ferry?.name || 'Ferry'} ({t.gateNumber} — {t.scheduledDeparture} • {t.status.toUpperCase()})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Status Indicators for selected trip */}
        {currentTrip && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-400 text-[11px]">
              Gate: <strong className="text-white">{currentTrip.gateNumber}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded-md font-bold uppercase ${
                currentTrip.status === 'boarding'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : currentTrip.status === 'delayed'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : currentTrip.status === 'departed' || currentTrip.status === 'in_transit'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {currentTrip.status}
              {currentTrip.delayMinutes > 0 && ` (+${currentTrip.delayMinutes}m)`}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: GATE CLOSED (Explicit Requirement) */}
          <button
            type="button"
            id="quick-action-gate-closed-btn"
            onClick={handleGateClosed}
            className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            title="Lock turnstiles, seal passenger manifest, and mark gate as closed"
          >
            <DoorClosed className="w-4 h-4 text-red-400" />
            <span>Gate Closed</span>
          </button>

          {/* Action 2: DELAYED (Explicit Requirement) */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-amber-500/40 overflow-hidden shadow-md">
            <button
              type="button"
              id="quick-action-delayed-btn"
              onClick={() => handleMarkDelayed()}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 active:scale-95"
              title="Flag voyage as delayed and issue passenger delay advisory"
            >
              <Clock className="w-4 h-4" />
              <span>Mark Delayed (+{delayMinutesChoice}m)</span>
            </button>
            <select
              value={delayMinutesChoice}
              onChange={(e) => setDelayMinutesChoice(Number(e.target.value))}
              className="bg-slate-900 text-amber-300 text-xs px-2 py-2 border-l border-slate-800 focus:outline-none font-mono"
            >
              <option value={10}>+10 min</option>
              <option value={15}>+15 min</option>
              <option value={20}>+20 min</option>
              <option value={30}>+30 min</option>
              <option value={45}>+45 min</option>
            </select>
          </div>

          {/* Action 3: Open Boarding */}
          <button
            type="button"
            id="quick-action-open-boarding-btn"
            onClick={handleOpenBoarding}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-600 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Open Boarding</span>
          </button>

          {/* Action 4: Cast Off / Underway */}
          <button
            type="button"
            id="quick-action-cast-off-btn"
            onClick={handleCastOff}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Anchor className="w-4 h-4 text-cyan-400" />
            <span>Cast Off</span>
          </button>

          {/* Action 5: Reset to On-Time */}
          <button
            type="button"
            id="quick-action-reset-btn"
            onClick={handleResetScheduled}
            className="px-2.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition-colors flex items-center gap-1"
            title="Reset trip status to scheduled on-time"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Right side: Push Notification Broadcast Checkbox */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoBroadcast}
              onChange={(e) => setAutoBroadcast(e.target.checked)}
              className="rounded accent-cyan-500 w-3.5 h-3.5"
            />
            <BellRing className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Auto-push alerts to passengers</span>
          </label>
        </div>
      </div>

      {/* Confirmation Notification Toast Banner */}
      {lastActionFeedback && (
        <div
          id="quick-boarding-feedback-banner"
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border animate-in fade-in slide-in-from-top-1 duration-150 ${
            lastActionFeedback.type === 'warning'
              ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
              : lastActionFeedback.type === 'info'
              ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200'
              : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{lastActionFeedback.text}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{lastActionFeedback.time}</span>
        </div>
      )}
    </div>
  );
};
