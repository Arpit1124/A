import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Port } from '../../types';
import {
  X,
  MapPin,
  Compass,
  Navigation,
  CheckCircle2,
  Ship,
  Coffee,
  ShieldCheck,
  DoorOpen,
  Info,
  Footprints,
  Accessibility,
  ArrowRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';

interface TerminalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateNumber: string;
  port?: Port;
  ferryName?: string;
  vesselType?: string;
  destinationName?: string;
  departureTime?: string;
}

export const TerminalMapModal: React.FC<TerminalMapModalProps> = ({
  isOpen,
  onClose,
  gateNumber,
  port,
  ferryName = 'Vessel',
  vesselType = 'Catamaran',
  destinationName = 'Mandwa Pier',
  departureTime = '14:45',
}) => {
  const [selectedGate, setSelectedGate] = useState<string>(gateNumber || 'G-1');
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen) return null;

  // Normalized designated gate string
  const normalizedDesignatedGate = (gateNumber || 'G-1').trim().toUpperCase();

  // Gates for this terminal (default fallback if port doesn't have gates array)
  const gates = port?.gates || [
    { id: 'gate-g1', number: 'G-1', status: 'boarding' as const },
    { id: 'gate-g2', number: 'G-2', status: 'open' as const },
    { id: 'gate-g3', number: 'G-3', status: 'open' as const },
    { id: 'gate-g4', number: 'G-4', status: 'closed' as const },
  ];

  return (
    <div
      id="terminal-map-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <motion.div
        id="terminal-map-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="p-5 sm:px-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {port?.name || 'Gateway Terminal (Pier 1)'} Floor Plan
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {port?.code || 'GTW-01'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Departure Terminal Concourse & Gate Wayfinding • Designated:{' '}
                <strong className="text-cyan-300 font-mono">Gate {normalizedDesignatedGate}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-slate-300 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
                className="p-1 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.15))}
                className="p-1 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              id="close-terminal-map-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner: Highlighting the Designated Gate */}
        <div className="px-6 py-3 bg-cyan-950/40 border-b border-cyan-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-cyan-200">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span>
              Your Vessel: <strong className="text-white font-bold">{ferryName}</strong> ({vesselType}) bound for{' '}
              <strong className="text-white">{destinationName}</strong> at{' '}
              <strong className="text-cyan-300 font-mono">{departureTime}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Boarding Point:</span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black font-mono text-xs shadow-md flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Gate {normalizedDesignatedGate}</span>
            </span>
          </div>
        </div>

        {/* Interactive Floor Plan Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden transition-transform duration-200 origin-top shadow-inner"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Waterfront / Pier Header */}
            <div className="w-full bg-sky-950/40 border border-sky-800/40 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between text-xs text-sky-300">
              <div className="flex items-center gap-2 font-semibold">
                <Ship className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>Waterfront Maritime Quay • Berth Alpha & Berth Bravo</span>
              </div>
              <span className="text-[11px] font-mono text-sky-400">Sea Level Pier Access</span>
            </div>

            {/* Gates Row (Berth Gangways) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {gates.map((g) => {
                const isTarget = g.number.toUpperCase() === normalizedDesignatedGate;
                const isSelected = g.number.toUpperCase() === selectedGate.toUpperCase();

                return (
                  <button
                    key={g.id || g.number}
                    type="button"
                    onClick={() => setSelectedGate(g.number)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isTarget
                        ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950'
                        : isSelected
                        ? 'bg-slate-900 border-slate-600'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isTarget && (
                      <div className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                        Your Gate
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-mono font-black text-base text-white">
                        <DoorOpen className={`w-4 h-4 ${isTarget ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>Gate {g.number}</span>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isTarget ? 'bg-cyan-400 animate-ping' : g.status === 'closed' ? 'bg-red-500' : 'bg-emerald-400'
                        }`}
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Gangway {g.number}</span>
                      <span
                        className={`font-semibold capitalize text-[10px] ${
                          isTarget ? 'text-cyan-300 font-bold' : g.status === 'closed' ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {isTarget ? 'Active Turnstile' : g.status || 'Ready'}
                      </span>
                    </div>

                    {isTarget && (
                      <div className="mt-2 pt-2 border-t border-cyan-800/60 text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                        <Footprints className="w-3 h-3 text-cyan-400" />
                        <span>~2 min walk • 80m</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Visual Walking Route Graphic */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>Terminal Wayfinding Pathway to Gate {normalizedDesignatedGate}</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400">Turnstile Zone 1 Ready</span>
              </div>

              {/* Step Sequence */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Step 1</div>
                  <div className="font-semibold text-white mt-0.5">Terminal Entrance</div>
                  <div className="text-[11px] text-slate-400">Security & Bag Scan</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Step 2</div>
                    <div className="font-semibold text-white mt-0.5">Departure Concourse</div>
                    <div className="text-[11px] text-slate-400">Pass Waiting Lounge</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Step 3</div>
                    <div className="font-semibold text-white mt-0.5">Turnstiles {normalizedDesignatedGate}</div>
                    <div className="text-[11px] text-cyan-300">Scan QR Boarding Pass</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-500/60 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Step 4 (Final)</div>
                    <div className="font-bold text-white mt-0.5">Gate {normalizedDesignatedGate} Gangway</div>
                    <div className="text-[11px] text-emerald-400 font-semibold">Board {ferryName}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Concourse Amenities & Services */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
                Passenger Amenities & Port Facilities
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAmenity(
                      selectedAmenity === 'lounge'
                        ? null
                        : 'Air-Conditioned Waiting Lounge (Center Concourse): High-speed Wi-Fi, flight-style arrival displays, charging kiosks.'
                    )
                  }
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>AC Lounge & Café</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Between Gate 1 & 2</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAmenity(
                      selectedAmenity === 'access'
                        ? null
                        : 'Accessibility Ramps: Zero-step gangway access with dedicated priority assistance crew located at Gate Turnstile.'
                    )
                  }
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Accessibility className="w-4 h-4 text-cyan-400" />
                    <span>Priority & Ramps</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Adjacent to Gate {normalizedDesignatedGate}</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAmenity(
                      selectedAmenity === 'help'
                        ? null
                        : 'Information & Lost Property Desk: Staffed 24/7 by Maharashtra Maritime Board officers.'
                    )
                  }
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span>MMB Helpdesk</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Main Lobby Entry</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAmenity(
                      selectedAmenity === 'security'
                        ? null
                        : 'Port Police & Security Post: CISF / Port security checkpoint with automated metal detectors and biometric validation.'
                    )
                  }
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 text-white font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Security Post</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Turnstile Concourse</div>
                </button>
              </div>

              {selectedAmenity && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-slate-200 flex items-start gap-2"
                >
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{selectedAmenity}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Need directions? Follow the illuminated overhead directional signage toward{' '}
            <strong className="text-white">Gate {normalizedDesignatedGate}</strong>.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-md"
            >
              Return to Ticket
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
