import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { PassengerFeedback } from '../../types';
import {
  MessageSquare,
  Star,
  Zap,
  Armchair,
  Wind,
  Waves,
  Sparkles,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Ship,
  Navigation,
  CheckCircle2,
  Filter,
  Download,
  ShieldCheck,
} from 'lucide-react';

export const PassengerFeedbackViewer: React.FC = () => {
  const { passengerFeedbacks, ferries, trips, promptFeedbackForTrip } = useFerry();

  const [selectedVessel, setSelectedVessel] = useState<string>('all');
  const [metricFilter, setMetricFilter] = useState<'all' | 'speed' | 'comfort'>('all');

  const filteredFeedbacks = passengerFeedbacks.filter((fb) => {
    if (selectedVessel !== 'all' && fb.vesselId !== selectedVessel) {
      return false;
    }
    if (metricFilter === 'speed' && fb.boardingSpeedRating < 4) {
      return true; // Highlight critical speed feedback
    }
    if (metricFilter === 'comfort' && fb.comfortRating < 4) {
      return true; // Highlight critical comfort feedback
    }
    return true;
  });

  // Calculate summary metrics
  const totalReviews = passengerFeedbacks.length;
  const avgBoardingSpeed = totalReviews
    ? (passengerFeedbacks.reduce((acc, f) => acc + f.boardingSpeedRating, 0) / totalReviews).toFixed(1)
    : '5.0';
  const avgWaitMin = totalReviews
    ? (passengerFeedbacks.reduce((acc, f) => acc + f.boardingWaitMinutes, 0) / totalReviews).toFixed(1)
    : '4.0';
  const avgComfort = totalReviews
    ? (passengerFeedbacks.reduce((acc, f) => acc + f.comfortRating, 0) / totalReviews).toFixed(1)
    : '5.0';
  const recommendPercent = totalReviews
    ? Math.round((passengerFeedbacks.filter((f) => f.wouldRecommend).length / totalReviews) * 100)
    : 100;

  const exportFeedbackJson = () => {
    const blob = new Blob([JSON.stringify(passengerFeedbacks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passenger-feedback-audit-${Date.now()}.json`;
    a.click();
  };

  const handleSimulatePassengerPrompt = () => {
    const targetTrip = trips.find((t) => t.status === 'in_transit' || t.status === 'arrived') || trips[0];
    promptFeedbackForTrip(targetTrip, 'DEMO-PASSENGER-TICKET');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header with Admin Confidentiality Guarantee */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-lg">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Passenger Experience & Trip Feedback
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly confidential post-voyage ratings capturing pier boarding velocity and onboard nautical comfort
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSimulatePassengerPrompt}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Simulate Passenger Prompt</span>
          </button>

          <button
            type="button"
            onClick={exportFeedbackJson}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Feedback Data</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Boarding Speed Metric */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800/40 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Boarding Speed Rating
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-cyan-300">{avgBoardingSpeed}</span>
            <span className="text-xs text-slate-400 font-mono">/ 5.0 Stars</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Avg Turnstile Clearance: <strong className="text-cyan-400">{avgWaitMin} min</strong>
          </p>
        </div>

        {/* Comfort Metric */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-800/40 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Armchair className="w-3.5 h-3.5 text-indigo-400" />
            Passenger Comfort
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-300">{avgComfort}</span>
            <span className="text-xs text-slate-400 font-mono">/ 5.0 Stars</span>
          </div>
          <p className="text-[10px] text-slate-400">Combines Seating, AC, and Wave Stability</p>
        </div>

        {/* Recommendation Score */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-800/40 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
            Net Promoter Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{recommendPercent}%</span>
            <span className="text-xs text-slate-400 font-mono">would recommend</span>
          </div>
          <p className="text-[10px] text-slate-400">Based on verified ticket holders</p>
        </div>

        {/* Total Reviews Captured */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Verified Ratings
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{totalReviews}</span>
            <span className="text-xs text-slate-400 font-mono">audits filed</span>
          </div>
          <p className="text-[10px] text-amber-400/90">Restricted to Administrative Roster</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Filter by Ferry:</span>
            <select
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
              className="bg-slate-900 text-white px-2.5 py-1 rounded-xl border border-slate-700 text-xs"
            >
              <option value="all">All Vessels ({passengerFeedbacks.length})</option>
              {ferries.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.vesselId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">View:</span>
            <button
              type="button"
              onClick={() => setMetricFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                metricFilter === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => setMetricFilter('speed')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                metricFilter === 'speed'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Speed Critical
            </button>
            <button
              type="button"
              onClick={() => setMetricFilter('comfort')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                metricFilter === 'comfort'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Comfort Critical
            </button>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-mono">
          Showing {filteredFeedbacks.length} feedback reports
        </div>
      </div>

      {/* Individual Passenger Feedbacks Roster */}
      <div className="space-y-4">
        {filteredFeedbacks.map((fb) => {
          return (
            <div
              key={fb.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all"
            >
              {/* Top Row: User & Vessel Context */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-900">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{fb.passengerName}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800">
                      {fb.bookingRef}
                    </span>
                    {fb.wouldRecommend ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        Recommends
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        Does Not Recommend
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Ship className="w-3.5 h-3.5 text-cyan-400" />
                      {fb.vesselName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      {fb.routeName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(fb.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Overall Stars */}
                <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-mono mr-1">Overall:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${
                        star <= fb.overallRating ? 'text-amber-400' : 'text-slate-700'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs font-mono font-bold text-white ml-1.5">
                    {fb.overallRating}.0
                  </span>
                </div>
              </div>

              {/* SPECIFIC CRITERIA BREAKDOWN: BOARDING SPEED vs COMFORT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Boarding Speed Breakdown */}
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      Boarding Speed & Terminal Flow
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {fb.boardingSpeedRating} / 5 Stars
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <strong>Wait Time:</strong>{' '}
                    <span className="text-cyan-300 font-mono font-bold">
                      {fb.boardingWaitMinutes} minutes
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-900">
                    <span className="text-slate-500 block text-[10px]">Gate / Turnstile Observation:</span>
                    {fb.boardingSpeedNote}
                  </div>
                </div>

                {/* 2. Vessel Comfort Breakdown */}
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Armchair className="w-3.5 h-3.5 text-indigo-400" />
                      Passenger Comfort & Ride Stability
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {fb.comfortRating} / 5 Stars
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Armchair className="w-3 h-3 text-indigo-400" /> Seating
                      </span>
                      <span className="font-mono font-bold text-indigo-300">
                        {fb.comfortFactors.seatingComfort}/5
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Wind className="w-3 h-3 text-cyan-400" /> AC / Air
                      </span>
                      <span className="font-mono font-bold text-cyan-300">
                        {fb.comfortFactors.airConditioningOrClimate}/5
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Waves className="w-3 h-3 text-blue-400" /> Sea Roll
                      </span>
                      <span className="font-mono font-bold text-blue-300">
                        {fb.comfortFactors.rideSmoothnessAndRoll}/5
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Cleanliness
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {fb.comfortFactors.cleanliness}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Comments */}
              {fb.comments && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider font-mono">
                    Passenger Remarks:
                  </span>
                  <p className="mt-0.5 leading-relaxed">{fb.comments}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
