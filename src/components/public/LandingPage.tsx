import React from 'react';
import { useFerry } from '../../context/FerryContext';
import { MaritimeMap } from '../map/MaritimeMap';
import { StatusBadge } from '../common/StatusBadge';
import { MarineWeatherWidget } from './MarineWeatherWidget';
import { SmartRouteRecommender } from './SmartRouteRecommender';
import {
  Ship,
  Navigation,
  Compass,
  Ticket,
  Clock,
  ShieldCheck,
  Radio,
  ArrowRight,
  Sparkles,
  Users,
  Anchor,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Gauge,
  TrendingUp,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    ferries,
    trips,
    ports,
    setActiveView,
    setCurrentRole,
    setOperatorTab,
    setSelectedFerryId,
    setIsBookingModalOpen,
  } = useFerry();

  const activeFerriesCount = ferries.filter((f) => f.status !== 'offline').length;
  const activeTripsCount = trips.filter((t) => t.status === 'in_transit' || t.status === 'boarding' || t.status === 'approaching').length;
  const totalPassengersToday = 1284;
  const activePortsCount = ports.filter((p) => p.operationalStatus === 'operational').length;

  return (
    <div id="ferryflow-landing-page" className="space-y-16 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-semibold tracking-wide shadow-inner">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Next-Gen Maritime Transit Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Real-Time Ferry Operations. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                One Connected Platform.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Track vessels, manage trips, monitor passengers, operate terminals, and keep passengers informed from one
              intelligent maritime operations platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="hero-track-ferry-btn"
                onClick={() => setActiveView('live-tracking')}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>Track a Ferry</span>
              </button>

              <button
                id="hero-book-ferry-btn"
                onClick={() => setActiveView('book')}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Ticket className="w-4 h-4 text-cyan-400" />
                <span>Book a Ferry</span>
              </button>

              <button
                id="hero-operator-login-btn"
                onClick={() => {
                  setCurrentRole('operator');
                  setOperatorTab('overview');
                  setActiveView('operator');
                }}
                className="px-5 py-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-cyan-900/50 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>Operator Portal</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* LIVE NETWORK HERO BAR */}
          <div className="bg-slate-900/90 border border-cyan-800/40 rounded-2xl p-4 sm:p-5 shadow-2xl mb-6 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>LIVE NETWORK METRICS</span>
              </div>
              <div className="text-xs text-slate-400">
                Live AIS Telemetry • Mumbai Harbor Maritime Zone
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">{activeFerriesCount}</div>
                  <div className="text-xs text-slate-400 font-medium">Ferries Online</div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/60">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">{activeTripsCount}</div>
                  <div className="text-xs text-slate-400 font-medium">Trips Active</div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{activePortsCount}</div>
                  <div className="text-xs text-slate-400 font-medium">Ports Operating</div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300">
                    {totalPassengersToday.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Passengers Today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Maritime Hero Radar Map */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2 px-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Interactive Marine Radar — Click any vessel to inspect speed, heading & manifest
              </span>
              <button
                onClick={() => setActiveView('live-tracking')}
                className="text-cyan-400 hover:underline font-medium flex items-center gap-1"
              >
                Open Full Radar Screen <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <MaritimeMap heightClass="h-[520px]" mode="dashboard-hero" />
          </div>

          {/* Real-time Marine Weather & Sea State Radar Widget */}
          <MarineWeatherWidget onSelectRoute={(routeId) => setActiveView('routes')} />

          {/* AI-Powered Smart Route Recommender */}
          <SmartRouteRecommender />
        </div>
      </section>

      {/* 2. LIVE FLEET SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">
              Fleet Status
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Live Commercial Vessels Underway
            </h2>
          </div>
          <button
            onClick={() => setActiveView('live-tracking')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-cyan-800 transition-colors"
          >
            View All {ferries.length} Vessels <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ferries.slice(0, 4).map((ferry) => (
            <div
              key={ferry.id}
              className="bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 rounded-xl p-4 shadow-lg transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                      {ferry.vesselId}
                    </span>
                    <h3 className="font-bold text-white text-base mt-1.5 group-hover:text-cyan-300 transition-colors">
                      {ferry.name}
                    </h3>
                  </div>
                  <StatusBadge status={ferry.status} size="sm" />
                </div>

                <p className="text-xs text-slate-400 mb-3">{ferry.type}</p>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Speed:</span>
                    <span className="font-mono text-cyan-300 font-bold">{ferry.speedKnots} kts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Heading:</span>
                    <span className="font-mono text-white">{ferry.heading}°</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Passengers:</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {ferry.currentPassengers} / {ferry.capacity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Skipper:</span>
                    <span className="truncate max-w-[120px] text-slate-200">{ferry.captainName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setSelectedFerryId(ferry.id);
                    setActiveView('live-tracking');
                  }}
                  className="flex-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 rounded-lg py-1.5 px-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Radar Track</span>
                </button>
                <button
                  onClick={() => setActiveView('book')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg py-1.5 px-3 text-xs font-medium transition-colors"
                >
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">
            Simple 4-Step Maritime Journey
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            How FerryFlow Works For Commuters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: '1. Select & Book',
              desc: 'Choose your origin, destination, passenger tier, and optional vehicle space with instant seat reservation.',
              icon: Ticket,
              color: 'text-cyan-400',
              bg: 'bg-cyan-950/40 border-cyan-800/60',
            },
            {
              step: '02',
              title: '2. Digital QR Pass',
              desc: 'Receive an instant secure QR ticket ready for Apple/Google wallet or terminal turnstile scanning.',
              icon: QrCode,
              color: 'text-sky-400',
              bg: 'bg-sky-950/40 border-sky-800/60',
            },
            {
              step: '03',
              title: '3. Real-Time Radar',
              desc: 'Watch your incoming ferry in real-time with automated geofenced approach advisories and live ETAs.',
              icon: Radio,
              color: 'text-emerald-400',
              bg: 'bg-emerald-950/40 border-emerald-800/60',
            },
            {
              step: '04',
              title: '4. Seamless Arrive',
              desc: 'Board through dedicated contactless gates with automated manifest sync and disembark on schedule.',
              icon: Anchor,
              color: 'text-indigo-400',
              bg: 'bg-indigo-950/40 border-indigo-800/60',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border ${item.bg} backdrop-blur-sm relative flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="font-mono text-2xl font-bold text-slate-700">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PASSENGER & OPERATOR DUAL CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Passenger Features */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Passenger Experience Suite</h3>
                <p className="text-xs text-slate-400">Streamlined booking, live transit & digital ticketing</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Multi-Route Ro-Pax & Passenger Booking:</strong>
                  Reserve seats for Adults, Seniors, Children, and vehicles (Cars, SUVs, Two-Wheelers).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Live Ferry Radar & Predictive ETA:</strong>
                  Track your exact vessel in motion with remaining nautical distance and dynamic delay calculations.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Digital QR Tickets & Gate Turnstile Pass:</strong>
                  High-resolution verifiable QR passes scannable by port staff with zero paperwork.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Real-time Weather & Service Disruption Alerts:</strong>
                  Instant push updates on maritime advisories, wave swell warnings, and gate updates.
                </div>
              </li>
            </ul>

            <button
              onClick={() => setActiveView('book')}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore Passenger Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Operator Features */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-950 text-sky-400 border border-sky-800">
                <Ship className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Operations Command Center</h3>
                <p className="text-xs text-slate-400">Harbor authority, fleet coordination & safety management</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Full Fleet AIS Tracking & Geofences:</strong>
                  Monitor speed, heading, engine telemetry, and automated approach triggers for all active vessels.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Turnstile Digital Boarding & Manifest Validation:</strong>
                  Real-time QR barcode scanner verifying boarding status, passenger tier, and vehicle registration.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Pre-Departure Safety Checklists & Captain Bridge:</strong>
                  12-step DG Shipping compliance checklist required before harbor clearance can be authorized.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">One-Touch Emergency SAR Incident Protocol:</strong>
                  Declare emergency incidents with automatic coordinate fixation, nearest responder detection, and live logs.
                </div>
              </li>
            </ul>

            <button
              onClick={() => {
                setCurrentRole('operator');
                setOperatorTab('overview');
                setActiveView('operator');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Operations Command</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. MARITIME SAFETY & EMERGENCY HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border border-red-900/40 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>MARITIME SAFETY PROTOCOL</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Emergency Response & Captain Compliance Engine
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Equipped with real-time AIS emergency transponder alarms, nearest vessel search-and-rescue proximity
              triangulation, and pre-departure seaworthiness audit trails.
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentRole('captain');
              setActiveView('captain');
            }}
            className="shrink-0 px-5 py-3 rounded-xl bg-red-900/80 hover:bg-red-800 border border-red-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-950/50"
          >
            <Compass className="w-4 h-4" />
            <span>Open Captain Bridge View</span>
          </button>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 text-center space-y-6 pt-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-cyan-950/40 to-slate-950 border border-cyan-800/40 shadow-2xl space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bring Your Ferry Network Online
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            Eliminate operational blindspots with real-time AIS radar, passenger manifest syncing, and contactless digital
            ticketing designed for modern harbor transit authorities.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveView('book')}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all"
            >
              Book Passenger Ticket
            </button>
            <button
              onClick={() => {
                setCurrentRole('operator');
                setOperatorTab('overview');
                setActiveView('operator');
              }}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all"
            >
              Open Operations Center
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
