import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFerry } from '../../context/FerryContext';
import {
  Star,
  Zap,
  Armchair,
  Wind,
  Waves,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Ship,
  Navigation,
} from 'lucide-react';

export const ContextAwareFeedbackModal: React.FC = () => {
  const {
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    activeFeedbackTrip,
    activeFeedbackBookingRef,
    submitPassengerFeedback,
    ferries,
    routes,
    playRoutineChime,
  } = useFerry();

  // Ratings State
  const [overallRating, setOverallRating] = useState<number>(5);
  const [boardingSpeedRating, setBoardingSpeedRating] = useState<number>(5);
  const [boardingWaitMinutes, setBoardingWaitMinutes] = useState<number>(4);
  const [boardingSpeedNote, setBoardingSpeedNote] = useState<string>('Fast contactless QR scan at turnstile');
  const [comfortRating, setComfortRating] = useState<number>(5);
  const [seatingComfort, setSeatingComfort] = useState<number>(5);
  const [airConditioning, setAirConditioning] = useState<number>(5);
  const [rideSmoothness, setRideSmoothness] = useState<number>(4);
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [passengerName, setPassengerName] = useState<string>('Rahul Deshmukh');
  const [comments, setComments] = useState<string>('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(true);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const matchedFerry = ferries.find((f) => f.id === activeFeedbackTrip?.ferryId) || ferries[0];
  const matchedRoute = routes.find((r) => r.id === activeFeedbackTrip?.routeId) || routes[0];

  useEffect(() => {
    if (isFeedbackModalOpen) {
      setIsSubmitted(false);
    }
  }, [isFeedbackModalOpen]);

  if (!isFeedbackModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPassengerFeedback({
      tripId: activeFeedbackTrip?.id || 'trip-101',
      bookingRef: activeFeedbackBookingRef || `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vesselId: matchedFerry.id,
      vesselName: matchedFerry.name,
      routeId: matchedRoute.id,
      routeName: matchedRoute.name,
      passengerName: passengerName.trim() || 'Verified Passenger',
      overallRating,
      boardingSpeedRating,
      boardingWaitMinutes,
      boardingSpeedNote,
      comfortRating,
      comfortFactors: {
        seatingComfort,
        airConditioningOrClimate: airConditioning,
        rideSmoothnessAndRoll: rideSmoothness,
        cleanliness,
      },
      comments: comments.trim(),
      wouldRecommend,
    });

    playRoutineChime();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsFeedbackModalOpen(false);
      setIsSubmitted(false);
    }, 2200);
  };

  const getSpeedLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Instant & Frictionless (< 3 min)';
      case 4:
        return 'Prompt & Organized (3 - 6 min)';
      case 3:
        return 'Moderate Wait / Queued (7 - 12 min)';
      case 2:
        return 'Sluggish / Pier Congestion';
      default:
        return 'Severe Delay / Gate Blocked';
    }
  };

  const getComfortLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Luxury & Exceptionally Smooth';
      case 4:
        return 'Pleasant & Fully Relaxing';
      case 3:
        return 'Acceptable / Noticeable Swell';
      case 2:
        return 'Stuffy Cabin / Uncomfortable';
      default:
        return 'Rough Sea State / Poor Ride';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-8 text-slate-100"
      >
        {isSubmitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">Feedback Logged Securely</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you for sharing your experience aboard <span className="text-cyan-400 font-semibold">{matchedFerry.name}</span>. Your ratings on boarding velocity and passenger comfort have been securely encrypted and delivered to harbor administration.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Visible strictly to admins in AdminPortal</span>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Post-Voyage Review
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3" />
                    <span>AdminPortal Exclusive View</span>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Rate Your Ferry Voyage Experience
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Ship className="w-3.5 h-3.5 text-cyan-400" />
                    {matchedFerry.name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    {matchedRoute.name}
                  </span>
                  {activeFeedbackBookingRef && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-300">{activeFeedbackBookingRef}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Passenger Name Field */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Your Name / Display Alias</label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Rahul Deshmukh"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* CRITICAL REQUIREMENT 1: BOARDING SPEED SECTION */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-900/60 border border-cyan-700 flex items-center justify-center text-cyan-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Boarding Speed & Terminal Flow</h4>
                      <p className="text-[11px] text-slate-400">
                        How swiftly did you clear pier security, baggage checks, and optical QR turnstiles?
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-1 rounded-lg">
                    {boardingSpeedRating} / 5 Stars
                  </span>
                </div>

                {/* 5-Star Selector */}
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setBoardingSpeedRating(star)}
                      className={`p-2 rounded-xl border transition-all ${
                        star <= boardingSpeedRating
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-950'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-medium text-cyan-300 ml-2">
                    {getSpeedLabel(boardingSpeedRating)}
                  </span>
                </div>

                {/* Wait Time & Quick Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">
                      Approx. Wait Time at Pier: <span className="text-cyan-400 font-mono font-bold">{boardingWaitMinutes} min</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={boardingWaitMinutes}
                      onChange={(e) => setBoardingWaitMinutes(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Turnstile / Gate Experience</label>
                    <select
                      value={boardingSpeedNote}
                      onChange={(e) => setBoardingSpeedNote(e.target.value)}
                      className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 text-xs"
                    >
                      <option value="Fast contactless QR scan at turnstile">Fast contactless QR scan at turnstile</option>
                      <option value="Luggage screening queue moved steadily">Luggage screening queue moved steadily</option>
                      <option value="Slight congestion at pier gangway">Slight congestion at pier gangway</option>
                      <option value="Vehicle loading caused foot passenger wait">Vehicle loading caused foot passenger wait</option>
                      <option value="Camera barcode scanner read pass instantly">Camera barcode scanner read pass instantly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CRITICAL REQUIREMENT 2: COMFORT SECTION */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/60 border border-indigo-700 flex items-center justify-center text-indigo-400">
                      <Armchair className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Vessel Comfort & Voyage Smoothness</h4>
                      <p className="text-[11px] text-slate-400">
                        Evaluate the onboard physical environment, seating, and nautical stability
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 border border-indigo-800 px-2 py-1 rounded-lg">
                    {comfortRating} / 5 Stars
                  </span>
                </div>

                {/* Overall Comfort Stars */}
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setComfortRating(star)}
                      className={`p-2 rounded-xl border transition-all ${
                        star <= comfortRating
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-950'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-medium text-indigo-300 ml-2">
                    {getComfortLabel(comfortRating)}
                  </span>
                </div>

                {/* Multi-Dimensional Comfort Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-950/60">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Armchair className="w-3.5 h-3.5 text-indigo-400" />
                        Seating Cushion & Legroom
                      </span>
                      <span className="font-mono font-bold text-indigo-400">{seatingComfort}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={seatingComfort}
                      onChange={(e) => setSeatingComfort(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-cyan-400" />
                        Air Conditioning & Ventilation
                      </span>
                      <span className="font-mono font-bold text-cyan-400">{airConditioning}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={airConditioning}
                      onChange={(e) => setAirConditioning(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Waves className="w-3.5 h-3.5 text-blue-400" />
                        Ride Smoothness & Swell Roll
                      </span>
                      <span className="font-mono font-bold text-blue-400">{rideSmoothness}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={rideSmoothness}
                      onChange={(e) => setRideSmoothness(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Cabin & Restroom Cleanliness
                      </span>
                      <span className="font-mono font-bold text-amber-400">{cleanliness}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={cleanliness}
                      onChange={(e) => setCleanliness(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Overall Rating & Recommendation */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-1">
                  <span className="text-slate-300 font-semibold block">Overall Voyage Rating</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        className={`p-1 text-base ${
                          star <= overallRating ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-300 font-semibold block">Would you recommend this ferry?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(true)}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                        wouldRecommend
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(false)}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                        !wouldRecommend
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>No</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Passenger Comments Field */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Detailed Passenger Notes & Suggestions
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share any details on gate turnaround speed, crew courtesy, seat vibration, or temperature..."
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:border-cyan-500 focus:outline-none placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Admin Confidentiality Notice */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-2.5 text-[11px] text-amber-300/90">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Confidentiality Guarantee:</strong> This feedback is compiled solely for harbor performance audits and is visible exclusively to administrators inside the <strong>AdminPortal</strong>. It is not published publicly.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-900/40 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Submit Passenger Feedback</span>
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
