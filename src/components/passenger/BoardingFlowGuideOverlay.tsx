import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFerry } from '../../context/FerryContext';
import { BOARDING_FLOW_STEPS } from '../../data/feedbackAndReportsData';
import { BoardingStep } from '../../types';
import { BoardingLottieAnimationSequence } from './BoardingLottieAnimationSequence';
import {
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Luggage,
  QrCode,
  Ship,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  X,
  Compass,
  FileCheck,
  HelpCircle,
  PhoneCall,
  Volume2,
  Info,
  Layers,
} from 'lucide-react';

export const BoardingFlowGuideOverlay: React.FC = () => {
  const {
    isBoardingGuideOpen,
    setIsBoardingGuideOpen,
    activeBoardingGuideTrip,
    ferries,
    routes,
    simulatedTime,
  } = useFerry();

  const [activeStepIndex, setActiveStepIndex] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    'step-1': true, // Photo ID Check completed by default upon entering terminal
  });
  const [showLuggageGuidelines, setShowLuggageGuidelines] = useState<boolean>(false);

  if (!isBoardingGuideOpen) return null;

  const trip = activeBoardingGuideTrip;
  const ferry = ferries.find((f) => f.id === trip?.ferryId) || ferries[0];
  const route = routes.find((r) => r.id === trip?.routeId) || routes[0];

  const totalSteps = BOARDING_FLOW_STEPS.length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  const toggleStepCompleted = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      return next;
    });
  };

  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return FileCheck;
      case 1:
        return Luggage;
      case 2:
        return Compass;
      case 3:
        return QrCode;
      case 4:
        return Ship;
      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="bg-slate-900 border border-cyan-800/80 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-6 text-slate-100"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-900 border-b border-cyan-800/60 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 text-[10px] font-mono font-bold tracking-wider uppercase">
                  Passenger Terminal Guidance
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                  Current Time: {simulatedTime}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Terminal Boarding Flow Guide</span>
              </h2>
              <p className="text-xs text-slate-300">
                Interactive step-by-step checklist for upcoming departure aboard{' '}
                <strong className="text-cyan-300">{ferry.name}</strong> ({route.name})
              </p>
            </div>
            <button
              onClick={() => setIsBoardingGuideOpen(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Departure Info Card */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-cyan-900/60 text-xs font-mono">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Boarding Gate</span>
              <span className="text-cyan-400 font-bold text-sm">Gate G-1 (Pier 2)</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Scheduled Dep.</span>
              <span className="text-emerald-400 font-bold text-sm">
                {trip?.scheduledDeparture || '14:45'}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Vessel Capacity</span>
              <span className="text-amber-400 font-bold text-sm">{ferry.capacity} Pax</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Status</span>
              <span className="text-indigo-400 font-bold text-sm uppercase">
                {trip?.status === 'boarding' ? 'NOW BOARDING' : 'ON SCHEDULE'}
              </span>
            </div>
          </div>

          {/* Overall Checklist Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Terminal Clearance Progress: {completedCount} of {totalSteps} Steps Complete
              </span>
              <span className="text-cyan-400 font-mono font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Interactive Steps Checklist Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Subtle Lottie-style Modern Animation Sequence */}
          <BoardingLottieAnimationSequence
            currentStepIndex={activeStepIndex}
            onStepChange={(idx) => setActiveStepIndex(idx)}
          />

          <div className="pt-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Step-by-Step Terminal Checklist
            </span>
          </div>

          {BOARDING_FLOW_STEPS.map((step, idx) => {
            const isCompleted = !!completedSteps[step.id];
            const isSelected = activeStepIndex === idx;
            const StepIcon = getStepIcon(idx);

            return (
              <div
                key={step.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isCompleted
                    ? 'bg-slate-950/50 border-emerald-800/40'
                    : isSelected
                    ? 'bg-slate-950 border-cyan-500 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Step Header Accordion Toggle */}
                <div
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                  onClick={() => setActiveStepIndex(idx)}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStepCompleted(step.id);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-500 hover:border-cyan-500 hover:text-cyan-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : <Circle className="w-4 h-4" />}
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <StepIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                          Step {step.stepNumber} • {step.shortLabel}
                        </span>
                        {isCompleted && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                            VERIFIED
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-sm sm:text-base leading-tight">
                        {step.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      ~{step.estimatedMinutes} min
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isSelected ? 'rotate-90 text-cyan-400' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Step Body */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 pt-1 border-t border-slate-900 space-y-3.5 text-xs"
                    >
                      <p className="text-slate-300 leading-relaxed">{step.description}</p>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-300 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>
                          <strong>Location:</strong> {step.location}
                        </span>
                      </div>

                      {/* Required Items */}
                      <div className="space-y-1.5">
                        <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider font-mono">
                          Required for this step:
                        </span>
                        <div className="space-y-1">
                          {step.mandatoryItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-slate-300">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security Guidelines */}
                      <div className="space-y-1.5">
                        <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider font-mono">
                          Safety & Security Guidelines:
                        </span>
                        <div className="space-y-1">
                          {step.securityGuidelines.map((guideline, i) => (
                            <div key={i} className="flex items-start gap-2 text-slate-400 text-[11px]">
                              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{guideline}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Terminal Tip */}
                      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-2 text-cyan-200 text-[11px]">
                        <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Terminal Insider Tip:</strong> {step.terminalTip}
                        </span>
                      </div>

                      {/* Step Action Buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted(step.id)}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isCompleted
                              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Mark Incomplete' : 'Mark as Cleared'}</span>
                        </button>

                        {idx < BOARDING_FLOW_STEPS.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              toggleStepCompleted(step.id);
                              setActiveStepIndex(idx + 1);
                            }}
                            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors flex items-center gap-1 text-xs"
                          >
                            <span>Next Step</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer Concourse Info & Luggage Dimensions Dialog */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLuggageGuidelines(!showLuggageGuidelines)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 flex items-center gap-1.5 font-semibold transition-colors"
            >
              <Luggage className="w-3.5 h-3.5" />
              <span>Luggage Rules & Size Limits</span>
            </button>
            <span className="text-slate-500 text-[11px] hidden sm:inline">•</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              Assistance counter located opposite Gate G-2
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsBoardingGuideOpen(false)}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md"
          >
            Done & Return to Dashboard
          </button>
        </div>

        {/* Luggage Guidelines Drawer */}
        <AnimatePresence>
          {showLuggageGuidelines && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <Luggage className="w-4 h-4 text-cyan-400" />
                  Luggage Allowances & Restricted Items
                </h5>
                <button
                  type="button"
                  onClick={() => setShowLuggageGuidelines(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 block">Permitted Allowance</span>
                  <p className="text-[11px] text-slate-300">
                    Up to 20 kg per passenger ticket (1 rolling bag + 1 backpack). Max dimensions: 55 × 40 × 20 cm.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 block">Lithium Batteries</span>
                  <p className="text-[11px] text-slate-300">
                    Carry in cabin baggage only. Maximum 100Wh rated capacity per battery bank.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-rose-400 block">Strictly Forbidden</span>
                  <p className="text-[11px] text-slate-300">
                    Kerosene, flammable liquids, pressurized fuel containers, loose fireworks, and unlabelled chemicals.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
