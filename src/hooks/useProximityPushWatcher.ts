import { useEffect, useRef } from 'react';
import { useFerry } from '../context/FerryContext';

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

function playPushChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.24);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio autostart policy
  }
}

/**
 * Global background push notification hook that monitors active passenger bookings
 * and triggers a browser Notification when their ferry enters within 5 nautical miles
 * of the destination port.
 */
export function useProximityPushWatcher() {
  const { bookings, ferries, trips, ports, routes } = useFerry();
  const alerted5NMTrips = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const activeBookings = bookings.filter(
      (b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'boarded'
    );

    activeBookings.forEach((booking) => {
      const trip = trips.find((t) => t.id === booking.tripId);
      if (!trip) return;

      const ferry = ferries.find((f) => f.id === trip.ferryId);
      if (!ferry) return;

      const route = routes.find((r) => r.id === trip.routeId);
      const destPortId = trip.destinationPortId || ferry.destinationPortId || route?.destinationPortId;
      const destPort = ports.find((p) => p.id === destPortId) || ports[1];

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
      const alreadyAlerted = alerted5NMTrips.current[trip.id];

      if (isWithin5NM && !alreadyAlerted) {
        alerted5NMTrips.current[trip.id] = true;
        const speed = ferry.speedKnots > 0 ? ferry.speedKnots : 15;
        const etaMinutes = Math.max(3, Math.round((distanceNM / speed) * 60));

        playPushChime();

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const notif = new Notification(`⚓ 5 NM Proximity Alert: ${ferry.name}`, {
              body: `Your booked vessel ${ferry.name} (${booking.bookingRef}) is now within 5 nautical miles (${distanceNM.toFixed(1)} NM) of ${destPort?.name || 'port'}. Estimated docking in ~${etaMinutes} mins at Gate ${trip.gateNumber || 'G-1'}. Prepare for arrival.`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `prox-5nm-${trip.id}`,
            });

            notif.onclick = () => {
              window.focus();
              notif.close();
            };
          } catch (e) {
            console.error('Proximity push notification error:', e);
          }
        }
      } else if (distanceNM > 6.0) {
        alerted5NMTrips.current[trip.id] = false;
      }
    });
  }, [bookings, ferries, trips, ports, routes]);
}
