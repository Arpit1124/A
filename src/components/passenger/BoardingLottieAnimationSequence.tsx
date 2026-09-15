import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Check, Sparkles, Shield, QrCode, Luggage, Ship, Compass } from 'lucide-react';

export interface BoardingLottieAnimationSequenceProps {
  currentStepIndex: number;
  onStepChange?: (index: number) => void;
  autoPlay?: boolean;
}

export const BoardingLottieAnimationSequence: React.FC<BoardingLottieAnimationSequenceProps> = ({
  currentStepIndex,
  onStepChange,
  autoPlay = true,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [activeStage, setActiveStage] = useState<number>(currentStepIndex || 0);

  // Sync with parent step change
  useEffect(() => {
    setActiveStage(currentStepIndex);
  }, [currentStepIndex]);

  // Autoplay sequence timer (moves to next stage every 5 seconds if playing)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStage((prev) => {
        const next = (prev + 1) % 4;
        if (onStepChange) onStepChange(next);
        return next;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [isPlaying, onStepChange]);

  const stages = [
    {
      title: 'Digital ID & Manifest Scan',
      subtitle: 'Biometric photo match & Coast Guard manifest check',
      color: 'from-cyan-500 to-blue-600',
      icon: Shield,
    },
    {
      title: 'Baggage Security X-Ray',
      subtitle: 'Contactless baggage conveyor scanner & deck safety tag',
      color: 'from-blue-500 to-indigo-600',
      icon: Luggage,
    },
    {
      title: 'Automated Turnstile QR',
      subtitle: 'Turnstile gate barrier auto-releases on QR optical scan',
      color: 'from-teal-500 to-emerald-600',
      icon: QrCode,
    },
    {
      title: 'Tidal Gangway Embarkation',
      subtitle: 'Priority gangway bridge access onto the passenger vessel',
      color: 'from-emerald-500 to-cyan-500',
      icon: Ship,
    },
  ];

  return (
    <div
      id="boarding-lottie-sequence-container"
      className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-cyan-800/60 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-72 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-60 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700/80 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
              Modern Check-In Sequence
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Stage {activeStage + 1} of 4: {stages[activeStage].title}
            </h4>
          </div>
        </div>

        {/* Stage Navigation & Play/Pause */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 mr-2">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveStage(idx);
                  if (onStepChange) onStepChange(idx);
                }}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                  activeStage === idx
                    ? 'bg-cyan-400 w-5 sm:w-6 ring-2 ring-cyan-500/40'
                    : 'bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Go to Stage ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs"
            title={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveStage(0);
              if (onStepChange) onStepChange(0);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Restart animation sequence"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Lottie-Style Animated Visual Canvas */}
      <div className="relative w-full h-44 sm:h-52 bg-slate-950/80 rounded-xl border border-slate-800/90 overflow-hidden flex items-center justify-center shadow-inner">
        <AnimatePresence mode="wait">
          {/* STAGE 0: ID CARD SCANNING ANIMATION */}
          {activeStage === 0 && (
            <motion.div
              key="stage-0-id-scan"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Terminal Scanner Base Pad */}
              <div className="absolute bottom-6 w-56 sm:w-64 h-8 bg-slate-900 border-2 border-cyan-800/80 rounded-xl flex items-center justify-around px-4 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  CISF OPTICAL VERIFIER
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>

              {/* Floating ID Document Card */}
              <motion.div
                animate={{
                  y: [-8, 4, -8],
                  rotate: [-1, 1, -1],
                }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="relative z-10 w-44 sm:w-52 h-28 sm:h-32 bg-gradient-to-br from-slate-800 via-slate-850 to-cyan-950 border border-cyan-400/80 rounded-2xl p-3 shadow-2xl flex flex-col justify-between overflow-hidden"
              >
                {/* ID Header */}
                <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-[8px]">
                      ID
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-200">PASSENGER CREDS</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                  />
                </div>

                {/* ID Details */}
                <div className="flex items-center gap-2.5 my-auto">
                  {/* Photo Silhouette */}
                  <div className="w-10 h-11 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center relative overflow-hidden">
                    <div className="w-5 h-5 rounded-full bg-slate-500 mb-2" />
                    <div className="w-8 h-4 rounded-t-full bg-slate-400 absolute bottom-0" />
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="w-20 h-2 bg-cyan-400/70 rounded-full" />
                    <div className="w-16 h-1.5 bg-slate-400 rounded-full" />
                    <div className="w-12 h-1.5 bg-slate-500 rounded-full" />
                  </div>
                </div>

                {/* Microchip */}
                <div className="flex items-center justify-between text-[8px] font-mono text-cyan-400/90 pt-1 border-t border-cyan-900/40">
                  <span>MUSTER ROLL: OK</span>
                  <span>GOVT APPROVED</span>
                </div>

                {/* Laser Scanning Beam */}
                <motion.div
                  animate={{ y: [-10, 100, -10] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] pointer-events-none"
                />
              </motion.div>

              {/* Floating Verified Stamp */}
              <motion.div
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: -12 }}
                transition={{ delay: 0.5, type: 'spring', damping: 12 }}
                className="absolute top-4 right-8 z-20 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider border-2 border-emerald-300 shadow-xl flex items-center gap-1"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>CLEARED</span>
              </motion.div>
            </motion.div>
          )}

          {/* STAGE 1: BAGGAGE CONVEYOR X-RAY SCANNER */}
          {activeStage === 1 && (
            <motion.div
              key="stage-1-baggage-scan"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Conveyor Belt System */}
              <div className="absolute bottom-7 w-72 sm:w-80 h-7 bg-slate-900 border-t-2 border-b-2 border-slate-700 flex items-center justify-around px-2">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center text-[8px] text-slate-400"
                  >
                    •
                  </motion.div>
                ))}
              </div>

              {/* X-Ray Tunnel Enclosure */}
              <div className="absolute z-10 w-36 h-36 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-blue-500/80 rounded-2xl flex flex-col items-center justify-between p-2 shadow-2xl">
                <div className="w-full flex items-center justify-between text-[8px] font-mono text-blue-400 font-bold px-1">
                  <span>X-RAY TUNNEL</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                </div>

                {/* Interior Neon Scanner Grid */}
                <div className="w-full h-20 bg-blue-950/40 rounded-lg border border-blue-500/30 flex items-center justify-center relative overflow-hidden">
                  <motion.div
                    animate={{ opacity: [0.3, 0.9, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute inset-0 bg-blue-500/15"
                  />
                  {/* Neon vertical sensor bars */}
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ height: ['40%', '90%', '40%'] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-1 bg-blue-400 rounded-full"
                    />
                    <motion.div
                      animate={{ height: ['70%', '30%', '70%'] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-1 bg-cyan-300 rounded-full"
                    />
                    <motion.div
                      animate={{ height: ['30%', '80%', '30%'] }}
                      transition={{ repeat: Infinity, duration: 0.9 }}
                      className="w-1 bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>

                <span className="text-[8px] font-mono text-emerald-400 font-bold">SAFETY TAG ATTACHED</span>
              </div>

              {/* Luggage Bag Gliding Across Conveyor */}
              <motion.div
                animate={{ x: [-120, 0, 120] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="relative z-20 flex flex-col items-center"
              >
                {/* Luggage Handle */}
                <div className="w-6 h-3 border-t-2 border-l-2 border-r-2 border-amber-400 rounded-t-md" />
                {/* Suitcase Body */}
                <div className="w-14 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl border border-amber-300 shadow-lg flex items-center justify-center relative">
                  <div className="w-full h-1 bg-amber-700/60" />
                  <div className="absolute w-3 h-3 bg-emerald-400 rounded-full flex items-center justify-center text-[7px] text-slate-950 font-black">
                    ✓
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* STAGE 2: TURNSTILE BARRIER & QR SCANNER */}
          {activeStage === 2 && (
            <motion.div
              key="stage-2-turnstile"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex items-center justify-center gap-6"
            >
              {/* Smartphone Displaying Dynamic QR Code */}
              <motion.div
                animate={{
                  y: [-4, 4, -4],
                  rotate: [-2, 2, -2],
                }}
                transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                className="w-24 sm:w-28 h-40 sm:h-44 bg-slate-950 rounded-2xl border-2 border-cyan-400 p-2 shadow-2xl flex flex-col items-center justify-between relative"
              >
                {/* Speaker pill */}
                <div className="w-6 h-1 bg-slate-700 rounded-full" />

                {/* QR Screen */}
                <div className="w-full h-24 sm:h-28 bg-white rounded-xl p-1.5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                  <QrCode className="w-16 h-16 sm:w-18 sm:h-18 text-slate-950" />
                  {/* Laser Scan Line */}
                  <motion.div
                    animate={{ y: [-30, 30, -30] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  />
                </div>

                <span className="text-[7px] font-mono text-cyan-300 font-bold">TURNSTILE READY</span>
              </motion.div>

              {/* Optical Turnstile Scanner Pillar & Barrier Arm */}
              <div className="relative flex flex-col items-center">
                {/* Top Scanner Glass Window */}
                <div className="w-20 h-10 bg-slate-900 border-2 border-emerald-500/80 rounded-t-xl flex flex-col items-center justify-center shadow-lg relative">
                  <span className="text-[7px] font-mono text-emerald-400 font-bold">GATE G-1 SCAN</span>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-3 h-3 rounded-full bg-emerald-400"
                  />
                </div>

                {/* Turnstile Base Stand */}
                <div className="w-14 h-24 bg-slate-800 border-l-2 border-r-2 border-slate-700 flex flex-col items-center justify-center relative">
                  {/* Revolving Gate Arm Bar */}
                  <motion.div
                    animate={{ rotate: [0, 45, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="w-20 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-lg absolute origin-left -left-6"
                  />
                  <span className="text-[8px] font-mono text-slate-400 mt-6">TURNSTILE</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: GANGWAY EMBARKATION ONTO FERRY VESSEL */}
          {activeStage === 3 && (
            <motion.div
              key="stage-3-gangway"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Sky background with stars/breeze dots */}
              <div className="absolute top-2 left-6 text-xs text-cyan-400/40">✦</div>
              <div className="absolute top-4 right-12 text-xs text-emerald-400/40">✦</div>

              {/* Harbor Water Waves */}
              <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-cyan-950 via-slate-950 to-transparent flex items-center justify-around overflow-hidden">
                <motion.div
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="w-full flex justify-around text-cyan-500/30 text-xs font-mono select-none"
                >
                  <span>~ ~ ~ ~ ~ ~ ~ ~ ~</span>
                  <span>~ ~ ~ ~ ~ ~ ~ ~ ~</span>
                </motion.div>
              </div>

              {/* Ferry Vessel & Pier Gangway Setup */}
              <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-4 mb-3">
                {/* Pier Edge */}
                <div className="w-20 sm:w-24 h-16 bg-slate-800 border-2 border-slate-700 rounded-tl-xl p-1 text-center flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-cyan-400 font-bold">PIER 2 GATE</span>
                  <div className="w-full h-1 bg-yellow-400 rounded-full" />
                </div>

                {/* Animated Gangway Bridge */}
                <div className="relative w-24 sm:w-32 h-6 border-b-4 border-cyan-400 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-cyan-600/50" />
                  {/* Walking Passenger Silhouette on Gangway */}
                  <motion.div
                    animate={{ x: [-40, 40] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="absolute -top-6 flex flex-col items-center"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-300" />
                    <div className="w-3.5 h-4 bg-cyan-400 rounded-t-sm" />
                  </motion.div>
                </div>

                {/* Ferry Vessel Bow Bobbing in Water */}
                <motion.div
                  animate={{
                    y: [-3, 3, -3],
                    rotate: [-1, 1, -1],
                  }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  className="w-32 sm:w-40 h-24 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border-2 border-cyan-500/80 rounded-r-3xl rounded-tl-lg p-2.5 shadow-2xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Ship className="w-4 h-4 text-cyan-400" />
                      <span className="text-[9px] font-bold text-white">RO-PAX FERRY</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {/* Vessel Passenger Cabin Windows */}
                  <div className="flex items-center gap-1.5 px-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-3.5 h-2.5 bg-cyan-400/60 rounded-sm border border-cyan-300" />
                    ))}
                  </div>

                  <span className="text-[8px] font-mono text-emerald-400 font-bold">WELCOME ABOARD</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtitle / Stage Context Note */}
      <div className="mt-3 text-center">
        <p className="text-xs text-slate-300 font-medium">
          {stages[activeStage].subtitle}
        </p>
      </div>
    </div>
  );
};
