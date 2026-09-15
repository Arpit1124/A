import React, { useState, useEffect, useRef } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Booking, Ferry, Trip, Port } from '../../types';
import {
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Ship,
  ArrowRight,
  Trash2,
  DoorOpen,
  Radio,
  ExternalLink,
  ShieldCheck,
  Check,
  Compass,
  MapPin,
  Navigation,
} from 'lucide-react';

export interface PushAlertMessage {
  id: string;
  timestamp: string;
  type:
    | 'delay'
    | 'cancellation'
    | 'gate_change'
    | 'boarding_start'
    | 'final_call'
    | 'gate_status_change'
    | 'departure_time_update'
    | 'proximity_5nm'
    | 'system';
  title: string;
  body: string;
  vesselName: string;
  vesselId: string;
  gateNumber?: string;
  distanceNM?: number;
  read: boolean;
}

interface PushNotificationServiceProps {
  bookings?: Booking[];
  ferries?: Ferry[];
  trips?: Trip[];
}

function calculateDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
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

function playPushChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.24); // D6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio autostart restrictions
  }
}

export const PushNotificationService: React.FC<PushNotificationServiceProps> = ({
  bookings: propBookings,
  ferries: propFerries,
  trips: propTrips,
}) => {
  const context = useFerry();
  const bookings = propBookings || context.bookings;
  const ferries = propFerries || context.ferries;
  const trips = propTrips || context.trips;
  const ports = context.ports;
  const routes = context.routes;
  const setActiveView = context.setActiveView;
  const setSelectedFerryId = context.setSelectedFerryId;

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [proximityAlertsEnabled, setProximityAlertsEnabled] = useState<boolean>(true);
  const [simulatedGate, setSimulatedGate] = useState<string>('G-3');

  const [alerts, setAlerts] = useState<PushAlertMessage[]>([
    {
      id: 'alert-init-proximity',
      timestamp: '2 mins ago',
      type: 'proximity_5nm',
      title: '🧭 Proximity Alert: Ocean Express within 5 NM of Mandwa',
      body: 'Your booked vessel Ocean Express (BK-2026-0901) has crossed into the 5.0 Nautical Mile approach zone (currently 3.8 NM / 7.0 km). Estimated dock arrival in ~12 mins at Gate G-1.',
      vesselName: 'Ocean Express',
      vesselId: 'FV-102',
      gateNumber: 'G-1',
      distanceNM: 3.8,
      read: false,
    },
    {
      id: 'alert-init-gate',
      timestamp: '8 mins ago',
      type: 'gate_change',
      title: 'Gate Assignment Update: Gate G-1 Active',
      body: 'Your Mandwa Ro-Pax passage (Ocean Express FV-102) is designated at Turnstile Gate G-1. Have QR passes ready.',
      vesselName: 'Ocean Express',
      vesselId: 'FV-102',
      gateNumber: 'G-1',
      read: false,
    },
  ]);

  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);
  const [toastAlert, setToastAlert] = useState<PushAlertMessage | null>(null);

  // Track previous statuses, gates, and proximity to avoid duplicate notifications
  const prevFerryStatuses = useRef<Record<string, string>>({});
  const prevTripGates = useRef<Record<string, string>>({});
  const prevTripGateStatuses = useRef<Record<string, string>>({});
  const prevTripDepartures = useRef<Record<string, { departure: string; delay: number }>>({});
  const prevTripStatuses = useRef<Record<string, string>>({});
  const prevProximity5NM = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        if (res === 'granted') {
          triggerPushAlert({
            id: `alert-perm-${Date.now()}`,
            timestamp: 'Just now',
            type: 'system',
            title: 'Push Notifications Activated',
            body: 'You will receive real-time OS push alerts for 5 NM port proximity, gate changes, and boarding calls even when the tab is in the background.',
            vesselName: 'Harbor Control',
            vesselId: 'MMB-DISPATCH',
            read: false,
          });
        }
      } catch (err) {
        console.error('Push notification request error:', err);
      }
    }
  };

  const triggerPushAlert = (alert: PushAlertMessage) => {
    // 1. Play sound chime if enabled
    if (soundEnabled) {
      playPushChime();
    }

    // 2. Add to in-app alerts state
    setAlerts((prev) => [alert, ...prev]);

    // 3. Display in-app floating toast
    setToastAlert(alert);
    setTimeout(() => {
      setToastAlert((current) => (current?.id === alert.id ? null : current));
    }, 7000);

    // 4. Trigger Native OS Web Notification (works even when tab is blurred, minimized, or backgrounded)
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const notif = new Notification(alert.title, {
          body: alert.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: alert.id,
          requireInteraction: alert.type === 'proximity_5nm' || alert.type === 'gate_change' || alert.type === 'boarding_start',
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.error('Web Push Notification error:', e);
      }
    }
  };

  // Automated monitoring: watch for real-time 5 NM Proximity, Gate Changes, Boarding Updates, and Ferry Status
  useEffect(() => {
    const activeBookings = bookings.filter(
      (b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'boarded'
    );

    activeBookings.forEach((b) => {
      const trip = trips.find((t) => t.id === b.tripId);
      if (!trip) return;

      const ferry = ferries.find((f) => f.id === trip.ferryId);
      if (!ferry) return;

      const route = routes.find((r) => r.id === trip.routeId);
      const destPortId = trip.destinationPortId || ferry.destinationPortId || route?.destinationPortId;
      const destPort = ports.find((p) => p.id === destPortId) || ports[1];

      // 1. REAL-TIME 5 NAUTICAL MILES PROXIMITY PUSH ALERT MONITOR
      if (proximityAlertsEnabled) {
        let distanceNM = 999;
        if (destPort?.coordinates && ferry.position) {
          const distKm = calculateDistanceInKm(
            ferry.position.lat,
            ferry.position.lng,
            destPort.coordinates.lat,
            destPort.coordinates.lng
          );
          distanceNM = kmToNauticalMiles(distKm);
        } else if (typeof trip.remainingDistanceKm === 'number') {
          distanceNM = kmToNauticalMiles(trip.remainingDistanceKm);
        }

        const isApproaching =
          trip.status === 'in_transit' || trip.status === 'approaching' || trip.status === 'delayed';
        const isWithin5NM = distanceNM <= 5.0 && distanceNM > 0.05 && isApproaching;
        const alreadyAlerted = prevProximity5NM.current[trip.id];

        if (isWithin5NM && !alreadyAlerted) {
          prevProximity5NM.current[trip.id] = true;
          const speed = ferry.speedKnots > 0 ? ferry.speedKnots : 15;
          const etaMin = Math.max(3, Math.round((distanceNM / speed) * 60));

          triggerPushAlert({
            id: `proximity-5nm-${trip.id}-${Date.now()}`,
            timestamp: 'Just now',
            type: 'proximity_5nm',
            title: `⚓ PROXIMITY ALERT: ${ferry.name} Within 5 NM of ${destPort?.name || 'Destination Port'}`,
            body: `Your booked vessel ${ferry.name} (Ref: ${b.bookingRef}) is now within 5 nautical miles (${distanceNM.toFixed(1)} NM / ${(distanceNM * 1.852).toFixed(1)} km) of ${destPort?.name || 'port'}. Estimated docking in ~${etaMin} minutes. Gate ${trip.gateNumber || 'G-1'} assigned. Prepare for arrival and disembarkation.`,
            vesselName: ferry.name,
            vesselId: ferry.vesselId,
            gateNumber: trip.gateNumber || 'G-1',
            distanceNM: Number(distanceNM.toFixed(1)),
            read: false,
          });
        } else if (distanceNM > 6.0) {
          // Reset proximity alert flag if trip resets or moves back out
          prevProximity5NM.current[trip.id] = false;
        }
      }

      // 2. Real-time Gate Change Monitor
      const currentGate = trip.gateNumber || 'G-1';
      const prevGate = prevTripGates.current[trip.id];
      if (prevGate && prevGate !== currentGate) {
        triggerPushAlert({
          id: `gate-change-${trip.id}-${Date.now()}`,
          timestamp: 'Just now',
          type: 'gate_change',
          title: `⚠️ GATE CHANGE: Gate ${prevGate} ➔ Gate ${currentGate}`,
          body: `Attention Passenger (${b.bookingRef}): Departure gate for ${ferry.name} has changed to Gate ${currentGate}. Please proceed to the new turnstile corridor.`,
          vesselName: ferry.name,
          vesselId: ferry.vesselId,
          gateNumber: currentGate,
          read: false,
        });
      }
      prevTripGates.current[trip.id] = currentGate;

      // 2b. Real-time Gate Status Change Monitor (e.g. Boarding Open, Final Call, Gate Closed)
      const currentGateStatus = trip.gateStatus || (trip.status === 'boarding' ? 'Boarding Open' : 'Gate Assigned');
      const prevGateStatus = prevTripGateStatuses.current[trip.id];
      if (prevGateStatus && prevGateStatus !== currentGateStatus) {
        triggerPushAlert({
          id: `gate-status-${trip.id}-${Date.now()}`,
          timestamp: 'Just now',
          type: 'gate_status_change',
          title: `🚨 GATE STATUS: ${currentGateStatus.toUpperCase()} (Gate ${currentGate})`,
          body: `Attention Passenger (${b.bookingRef}): Gate ${currentGate} for ${ferry.name} is now "${currentGateStatus}". Turnstile status: ${currentGateStatus === 'Boarding Open' ? 'Open for all ticket holders' : currentGateStatus === 'Final Call' ? 'Final call, boarding concluding' : currentGateStatus}.`,
          vesselName: ferry.name,
          vesselId: ferry.vesselId,
          gateNumber: currentGate,
          read: false,
        });
      }
      prevTripGateStatuses.current[trip.id] = currentGateStatus;

      // 2c. Real-time Departure Time Update Monitor
      const currentDep = trip.scheduledDeparture;
      const currentDelay = trip.delayMinutes || 0;
      const prevDep = prevTripDepartures.current[trip.id];
      if (prevDep && (prevDep.departure !== currentDep || prevDep.delay !== currentDelay)) {
        const timeDetail = prevDep.departure !== currentDep
          ? `rescheduled from ${prevDep.departure} to ${currentDep}`
          : `departure adjusted (+${currentDelay}m delay)`;

        triggerPushAlert({
          id: `dep-time-${trip.id}-${Date.now()}`,
          timestamp: 'Just now',
          type: 'departure_time_update',
          title: `⏱️ DEPARTURE TIME UPDATED: ${currentDep}`,
          body: `Attention Passenger (${b.bookingRef}): ${ferry.name} (Trip #${trip.tripNumber}) departure time ${timeDetail}. Assigned at Gate ${currentGate}.`,
          vesselName: ferry.name,
          vesselId: ferry.vesselId,
          gateNumber: currentGate,
          read: false,
        });
      }
      prevTripDepartures.current[trip.id] = { departure: currentDep, delay: currentDelay };

      // 3. Real-time Boarding Status Monitor
      const prevTripStatus = prevTripStatuses.current[trip.id];
      if (trip.status === 'boarding' && prevTripStatus !== 'boarding') {
        triggerPushAlert({
          id: `boarding-start-${trip.id}-${Date.now()}`,
          timestamp: 'Just now',
          type: 'boarding_start',
          title: `🚢 BOARDING COMMENCED: Gate ${currentGate}`,
          body: `Boarding turnstiles are now open for ${ferry.name} at Gate ${currentGate}. Priority boarding for Premium Class (Group A), followed by General (Group B).`,
          vesselName: ferry.name,
          vesselId: ferry.vesselId,
          gateNumber: currentGate,
          read: false,
        });
      }
      prevTripStatuses.current[trip.id] = trip.status;

      // 4. Real-time Ferry Delay / Emergency Monitor
      const prevFerryStatus = prevFerryStatuses.current[ferry.id];
      if (ferry.status === 'delayed' && prevFerryStatus !== 'delayed') {
        triggerPushAlert({
          id: `alert-delay-${ferry.id}-${Date.now()}`,
          timestamp: 'Just now',
          type: 'delay',
          title: `⚠️ Schedule Delay Alert: ${ferry.name}`,
          body: `Your booked passage (${b.bookingRef}) is buffered by ~15 mins due to vessel congestion in the channel. Gate ${currentGate} remains assigned.`,
          vesselName: ferry.name,
          vesselId: ferry.vesselId,
          gateNumber: currentGate,
          read: false,
        });
      }
      prevFerryStatuses.current[ferry.id] = ferry.status;
    });
  }, [ferries, bookings, trips, ports, routes, proximityAlertsEnabled]);

  // Interactive simulation triggers for user testing
  const handleSimulateGateChange = () => {
    const nextGate = simulatedGate === 'G-3' ? 'Gate G-4' : 'Gate G-3';
    setSimulatedGate(nextGate === 'Gate G-3' ? 'G-3' : 'G-4');

    triggerPushAlert({
      id: `sim-gate-${Date.now()}`,
      timestamp: 'Just now',
      type: 'gate_change',
      title: `🚨 GATE CHANGE ALERT: Moved to ${nextGate}`,
      body: `Harbor Operations update: Your departure on Ocean Express (Mandwa Ro-Pax) has moved from Gate G-1 to ${nextGate}. Turnstile readers updated.`,
      vesselName: 'Ocean Express',
      vesselId: 'FV-102',
      gateNumber: nextGate,
      read: false,
    });
  };

  const handleSimulateBoardingCall = () => {
    triggerPushAlert({
      id: `sim-boarding-${Date.now()}`,
      timestamp: 'Just now',
      type: 'boarding_start',
      title: '🟢 BOARDING STARTED: Proceed to Gate G-1',
      body: 'Turnstiles open for Mandwa Ro-Pax (Ocean Express). Boarding Group A (Premium) and vehicles now clearing gangways.',
      vesselName: 'Ocean Express',
      vesselId: 'FV-102',
      gateNumber: 'G-1',
      read: false,
    });
  };

  const handleSimulateFinalCall = () => {
    triggerPushAlert({
      id: `sim-final-${Date.now()}`,
      timestamp: 'Just now',
      type: 'final_call',
      title: '⏳ FINAL BOARDING CALL: Gate G-1 Closing in 4 Mins',
      body: 'Last call for booked passengers aboard Ocean Express. Gangways retracting shortly. Please present digital QR ticket immediately.',
      vesselName: 'Ocean Express',
      vesselId: 'FV-102',
      gateNumber: 'G-1',
      read: false,
    });
  };

  const handleSimulateDelay = () => {
    triggerPushAlert({
      id: `sim-delay-${Date.now()}`,
      timestamp: 'Just now',
      type: 'delay',
      title: '⚠️ Departure Delay Notice: +15 mins',
      body: 'Harbor AIS radar detected heavy cargo convoy in shipping fairway. Mandwa Ro-Pax departure rescheduled to 15:15 at Gate G-1.',
      vesselName: 'Ocean Express',
      vesselId: 'FV-102',
      gateNumber: 'G-1',
      read: false,
    });
  };

  const handleSimulate5NMProximityAlert = () => {
    const activeBooking =
      bookings.find((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'boarded') ||
      bookings[0];
    const trip = activeBooking
      ? trips.find((t) => t.id === activeBooking.tripId) || trips[0]
      : trips[0];
    const ferry = trip ? ferries.find((f) => f.id === trip.ferryId) || ferries[0] : ferries[0];
    const destPort = ports.find((p) => p.id === trip?.destinationPortId) || ports[1];

    triggerPushAlert({
      id: `sim-prox-5nm-${Date.now()}`,
      timestamp: 'Just now',
      type: 'proximity_5nm',
      title: `⚓ 5 NM PROXIMITY ALERT: ${ferry.name} Approaching ${destPort?.name || 'Mandwa'}`,
      body: `AIS Telemetry confirmed: Your booked vessel ${ferry.name} (${activeBooking?.bookingRef || 'BK-2026-0901'}) is now within 5 nautical miles (4.2 NM / 7.8 km) of ${destPort?.name || 'Mandwa Ro-Pax Terminal'}. Estimated docking in ~11 minutes at Gate ${trip?.gateNumber || 'G-1'}. Prepare for arrival.`,
      vesselName: ferry.name,
      vesselId: ferry.vesselId,
      gateNumber: trip?.gateNumber || 'G-1',
      distanceNM: 4.2,
      read: false,
    });
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  // Active bookings with calculated nautical distance to destination port
  const activeBookingsWithDistance = bookings
    .filter((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'boarded')
    .map((b) => {
      const trip = trips.find((t) => t.id === b.tripId);
      const ferry = trip ? ferries.find((f) => f.id === trip.ferryId) : undefined;
      const route = trip ? routes.find((r) => r.id === trip.routeId) : undefined;
      const destPortId = trip?.destinationPortId || ferry?.destinationPortId || route?.destinationPortId;
      const destPort = ports.find((p) => p.id === destPortId) || ports[1];

      let distanceNM = 999;
      if (destPort?.coordinates && ferry?.position) {
        const distKm = calculateDistanceInKm(
          ferry.position.lat,
          ferry.position.lng,
          destPort.coordinates.lat,
          destPort.coordinates.lng
        );
        distanceNM = kmToNauticalMiles(distKm);
      } else if (trip && typeof trip.remainingDistanceKm === 'number') {
        distanceNM = kmToNauticalMiles(trip.remainingDistanceKm);
      }

      const speed = (ferry?.speedKnots && ferry.speedKnots > 0) ? ferry.speedKnots : 15;
      const etaMinutes = Math.max(2, Math.round((distanceNM / speed) * 60));

      return {
        booking: b,
        trip,
        ferry,
        destPort,
        distanceNM: Number(distanceNM.toFixed(1)),
        isWithin5NM: distanceNM <= 5.0 && distanceNM > 0.05,
        etaMinutes,
      };
    });

  return (
    <div
      id="push-notification-service"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
    >
      {/* Toast Alert floating banner */}
      {toastAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-950/95 backdrop-blur-md border border-cyan-500/60 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 flex items-start gap-3 text-xs">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              toastAlert.type === 'cancellation'
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : toastAlert.type === 'proximity_5nm'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse'
                : toastAlert.type === 'gate_change'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : toastAlert.type === 'boarding_start'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
            }`}
          >
            {toastAlert.type === 'proximity_5nm' ? (
              <Compass className="w-5 h-5 text-cyan-400 animate-spin [animation-duration:8s]" />
            ) : toastAlert.type === 'gate_change' ? (
              <DoorOpen className="w-5 h-5 animate-pulse" />
            ) : toastAlert.type === 'boarding_start' ? (
              <Ship className="w-5 h-5 animate-bounce" />
            ) : toastAlert.type === 'cancellation' ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <BellRing className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{toastAlert.title}</span>
              <button
                type="button"
                onClick={() => setToastAlert(null)}
                className="text-slate-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{toastAlert.body}</p>
            <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono pt-1">
              <span>Dispatched to OS & lockscreen • {toastAlert.timestamp}</span>
              {toastAlert.distanceNM && (
                <span className="text-cyan-300 font-bold">{toastAlert.distanceNM} NM away</span>
              )}
              {toastAlert.gateNumber && (
                <span className="text-amber-300 font-bold ml-2">{toastAlert.gateNumber}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <BellRing className="w-5 h-5 animate-bounce [animation-duration:3s]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                Real-Time Push Notification & 5 NM Proximity Alert System
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                5 NM Geofence Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Alerts passengers when their booked ferry is within 5 nautical miles of port, plus gate updates and boarding calls.
            </p>
          </div>
        </div>

        {/* Action and Permission Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {permission !== 'granted' ? (
            <button
              type="button"
              onClick={requestPushPermission}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Browser Push Notifications</span>
            </button>
          ) : (
            <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OS Push Active</span>
            </span>
          )}

          {/* 5 NM Proximity Toggle */}
          <button
            type="button"
            onClick={() => setProximityAlertsEnabled(!proximityAlertsEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              proximityAlertsEnabled
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="Toggle 5 Nautical Miles Approach Geofence Alerts"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>5 NM Alerts: {proximityAlertsEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Sound Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1 ${
              soundEnabled
                ? 'bg-slate-800 text-cyan-300 border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Mute alert chimes' : 'Enable alert chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Alerts Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 relative border border-slate-700"
          >
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alerts Log</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Real-time 5 NM Approach Geofence HUD for Active Bookings */}
      {activeBookingsWithDistance.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>Live Port Approach Geofence Status (5 NM Threshold)</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              1 NM = 1.852 km • Real-time AIS Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeBookingsWithDistance.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  item.isWithin5NM
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">
                        {item.ferry?.name || 'Booked Ferry'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {item.booking.bookingRef}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Approaching: <strong className="text-slate-200">{item.destPort?.name || 'Destination Port'}</strong>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      item.isWithin5NM
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.isWithin5NM ? '⚡ WITHIN 5 NM' : 'IN TRANSIT'}
                  </span>
                </div>

                {/* Progress bar to 5 NM boundary */}
                <div className="space-y-1 my-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Distance to Port:</span>
                    <span className="text-cyan-300 font-bold">
                      {item.distanceNM < 900 ? `${item.distanceNM} NM (${(item.distanceNM * 1.852).toFixed(1)} km)` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-700 ${
                        item.isWithin5NM ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-cyan-600'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(5, (1 - Math.min(item.distanceNM, 10) / 10) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>10 NM Open Sea</span>
                    <span className="text-amber-400 font-semibold">5 NM Push Geofence</span>
                    <span>Docking Berth</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">
                    Est. Dock: <strong className="text-white font-mono">~{item.etaMinutes} mins</strong>
                  </span>
                  {item.ferry && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFerryId(item.ferry!.id);
                        setActiveView('live-tracking');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" />
                      <span>Track on Radar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-Time Simulation Buttons */}
      <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Test Real-Time Dispatch:</span>
          <span className="text-slate-400 text-[11px]">
            Simulate live proximity and terminal events to verify browser push notification delivery.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate 5 NM Proximity Alert */}
          <button
            type="button"
            onClick={handleSimulate5NMProximityAlert}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-[11px] font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test 5 NM Proximity Alert</span>
          </button>

          {/* Simulate Gate Change */}
          <button
            type="button"
            onClick={handleSimulateGateChange}
            className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Simulate Gate Change</span>
          </button>

          {/* Simulate Boarding Call */}
          <button
            type="button"
            onClick={handleSimulateBoardingCall}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Simulate Boarding Start</span>
          </button>

          {/* Simulate Final Call */}
          <button
            type="button"
            onClick={handleSimulateFinalCall}
            className="px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/80 text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Simulate Final Call</span>
          </button>

          {/* Simulate Delay */}
          <button
            type="button"
            onClick={handleSimulateDelay}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1"
          >
            <span>Delay Alert</span>
          </button>
        </div>
      </div>

      {/* Alerts Log Dropdown / History Drawer */}
      {showNotificationCenter && (
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 animate-in fade-in text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Dispatched Push Notification History ({alerts.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setAlerts([])}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    al.type === 'cancellation'
                      ? 'bg-rose-950/30 border-rose-900/60'
                      : al.type === 'proximity_5nm'
                      ? 'bg-cyan-950/40 border-cyan-700/70'
                      : al.type === 'gate_change'
                      ? 'bg-amber-950/30 border-amber-900/60'
                      : al.type === 'boarding_start'
                      ? 'bg-emerald-950/30 border-emerald-900/60'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          al.type === 'cancellation'
                            ? 'bg-rose-400'
                            : al.type === 'proximity_5nm'
                            ? 'bg-cyan-400 animate-ping'
                            : al.type === 'gate_change'
                            ? 'bg-amber-400'
                            : al.type === 'boarding_start'
                            ? 'bg-emerald-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <span className="font-bold text-white text-xs">{al.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({al.timestamp})</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{al.body}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                      <span>Vessel: {al.vesselName} ({al.vesselId})</span>
                      {al.distanceNM && (
                        <span className="text-cyan-300 font-bold">~{al.distanceNM} NM to port</span>
                      )}
                      {al.gateNumber && (
                        <span className="text-amber-300 font-bold">Assigned: {al.gateNumber}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                      OS Push
                    </span>
                    {al.type === 'proximity_5nm' && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetFerry = ferries.find((f) => f.vesselId === al.vesselId || f.name === al.vesselName);
                          if (targetFerry) setSelectedFerryId(targetFerry.id);
                          setActiveView('live-tracking');
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Radar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500 text-xs">
                No notification alerts currently logged.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
