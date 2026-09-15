import React, { useState, useEffect } from 'react';
import { Booking, Ferry, Route, Trip } from '../../types';
import {
  Wallet,
  QrCode,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  MapPin,
  Ship,
  Sparkles,
  CreditCard,
  Plus,
  Download,
  Share2,
  X,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Eye,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DigitalWalletProps {
  bookings: Booking[];
  routes: Route[];
  ferries: Ferry[];
  trips: Trip[];
  isOpen?: boolean;
  onClose?: () => void;
  onSelectBooking?: (bookingId: string) => void;
}

export const DigitalWallet: React.FC<DigitalWalletProps> = ({
  bookings,
  routes,
  ferries,
  trips,
  isOpen = true,
  onClose,
  onSelectBooking,
}) => {
  const activeBookings = bookings.filter((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'boarded');

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    activeBookings.length > 0 ? activeBookings[0].id : ''
  );
  const [highBrightnessMode, setHighBrightnessMode] = useState<boolean>(false);
  const [showWalletCard, setShowWalletCard] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(1450);
  const [voyagerMiles, setVoyagerMiles] = useState<number>(680);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');

  // Live anti-screenshot watermarked dynamic token ticking every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTimestamp(now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentBooking = activeBookings.find((b) => b.id === selectedBookingId) || activeBookings[0];
  const currentTrip = currentBooking ? trips.find((t) => t.id === currentBooking.tripId) : undefined;
  const currentRoute = currentBooking ? routes.find((r) => r.id === currentBooking.routeId) : undefined;
  const currentFerry = currentTrip ? ferries.find((f) => f.id === currentTrip.ferryId) : undefined;
  const currentPassengerName = currentBooking?.passengers[0]?.fullName || 'Passenger';

  const handleTopUp = () => {
    setWalletBalance((prev) => prev + 500);
    setVoyagerMiles((prev) => prev + 50);
    setDownloadToast('Added ₹500 to FerryPass Stored Value!');
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const handleDownloadPass = () => {
    setDownloadToast(`Exported digital boarding pass for ${currentPassengerName}!`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <div
      id="maritime-digital-wallet"
      className={`relative rounded-3xl border transition-all duration-300 overflow-hidden ${
        highBrightnessMode
          ? 'bg-white text-slate-950 border-white shadow-2xl ring-4 ring-cyan-400'
          : 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-cyan-500/40 text-white shadow-2xl'
      } p-5 sm:p-6 space-y-6`}
    >
      {/* Decorative ambient background */}
      {!highBrightnessMode && (
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-md ${
              highBrightnessMode
                ? 'bg-slate-950 text-cyan-400'
                : 'bg-cyan-950/80 border border-cyan-700/80 text-cyan-300'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  highBrightnessMode ? 'bg-slate-200 text-slate-900' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}
              >
                Virtual Passholder Wallet
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeBookings.length} Active {activeBookings.length === 1 ? 'Pass' : 'Passes'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Turnstile Smart Wallet</h2>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="toggle-turnstile-high-brightness"
            onClick={() => setHighBrightnessMode(!highBrightnessMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              highBrightnessMode
                ? 'bg-slate-950 text-cyan-300 hover:bg-slate-900'
                : 'bg-slate-950 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/60'
            }`}
            title="Max contrast mode for instant optical scanner detection at turnstiles"
          >
            {highBrightnessMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{highBrightnessMode ? 'Normal Mode' : 'Turnstile Scanner Boost'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Download Toast */}
      {downloadToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-cyan-950 border border-cyan-500 text-cyan-300 text-xs flex items-center gap-2 shadow-lg relative z-20"
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{downloadToast}</span>
        </motion.div>
      )}

      {/* Main Wallet Content: Left Card Stack + Right Quick-Access Turnstile QR */}
      {activeBookings.length > 0 && currentBooking ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Left Column (7 cols): Pass Stack + Frequent Voyager Stored Card */}
          <div className="lg:col-span-7 space-y-4">
            {/* Active Ticket Carousel / Selector Tabs */}
            <div className="space-y-2">
              <span className={`text-[11px] font-mono uppercase font-bold block ${highBrightnessMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Active Boarding Passes ({activeBookings.length})
              </span>

              <div className="space-y-2.5">
                {activeBookings.map((b, index) => {
                  const isSelected = b.id === currentBooking.id;
                  const bTrip = trips.find((t) => t.id === b.tripId);
                  const bRoute = routes.find((r) => r.id === b.routeId);

                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBookingId(b.id);
                        if (onSelectBooking) onSelectBooking(b.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? highBrightnessMode
                            ? 'bg-slate-100 border-slate-900 shadow-md ring-2 ring-slate-950'
                            : 'bg-slate-950 border-cyan-400 shadow-xl shadow-cyan-950/40'
                          : highBrightnessMode
                          ? 'bg-white border-slate-300 hover:bg-slate-50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950'
                                : highBrightnessMode
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-slate-900 text-cyan-400'
                            }`}
                          >
                            P{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold text-sm ${highBrightnessMode ? 'text-slate-950' : 'text-white'}`}
                              >
                                {bRoute?.name || 'Harbor Channel Crossing'}
                              </span>
                              {b.vehicle && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono text-[9px] font-bold">
                                  RO-PAX {b.vehicle.type}
                                </span>
                              )}
                            </div>
                            <div className={`text-xs mt-0.5 ${highBrightnessMode ? 'text-slate-600' : 'text-slate-400'}`}>
                              {b.passengers[0]?.fullName || 'Passenger'} • Gate {bTrip?.gateNumber || 'G1'} • Dep: {bTrip?.scheduledDeparture || 'Punctual'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                              bTrip?.gateStatus === 'Boarding Open' || bTrip?.gateStatus === 'Final Call'
                                ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                                : 'bg-cyan-500/20 text-cyan-600 border border-cyan-500/40'
                            }`}
                          >
                            {bTrip?.gateStatus || 'CONFIRMED'}
                          </span>
                          <div className={`font-mono text-xs font-bold mt-1 ${highBrightnessMode ? 'text-slate-900' : 'text-slate-300'}`}>
                            ₹{b.totalFareInr}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stored Value FerryPass & Frequent Voyager Miles Card */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                highBrightnessMode
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 border-slate-800 text-white'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs tracking-tight">FerryPass™ Stored Value Card</span>
                </div>
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/60">
                  Contactless NFC Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Available Balance</span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">₹{walletBalance}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Voyager Miles</span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-cyan-400">{voyagerMiles} nm</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/60">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Tap on turnstile pad for instant auto-deduct passage</span>
                </div>
                <button
                  type="button"
                  onClick={handleTopUp}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Top-Up</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Quick-Access Turnstile QR Scanner Pass */}
          <div className="lg:col-span-5">
            <div
              className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col items-center text-center space-y-4 ${
                highBrightnessMode
                  ? 'bg-white border-slate-950 shadow-2xl'
                  : 'bg-slate-950 border-cyan-500/50 shadow-2xl shadow-cyan-950/50'
              }`}
            >
              {/* Gate Callout Tag */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
                <div className="text-left">
                  <span className={`text-[10px] font-mono block ${highBrightnessMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    ASSIGNED GATE
                  </span>
                  <span className="font-mono text-base font-black text-cyan-400">
                    GATE {currentTrip?.gateNumber || '02'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-mono block ${highBrightnessMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    GATE STATUS
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {currentTrip?.gateStatus || 'BOARDING OPEN'}
                  </span>
                </div>
              </div>

              {/* Turnstile High-Contrast QR Code Card */}
              <div className="relative p-4 bg-white rounded-2xl shadow-inner border-2 border-slate-900/40">
                {/* Visual pulsating scan line */}
                <motion.div
                  animate={{ y: [0, 140, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent pointer-events-none z-10"
                />

                {/* Simulated high-density Turnstile QR Matrix */}
                <div className="w-44 h-44 sm:w-48 sm:h-48 bg-white flex items-center justify-center p-2">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-slate-950"
                    fill="currentColor"
                  >
                    {/* Outer corners / Finder patterns */}
                    <rect x="5" y="5" width="26" height="26" fill="black" rx="3" />
                    <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                    <rect x="13" y="13" width="10" height="10" fill="black" rx="1.5" />

                    <rect x="69" y="5" width="26" height="26" fill="black" rx="3" />
                    <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                    <rect x="77" y="13" width="10" height="10" fill="black" rx="1.5" />

                    <rect x="5" y="69" width="26" height="26" fill="black" rx="3" />
                    <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                    <rect x="13" y="77" width="10" height="10" fill="black" rx="1.5" />

                    {/* Data grid dots */}
                    <rect x="36" y="8" width="6" height="6" fill="black" />
                    <rect x="46" y="8" width="6" height="6" fill="black" />
                    <rect x="56" y="8" width="6" height="6" fill="black" />
                    <rect x="36" y="18" width="6" height="6" fill="black" />
                    <rect x="52" y="18" width="6" height="6" fill="black" />
                    <rect x="42" y="28" width="6" height="6" fill="black" />
                    <rect x="48" y="28" width="6" height="6" fill="black" />

                    <rect x="8" y="36" width="6" height="6" fill="black" />
                    <rect x="18" y="36" width="6" height="6" fill="black" />
                    <rect x="28" y="36" width="6" height="6" fill="black" />
                    <rect x="36" y="36" width="8" height="8" fill="black" />
                    <rect x="48" y="36" width="6" height="6" fill="black" />
                    <rect x="58" y="36" width="6" height="6" fill="black" />
                    <rect x="68" y="36" width="6" height="6" fill="black" />
                    <rect x="78" y="36" width="6" height="6" fill="black" />

                    <rect x="8" y="46" width="6" height="6" fill="black" />
                    <rect x="20" y="46" width="6" height="6" fill="black" />
                    <rect x="36" y="46" width="6" height="6" fill="black" />
                    <rect x="48" y="46" width="8" height="8" fill="black" />
                    <rect x="62" y="46" width="6" height="6" fill="black" />
                    <rect x="76" y="46" width="6" height="6" fill="black" />
                    <rect x="86" y="46" width="6" height="6" fill="black" />

                    <rect x="8" y="56" width="6" height="6" fill="black" />
                    <rect x="24" y="56" width="6" height="6" fill="black" />
                    <rect x="36" y="56" width="6" height="6" fill="black" />
                    <rect x="50" y="56" width="6" height="6" fill="black" />
                    <rect x="64" y="56" width="6" height="6" fill="black" />
                    <rect x="78" y="56" width="6" height="6" fill="black" />

                    <rect x="36" y="68" width="6" height="6" fill="black" />
                    <rect x="48" y="68" width="6" height="6" fill="black" />
                    <rect x="60" y="68" width="6" height="6" fill="black" />
                    <rect x="72" y="68" width="6" height="6" fill="black" />
                    <rect x="84" y="68" width="6" height="6" fill="black" />

                    <rect x="36" y="78" width="6" height="6" fill="black" />
                    <rect x="46" y="78" width="6" height="6" fill="black" />
                    <rect x="58" y="78" width="6" height="6" fill="black" />
                    <rect x="70" y="78" width="6" height="6" fill="black" />
                    <rect x="82" y="78" width="6" height="6" fill="black" />

                    <rect x="40" y="88" width="6" height="6" fill="black" />
                    <rect x="52" y="88" width="6" height="6" fill="black" />
                    <rect x="66" y="88" width="6" height="6" fill="black" />
                    <rect x="80" y="88" width="6" height="6" fill="black" />
                  </svg>
                </div>

                {/* Floating Anti-screenshot Watermark */}
                <div className="absolute bottom-1 right-2 text-[9px] font-mono font-bold text-slate-600 select-none">
                  LIVE SEC: {liveTimestamp}
                </div>
              </div>

              {/* Passenger & Ticket Code */}
              <div className="space-y-1">
                <div className="font-mono text-sm font-black tracking-widest text-cyan-400">
                  {currentBooking.bookingRef || `FERRY-${currentBooking.id.slice(0, 8).toUpperCase()}`}
                </div>
                <div className={`text-xs ${highBrightnessMode ? 'text-slate-700' : 'text-slate-300'}`}>
                  {currentPassengerName} • Seat {currentBooking.seatNumbers?.join(', ') || 'Deck 1'}
                </div>
              </div>

              {/* Turnstile Instructions */}
              <div
                className={`p-2.5 rounded-xl text-[11px] w-full border ${
                  highBrightnessMode
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 font-semibold text-cyan-400 mb-0.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Hold 10-15 cm Above Scanner Glass</span>
                </div>
                <span>Turnstile green beacon will chime upon successful manifest match.</span>
              </div>

              {/* Download / Export Button */}
              <div className="w-full flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPass}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save Offline Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
          <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Active Passes in Wallet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you confirm a ticket, your turnstile boarding passes and biometric gate QR tokens will appear here
            automatically.
          </p>
        </div>
      )}
    </div>
  );
};
