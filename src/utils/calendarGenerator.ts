import { Booking, Route, Trip, Ferry, Port } from '../types';

interface GenerateIcsParams {
  booking: Booking;
  route?: Route;
  trip?: Trip;
  ferry?: Ferry;
  originPort?: Port;
  destinationPort?: Port;
}

/**
 * Formats a Date object into iCalendar UTC string format: YYYYMMDDTHHMMSSZ
 */
function formatDateToIcsUtc(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates an RFC 5545 compliant .ics iCalendar file string and triggers client-side download
 */
export function generateTicketIcs({
  booking,
  route,
  trip,
  ferry,
  originPort,
  destinationPort,
}: GenerateIcsParams): void {
  // Parse trip date or default to today/tomorrow
  const bookingDateStr = booking.bookingDate || new Date().toISOString().split('T')[0];
  const departureStr = trip?.scheduledDeparture || '14:45';
  const arrivalStr = trip?.estimatedArrival || '15:35';

  const [depH, depM] = departureStr.split(':').map((v) => parseInt(v, 10) || 0);
  const [arrH, arrM] = arrivalStr.split(':').map((v) => parseInt(v, 10) || 0);

  const [year, month, day] = bookingDateStr.split('-').map((v) => parseInt(v, 10) || 0);

  // Local departure date
  const startDate = new Date(year, (month || 1) - 1, day || 1, depH, depM, 0);

  // Local arrival date (account for same-day crossing)
  const endDate = new Date(year, (month || 1) - 1, day || 1, arrH, arrM, 0);
  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setHours(startDate.getHours() + 1);
  }

  const now = new Date();
  const dtStamp = formatDateToIcsUtc(now);
  const dtStart = formatDateToIcsUtc(startDate);
  const dtEnd = formatDateToIcsUtc(endDate);

  const routeName = route?.name || 'Harbour Ferry Passage';
  const vesselName = ferry?.name ? `${ferry.name} (${ferry.vesselId})` : 'FerryFlow Vessel';
  const originName = originPort?.name || 'Gateway Pier';
  const destName = destinationPort?.name || 'Mandwa Pier';
  const gate = trip?.gateNumber || 'G-1';
  const seatList = booking.seatNumbers.join(', ');
  const ticketClass = booking.ticketClass || 'Standard';
  const boardingGroup = booking.boardingGroup || 'Group B';

  const summary = `🚢 Ferry: ${routeName} (Ref: ${booking.bookingRef})`;
  const location = `${originName}, Gate ${gate} to ${destName}`;
  const description = [
    `FerryFlow Maritime Boarding Pass`,
    `Pass Ref: ${booking.bookingRef}`,
    `Route: ${routeName}`,
    `Vessel: ${vesselName}`,
    `Departure: ${departureStr} from Gate ${gate}`,
    `Estimated Arrival: ${arrivalStr} at ${destName}`,
    `Seats: ${seatList}`,
    `Class: ${ticketClass} (${boardingGroup})`,
    `Passengers: ${booking.passengers.map((p) => p.fullName).join(', ')}`,
    booking.vehicle ? `Vehicle: ${booking.vehicle.type} (${booking.vehicle.registrationNumber})` : '',
    `Important: Please arrive at Gate ${gate} 15 minutes prior to scheduled departure. Have your QR code ready at turnstiles.`,
  ]
    .filter(Boolean)
    .join('\\n');

  const uid = `ferryflow-${booking.bookingRef}-${Date.now()}@ferryflow.in`;

  // Format RFC 5545 iCalendar data
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FerryFlow Maritime Solutions//Boarding Pass Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    // 30-minute departure alert notification
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Ferry departure in 30 minutes: ${routeName} at Gate ${gate}`,
    'END:VALARM',
    // 15-minute boarding start alert
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Turnstiles opening now: Boarding for ${vesselName} at Gate ${gate}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Trigger file download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `FerryFlow-Voyage-${booking.bookingRef}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
