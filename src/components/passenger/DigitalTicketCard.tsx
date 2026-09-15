import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useFerry } from '../../context/FerryContext';
import { Booking } from '../../types';
import { generateTicketPdf } from '../../utils/ticketPdfGenerator';
import { generateTicketIcs } from '../../utils/calendarGenerator';
import { TerminalMapModal } from './TerminalMapModal';
import {
  Ship,
  Clock,
  Radio,
  Download,
  Share2,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  Check,
  Flame,
  ArrowRight,
  Waves,
  Wind,
  Sun,
  MapPin,
  Sparkles,
  RotateCcw,
  Compass,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Calendar,
  Users,
  Car,
  Info,
  Star,
  MessageSquare,
  Send,
  Edit3,
  Award,
} from 'lucide-react';

interface DigitalTicketCardProps {
  booking: Booking;
  onOpenQR: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
  isPastTrip?: boolean;
  highContrast?: boolean;
}

export const DigitalTicketCard: React.FC<DigitalTicketCardProps> = ({
  booking,
  onOpenQR,
  onCancel,
  isPastTrip = false,
  highContrast = false,
}) => {
  const {
    trips,
    routes,
    ferries,
    ports,
    setActiveView,
    setSelectedFerryId,
    simulatedSeconds,
    simulatedTime,
    openBoardingGuide,
    promptFeedbackForTrip,
  } = useFerry();
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showTerminalMap, setShowTerminalMap] = useState<boolean>(false);
  const [showWeatherDetails, setShowWeatherDetails] = useState<boolean>(false);

  const trip = trips.find((t) => t.id === booking.tripId);
  const route = routes.find((r) => r.id === booking.routeId);
  const ferry = ferries.find((f) => f.id === trip?.ferryId);
  const originPort = ports.find((p) => p.id === trip?.originPortId) || ports[0];
  const destinationPort = ports.find((p) => p.id === trip?.destinationPortId);

  // Parse scheduled departure time (format: "HH:mm")
  const departureStr = trip?.scheduledDeparture || '14:45';
  const [depH, depM] = departureStr.split(':').map((val) => parseInt(val, 10) || 0);
  const departureSeconds = depH * 3600 + depM * 60;

  // Boarding gate opens 15 minutes before scheduled departure
  const boardingStartSeconds = departureSeconds - 15 * 60;

  // Real-time second offsets synchronized with FerryContext simulated clock
  const secondsUntilDeparture = departureSeconds - simulatedSeconds;
  const secondsUntilBoarding = boardingStartSeconds - simulatedSeconds;
  const minutesUntilDeparture = Math.round(secondsUntilDeparture / 60);

  // Automatic visual alert when departure time is within 30 minutes (only for active trips)
  const isWithin30MinAlert = !isPastTrip && secondsUntilDeparture > 0 && secondsUntilDeparture <= 30 * 60;
  const isUrgentDeparting = !isPastTrip && secondsUntilDeparture > 0 && secondsUntilDeparture <= 10 * 60;

  // Boarding countdown text
  const formatCountdown = (secs: number) => {
    if (secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  // Requirement: Boarding Group visual indicator based on ticket class (e.g. Premium, Standard)
  const ticketClass =
    booking.ticketClass ||
    (booking.seatNumbers.some((s) => s.startsWith('A') || s.startsWith('VIP'))
      ? 'Premium'
      : booking.vehicle
      ? 'Standard'
      : 'Standard');

  const boardingGroup =
    booking.boardingGroup ||
    (ticketClass === 'Premium'
      ? 'Group A'
      : booking.vehicle
      ? 'Group V'
      : 'Group B');

  // Requirement: Weather impact badge displaying real-time sea conditions and influence on trip schedule
  const waveHeight = originPort?.weather?.waveHeightM ?? 0.6;
  const windKnots = originPort?.weather?.windKnots ?? 12;
  const rawCondition = originPort?.weather?.condition || 'Sunny';

  let seaState: 'Calm' | 'Choppy' | 'Rough' = 'Calm';
  let scheduleImpactText = 'On-Time Crossing Expected • No sea swell delays';
  let badgeColorClasses = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300';

  if (waveHeight >= 1.3 || windKnots >= 20 || rawCondition.includes('Rough')) {
    seaState = 'Rough';
    scheduleImpactText = 'High Swell Alert • Possible +10-15m transit variance, open decks secured';
    badgeColorClasses = 'bg-rose-950/60 border-rose-500/50 text-rose-300';
  } else if (waveHeight >= 0.8 || windKnots >= 14 || rawCondition.includes('Chop') || rawCondition.includes('Breezy')) {
    seaState = 'Choppy';
    scheduleImpactText = 'Moderate Sea Swell • Speed buffered by ~3-5m for passenger comfort';
    badgeColorClasses = 'bg-amber-950/60 border-amber-500/50 text-amber-300';
  } else {
    seaState = 'Calm';
    scheduleImpactText = 'Smooth Sea State • Favorable channel conditions, scheduled on-time arrival';
    badgeColorClasses = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
  }

  // Requirement: Share button with Web Share API and graceful clipboard fallback
  const handleShare = async () => {
    const shareTitle = `FerryFlow Boarding Pass • ${booking.bookingRef}`;
    const shareText = `🚢 FerryFlow Maritime Boarding Pass
Route: ${route?.name || 'Harbour Ferry Express'}
Vessel: ${ferry?.name || 'Vessel'} (${ferry?.vesselId || 'FV'})
Class: ${ticketClass} (${boardingGroup})
Departure: ${departureStr} at Gate ${trip?.gateNumber || 'G-1'}
Seats: ${booking.seatNumbers.join(', ')}
Pass ID: ${booking.bookingRef}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        setShareFeedback('Boarding pass shared successfully!');
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${window.location.href}`);
      setShareFeedback('Pass copied to clipboard for messaging apps!');
    } catch {
      setShareFeedback(`Pass ${booking.bookingRef} ready to share`);
    }
    setTimeout(() => setShareFeedback(null), 3000);
  };

  // Requirement: Download as PDF
  const handleDownloadPdf = () => {
    generateTicketPdf({ booking, route, trip, ferry });
  };

  // Requirement: 'Add to Calendar' button that generates an .ics file download
  const handleAddToCalendar = () => {
    try {
      generateTicketIcs({
        booking,
        route,
        trip,
        ferry,
        originPort,
        destinationPort,
      });
      setShareFeedback('Voyage added to calendar! .ics file downloaded for Google / Apple / Outlook.');
      setTimeout(() => setShareFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to generate calendar event', err);
    }
  };

  // Requirement: Post-trip feedback section for expired tickets in Ticket History archive
  interface TripFeedbackRecord {
    rating: number;
    tags: string[];
    comment: string;
    submittedAt: string;
  }

  const feedbackStorageKey = `ferryflow_post_trip_feedback_${booking.id}`;
  const [savedFeedback, setSavedFeedback] = useState<TripFeedbackRecord | null>(() => {
    try {
      const stored = localStorage.getItem(feedbackStorageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isEditingFeedback, setIsEditingFeedback] = useState<boolean>(false);
  const [ratingScore, setRatingScore] = useState<number>(savedFeedback?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    savedFeedback?.tags || ['Punctual Crossing', 'Clean Vessel', 'Smooth Sea State']
  );
  const [commentText, setCommentText] = useState<string>(
    savedFeedback?.comment || 'Smooth Ro-Pax crossing with quick turnstile clearance.'
  );
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState<string | null>(null);

  const availableReviewTags = [
    'Punctual Crossing',
    'Clean Vessel',
    'Polite Crew',
    'Smooth Sea State',
    'Turnstile Speed',
    'Comfortable Seating',
    'Clear Announcements',
    'Safe Gangway Flow',
  ];

  const toggleReviewTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFeedbackFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: TripFeedbackRecord = {
      rating: ratingScore,
      tags: selectedTags,
      comment: commentText.trim(),
      submittedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    try {
      localStorage.setItem(feedbackStorageKey, JSON.stringify(record));
    } catch (err) {
      console.error('Failed to persist feedback', err);
    }
    setSavedFeedback(record);
    setIsEditingFeedback(false);
    setFeedbackSuccessToast('Post-trip feedback logged! +50 Frequent Voyager miles credited.');
    setTimeout(() => setFeedbackSuccessToast(null), 4000);
  };

  const ticketCardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: 'easeOut',
        staggerChildren: 0.08,
        delayChildren: 0.04,
      },
    },
  };

  const ticketSectionVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: 'easeOut',
      },
    },
  };

  return (
    <>
      <motion.div
        id={`ticket-card-${booking.id}`}
        variants={ticketCardVariants}
        initial="hidden"
        animate="show"
        className={`rounded-2xl p-6 shadow-xl space-y-5 border transition-all relative overflow-hidden ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white shadow-[0_0_35px_rgba(250,204,21,0.3)] ring-2 ring-yellow-400'
            : isPastTrip
            ? 'bg-slate-900/80 border-slate-800/80 opacity-90'
            : isUrgentDeparting
            ? 'bg-slate-900 border-amber-500/80 ring-2 ring-amber-500/30'
            : isWithin30MinAlert
            ? 'bg-slate-900 border-amber-500/50'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* High-Contrast Mode Low-Light Readability Badge */}
        {highContrast && (
          <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl flex flex-wrap items-center justify-between font-black text-xs uppercase tracking-wider shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
              <span>HIGH-CONTRAST TERMINAL READABILITY MODE ACTIVE</span>
            </div>
            <span className="font-mono text-xs bg-black text-yellow-300 px-2.5 py-0.5 rounded font-black">
              GATE {trip?.gateNumber || 'G-1'} • DEPARTURE {departureStr}
            </span>
          </div>
        )}

        {/* Requirement: Visual 'Past Trip' Watermark on expired/past tickets */}
        {isPastTrip && (
          <div
            id={`past-trip-watermark-${booking.id}`}
            className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10 select-none opacity-20 sm:opacity-25"
          >
            <div className="transform -rotate-12 border-4 border-dashed border-slate-400/90 px-8 py-2.5 rounded-2xl shadow-sm bg-slate-950/40">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest text-slate-400 font-mono">
                PAST TRIP
              </span>
            </div>
          </div>
        )}

        {/* Departure Alert Banner (Active trips within 30 min) */}
        {isWithin30MinAlert && (
          <div
            id={`departure-alert-${booking.id}`}
            className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border text-xs ${
              isUrgentDeparting
                ? 'bg-rose-950/60 border-rose-500/70 text-rose-200 animate-pulse'
                : 'bg-amber-950/50 border-amber-500/60 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  isUrgentDeparting ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="font-bold uppercase tracking-wide text-[11px] block">
                  {isUrgentDeparting ? 'Final Boarding Call — Gate Closing Soon' : 'Upcoming Departure Alert'}
                </span>
                <span className="text-[11px] opacity-90">
                  Departure in <strong className="underline font-mono">{minutesUntilDeparture} minutes</strong> (
                  {departureStr}). Turnstiles close 10 mins prior at Gate {trip?.gateNumber || 'G-1'}.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-950/80 border border-amber-500/40 text-amber-300 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>T-Minus {minutesUntilDeparture}m</span>
            </div>
          </div>
        )}

        {/* Ticket Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-md shrink-0">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`font-bold tracking-tight ${
                    highContrast ? 'text-2xl text-yellow-300 font-black' : 'text-lg text-white'
                  }`}
                >
                  {route?.name || 'Gateway to Mandwa Express'}
                </h3>
                <span
                  className={`font-mono font-bold rounded ${
                    highContrast
                      ? 'text-xs px-2.5 py-1 bg-yellow-400 text-black font-black border border-black'
                      : 'text-xs px-2 py-0.5 bg-slate-950 text-cyan-400 border border-slate-800'
                  }`}
                >
                  {booking.bookingRef}
                </span>
              </div>
              <div
                className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 ${
                  highContrast ? 'text-sm text-slate-200' : 'text-xs text-slate-400'
                }`}
              >
                <span>
                  Vessel:{' '}
                  <span className={highContrast ? 'text-white font-bold' : 'text-slate-200 font-semibold'}>
                    {ferry?.name || 'River Star'} ({ferry?.vesselId || 'FV-101'})
                  </span>
                </span>
                <span>•</span>
                <span>
                  Gate:{' '}
                  <span
                    className={`font-mono font-bold ${
                      highContrast
                        ? 'text-black bg-yellow-400 px-2 py-0.5 rounded font-black text-sm'
                        : 'text-cyan-400'
                    }`}
                  >
                    {trip?.gateNumber || 'G-1'}
                  </span>
                </span>
                <span>•</span>
                <span className={highContrast ? 'text-slate-300 font-mono text-xs' : 'text-slate-500 font-mono text-[11px]'}>
                  Booked on {booking.bookingDate || '2026-09-05'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Requirement: Boarding Group visual indicator based on ticket class */}
            <div
              id={`boarding-group-badge-${booking.id}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                ticketClass === 'Premium'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                  : booking.vehicle
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/50'
              }`}
              title={`Boarding Group: ${boardingGroup} for ${ticketClass} Class`}
            >
              {ticketClass === 'Premium' ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ) : booking.vehicle ? (
                <Car className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Users className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="font-mono uppercase tracking-wider">{boardingGroup}</span>
              <span className="text-[10px] font-normal opacity-80 font-sans">({ticketClass})</span>
            </div>

            {/* Countdown / Status Strip */}
            {!isPastTrip ? (
              <div
                id={`boarding-timer-${booking.id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs shadow-inner"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  {secondsUntilBoarding > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-medium">
                        Boarding Starts In:
                      </span>
                      <span className="font-mono font-bold text-cyan-400 tabular-nums">
                        {formatCountdown(secondsUntilBoarding)}
                      </span>
                    </div>
                  ) : secondsUntilDeparture > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-emerald-400 text-[11px]">
                        Boarding Open (Gate {trip?.gateNumber || 'G-1'})
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-400 font-mono text-[11px]">Voyage Departed</div>
                  )}
                </div>
              </div>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Voyage Concluded</span>
              </span>
            )}

            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase border flex items-center gap-1 ${
                isPastTrip
                  ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isPastTrip ? 'Archived' : booking.bookingStatus === 'boarded' ? 'Boarded' : 'Confirmed'}</span>
            </span>
          </div>
        </div>

        {/* Requirement: Weather Impact Badge displaying real-time sea conditions (Calm, Choppy, Rough) and schedule influence */}
        <div
          id={`weather-impact-badge-${booking.id}`}
          className={`p-3 rounded-xl border text-xs relative z-20 space-y-2 ${badgeColorClasses}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-black/20 shrink-0">
                {seaState === 'Rough' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                ) : seaState === 'Choppy' ? (
                  <Wind className="w-4 h-4 text-amber-400" />
                ) : (
                  <Waves className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs font-mono uppercase tracking-wide">
                  Sea Condition: {seaState} Waters
                </span>
                <span className="text-[11px] opacity-80 font-mono">
                  (Wave Swell: {waveHeight}m • Wind: {windKnots} kts {originPort?.weather?.windDirection || 'W'})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWeatherDetails(!showWeatherDetails)}
              className="text-[11px] font-semibold opacity-90 hover:opacity-100 flex items-center gap-1 underline underline-offset-2 transition-opacity"
            >
              <span>{showWeatherDetails ? 'Hide Advisory' : 'Schedule Influence'}</span>
              {showWeatherDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="text-[11px] flex items-center gap-1.5 opacity-95">
            <span className="font-semibold uppercase tracking-wider text-[10px] bg-black/30 px-1.5 py-0.5 rounded">
              Schedule Impact
            </span>
            <span>{scheduleImpactText}</span>
          </div>

          {/* Expandable Marine Meteorological Telemetry */}
          <AnimatePresence>
            {showWeatherDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 mt-2 border-t border-current/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono"
              >
                <div>
                  <span className="opacity-70 block">Departure Port:</span>
                  <span className="font-bold">{originPort?.name || 'Gateway Terminal'}</span>
                </div>
                <div>
                  <span className="opacity-70 block">Visibility:</span>
                  <span className="font-bold">{originPort?.weather?.visibilityKm || 9.5} km</span>
                </div>
                <div>
                  <span className="opacity-70 block">Water Temp:</span>
                  <span className="font-bold">{originPort?.weather?.temperatureC || 29}°C</span>
                </div>
                <div>
                  <span className="opacity-70 block">Port Advisory:</span>
                  <span className="font-bold truncate">{originPort?.weather?.advisory || 'Normal Navigation'}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Real-Time Live Status Strip */}
        <div
          className={`rounded-xl space-y-3 relative z-20 ${
            highContrast
              ? 'bg-zinc-950 p-4 border-2 border-yellow-400 text-sm'
              : 'bg-slate-950 p-4 border border-slate-800 text-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${highContrast ? 'text-yellow-400' : 'text-cyan-400'} ${!isPastTrip ? 'animate-pulse' : ''}`} />
              <span className={`font-semibold ${highContrast ? 'text-white text-sm' : 'text-slate-200'}`}>
                Scheduled Departure:{' '}
                <strong
                  className={`font-mono ${
                    highContrast ? 'text-yellow-300 text-xl font-black underline' : 'text-cyan-300'
                  }`}
                >
                  {departureStr}
                </strong>
                <span className={`ml-2 font-normal font-mono ${highContrast ? 'text-slate-300 text-xs' : 'text-slate-400'}`}>
                  (System Clock: {simulatedTime})
                </span>
              </span>
            </div>
            <div className={`font-mono ${highContrast ? 'text-slate-200 text-sm' : 'text-slate-400'}`}>
              Speed:{' '}
              <span className={`font-bold ${highContrast ? 'text-yellow-400 text-base' : 'text-white'}`}>
                {ferry?.speedKnots || 14.5} knots
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>
                {isPastTrip
                  ? 'Voyage Completed (100%)'
                  : `Voyage Progress: Vessel is ${trip?.progressPercent ?? 68}% en route`}
              </span>
              <span className="font-mono text-cyan-300">
                {isPastTrip ? '0.0 km remaining' : `${trip?.remainingDistanceKm ?? 6.2} km remaining`}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPastTrip ? 'bg-slate-600' : 'bg-gradient-to-r from-cyan-500 to-sky-400'
                }`}
                style={{ width: isPastTrip ? '100%' : `${trip?.progressPercent ?? 68}%` }}
              />
            </div>
          </div>
        </div>

        {/* Post-Trip Feedback Section for Expired Tickets in History Archive */}
        {isPastTrip && (
          <div
            id={`post-trip-feedback-section-${booking.id}`}
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs relative z-20"
          >
            {savedFeedback && !isEditingFeedback ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-sm">Your Post-Trip Review</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      MMB Verified Review
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Logged {savedFeedback.submittedAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingFeedback(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Review</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= savedFeedback.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-amber-400 font-mono text-xs">
                    {savedFeedback.rating}.0 / 5.0
                  </span>
                </div>

                {savedFeedback.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {savedFeedback.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}

                {savedFeedback.comment && (
                  <p className="text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    "{savedFeedback.comment}"
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleFeedbackFormSubmit} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="font-bold text-white text-xs">Rate Your Voyage on {ferry?.name || 'Vessel'}</h4>
                      <p className="text-[11px] text-slate-400">
                        Help Maharashtra Maritime Board monitor passenger comfort and on-time gangway flow
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    +50 Voyager Miles
                  </span>
                </div>

                {/* Interactive Star Rating */}
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 font-medium">Overall Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            star <= (hoverRating ?? ratingScore)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">
                    {(hoverRating ?? ratingScore)}.0 Stars
                  </span>
                </div>

                {/* Service Aspect Tags */}
                <div className="space-y-1.5">
                  <span className="text-slate-400 text-[11px]">Key Highlights:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableReviewTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleReviewTag(tag)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments Field */}
                <div className="space-y-1">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share comments regarding boarding speed, deck cleanliness, or crew hospitality..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {isEditingFeedback && (
                    <button
                      type="button"
                      onClick={() => setIsEditingFeedback(false)}
                      className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Voyage Review</span>
                  </button>
                </div>
              </form>
            )}

            {/* Post-trip feedback success notification */}
            {feedbackSuccessToast && (
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedbackSuccessToast}</span>
              </div>
            )}
          </div>
        )}

        {/* Ticket Details & Action Buttons */}
        <div
          className={`flex flex-wrap items-center justify-between gap-4 pt-4 border-t relative z-20 ${
            highContrast ? 'border-yellow-400/60 text-sm' : 'border-slate-800 text-xs'
          }`}
        >
          <div
            className={`flex flex-wrap items-center gap-4 ${
              highContrast ? 'text-slate-200' : 'text-slate-400'
            }`}
          >
            <span>
              Seats:{' '}
              <strong className={highContrast ? 'text-yellow-300 font-mono text-base font-black' : 'text-white font-mono'}>
                {booking.seatNumbers.join(', ')}
              </strong>
            </span>
            <span>
              Passengers:{' '}
              <strong className={highContrast ? 'text-white font-black text-base' : 'text-white'}>
                {booking.passengers.length}
              </strong>
            </span>
            <span>
              Fare Paid:{' '}
              <strong className={highContrast ? 'text-yellow-400 font-mono text-base font-black' : 'text-emerald-400 font-mono'}>
                ₹{booking.totalFareInr}
              </strong>
            </span>
            {booking.vehicle && (
              <span className={highContrast ? 'text-yellow-300 font-mono font-bold' : 'text-cyan-400 font-mono'}>
                Vehicle: {booking.vehicle.type} ({booking.vehicle.registrationNumber})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Requirement: 'Add to Calendar' button that generates an .ics file download */}
            <button
              type="button"
              id={`add-to-calendar-btn-${booking.id}`}
              onClick={handleAddToCalendar}
              className={`rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
                highContrast
                  ? 'px-4 py-2.5 bg-black hover:bg-zinc-900 text-yellow-300 border-2 border-yellow-400 font-bold text-sm'
                  : 'px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-sky-800/60 text-xs'
              }`}
              title="Add voyage to personal calendar (.ics file download)"
            >
              <Calendar className={`w-4 h-4 ${highContrast ? 'text-yellow-400' : 'text-sky-400'}`} />
              <span>Add to Calendar</span>
            </button>

            {/* Requirement: 'Open Terminal Map' button displaying dynamic floor plan with highlighted designated gate */}
            <button
              type="button"
              id={`open-terminal-map-btn-${booking.id}`}
              onClick={() => setShowTerminalMap(true)}
              className={`rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
                highContrast
                  ? 'px-4 py-2.5 bg-black hover:bg-zinc-900 text-white border-2 border-white font-bold text-sm'
                  : 'px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 text-xs'
              }`}
              title="View dynamic terminal floor plan with your designated boarding gate highlighted"
            >
              <Compass className={`w-4 h-4 ${highContrast ? 'text-yellow-400' : 'text-cyan-400'}`} />
              <span>Open Terminal Map</span>
            </button>

            {/* Requirement: Boarding Flow Guide Overlay Trigger for upcoming departures */}
            {!isPastTrip && (
              <button
                type="button"
                id={`boarding-guide-btn-${booking.id}`}
                onClick={() => openBoardingGuide(trip)}
                className={`rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
                  highContrast
                    ? 'px-4 py-2.5 bg-black hover:bg-zinc-900 text-cyan-300 border-2 border-cyan-400 font-bold text-sm'
                    : 'px-3.5 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 border border-cyan-700 text-xs font-bold'
                }`}
                title="Open Terminal Boarding Flow Guide: ID check, luggage scan, gate entry checklist"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Boarding Guide</span>
              </button>
            )}

            {/* Requirement: Context-Aware Feedback Modal Trigger for rating boarding speed & comfort */}
            <button
              type="button"
              id={`rate-feedback-btn-${booking.id}`}
              onClick={() => trip && promptFeedbackForTrip(trip, booking.bookingRef)}
              className={`rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
                highContrast
                  ? 'px-4 py-2.5 bg-black hover:bg-zinc-900 text-yellow-300 border-2 border-yellow-400 font-bold text-sm'
                  : 'px-3.5 py-2 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border border-amber-800/80 text-xs'
              }`}
              title="Rate your voyage: boarding speed & vessel comfort (Admin confidential)"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
              <span>Rate Trip (Speed & Comfort)</span>
            </button>

            {/* Requirement: 'Download as PDF' feature */}
            <button
              type="button"
              id={`download-pdf-btn-${booking.id}`}
              onClick={handleDownloadPdf}
              className={`rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                highContrast
                  ? 'px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-slate-400 font-bold text-sm'
                  : 'px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs'
              }`}
              title="Download individual printable PDF boarding pass for offline access"
            >
              <Download className={`w-4 h-4 ${highContrast ? 'text-yellow-400' : 'text-emerald-400'}`} />
              <span>Download PDF</span>
            </button>

            {/* Requirement: 'Share' button with Web Share API */}
            <button
              type="button"
              id={`share-ticket-btn-${booking.id}`}
              onClick={handleShare}
              className={`rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                highContrast
                  ? 'px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-slate-400 font-bold text-sm'
                  : 'px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs'
              }`}
              title="Share ticket details directly via messaging apps"
            >
              <Share2 className={`w-4 h-4 ${highContrast ? 'text-yellow-400' : 'text-cyan-400'}`} />
              <span>Share</span>
            </button>

            {/* View QR Pass Modal Button */}
            <button
              type="button"
              id={`view-qr-btn-${booking.id}`}
              onClick={() => onOpenQR(booking)}
              className={`rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-md ${
                highContrast
                  ? 'px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-yellow-500 font-black text-sm'
                  : 'px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold'
              }`}
            >
              <QrCode className={`w-4 h-4 ${highContrast ? 'text-black' : 'text-cyan-400'}`} />
              <span>{isPastTrip ? 'View Receipt QR' : 'View QR Pass'}</span>
            </button>

            {/* Live Vessel Radar Tracking or Rebook Trip */}
            {!isPastTrip ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFerryId(trip?.ferryId || 'ferry-101');
                  setActiveView('live-tracking');
                }}
                className={`rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  highContrast
                    ? 'px-4 py-2.5 bg-white hover:bg-slate-100 text-black font-black text-sm'
                    : 'px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs'
                }`}
              >
                <Radio className={`w-4 h-4 ${highContrast ? 'text-black' : ''}`} />
                <span>Track Live</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('book')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
                title="Book this passage again"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Book Again</span>
              </button>
            )}

            {/* Cancel (only for active, unboarded trips) */}
            {!isPastTrip && booking.bookingStatus !== 'boarded' && (
              <button
                type="button"
                onClick={() => onCancel(booking.id)}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Share Toast Feedback Notification */}
        {shareFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-xs flex items-center gap-2 relative z-20"
          >
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{shareFeedback}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Dynamic Terminal Map Modal */}
      <TerminalMapModal
        isOpen={showTerminalMap}
        onClose={() => setShowTerminalMap(false)}
        gateNumber={trip?.gateNumber || 'G-1'}
        port={originPort}
        ferryName={ferry?.name}
        vesselType={ferry?.type}
        destinationName={destinationPort?.name || 'Mandwa Ro-Pax Terminal'}
        departureTime={departureStr}
      />
    </>
  );
};
