import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useFerry } from '../../context/FerryContext';
import { Booking } from '../../types';
import { OfflinePassStorage, OfflineCachedTicket } from './OfflinePassStorage';
import { PushNotificationService } from './PushNotificationService';
import { TripHistorySection } from './TripHistorySection';
import { FrequentVoyagerPoints } from './FrequentVoyagerPoints';
import { PassengerGateScanner } from './PassengerGateScanner';
import { DigitalTicketCard } from './DigitalTicketCard';
import { PassengerDashboardTour } from './PassengerDashboardTour';
import { PassengerLoyaltyBadge } from './PassengerLoyaltyBadge';
import { PassengerGateDepartureAlertSystem } from './PassengerGateDepartureAlertSystem';
import { DigitalWallet } from './DigitalWallet';
import { generateTicketPdf } from '../../utils/ticketPdfGenerator';
import {
  Ticket,
  Clock,
  Navigation,
  Ship,
  CheckCircle2,
  XCircle,
  Radio,
  Download,
  AlertTriangle,
  Star,
  MessageSquare,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Printer,
  WifiOff,
  Camera,
  FileText,
  Share2,
  Check,
  BellRing,
  History,
  Archive,
  Sparkles,
  Contrast,
  Compass,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export const PassengerDashboard: React.FC = () => {
  const {
    bookings,
    cancelBooking,
    routes,
    trips,
    ferries,
    setActiveView,
    setSelectedFerryId,
    simulatedSeconds,
    simulatedTime,
    openBoardingGuide,
    promptFeedbackForTrip,
  } = useFerry();

  const [selectedTicketForQR, setSelectedTicketForQR] = useState<Booking | OfflineCachedTicket | null>(null);
  const [modalShareFeedback, setModalShareFeedback] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<string>('Punctuality & Speed');
  const [feedbackComment, setFeedbackComment] = useState<string>('Very smooth Mandwa Ro-Pax experience.');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [showGateScanner, setShowGateScanner] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(true);
  const [isReloadingTickets, setIsReloadingTickets] = useState<boolean>(false);
  const [ticketListKey, setTicketListKey] = useState<number>(0);

  const handleReloadTickets = () => {
    setIsReloadingTickets(true);
    setTimeout(() => {
      setTicketListKey((k) => k + 1);
      setIsReloadingTickets(false);
    }, 350);
  };

  const boardingDashboardVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const ticketCardItemVariants: Variants = {
    hidden: { opacity: 0, y: 22, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 280,
        damping: 24,
      },
    },
  };

  const [highContrastMode, setHighContrastMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ferryflow_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHighContrast = () => {
    const next = !highContrastMode;
    setHighContrastMode(next);
    try {
      localStorage.setItem('ferryflow_high_contrast', String(next));
    } catch {
      // Ignore storage errors
    }
  };

  const [showWelcomeTourBanner, setShowWelcomeTourBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ferryflow_passenger_tour_completed') !== 'true';
    } catch {
      return true;
    }
  });

  // Dynamic automatic expiration determination
  const isBookingExpired = (b: Booking) => {
    if (b.bookingStatus === 'completed' || b.bookingStatus === 'cancelled') return true;
    const trip = trips.find((t) => t.id === b.tripId);
    if (trip?.status === 'arrived' || trip?.status === 'cancelled') return true;
    if (trip?.scheduledDeparture) {
      const [h, m] = trip.scheduledDeparture.split(':').map((v) => parseInt(v, 10) || 0);
      const depSecs = h * 3600 + m * 60;
      // If simulated time has elapsed past scheduled departure + duration buffer
      if (simulatedSeconds > depSecs + 50 * 60) return true;
    }
    return false;
  };

  const activeBookings = bookings.filter((b) => !isBookingExpired(b));
  const expiredBookings = bookings.filter((b) => isBookingExpired(b));

  const handleCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking? A 90% refund (₹162) will be credited to your source UPI/Card.')) {
      cancelBooking(bookingId);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackComment('');
    }, 3000);
  };

  const handlePrintBoardingPass = () => {
    window.print();
  };

  return (
    <div id="passenger-dashboard-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">
            Passenger Portal
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Bookings & Digital Tickets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your verifiable QR turnstile passes, live ferry radar tracking, and real-time voyage ETA updates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Requirement: High-Contrast Boarding Mode toggle */}
          <button
            type="button"
            id="high-contrast-boarding-mode-toggle"
            onClick={toggleHighContrast}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shadow-sm ${
              highContrastMode
                ? 'bg-yellow-400 text-black border-yellow-500 shadow-[0_0_16px_rgba(250,204,21,0.4)] font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border-slate-700'
            }`}
            title="Toggle High-Contrast Boarding Mode to maximize ticket colors and typography legibility in low-light ferry terminal conditions"
          >
            <Contrast className="w-4 h-4" />
            <span>{highContrastMode ? 'High-Contrast: ON' : 'High-Contrast Mode'}</span>
          </button>

          {/* Interactive Guided Tour Trigger Button */}
          <button
            type="button"
            id="start-guided-tour-btn"
            onClick={() => setIsTourOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            title="Launch interactive tour of passenger dashboard features"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Interactive Tour</span>
          </button>

          {/* Boarding Flow Guide Overlay Trigger */}
          <button
            type="button"
            id="passenger-boarding-flow-guide-btn"
            onClick={() => openBoardingGuide(activeBookings.length > 0 ? trips.find((t) => t.id === activeBookings[0].tripId) : undefined)}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-700/80 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            title="Open step-by-step terminal boarding guide checklist (ID check, luggage scan, gate entry)"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Boarding Flow Guide</span>
          </button>

          {/* Virtual Digital Wallet Trigger */}
          <button
            type="button"
            id="passenger-digital-wallet-btn"
            onClick={() => setIsWalletOpen(!isWalletOpen)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm border ${
              isWalletOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-cyan-950'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700'
            }`}
            title="Open virtual passholder wallet with stored tickets and fast-track turnstile QR"
          >
            <Wallet className="w-4 h-4" />
            <span>Digital Wallet ({activeBookings.length})</span>
          </button>

          <button
            type="button"
            id="turnstile-scanner-btn"
            onClick={() => setShowGateScanner(!showGateScanner)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 ${
              showGateScanner
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{showGateScanner ? 'Hide Gate Scanner' : 'Gate Camera QR Scanner'}</span>
          </button>

          <button
            onClick={() => setActiveView('book')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            <span>Book Another Ferry</span>
          </button>
        </div>
      </div>

      {/* High-Contrast Mode Active Banner */}
      {highContrastMode && (
        <div
          id="high-contrast-active-banner"
          className="bg-yellow-400 text-black border-2 border-yellow-500 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 font-semibold text-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-black animate-ping" />
            <div>
              <span className="font-black uppercase tracking-wider text-sm block">
                High-Contrast Boarding Mode Active
              </span>
              <span className="text-xs text-black/90 font-medium">
                Optimized with enlarged typography, pitch-black high contrast backgrounds, and stark border accents for dim ferry terminal turnstiles.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHighContrast}
            className="px-3.5 py-1.5 bg-black text-yellow-400 hover:bg-zinc-900 rounded-xl font-black text-xs transition-colors border border-black shadow"
          >
            Switch to Standard Mode
          </button>
        </div>
      )}

      {/* First-Time User Guided Tour Welcome Banner */}
      {showWelcomeTourBanner && (
        <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-sky-950/70 border border-cyan-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">New to FerryFlow? Take a 60-Second Guided Tour</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Discover how to scan QR passes at turnstiles, view real-time gate change alerts, and sync ferry crossings to your calendar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsTourOpen(true);
                setShowWelcomeTourBanner(false);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Start Interactive Tour</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowWelcomeTourBanner(false);
                try {
                  localStorage.setItem('ferryflow_passenger_tour_completed', 'true');
                } catch {
                  // Ignore storage errors
                }
              }}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Requirement: Real-Time Gate Status & Departure Time Alert Notification System */}
      <PassengerGateDepartureAlertSystem
        bookings={bookings}
        ferries={ferries}
        trips={trips}
        onOpenQR={(t) => setSelectedTicketForQR(t)}
      />

      {/* Requirement: Virtual 'Digital Wallet' Component storing active passes & quick-access gate turnstile QR */}
      <AnimatePresence>
        {isWalletOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <DigitalWallet
              bookings={activeBookings}
              routes={routes}
              ferries={ferries}
              trips={trips}
              isOpen={isWalletOpen}
              onClose={() => setIsWalletOpen(false)}
              onSelectBooking={(id) => {
                const found = activeBookings.find((b) => b.id === id);
                if (found) setSelectedTicketForQR(found);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requirement: Passenger Loyalty badge reflecting frequent traveler status based on total trips taken */}
      <PassengerLoyaltyBadge bookings={bookings} />

      {/* FREQUENT VOYAGER LOYALTY POINTS & REWARD TIER TRACKER */}
      <FrequentVoyagerPoints bookings={bookings} />

      {/* CAMERA TURNSTILE GATE QR SCANNER */}
      {showGateScanner && (
        <PassengerGateScanner onClose={() => setShowGateScanner(false)} />
      )}

      {/* Automated Push Notification Monitor Service */}
      <PushNotificationService bookings={bookings} ferries={ferries} trips={trips} />

      {/* Offline Local State Persistence Engine */}
      <OfflinePassStorage
        bookings={bookings}
        routes={routes}
        trips={trips}
        ferries={ferries}
        onOpenQR={(t) => setSelectedTicketForQR(t)}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulateOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
      />

      {/* Requirement: Boarding Flow Guide - Visual checklist of terminal steps */}
      <div
        id="terminal-boarding-flow-guide-banner"
        className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-sky-950/80 border border-cyan-500/40 rounded-2xl p-5 shadow-xl space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Terminal Boarding Flow Guide</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  DEPARTURE CHECKLIST
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Step-by-step visual guidance through ID check, luggage screening, and turnstile QR gate entry to reduce terminal delays.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="open-terminal-flow-guide-action-btn"
            onClick={() => openBoardingGuide(activeBookings.length > 0 ? trips.find((t) => t.id === activeBookings[0].tripId) : undefined)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Launch Visual Checklist</span>
          </button>
        </div>

        {/* 3 Step Visual Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">1</span>
            <span className="text-slate-300 font-medium">Government Photo ID Check</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">2</span>
            <span className="text-slate-300 font-medium">Luggage X-Ray & Screening</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">3</span>
            <span className="text-slate-300 font-medium">Turnstile QR Digital Pass Entry</span>
          </div>
        </div>
      </div>

      {/* Requirement: Context-Aware Feedback Prompt - Visible to Passengers, Ratings Audited in AdminPortal */}
      <div
        id="post-voyage-feedback-prompt-banner"
        className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Rate Your Journey Experience</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ADMIN AUDIT EXCLUSIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Traveled recently? Rate your pier boarding speed and vessel seating comfort. Feedback is directly reviewed by port administrators.
            </p>
          </div>
        </div>
        <button
          type="button"
          id="prompt-post-trip-feedback-btn"
          onClick={() => {
            const lastTrip = trips.find((t) => t.status === 'arrived') || trips[0];
            promptFeedbackForTrip(lastTrip, bookings[0]?.bookingRef || 'BK-MUMBAI-EXP');
          }}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Rate Boarding & Comfort</span>
        </button>
      </div>

      {/* Active Bookings Section */}
      <div id="active-boarding-passes-section" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Active & Upcoming Passages ({activeBookings.length})</span>
          </h2>

          <button
            type="button"
            id="reload-ticket-details-btn"
            onClick={handleReloadTickets}
            disabled={isReloadingTickets}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-cyan-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            title="Reload ticket details with staggered entrance animation"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isReloadingTickets ? 'animate-spin' : ''}`} />
            <span>{isReloadingTickets ? 'Loading Ticket Details...' : 'Reload Ticket Details'}</span>
          </button>
        </div>

        {activeBookings.length > 0 ? (
          <motion.div
            key={`boarding-passes-list-${ticketListKey}`}
            variants={boardingDashboardVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4"
          >
            {activeBookings.map((b) => (
              <motion.div key={b.id} variants={ticketCardItemVariants}>
                <DigitalTicketCard
                  booking={b}
                  onOpenQR={(ticket) => setSelectedTicketForQR(ticket)}
                  onCancel={(id) => handleCancel(id)}
                  isPastTrip={false}
                  highContrast={highContrastMode}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-3">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-bold text-white text-base">No Active Bookings</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any upcoming ferry passages. Book your next journey in seconds.
            </p>
            <button
              onClick={() => setActiveView('book')}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Book Now
            </button>
          </div>
        )}
      </div>

      {/* TICKET HISTORY ARCHIVE SECTION (Automatically moves expired tickets to scrollable archive list with visual 'Past Trip' watermark) */}
      <div id="ticket-history-section" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <span>Ticket History & Archived Passes ({expiredBookings.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Expired and concluded passages are automatically moved to this scrollable archive with official 'Past Trip' validation watermarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scrollable Archive ({expiredBookings.length} Trips)</span>
            </span>
          </div>
        </div>

        {expiredBookings.length > 0 ? (
          <div
            id="ticket-history-scrollable-list"
            className="max-h-[580px] overflow-y-auto pr-2 space-y-4 rounded-2xl scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950"
          >
            {expiredBookings.map((b) => (
              <DigitalTicketCard
                key={b.id}
                booking={b}
                onOpenQR={(ticket) => setSelectedTicketForQR(ticket)}
                onCancel={(id) => handleCancel(id)}
                isPastTrip={true}
                highContrast={highContrastMode}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="font-semibold text-slate-300 text-sm">No Expired Tickets in Archive</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Whenever an upcoming voyage completes or the scheduled arrival passes, your digital boarding pass will automatically transition here.
            </p>
          </div>
        )}
      </div>

      {/* TRIP HISTORY LOG & YEAR FILTER SECTION */}
      <TripHistorySection />

      {/* FEEDBACK & RATINGS FORM */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Passenger Voyage Feedback</h2>
        </div>
        <p className="text-xs text-slate-400">
          Share your experience with Maharashtra Maritime Board and Harbor authorities to improve harbor service quality.
        </p>

        {feedbackSubmitted ? (
          <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Thank you for your rating! Your feedback has been logged to the Port Operations Command.</span>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-slate-300 font-semibold">Your Overall Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Feedback Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                >
                  <option value="Punctuality & Speed">Punctuality & Speed</option>
                  <option value="Terminal Boarding Gates">Terminal Boarding Gates</option>
                  <option value="Vessel Cleanliness & Seating">Vessel Cleanliness & Seating</option>
                  <option value="Safety Briefing & Crew Conduct">Safety Briefing & Crew Conduct</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Comments or Suggestions</label>
                <input
                  type="text"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share details about your journey..."
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>

      {/* MODAL: QR TICKET PREVIEW & OFFLINE BOARDING PASS */}
      <AnimatePresence>
        {selectedTicketForQR && (() => {
          const selectedTrip = trips.find((t) => t.id === (selectedTicketForQR as any).tripId);
          const selectedDepartureStr = selectedTrip?.scheduledDeparture || '14:45';
          const [sDepH, sDepM] = selectedDepartureStr.split(':').map((v) => parseInt(v, 10) || 0);
          const sDepSeconds = sDepH * 3600 + sDepM * 60;
          const sBoardingSeconds = sDepSeconds - 15 * 60;
          const sSecsUntilDeparture = sDepSeconds - simulatedSeconds;
          const sSecsUntilBoarding = sBoardingSeconds - simulatedSeconds;
          const sMinsUntilDeparture = Math.round(sSecsUntilDeparture / 60);
          const sIsWithin30Mins = sSecsUntilDeparture > 0 && sSecsUntilDeparture <= 30 * 60;

          const handleModalShare = async () => {
            const shareTitle = `FerryFlow Boarding Pass • ${selectedTicketForQR.bookingRef}`;
            const shareText = `🚢 FerryFlow Boarding Pass: ${selectedTicketForQR.bookingRef}\nDeparture: ${selectedDepartureStr} at Gate ${selectedTrip?.gateNumber || 'G-1'}\nSeats: ${selectedTicketForQR.seatNumbers?.join(', ') || 'General Deck'}`;

            if (navigator.share) {
              try {
                await navigator.share({
                  title: shareTitle,
                  text: shareText,
                  url: window.location.href,
                });
                setModalShareFeedback('Shared successfully!');
                setTimeout(() => setModalShareFeedback(null), 3000);
                return;
              } catch (err: any) {
                if (err.name === 'AbortError') return;
              }
            }

            try {
              await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${window.location.href}`);
              setModalShareFeedback('Pass copied to clipboard!');
            } catch {
              setModalShareFeedback(`Ref ${selectedTicketForQR.bookingRef}`);
            }
            setTimeout(() => setModalShareFeedback(null), 3000);
          };

          return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div className="font-bold text-white text-base">Digital Boarding Pass</div>
                  </div>
                  <button
                    onClick={() => setSelectedTicketForQR(null)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Departure Alert Banner within 30 minutes */}
                {sIsWithin30Mins && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span>Departs in <strong>{sMinsUntilDeparture}m</strong>! Turnstiles close 10m prior.</span>
                    </div>
                    <span className="font-mono font-bold text-amber-300 text-[10px] bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/50">
                      T-{sMinsUntilDeparture}m
                    </span>
                  </div>
                )}

                {/* Offline Verified Pass Badge */}
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold">Offline Verified Turnstile Pass</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Local Cache Stored
                  </span>
                </div>

                {/* Dynamic 'Boarding Starts In' Countdown Timer */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Boarding Status:</span>
                  </div>
                  <div className="font-mono font-bold">
                    {sSecsUntilBoarding > 0 ? (
                      <span className="text-cyan-400">
                        Boarding Starts In: {Math.floor(sSecsUntilBoarding / 60)}m{' '}
                        {(sSecsUntilBoarding % 60).toString().padStart(2, '0')}s
                      </span>
                    ) : sSecsUntilDeparture > 0 ? (
                      <span className="text-emerald-400 animate-pulse">
                        Boarding Open • Gate {selectedTrip?.gateNumber || 'G-1'}
                      </span>
                    ) : (
                      <span className="text-slate-400">Voyage Departed</span>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="28" height="28" fill="#030712" />
                      <rect x="15" y="15" width="18" height="18" fill="white" />
                      <rect x="20" y="20" width="8" height="8" fill="#030712" />
                      <rect x="62" y="10" width="28" height="28" fill="#030712" />
                      <rect x="67" y="15" width="18" height="18" fill="white" />
                      <rect x="72" y="20" width="8" height="8" fill="#030712" />
                      <rect x="10" y="62" width="28" height="28" fill="#030712" />
                      <rect x="15" y="67" width="18" height="18" fill="white" />
                      <rect x="20" y="72" width="8" height="8" fill="#030712" />
                      <rect x="42" y="14" width="6" height="14" fill="#030712" />
                      <rect x="14" y="44" width="14" height="6" fill="#030712" />
                      <rect x="44" y="44" width="14" height="14" fill="#030712" />
                      <rect x="64" y="48" width="10" height="10" fill="#030712" />
                      <rect x="46" y="68" width="10" height="16" fill="#030712" />
                      <rect x="68" y="68" width="20" height="8" fill="#030712" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-mono font-bold text-cyan-400 tracking-wider">
                      {selectedTicketForQR.bookingRef}
                    </div>
                    <div className="text-xs text-slate-300">
                      Present this QR at port turnstile scanner or mobile AIS ticket terminal.
                    </div>
                  </div>

                  {/* Voyage Summary Grid */}
                  <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Seats</span>
                      <span className="font-mono text-white font-semibold">
                        {selectedTicketForQR.seatNumbers?.join(', ') || 'General Deck'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Total Fare</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        ₹{selectedTicketForQR.totalFareInr} Paid
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                      <span>MMB TURNSTILE AUTH: VALID</span>
                      <span>HMAC-SHA256 SIGNED</span>
                    </div>
                  </div>
                </div>

                {/* Share Notification Feedback */}
                {modalShareFeedback && (
                  <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{modalShareFeedback}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      const bkg = bookings.find((b) => b.id === selectedTicketForQR.id) || (selectedTicketForQR as any);
                      const trip = trips.find((t) => t.id === bkg?.tripId);
                      const route = routes.find((r) => r.id === bkg?.routeId);
                      const ferry = ferries.find((f) => f.id === trip?.ferryId);
                      generateTicketPdf({ booking: bkg, route, trip, ferry });
                    }}
                    className="flex-1 py-2.5 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    title="Download formatted printable PDF boarding pass"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={handleModalShare}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    title="Share pass details via messaging apps"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={handlePrintBoardingPass}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => setSelectedTicketForQR(null)}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Interactive Guided Tour Modal */}
      <PassengerDashboardTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={() => setShowWelcomeTourBanner(false)}
      />
    </div>
  );
};
