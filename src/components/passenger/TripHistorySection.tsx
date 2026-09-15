import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Booking, Route, Ferry } from '../../types';
import {
  History,
  Calendar,
  Ship,
  Navigation,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Filter,
  Search,
  ArrowRight,
  TrendingDown,
  Sparkles,
  MapPin,
  Ticket,
  ChevronDown,
  Printer,
  X,
  Repeat,
} from 'lucide-react';

export interface PastJourneyItem {
  id: string;
  bookingRef: string;
  tripNumber: string;
  year: number;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  routeId: string;
  routeName: string;
  originPort: string;
  destinationPort: string;
  distanceKm: number;
  vesselId: string;
  vesselName: string;
  vesselType: string;
  scheduledDeparture: string;
  actualDeparture: string;
  scheduledArrival: string;
  actualArrival: string;
  durationMin: number;
  passengers: { name: string; seat: string; category: string }[];
  vehicle?: string;
  totalFareInr: number;
  paymentMethod: string;
  status: 'completed' | 'cancelled' | 'refunded';
  punctuality: 'on_time' | 'minor_delay' | 'cancelled';
  delayMinutes: number;
  co2SavedKg: number;
}

const HISTORICAL_JOURNEYS: PastJourneyItem[] = [
  {
    id: 'hist-2026-1',
    bookingRef: 'BK-2026-0819-74',
    tripNumber: 'TRP-101',
    year: 2026,
    date: '2026-08-19',
    formattedDate: '19 Aug 2026',
    routeId: 'route-1',
    routeName: 'Gateway of India ⇄ Mandwa Ro-Pax',
    originPort: 'Gateway of India (Terminal 1)',
    destinationPort: 'Mandwa Ro-Pax Jetty (Berth 2)',
    distanceKm: 18.5,
    vesselId: 'FV-102',
    vesselName: 'M.V. Mandwa Pride',
    vesselType: 'High-Speed Ro-Pax Catamaran',
    scheduledDeparture: '08:30',
    actualDeparture: '08:32',
    scheduledArrival: '09:15',
    actualArrival: '09:16',
    durationMin: 44,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Upper Deck A12', category: 'Adult' },
      { name: 'Sneha Verma', seat: 'Upper Deck A13', category: 'Adult' },
    ],
    vehicle: 'Sedan (MH-01-DE-4412)',
    totalFareInr: 1260,
    paymentMethod: 'UPI (Google Pay)',
    status: 'completed',
    punctuality: 'on_time',
    delayMinutes: 1,
    co2SavedKg: 9.8,
  },
  {
    id: 'hist-2026-2',
    bookingRef: 'BK-2026-0704-18',
    tripNumber: 'TRP-104',
    year: 2026,
    date: '2026-07-04',
    formattedDate: '04 Jul 2026',
    routeId: 'route-2',
    routeName: 'Gateway of India ⇄ Elephanta Caves',
    originPort: 'Gateway of India (Terminal 3)',
    destinationPort: 'Elephanta Island Pier',
    distanceKm: 11.2,
    vesselId: 'FV-104',
    vesselName: 'Elephanta Queen',
    vesselType: 'Twin-Screw Heritage Cruise',
    scheduledDeparture: '11:00',
    actualDeparture: '11:05',
    scheduledArrival: '11:55',
    actualArrival: '12:00',
    durationMin: 55,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Main Deck B04', category: 'Adult' },
    ],
    totalFareInr: 260,
    paymentMethod: 'Credit Card (Visa ending 8812)',
    status: 'completed',
    punctuality: 'minor_delay',
    delayMinutes: 5,
    co2SavedKg: 5.4,
  },
  {
    id: 'hist-2026-3',
    bookingRef: 'BK-2026-0512-92',
    tripNumber: 'TRP-108',
    year: 2026,
    date: '2026-05-12',
    formattedDate: '12 May 2026',
    routeId: 'route-3',
    routeName: 'Bhaucha Dhakka ⇄ Mora Pier (Uran)',
    originPort: 'Bhaucha Dhakka (Ferry Wharf)',
    destinationPort: 'Mora Pier Jetty',
    distanceKm: 14.0,
    vesselId: 'FV-105',
    vesselName: 'Harbour Queen',
    vesselType: 'Steel Hull Commuter Ferry',
    scheduledDeparture: '06:45',
    actualDeparture: '06:45',
    scheduledArrival: '07:30',
    actualArrival: '07:28',
    durationMin: 43,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Economy C18', category: 'Adult' },
    ],
    totalFareInr: 90,
    paymentMethod: 'UPI (Paytm)',
    status: 'completed',
    punctuality: 'on_time',
    delayMinutes: 0,
    co2SavedKg: 6.2,
  },
  {
    id: 'hist-2025-1',
    bookingRef: 'BK-2025-1224-63',
    tripNumber: 'TRP-092',
    year: 2025,
    date: '2025-12-24',
    formattedDate: '24 Dec 2025',
    routeId: 'route-1',
    routeName: 'Gateway of India ⇄ Mandwa Ro-Pax',
    originPort: 'Gateway of India (Terminal 1)',
    destinationPort: 'Mandwa Ro-Pax Jetty (Berth 1)',
    distanceKm: 18.5,
    vesselId: 'FV-101',
    vesselName: 'Ocean Queen',
    vesselType: 'High-Speed Ro-Pax Ferry',
    scheduledDeparture: '16:15',
    actualDeparture: '16:20',
    scheduledArrival: '17:05',
    actualArrival: '17:10',
    durationMin: 50,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Captain Lounge VIP-1', category: 'Adult' },
      { name: 'Sneha Verma', seat: 'Captain Lounge VIP-2', category: 'Adult' },
    ],
    vehicle: 'SUV (MH-01-DE-4412)',
    totalFareInr: 1540,
    paymentMethod: 'NetBanking (HDFC Bank)',
    status: 'completed',
    punctuality: 'on_time',
    delayMinutes: 5,
    co2SavedKg: 10.2,
  },
  {
    id: 'hist-2025-2',
    bookingRef: 'BK-2025-1018-44',
    tripNumber: 'TRP-085',
    year: 2025,
    date: '2025-10-18',
    formattedDate: '18 Oct 2025',
    routeId: 'route-4',
    routeName: 'Belapur (Navi Mumbai) ⇄ Elephanta Island',
    originPort: 'Belapur Water Taxi Terminal',
    destinationPort: 'Elephanta Island Pier',
    distanceKm: 15.6,
    vesselId: 'FV-106',
    vesselName: 'Navi Mumbai Jet',
    vesselType: 'Express Monohull Water Taxi',
    scheduledDeparture: '09:30',
    actualDeparture: '09:30',
    scheduledArrival: '10:00',
    actualArrival: '09:58',
    durationMin: 28,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Jet Pass J08', category: 'Adult' },
    ],
    totalFareInr: 450,
    paymentMethod: 'UPI (PhonePe)',
    status: 'completed',
    punctuality: 'on_time',
    delayMinutes: 0,
    co2SavedKg: 8.5,
  },
  {
    id: 'hist-2025-3',
    bookingRef: 'BK-2025-0402-11',
    tripNumber: 'TRP-044',
    year: 2025,
    date: '2025-04-02',
    formattedDate: '02 Apr 2025',
    routeId: 'route-1',
    routeName: 'Gateway of India ⇄ Mandwa Ro-Pax',
    originPort: 'Gateway of India (Terminal 2)',
    destinationPort: 'Mandwa Ro-Pax Jetty (Berth 2)',
    distanceKm: 18.5,
    vesselId: 'FV-102',
    vesselName: 'M.V. Mandwa Pride',
    vesselType: 'High-Speed Ro-Pax Catamaran',
    scheduledDeparture: '14:00',
    actualDeparture: '14:08',
    scheduledArrival: '14:48',
    actualArrival: '14:55',
    durationMin: 47,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Standard B21', category: 'Adult' },
    ],
    totalFareInr: 180,
    paymentMethod: 'UPI (BHIM)',
    status: 'completed',
    punctuality: 'minor_delay',
    delayMinutes: 7,
    co2SavedKg: 9.8,
  },
  {
    id: 'hist-2024-1',
    bookingRef: 'BK-2024-1110-81',
    tripNumber: 'TRP-018',
    year: 2024,
    date: '2024-11-10',
    formattedDate: '10 Nov 2024',
    routeId: 'route-1',
    routeName: 'Gateway of India ⇄ Mandwa Ro-Pax',
    originPort: 'Gateway of India (Terminal 1)',
    destinationPort: 'Mandwa Ro-Pax Jetty (Berth 1)',
    distanceKm: 18.5,
    vesselId: 'FV-101',
    vesselName: 'Ocean Queen',
    vesselType: 'High-Speed Ro-Pax Ferry',
    scheduledDeparture: '10:00',
    actualDeparture: '10:00',
    scheduledArrival: '10:45',
    actualArrival: '10:44',
    durationMin: 44,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Upper Deck A01', category: 'Adult' },
      { name: 'Sneha Verma', seat: 'Upper Deck A02', category: 'Adult' },
    ],
    totalFareInr: 360,
    paymentMethod: 'Credit Card (Mastercard)',
    status: 'completed',
    punctuality: 'on_time',
    delayMinutes: 0,
    co2SavedKg: 9.8,
  },
  {
    id: 'hist-2024-2',
    bookingRef: 'BK-2024-0315-05',
    tripNumber: 'TRP-007',
    year: 2024,
    date: '2024-03-15',
    formattedDate: '15 Mar 2024',
    routeId: 'route-2',
    routeName: 'Gateway of India ⇄ Elephanta Caves',
    originPort: 'Gateway of India (Terminal 3)',
    destinationPort: 'Elephanta Island Pier',
    distanceKm: 11.2,
    vesselId: 'FV-104',
    vesselName: 'Elephanta Queen',
    vesselType: 'Heritage Tourist Ferry',
    scheduledDeparture: '13:30',
    actualDeparture: '13:35',
    scheduledArrival: '14:25',
    actualArrival: '14:30',
    durationMin: 55,
    passengers: [
      { name: 'Rohit K. Verma', seat: 'Open Deck F11', category: 'Adult' },
    ],
    totalFareInr: 240,
    paymentMethod: 'Debit Card (SBI)',
    status: 'completed',
    punctuality: 'minor_delay',
    delayMinutes: 5,
    co2SavedKg: 5.4,
  },
];

export const TripHistorySection: React.FC = () => {
  const { theme, setActiveView, setPreselectedRouteIdForBooking } = useFerry();
  const isDark = theme === 'dark';

  const [selectedYear, setSelectedYear] = useState<'all' | '2026' | '2025' | '2024'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PastJourneyItem | null>(null);

  // Filter journeys by year and search
  const filteredJourneys = useMemo(() => {
    return HISTORICAL_JOURNEYS.filter((j) => {
      const matchYear = selectedYear === 'all' || j.year.toString() === selectedYear;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        j.routeName.toLowerCase().includes(q) ||
        j.vesselName.toLowerCase().includes(q) ||
        j.vesselId.toLowerCase().includes(q) ||
        j.bookingRef.toLowerCase().includes(q);
      return matchYear && matchSearch;
    });
  }, [selectedYear, searchQuery]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalTrips = filteredJourneys.length;
    const totalDistance = filteredJourneys.reduce((sum, j) => sum + j.distanceKm, 0);
    const totalCO2 = filteredJourneys.reduce((sum, j) => sum + j.co2SavedKg, 0);
    const totalSpend = filteredJourneys.reduce((sum, j) => sum + j.totalFareInr, 0);
    return {
      totalTrips,
      totalDistance: Math.round(totalDistance),
      totalNauticalMiles: (totalDistance * 0.539957).toFixed(1),
      totalCO2: totalCO2.toFixed(1),
      totalSpend,
    };
  }, [filteredJourneys]);

  const handleRebook = (routeId: string) => {
    if (setPreselectedRouteIdForBooking) {
      setPreselectedRouteIdForBooking(routeId);
    }
    setActiveView('book');
  };

  return (
    <div id="passenger-trip-history-section" className="space-y-6">
      {/* E-Receipt / Tax Invoice Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">Maharashtra Maritime Board E-Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono">
                <div>
                  <span className="text-slate-500 block">Booking Reference</span>
                  <span className="font-bold text-cyan-400">{selectedReceipt.bookingRef}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Voyage Date</span>
                  <span className="font-bold">{selectedReceipt.formattedDate}</span>
                </div>
              </div>

              <div className="space-y-1 py-1">
                <div className="flex justify-between text-slate-400">
                  <span>Maritime Route:</span>
                  <span className="font-semibold text-white">{selectedReceipt.routeName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Assigned Vessel:</span>
                  <span className="font-semibold text-cyan-300">{selectedReceipt.vesselName} ({selectedReceipt.vesselId})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Departure Time:</span>
                  <span>{selectedReceipt.scheduledDeparture} (Actual: {selectedReceipt.actualDeparture})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Arrival Time:</span>
                  <span>{selectedReceipt.scheduledArrival} (Actual: {selectedReceipt.actualArrival})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Duration:</span>
                  <span>{selectedReceipt.durationMin} minutes ({selectedReceipt.distanceKm} km)</span>
                </div>
              </div>

              {/* Passengers Breakdown */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Passenger Manifest:</span>
                <div className="space-y-1">
                  {selectedReceipt.passengers.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                      <span>{p.name} ({p.category})</span>
                      <span className="font-mono text-cyan-300">{p.seat}</span>
                    </div>
                  ))}
                  {selectedReceipt.vehicle && (
                    <div className="flex justify-between text-[11px] bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                      <span>Vehicle Passage: {selectedReceipt.vehicle}</span>
                      <span className="font-mono text-emerald-400">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Paid & Payment Method */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">Payment Method</span>
                  <span className="font-medium text-slate-300">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Total Amount Paid</span>
                  <span className="text-lg font-extrabold font-mono text-emerald-400">₹{selectedReceipt.totalFareInr}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Voyage & Trip History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log of all completed journeys, departures, assigned maritime vessels, seat passes, and tax receipts
          </p>
        </div>

        {/* Filter by Year Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Year:</span>
          </span>
          {(['all', '2026', '2025', '2024'] as const).map((yr) => (
            <button
              key={yr}
              type="button"
              id={`filter-year-${yr}`}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {yr === 'all' ? 'All Years' : yr}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Ribbon for Filtered Years */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Voyages Logged</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-white">{stats.totalTrips}</span>
            <Ship className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{selectedYear === 'all' ? 'Lifetime record' : `In year ${selectedYear}`}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Distance Traveled</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-cyan-300">{stats.totalNauticalMiles} NM</span>
            <Navigation className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{stats.totalDistance} Total Kilometers</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">CO₂ Emissions Avoided</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">-{stats.totalCO2} kg</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">vs. Highway traffic detour</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Total Ticket Spend</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-300">₹{stats.totalSpend.toLocaleString('en-IN')}</span>
            <Ticket className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">100% Tax Deductible</span>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter trip history by route name, vessel (e.g. Mandwa Pride), or booking ref..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Journey List Cards */}
      <div className="space-y-3">
        {filteredJourneys.length > 0 ? (
          filteredJourneys.map((journey) => (
            <div
              key={journey.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-xl transition-all space-y-4"
            >
              {/* Card Top Row: Route, Date, Status */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {journey.bookingRef}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Trip {journey.tripNumber}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{journey.formattedDate}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{journey.routeName}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed {journey.delayMinutes > 0 ? `(+${journey.delayMinutes}m)` : 'On-Time'}</span>
                  </span>
                </div>
              </div>

              {/* Vessel & Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Commercial Vessel</span>
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300 mt-0.5">
                    <Ship className="w-3.5 h-3.5" />
                    <span>{journey.vesselName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono">[{journey.vesselId}] • {journey.vesselType}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Departure Times</span>
                  <div className="font-bold text-white mt-0.5 font-mono">
                    Sched: {journey.scheduledDeparture}
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono">Actual: {journey.actualDeparture}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Arrival & Duration</span>
                  <div className="font-bold text-white mt-0.5 font-mono">
                    Sched: {journey.scheduledArrival}
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono">Actual: {journey.actualArrival} ({journey.durationMin}m)</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Fare Paid & Seats</span>
                  <div className="font-bold text-emerald-400 mt-0.5 font-mono">
                    ₹{journey.totalFareInr} ({journey.paymentMethod.split(' ')[0]})
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    {journey.passengers.map((p) => p.seat).join(', ')}
                  </span>
                </div>
              </div>

              {/* Passenger Badges and Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Passengers:</span>
                  {journey.passengers.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-medium">
                      {p.name} ({p.seat})
                    </span>
                  ))}
                  {journey.vehicle && (
                    <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 text-[11px]">
                      🚗 {journey.vehicle}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(journey)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View E-Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRebook(journey.routeId)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Rebook Route</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Voyages Found</h4>
            <p className="text-xs text-slate-500">
              No historical ferry journeys match your current search or year filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
