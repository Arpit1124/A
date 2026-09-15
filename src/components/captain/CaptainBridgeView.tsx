import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { MaritimeMap } from '../map/MaritimeMap';
import { VesselEngineTelemetryChart } from './VesselEngineTelemetryChart';
import { MaintenanceLogTab } from './MaintenanceLogTab';
import { FuelEfficiencyAdvisor } from './FuelEfficiencyAdvisor';
import { RealTimeTelemetryArchive } from './RealTimeTelemetryArchive';
import {
  Compass,
  Ship,
  Radio,
  Gauge,
  CheckSquare,
  Square,
  AlertTriangle,
  Volume2,
  Mic,
  ShieldAlert,
  Wind,
  Navigation,
  CheckCircle2,
  Anchor,
  Activity,
  Layers,
  Fuel,
  Sliders,
  Wrench,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

export const CaptainBridgeView: React.FC = () => {
  const { ferries, selectedFerryId, setSelectedFerryId, updateFerry, declareEmergency, setActiveView } = useFerry();

  const activeFerry = ferries.find((f) => f.id === selectedFerryId) || ferries[0];
  const [bridgeTab, setBridgeTab] = useState<'helm' | 'fuel_advisor' | 'maintenance' | 'telemetry_archive'>('helm');

  // 12 DG Shipping Seaworthiness Pre-Departure Checklist Items
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'c1': true,
    'c2': true,
    'c3': true,
    'c4': true,
    'c5': true,
    'c6': true,
    'c7': true,
    'c8': true,
    'c9': true,
    'c10': true,
    'c11': true,
    'c12': true,
  });

  const checklistItems = [
    { id: 'c1', title: 'Life jackets verified', desc: 'Sufficient jackets for capacity + 10% infant allowance' },
    { id: 'c2', title: 'Life rafts inspected', desc: 'Hydrostatic release units inspected and clear of deck gear' },
    { id: 'c3', title: 'Fire suppression charged', desc: 'Engine room CO2 flood system & portable foam extinguishers checked' },
    { id: 'c4', title: 'Bilge pumps operational', desc: 'Fore and aft automatic bilge alarms tested dry' },
    { id: 'c5', title: 'VHF radio check completed', desc: 'Comm check confirmed on VHF Marine Ch 16 & Ch 12 (Port Control)' },
    { id: 'c6', title: 'Navigational lights functional', desc: 'Port, starboard, stern, and masthead steaming lights verified' },
    { id: 'c7', title: 'Engine fluids nominal', desc: 'Main diesel oil pressure (4.2 bar) & jacket coolant (82°C) nominal' },
    { id: 'c8', title: 'Steering gear response tested', desc: 'Hard-over port to starboard within 12 seconds confirmed' },
    { id: 'c9', title: 'Weather forecast reviewed', desc: 'MMB marine meteorological advisory for tidal swells logged' },
    { id: 'c10', title: 'Passenger manifest reconciled', desc: 'Turnstile gate QR scan count matches onboard deck headcount' },
    { id: 'c11', title: 'Vehicle deck lashings secured', desc: 'Ro-Pax wheel chocks and safety chains secured for open sea transit' },
    { id: 'c12', title: 'Emergency steering drill verified', desc: 'Mandatory DG Shipping emergency crew drill logged within 30 days' },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const isAllChecklistDone = completedCount === checklistItems.length;

  // Bridge Controls State
  const [throttleSpeed, setThrottleSpeed] = useState<number>(activeFerry?.speedKnots || 14.5);
  const [headingInput, setHeadingInput] = useState<number>(activeFerry?.heading || 165);
  const [hornActive, setHornActive] = useState<boolean>(false);
  const [activeVhfChannel, setActiveVhfChannel] = useState<string>('16');
  const [vhfLogs, setVhfLogs] = useState<Array<{ time: string; channel: string; sender: string; text: string }>>([
    {
      time: '14:02:15',
      channel: '16',
      sender: 'Harbor Control (VTMS)',
      text: 'River Star (FV-101), cleared for outbound transit through Middle Ground passage.',
    },
    {
      time: '14:04:40',
      channel: '16',
      sender: 'River Star Master',
      text: 'Harbor Control, River Star copy outbound passage. Maintaining 14.5 knots, heading 165.',
    },
    {
      time: '14:08:12',
      channel: '12',
      sender: 'Mandwa Terminal Tower',
      text: 'All vessels approaching Mandwa, berth 2 is clear for Ro-Pax disembarkation.',
    },
  ]);
  const [paAnnouncement, setPaAnnouncement] = useState<string>('');
  const [paBroadcastActive, setPaBroadcastActive] = useState<boolean>(false);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSpeedThrottleChange = (newSpeed: number) => {
    setThrottleSpeed(newSpeed);
    updateFerry(activeFerry.id, { speedKnots: newSpeed });
  };

  const handleHeadingSteer = (delta: number) => {
    const newH = (headingInput + delta + 360) % 360;
    setHeadingInput(newH);
    updateFerry(activeFerry.id, { heading: newH });
  };

  const handleSoundHorn = () => {
    setHornActive(true);
    setTimeout(() => setHornActive(false), 2000);
  };

  const handleSendVhf = (text: string) => {
    const now = new Date().toTimeString().split(' ')[0];
    setVhfLogs((prev) => [
      ...prev,
      {
        time: now,
        channel: activeVhfChannel,
        sender: `${activeFerry.name} (Master)`,
        text,
      },
    ]);
  };

  const handleBroadcastPa = (preset: string) => {
    setPaAnnouncement(preset);
    setPaBroadcastActive(true);
    setTimeout(() => setPaBroadcastActive(false), 3500);
  };

  return (
    <div id="captain-tactical-bridge" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bridge Nav & Vessel Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-950/70">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Master Tactical Bridge Console</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                WHEELHOUSE COMM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Skipper telemetry, collision avoidance AIS radar, engine throttles, and Seaworthiness safety compliance
            </p>
          </div>
        </div>

        {/* Vessel Switcher */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Command Vessel:</label>
          <select
            value={activeFerry.id}
            onChange={(e) => setSelectedFerryId(e.target.value)}
            className="bg-slate-900 text-white text-xs p-2.5 rounded-xl border border-slate-800 font-bold"
          >
            {ferries.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.vesselId} • {f.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requirement: Maintenance Log tab within CaptainBridgeView */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="captain-bridge-helm-tab-btn"
            onClick={() => setBridgeTab('helm')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              bridgeTab === 'helm'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Tactical Helm & Instruments</span>
          </button>

          <button
            type="button"
            id="captain-bridge-fuel-tab-btn"
            onClick={() => setBridgeTab('fuel_advisor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              bridgeTab === 'fuel_advisor'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Fuel Efficiency Advisor</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                bridgeTab === 'fuel_advisor'
                  ? 'bg-black/20 text-white font-black'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              Hydro-AI
            </span>
          </button>

          <button
            type="button"
            id="captain-bridge-maintenance-tab-btn"
            onClick={() => setBridgeTab('maintenance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              bridgeTab === 'maintenance'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Maintenance Log</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                bridgeTab === 'maintenance' ? 'bg-black/20 text-slate-950 font-black' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              Active Voyage
            </span>
          </button>

          <button
            type="button"
            id="captain-bridge-telemetry-archive-tab-btn"
            onClick={() => setBridgeTab('telemetry_archive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              bridgeTab === 'telemetry_archive'
                ? 'bg-cyan-600 text-white shadow-md font-extrabold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Real-Time Telemetry Archive</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                bridgeTab === 'telemetry_archive' ? 'bg-black/20 text-white font-black' : 'bg-cyan-500/20 text-cyan-300'
              }`}
            >
              Hourly Reports
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:flex items-center gap-2 pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Active Command: {activeFerry.name} ({activeFerry.vesselId})</span>
        </div>
      </div>

      {/* Tab 1: Maintenance Log Content */}
      {bridgeTab === 'fuel_advisor' ? (
        <FuelEfficiencyAdvisor
          activeFerry={activeFerry}
          throttleSpeed={throttleSpeed}
          onApplySpeed={handleSpeedThrottleChange}
        />
      ) : bridgeTab === 'maintenance' ? (
        <MaintenanceLogTab activeFerry={activeFerry} />
      ) : bridgeTab === 'telemetry_archive' ? (
        <RealTimeTelemetryArchive activeFerry={activeFerry} />
      ) : (
        /* Tab 2: Tactical Helm & Radar Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Primary Bridge Telemetry & Throttle (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bridge Gauges Cluster */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                <Gauge className="w-4 h-4" />
                <span>PRIMARY BRIDGE TELEMETRY GAUGES</span>
              </span>
              <span className="font-mono text-slate-400">Master: {activeFerry.captainName}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Speed */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">LOG SPEED</span>
                <span className="text-2xl font-extrabold font-mono text-cyan-300 block mt-1">
                  {throttleSpeed.toFixed(1)} <span className="text-xs font-normal text-slate-400">kts</span>
                </span>
                <span className="text-[10px] text-emerald-400">Cruising Mode</span>
              </div>

              {/* Heading */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">GYRO HEADING</span>
                <span className="text-2xl font-extrabold font-mono text-white block mt-1">
                  {headingInput}°
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SSE Course</span>
              </div>

              {/* Water Depth Sounder */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">ECHO SOUNDER</span>
                <span className="text-2xl font-extrabold font-mono text-sky-400 block mt-1">
                  14.8 <span className="text-xs font-normal text-slate-400">m</span>
                </span>
                <span className="text-[10px] text-emerald-400">Safe Keel Clearance</span>
              </div>

              {/* Engine Temp */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">MAIN ENGINE</span>
                <span className="text-2xl font-extrabold font-mono text-white block mt-1">
                  82°C
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">1,820 RPM (Twin)</span>
              </div>
            </div>

            {/* Interactive Steering & Throttle Wheelhouse Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Electronic Throttle Telemetry (0 - 22 Knots)</span>
                <span className="font-mono text-cyan-300 font-bold">{throttleSpeed.toFixed(1)} kts</span>
              </div>
              <input
                type="range"
                min="0"
                max="22"
                step="0.5"
                value={throttleSpeed}
                onChange={(e) => handleSpeedThrottleChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 mr-1">Rudder Steer:</span>
                  <button
                    onClick={() => handleHeadingSteer(-5)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-mono"
                  >
                    -5° Port
                  </button>
                  <button
                    onClick={() => handleHeadingSteer(-1)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-mono"
                  >
                    -1°
                  </button>
                  <button
                    onClick={() => handleHeadingSteer(1)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-mono"
                  >
                    +1°
                  </button>
                  <button
                    onClick={() => handleHeadingSteer(5)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-mono"
                  >
                    +5° Stbd
                  </button>
                </div>

                {/* Horn Sound Signal */}
                <button
                  onClick={handleSoundHorn}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    hornActive
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{hornActive ? 'BLASTING FOG SIGNAL...' : 'Sound Ship Horn'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Fuel Efficiency Quick Advisor Banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>AI Fuel Optimizer: Recommended Cruise 14.6 kts</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    -28% Burn
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Opposing tidal current (1.6 kts) & 14 kt headwind detected in fairway
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSpeedThrottleChange(14.6)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-950/40"
              >
                Set 14.6 kts
              </button>
              <button
                type="button"
                onClick={() => setBridgeTab('fuel_advisor')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                Advisor Details →
              </button>
            </div>
          </div>

          {/* Real-time Fuel Efficiency & Engine Load Visualization (Recharts) */}
          <VesselEngineTelemetryChart ferry={activeFerry} throttleSpeed={throttleSpeed} />

          {/* VHF Marine Radio Transceiver Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="font-bold text-white text-xs">VHF Marine Radio Communications (Simulated)</h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {['16', '12', '13', '06'].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setActiveVhfChannel(ch)}
                    className={`px-2 py-0.5 rounded ${
                      activeVhfChannel === ch
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ch {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* VHF Radio Logs */}
            <div className="space-y-2 max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              {vhfLogs.map((log, idx) => (
                <div key={idx} className="text-slate-300 leading-relaxed">
                  <span className="text-slate-500">[{log.time}] </span>
                  <span className="text-cyan-400 font-bold">Ch{log.channel} </span>
                  <span className="text-amber-300 font-semibold">{log.sender}: </span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>

            {/* Quick Radio Preset Transmit */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => handleSendVhf('Outbound Gateway fairway, maintaining visual watch.')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Transmit: "Outbound fairway clear"
              </button>
              <button
                onClick={() => handleSendVhf('Approaching Mandwa breakwater, request berthing clearance.')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Transmit: "Request berthing clearance"
              </button>
              <button
                onClick={() => handleSendVhf('Securite, securite: heavy commercial barge crossing ahead.')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px]"
              >
                Transmit: "Securite navigation warning"
              </button>
            </div>
          </div>

          {/* Passenger Public Address (PA) Broadcaster */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-xs">Wheelhouse Public Address (PA) Broadcaster</h3>
              </div>
              {paBroadcastActive && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  ONBOARD PA LIVE
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() =>
                  handleBroadcastPa(
                    'Welcome aboard FerryFlow. Please review safety notices, locate life jackets under your seats, and enjoy the voyage.'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-left"
              >
                <div className="font-semibold text-white">1. Safety Briefing</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Welcome & Life Jacket Drill</div>
              </button>

              <button
                onClick={() =>
                  handleBroadcastPa(
                    'Attention passengers, we are passing historic Elephanta Island on the port side. Please remain seated while vessel turns.'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-left"
              >
                <div className="font-semibold text-white">2. Scenic Landmark</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Elephanta Channel Turn</div>
              </button>

              <button
                onClick={() =>
                  handleBroadcastPa(
                    'Attention passengers, we are now approaching Mandwa Terminal. Ro-Pax vehicle drivers please proceed to vehicle deck.'
                  )
                }
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-left"
              >
                <div className="font-semibold text-white">3. Disembarkation</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Terminal Approach Notice</div>
              </button>
            </div>

            {paAnnouncement && (
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-cyan-300 italic">
                "{paAnnouncement}"
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Tactical Collision Radar + Seaworthiness Pre-Departure Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tactical AIS Navigation Radar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Bridge AIS Tactical Scope</span>
              </span>
              <span className="font-mono text-cyan-400 text-[11px]">RANGE: 12 NM</span>
            </div>
            <MaritimeMap heightClass="h-[360px]" selectedFerry={activeFerry} />
          </div>

          {/* 12-Item Pre-Departure Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">DG Shipping Seaworthiness Clearance</h3>
                <p className="text-[11px] text-slate-400">Pre-departure master compliance audit</p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    isAllChecklistDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {completedCount} / {checklistItems.length} CLEARED
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 text-xs">
              {checklistItems.map((item) => {
                const checked = checklist[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      checked
                        ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                        : 'bg-red-950/20 border-red-800/40 text-red-300'
                    }`}
                  >
                    <div className="mt-0.5 text-cyan-400">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Master Signature: Capt. S. Rane</span>
              <button
                onClick={() => {
                  alert(
                    isAllChecklistDone
                      ? 'SEAWORTHINESS AUDIT AUTHORIZED: Harbor Master clearance granted.'
                      : 'WARNING: Incomplete safety checklist. Clear all 12 items before departure.'
                  );
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
                  isAllChecklistDone
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Sign Seaworthiness Form
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};
