import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Ticket,
  Camera,
  BellRing,
  WifiOff,
  History,
  Award,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  highlights: string[];
  icon: React.ElementType;
  position?: 'top' | 'bottom' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: '#passenger-dashboard-screen',
    title: 'Welcome to FerryFlow Passenger Portal',
    description:
      'Your unified maritime hub for digital boarding passes, turnstile scanning, vessel radar tracking, and real-time gate advisories across Mumbai Harbour.',
    highlights: [
      'Access live turnstile passes with verifiable QR codes',
      'Track real-time vessel locations and sea weather conditions',
      'Sync departure times directly to your personal calendar',
    ],
    icon: Compass,
    position: 'center',
  },
  {
    id: 'active_tickets',
    targetSelector: '#active-boarding-passes-section',
    title: 'Active Boarding Passes & Live Countdown',
    description:
      'All upcoming confirmed bookings appear here with dynamic "Boarding Starts In" countdown timers synced to the harbor system clock.',
    highlights: [
      'Real-time marine sea state badge (Calm, Choppy, Rough)',
      'Boarding group indicators (Group A, Group B, Group V)',
      '"Add to Calendar" (.ics download) and "Download PDF"',
      '30-minute automatic departure alert notifications',
    ],
    icon: Ticket,
    position: 'bottom',
  },
  {
    id: 'gate_scanner',
    targetSelector: '#turnstile-scanner-btn',
    title: 'Gate Camera QR Scanner & Turnstile Check-In',
    description:
      'Fast-track gate access using the camera scanner at port turnstiles, complete with audible validation beeps and manual ticket code override.',
    highlights: [
      'High-speed QR camera reader with laser guidance',
      'Audible chime confirms turnstile barcode acceptance',
      'Manual ticket code input if lighting or camera is limited',
    ],
    icon: Camera,
    position: 'bottom',
  },
  {
    id: 'push_alerts',
    targetSelector: '#push-notification-service',
    title: 'Real-Time Gate Changes & Boarding Push Alerts',
    description:
      'Stay informed about sudden gate shifts, boarding commencement, and departure updates even when the app is minimized or the screen is locked.',
    highlights: [
      'OS-level native notifications delivered in background',
      'Instant alert when your vessel gate changes (e.g. G-1 ➔ G-3)',
      'Audio chimes notify when turnstiles open for your group',
    ],
    icon: BellRing,
    position: 'bottom',
  },
  {
    id: 'offline_storage',
    targetSelector: '#offline-pass-storage',
    title: 'Offline Pass Storage (Zero Signal Mode)',
    description:
      'Sailing through maritime dead zones? Your digital boarding passes and QR codes are automatically cached locally on your device.',
    highlights: [
      'Instant offline turnstile presentation with no cellular required',
      'Automatic sync whenever network signal returns',
      'Simulate offline mode to verify boarding readiness anytime',
    ],
    icon: WifiOff,
    position: 'top',
  },
  {
    id: 'ticket_history',
    targetSelector: '#ticket-history-section',
    title: 'Ticket History Archive & Post-Trip Reviews',
    description:
      'Concluded voyages automatically transition to this scrollable archive with official "Past Trip" watermarks and post-trip feedback ratings.',
    highlights: [
      'Automatic expiration moves past trips to a dedicated archive',
      'Rate your voyage (1-5 stars) and review crew/cleanliness',
      'Earn +50 Frequent Voyager miles for every completed review',
      'Download past passage invoices & expense receipts as PDF',
    ],
    icon: History,
    position: 'top',
  },
  {
    id: 'loyalty_rewards',
    targetSelector: '#frequent-voyager-points',
    title: 'Frequent Voyager Rewards & Miles Tracker',
    description:
      'Earn nautical miles on every Mandwa, Elephanta, and Rewas crossing to unlock priority boarding and free passage redemptions.',
    highlights: [
      'Track tier progress from Standard to Commodore',
      'Redeem miles for seat upgrades and onboard refreshments',
      'Priority gangway boarding for Gold & Commodore tiers',
    ],
    icon: Award,
    position: 'bottom',
  },
];

interface PassengerDashboardTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const PassengerDashboardTour: React.FC<PassengerDashboardTourProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target element bounding rectangle & scroll into view
  const updateTargetPosition = useCallback(() => {
    if (!step) return;

    if (step.position === 'center') {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.targetSelector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Small timeout to allow smooth scroll to settle
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }, 350);
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetPosition();

    const handleResize = () => updateTargetPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen || !step) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('ferryflow_passenger_tour_completed', 'true');
    } catch {
      // Ignore storage errors
    }
    onClose();
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('ferryflow_passenger_tour_completed', 'true');
    } catch {
      // Ignore storage errors
    }
    if (onComplete) onComplete();
    onClose();
  };

  const IconComponent = step.icon;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate popover positioning relative to target or center screen
  const getPopoverStyle = (): React.CSSProperties => {
    if (step.position === 'center' || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '560px',
      };
    }

    const padding = 16;
    const popoverWidth = 480;
    let top = targetRect.bottom + padding;
    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;

    // Boundary check for horizontal overflow
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    // Boundary check for vertical overflow
    if (top + 340 > window.innerHeight && targetRect.top > 360) {
      top = targetRect.top - 360;
    }

    return {
      top: `${Math.max(16, top)}px`,
      left: `${left}px`,
      maxWidth: `${popoverWidth}px`,
    };
  };

  return (
    <div id="passenger-dashboard-guided-tour" className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Darkened Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Target Element Spotlight Ring if element is found */}
      {targetRect && (
        <div
          className="absolute rounded-2xl border-2 border-cyan-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.75),0_0_25px_rgba(6,182,212,0.6)] pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* Tour Dialog Card */}
      <div className="fixed" style={getPopoverStyle()}>
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl shadow-cyan-950/60 space-y-4 text-slate-200"
        >
          {/* Top Bar: Step Indicator, Title & Close */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">GUIDED TOUR</span>
                </div>
                <h3 className="font-bold text-white text-base mt-0.5">{step.title}</h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>

          {/* Key Feature Bullets */}
          {step.highlights.length > 0 && (
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                Key Features Highlight:
              </span>
              <ul className="space-y-1.5">
                {step.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom Bar with Step Dots and Navigation Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-6 bg-cyan-400'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Go to step ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium"
              >
                Skip
              </button>

              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all"
              >
                <span>{isLastStep ? 'Got It, Finish Tour' : 'Next'}</span>
                {isLastStep ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
