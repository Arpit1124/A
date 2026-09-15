import React, { useState, useEffect, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry, Trip, Port, Route } from '../../types';
import {
  Clock,
  Anchor,
  Radio,
  Gauge,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Navigation,
  Sparkles,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Waves,
} from 'lucide-react';

interface DockingCountdownTimerProps {
  selectedFerry: Ferry;
  route?: Route;
  trip?: Trip;
  destPort?: Port;
}

function calculateDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function kmToNauticalMiles(km: number): number {
  return km / 1.852;
}

export const DockingCountdownTimer: React.FC<DockingCountdownTimerProps> = ({
  selectedFerry,
  route,
  trip,
  destPort,
}) => {
  const { ports, ferries, trips, setSelectedFerryId } = useFerry();

  // Find destination port if not provided
  const targetPort = useMemo(() => {
    if (destPort) return destPort;
    const destPortId = trip?.destinationPortId || selectedFerry.destinationPortId || route?.destinationPortId;
    return ports.find((p) => p.id === destPortId) || ports[1];
  }, [destPort, trip, selectedFerry, route, ports]);

  // Determine other approaching or docked vessels at target port for berthing availability
  const berthingAvailability = useMemo(() => {
    if (!targetPort) {
      return {
        status: 'available' as const,
        availableBerths: 2,
        totalBerths: 3,
        queueDelayMinutes: 0,
        berthCode: 'Berth B-1',
        message: 'Direct docking corridor clear',
      };
    }

    const otherApproaching = ferries.filter(
      (f) =>
        f.id !== selectedFerry.id &&
        (f.destinationPortId === targetPort.id || f.currentPortId === targetPort.id) &&
        (f.status === 'approaching' || f.status === 'docked' || f.status === 'boarding')
    );

    const totalGates = targetPort.gates?.length || 3;
    const occupiedGates = Math.min(totalGates - 1, otherApproaching.length);
    const availableGates = Math.max(1, totalGates - occupiedGates);

    const isCongested = targetPort.operationalStatus === 'congested';
    let queueDelay = 0;
    let status: 'available' | 'reserved' | 'queuing' = 'available';

    if (isCongested || occupiedGates >= totalGates) {
      queueDelay = 4.5;
      status = 'queuing';
    } else if (occupiedGates > 0) {
      queueDelay = 1.5;
      status = 'reserved';
    }

    const assignedGate = targetPort.gates?.find(
      (g) => g.assignedTripId === trip?.id || g.status === 'open'
    ) || targetPort.gates?.[0];

    return {
      status,
      availableBerths: availableGates,
      totalBerths: totalGates,
      queueDelayMinutes: queueDelay,
      berthCode: assignedGate ? `Berth ${assignedGate.number}` : 'Berth B-2',
      message:
        status === 'available'
          ? 'Berth cleared for immediate docking sequence'
          : status === 'reserved'
          ? 'Clearance granted; previous vessel completing slipway unmooring'
          : 'Berth queue active; vessel holding slow fairway approach',
    };
  }, [targetPort, ferries, selectedFerry, trip]);

  // Compute AIS distance
  const distanceNM = useMemo(() => {
    if (targetPort?.coordinates && selectedFerry?.position) {
      const distKm = calculateDistanceInKm(
        selectedFerry.position.lat,
        selectedFerry.position.lng,
        targetPort.coordinates.lat,
        targetPort.coordinates.lng
      );
      return Math.max(0.1, kmToNauticalMiles(distKm));
    }
    if (trip && typeof trip.remainingDistanceKm === 'number') {
      return Math.max(0.1, kmToNauticalMiles(trip.remainingDistanceKm));
    }
    return 3.2; // fallback
  }, [targetPort, selectedFerry, trip]);

  // Speed in knots
  const speedKnots = selectedFerry.speedKnots > 0.5 ? selectedFerry.speedKnots : 14.5;

  // Calculate total seconds to dock: (distance / speed * 3600) + (berthing queue seconds)
  const baseSecondsToDock = useMemo(() => {
    const transitSeconds = (distanceNM / speedKnots) * 3600;
    const berthingBufferSeconds = berthingAvailability.queueDelayMinutes * 60;
    return Math.max(20, Math.round(transitSeconds + berthingBufferSeconds));
  }, [distanceNM, speedKnots, berthingAvailability.queueDelayMinutes]);

  // Dynamic state countdown timer in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(baseSecondsToDock);

  // Sync when vessel data updates
  useEffect(() => {
    setSecondsRemaining(baseSecondsToDock);
  }, [baseSecondsToDock]);

  // Dynamic ticking countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format mm:ss or hh:mm:ss
  const formattedCountdown = useMemo(() => {
    if (secondsRemaining <= 0) return '00:00 - DOCKING NOW';
    const hrs = Math.floor(secondsRemaining / 3600);
    const mins = Math.floor((secondsRemaining % 3600) / 60);
    const secs = secondsRemaining % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsRemaining]);

  // Approach Phase
  const approachPhase = useMemo(() => {
    if (secondsRemaining <= 30 || distanceNM <= 0.2) {
      return {
        name: 'Phase 4: Slipway Mooring & Gangway Lock',
        description: 'Vessel aligns to pontoon fenders, bow lines secured, turnstile opens',
        color: 'emerald',
        progress: 98,
      };
    }
    if (distanceNM <= 1.2 || secondsRemaining <= 300) {
      return {
        name: 'Phase 3: Final Port Basin Maneuvering',
        description: 'Speed decelerated to < 6 kts. Bow thrusters and harbor tug escort engaged',
        color: 'cyan',
        progress: 82,
      };
    }
    if (distanceNM <= 3.5 || secondsRemaining <= 900) {
      return {
        name: 'Phase 2: Harbor Fairway Inbound Channel',
        description: 'Navigating maritime separation scheme; AIS berthing clearance confirmed',
        color: 'sky',
        progress: 55,
      };
    }
    return {
      name: 'Phase 1: Open Water Passage',
      description: 'Cruising navigation lane at optimal speed with constant AIS beacon relay',
      color: 'indigo',
      progress: 28,
    };
  }, [distanceNM, secondsRemaining]);

  // List of other approaching vessels to quickly switch
  const approachingVessels = ferries.filter(
    (f) => f.status === 'approaching' || f.status === 'on_time' || f.status === 'delayed'
  );

  return (
    <div
      id="docking-countdown-timer-widget"
      className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 text-xs"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/80 flex items-center justify-center text-cyan-400">
            <Clock className="w-5 h-5 animate-spin [animation-duration:12s]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                Dynamic Time-to-Dock AIS Countdown
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                AIS Telemetry + Berthing Slot Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Exact seconds estimated until pontoon touch-down based on speed over ground, harbor currents, and quay occupancy.
            </p>
          </div>
        </div>

        {/* Quick Vessel Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Track Vessel:</span>
          <select
            value={selectedFerry.id}
            onChange={(e) => setSelectedFerryId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-500"
          >
            {approachingVessels.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.vesselId}) - {f.speedKnots} kts
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Countdown Display Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Vessel and Port info */}
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Ship className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-extrabold text-base tracking-tight">
              {selectedFerry.name}
            </span>
            <span className="text-slate-400 font-mono text-xs">({selectedFerry.vesselId})</span>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-300 text-xs">
            <span>Inbound to</span>
            <strong className="text-cyan-300">{targetPort?.name || 'Mandwa Terminal'}</strong>
            <span className="text-slate-500">•</span>
            <span className="text-amber-300 font-semibold">{berthingAvailability.berthCode}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-center md:justify-start gap-2">
            <Navigation className="w-3 h-3 text-slate-400" />
            <span>
              Remaining AIS Range:{' '}
              <strong className="text-white font-mono">{distanceNM.toFixed(2)} NM</strong>{' '}
              ({(distanceNM * 1.852).toFixed(1)} km)
            </span>
          </div>
        </div>

        {/* Center: Glowing Dynamic Countdown Clock */}
        <div className="flex flex-col items-center justify-center bg-slate-950 px-6 py-3 rounded-2xl border border-cyan-500/40 shadow-inner shadow-cyan-950/50">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Live Countdown to Touch-Down
          </span>
          <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-widest py-0.5 text-shadow">
            {formattedCountdown}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {secondsRemaining > 0
              ? `Docking Window: ~${Math.ceil(secondsRemaining / 60)} minutes remaining`
              : 'All lines fast to berth bollards'}
          </span>
        </div>

        {/* Right: Berthing Availability Status Pill */}
        <div className="space-y-1.5 text-center md:text-right w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-end gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                berthingAvailability.status === 'available'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                  : berthingAvailability.status === 'reserved'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700/80'
              }`}
            >
              {berthingAvailability.status === 'available' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Anchor className="w-3.5 h-3.5 animate-pulse" />
              )}
              <span>
                {berthingAvailability.status === 'available'
                  ? 'Berth Clear & Open'
                  : berthingAvailability.status === 'reserved'
                  ? 'Berth Assigned & Clearing'
                  : 'Berth Occupied (Queue Buffer)'}
              </span>
            </span>
          </div>

          <div className="text-[11px] text-slate-300">
            Available Slips:{' '}
            <strong className="text-white font-mono">
              {berthingAvailability.availableBerths} / {berthingAvailability.totalBerths}
            </strong>
          </div>
          <div className="text-[10px] text-slate-400 max-w-xs md:ml-auto">
            {berthingAvailability.message}
          </div>
        </div>
      </div>

      {/* Real-time Approach Phase Progress */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white text-xs">{approachPhase.name}</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 font-bold">
            {approachPhase.progress}% Progress to Berth
          </span>
        </div>

        <p className="text-[11px] text-slate-400">{approachPhase.description}</p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-1000 ease-out"
            style={{ width: `${approachPhase.progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
          <span>Fairway Waypoint Alpha</span>
          <span>Harbor Outer Breakwater</span>
          <span>Basin Deceleration</span>
          <span className="text-emerald-300 font-bold">Mooring Slip</span>
        </div>
      </div>

      {/* AIS Telemetry Breakdown Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-400" />
            Speed Over Ground (SOG)
          </span>
          <div className="text-base font-bold font-mono text-cyan-300">
            {speedKnots.toFixed(1)} kts
          </div>
          <div className="text-[10px] text-slate-400">
            ~{(speedKnots * 1.852).toFixed(1)} km/h • AIS Stream
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            Heading & Bearing
          </span>
          <div className="text-base font-bold font-mono text-white">
            {selectedFerry.heading}° True
          </div>
          <div className="text-[10px] text-slate-400">Harbor Navigation Line</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Anchor className="w-3 h-3 text-cyan-400" />
            Target Quay / Berth
          </span>
          <div className="text-base font-bold font-mono text-amber-300">
            {berthingAvailability.berthCode}
          </div>
          <div className="text-[10px] text-slate-400">
            {targetPort?.city || 'Mumbai Harbour'} • Gangway 2
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            Berthing Queue Hold
          </span>
          <div className="text-base font-bold font-mono text-emerald-400">
            {berthingAvailability.queueDelayMinutes > 0
              ? `+${berthingAvailability.queueDelayMinutes}m buffer`
              : '0m delay (Clear)'}
          </div>
          <div className="text-[10px] text-slate-400">VHF Marine Ch 12</div>
        </div>
      </div>
    </div>
  );
};
