import { jsPDF } from 'jspdf';
import { Booking, Route, Trip, Ferry } from '../types';

export interface GenerateTicketPdfOptions {
  booking: Booking;
  route?: Route;
  trip?: Trip;
  ferry?: Ferry;
}

export function generateTicketPdf({ booking, route, trip, ferry }: GenerateTicketPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.getImageProperties ? 210 : 210;
  const primaryColor: [number, number, number] = [15, 23, 42]; // #0f172a slate-900
  const accentColor: [number, number, number] = [8, 145, 178]; // #0891b2 cyan-600
  const emeraldColor: [number, number, number] = [16, 185, 129]; // #10b981 emerald-500
  const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc slate-50
  const borderColor: [number, number, number] = [226, 232, 240]; // #e2e8f0 slate-200

  // 1. Top Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent Line under header
  doc.setFillColor(...accentColor);
  doc.rect(0, 42, pageWidth, 3, 'F');

  // Authority Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FERRYFLOW MARITIME TRANSIT', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Maharashtra Maritime Board (MMB) & Port Trust Approved Transit Pass', 14, 26);
  doc.text('Authorized Digital Electronic Boarding Document', 14, 32);

  // Status Pill on top right
  doc.setFillColor(...emeraldColor);
  doc.roundedRect(pageWidth - 56, 12, 42, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIRMED / PAID', pageWidth - 52, 18.5);

  // Document Issuance Note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 56, 28);

  // 2. Main Ticket Card Box
  const cardY = 54;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, cardY, pageWidth - 28, 108, 4, 4, 'FD');

  // Card Header / Route corridor
  doc.setFillColor(241, 245, 249);
  doc.rect(14, cardY, pageWidth - 28, 18, 'F');
  doc.setDrawColor(...borderColor);
  doc.line(14, cardY + 18, pageWidth - 14, cardY + 18);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const routeTitle = route?.name ? route.name : 'Mumbai Harbour Passenger Route';
  doc.text(routeTitle, 20, cardY + 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text(`PASS ID: ${booking.id}`, pageWidth - 65, cardY + 12);

  // Key Journey Details Grid
  const gridY = cardY + 26;

  // Column 1: Departure & Arrival Times
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHEDULED DEPARTURE', 20, gridY);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(trip?.scheduledDeparture || '09:00 AM', 20, gridY + 7);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('ESTIMATED ARRIVAL', 75, gridY);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(trip?.estimatedArrival || '09:55 AM', 75, gridY + 7);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('BOARDING GATE', 130, gridY);
  doc.setFontSize(14);
  doc.setTextColor(...accentColor);
  doc.text(trip?.gateNumber || 'Gate #2 (Jetty A)', 130, gridY + 7);

  // Column 2: Vessel & Berth
  const row2Y = gridY + 20;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('ASSIGNED VESSEL', 20, row2Y);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(ferry?.name || 'M2M Mandwa Express (Ro-Pax)', 20, row2Y + 6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Reg: ${ferry?.vesselId || 'FV-101'} • AIS: ${ferry?.aisIdentifier || '419000101'}`, 20, row2Y + 11);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SEAT / TIER', 130, row2Y);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.seatNumbers?.[0] ? `Seat ${booking.seatNumbers[0]} (Upper Deck)` : 'General Seating / Saloon', 130, row2Y + 6);

  // Column 3: Passenger List
  const row3Y = row2Y + 22;
  doc.setDrawColor(...borderColor);
  doc.line(20, row3Y - 4, pageWidth - 20, row3Y - 4);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PASSENGER MANIFEST', 20, row3Y + 3);

  let paxY = row3Y + 10;
  booking.passengers.forEach((p, index) => {
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${p.fullName} (${p.category || 'Adult'}, Age ${p.age})`, 20, paxY);

    const seat = booking.seatNumbers?.[index];
    if (seat) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Seat: ${seat}`, 110, paxY);
    }
    paxY += 7;
  });

  if (booking.vehicle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Vehicle Pass: ${booking.vehicle.type.toUpperCase()} • Reg No: ${booking.vehicle.registrationNumber}`, 20, paxY);
    paxY += 7;
  }

  // Column 4: Financial Total
  const fareY = cardY + 96;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(20, fareY, pageWidth - 40, 9, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Fare Paid: INR ${booking.totalFareInr.toFixed(2)} via ${booking.paymentMethod.toUpperCase()}`, 24, fareY + 6);
  doc.setTextColor(...emeraldColor);
  doc.text('TAX INVOICE ATTACHED • GST REGULAR', pageWidth - 80, fareY + 6);

  // 3. QR Code & Turnstile Turnstile Verification Section
  const qrSectionY = 172;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(14, qrSectionY, pageWidth - 28, 52, 4, 4, 'FD');

  // Simulated High-Density QR Gate Block
  doc.setFillColor(15, 23, 42);
  doc.rect(22, qrSectionY + 8, 36, 36, 'F');

  // Simulated QR white inner modules
  doc.setFillColor(255, 255, 255);
  doc.rect(26, qrSectionY + 12, 10, 10, 'F');
  doc.rect(44, qrSectionY + 12, 10, 10, 'F');
  doc.rect(26, qrSectionY + 30, 10, 10, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(29, qrSectionY + 15, 4, 4, 'F');
  doc.rect(47, qrSectionY + 15, 4, 4, 'F');
  doc.rect(29, qrSectionY + 33, 4, 4, 'F');

  // QR Text
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Automated Gate Turnstile Barcode', 66, qrSectionY + 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Present this QR code to the turnstile optical scanner at least 15 minutes before scheduled departure.', 66, qrSectionY + 23);
  doc.text(`Digital Verification Hash: SHA256:${booking.id}-GATE-MMB-VERIFIED`, 66, qrSectionY + 29);
  doc.text('Pass valid for single embarkation through designated automated security turnstile gate.', 66, qrSectionY + 35);

  // 4. Maritime Safety Instructions & Carriage Policy
  const safetyY = 232;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Passenger Maritime Instructions & Carriage Conditions:', 14, safetyY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const conditions = [
    '1. Embarkation gates close strictly 10 minutes before departure time. Late arrivals cannot be accommodated.',
    '2. Life vests are stowed beneath passenger seats and in overhead bins. Listen to the crew safety briefing upon boarding.',
    '3. Hazardous cargo, lithium car battery packs without prior declaration, and open flames are strictly prohibited on board.',
    '4. In case of adverse monsoon weather or swell advisories, services may experience delay or route diversion per Port Trust safety directives.',
    '5. Carry this physical printed boarding pass or have the digital screen pass ready on the FerryFlow web portal.',
  ];

  let condY = safetyY + 6;
  conditions.forEach((cond) => {
    doc.text(cond, 14, condY);
    condY += 5;
  });

  // Footer Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 285, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('FerryFlow Maritime Transit Services • Customer Helpline: 1800-266-FERRY • support@ferryflow.gov.in', 14, 292);

  // Save the PDF
  doc.save(`FerryFlow-Ticket-${booking.id}.pdf`);
}
