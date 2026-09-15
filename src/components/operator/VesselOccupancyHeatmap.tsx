import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useFerry } from '../../context/FerryContext';
import { Ferry } from '../../types';
import {
  Users,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Info,
  Sliders,
  Maximize2,
  RefreshCw,
  TrendingUp,
  Volume2,
  ArrowRight,
  Shield,
  Compass,
} from 'lucide-react';

export interface DeckZone {
  id: string;
  name: string;
  deck: 'main' | 'upper' | 'cargo';
  capacity: number;
  currentPax: number;
  pathD: string; // SVG path for the schematic zone
  center: [number, number]; // [x, y] for D3 label & centroid
  colorThreshold?: string;
  recommendedAction?: string;
  category: 'seating' | 'gangway' | 'concourse' | 'muster' | 'vehicle';
}

interface VesselOccupancyHeatmapProps {
  selectedFerryId?: string;
  className?: string;
}

export const VesselOccupancyHeatmap: React.FC<VesselOccupancyHeatmapProps> = ({
  selectedFerryId,
  className = '',
}) => {
  const { ferries, updateFerry, addAuditLog } = useFerry();

  // Selected ferry
  const [activeFerryId, setActiveFerryId] = useState<string>(
    selectedFerryId || ferries[0]?.id || 'ferry-gateway-1'
  );

  const activeFerry = useMemo(
    () => ferries.find((f) => f.id === activeFerryId) || ferries[0],
    [ferries, activeFerryId]
  );

  const [activeDeck, setActiveDeck] = useState<'main' | 'upper' | 'cargo'>('main');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('zone-central-lobby');
  const [isSimulatingBoarding, setIsSimulatingBoarding] = useState<boolean>(false);
  const [filterThreshold, setFilterThreshold] = useState<'all' | 'crowded' | 'optimal'>('all');
  const [boardGroupRate, setBoardGroupRate] = useState<number>(12); // simulated pax boarding batch

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Deck Zones Layout Definition
  const [deckZones, setDeckZones] = useState<DeckZone[]>([
    // MAIN PASSENGER SALOON DECK (650 x 280 coordinate system)
    {
      id: 'zone-fore-port',
      name: 'Forward Port Seating',
      deck: 'main',
      capacity: 45,
      currentPax: 38,
      pathD: 'M 140,50 L 260,50 L 260,115 L 140,115 Z',
      center: [200, 82],
      category: 'seating',
    },
    {
      id: 'zone-fore-starboard',
      name: 'Forward Starboard Seating',
      deck: 'main',
      capacity: 45,
      currentPax: 41,
      pathD: 'M 140,145 L 260,145 L 260,210 L 140,210 Z',
      center: [200, 178],
      category: 'seating',
    },
    {
      id: 'zone-bow-observation',
      name: 'Bow Panoramic Lounge',
      deck: 'main',
      capacity: 30,
      currentPax: 28,
      pathD: 'M 60,130 Q 80,60 130,50 L 130,210 Q 80,200 60,130 Z',
      center: [98, 130],
      category: 'seating',
    },
    {
      id: 'zone-central-lobby',
      name: 'Central Boarding Concourse & Gangway',
      deck: 'main',
      capacity: 60,
      currentPax: 54, // High congestion area
      pathD: 'M 270,50 L 390,50 L 390,210 L 270,210 Z',
      center: [330, 130],
      category: 'gangway',
    },
    {
      id: 'zone-aft-port',
      name: 'Aft Port Passenger Seating',
      deck: 'main',
      capacity: 50,
      currentPax: 22, // Under-utilized
      pathD: 'M 400,50 L 530,50 L 530,115 L 400,115 Z',
      center: [465, 82],
      category: 'seating',
    },
    {
      id: 'zone-aft-starboard',
      name: 'Aft Starboard Seating',
      deck: 'main',
      capacity: 50,
      currentPax: 26,
      pathD: 'M 400,145 L 530,145 L 530,210 L 400,210 Z',
      center: [465, 178],
      category: 'seating',
    },
    {
      id: 'zone-stern-muster',
      name: 'Stern Muster Station Alpha',
      deck: 'main',
      capacity: 40,
      currentPax: 15,
      pathD: 'M 540,55 L 610,65 L 610,195 L 540,205 Z',
      center: [575, 130],
      category: 'muster',
    },

    // UPPER PROMENADE DECK
    {
      id: 'zone-up-bridge-access',
      name: 'Wheelhouse & Bridge Access Bay',
      deck: 'upper',
      capacity: 15,
      currentPax: 6,
      pathD: 'M 100,70 L 190,70 L 190,190 L 100,190 Z',
      center: [145, 130],
      category: 'concourse',
    },
    {
      id: 'zone-up-premium-lounge',
      name: 'Upper VIP Executive Lounge',
      deck: 'upper',
      capacity: 35,
      currentPax: 29,
      pathD: 'M 200,60 L 350,60 L 350,200 L 200,200 Z',
      center: [275, 130],
      category: 'seating',
    },
    {
      id: 'zone-up-sun-deck',
      name: 'Open Sun Promenade & Cafe',
      deck: 'upper',
      capacity: 50,
      currentPax: 32,
      pathD: 'M 360,55 L 520,55 L 520,205 L 360,205 Z',
      center: [440, 130],
      category: 'seating',
    },
    {
      id: 'zone-up-aft-rail',
      name: 'Upper Aft Viewing Railings',
      deck: 'upper',
      capacity: 30,
      currentPax: 14,
      pathD: 'M 530,65 L 590,75 L 590,185 L 530,195 Z',
      center: [560, 130],
      category: 'muster',
    },

    // RO-PAX CARGO / VEHICLE DECK
    {
      id: 'zone-car-lane-1',
      name: 'Port Vehicle Lane (Cars / SUVs)',
      deck: 'cargo',
      capacity: 20,
      currentPax: 16,
      pathD: 'M 120,60 L 530,60 L 530,120 L 120,120 Z',
      center: [325, 90],
      category: 'vehicle',
    },
    {
      id: 'zone-car-lane-2',
      name: 'Starboard Vehicle Lane & Two-Wheelers',
      deck: 'cargo',
      capacity: 25,
      currentPax: 19,
      pathD: 'M 120,140 L 530,140 L 530,200 L 120,200 Z',
      center: [325, 170],
      category: 'vehicle',
    },
    {
      id: 'zone-cargo-ramp',
      name: 'Hydraulic Stern Ro-Pax Ramp',
      deck: 'cargo',
      capacity: 30,
      currentPax: 8,
      pathD: 'M 540,70 L 620,80 L 620,180 L 540,190 Z',
      center: [580, 130],
      category: 'gangway',
    },
  ]);

  // Current deck's zones
  const currentDeckZones = useMemo(
    () => deckZones.filter((z) => z.deck === activeDeck),
    [deckZones, activeDeck]
  );

  // Selected Zone Details
  const selectedZone = useMemo(
    () => deckZones.find((z) => z.id === selectedZoneId) || currentDeckZones[0],
    [deckZones, selectedZoneId, currentDeckZones]
  );

  // High-traffic crowd statistics
  const crowdMetrics = useMemo(() => {
    const totalCapacity = currentDeckZones.reduce((acc, z) => acc + z.capacity, 0);
    const totalPax = currentDeckZones.reduce((acc, z) => acc + z.currentPax, 0);
    const deckUtilization = totalCapacity > 0 ? Math.round((totalPax / totalCapacity) * 100) : 0;

    const crowdedZones = currentDeckZones.filter((z) => z.currentPax / z.capacity >= 0.85);
    const underUtilizedZones = currentDeckZones.filter((z) => z.currentPax / z.capacity < 0.6);

    // Lateral balance: Port vs Starboard
    const portPax = currentDeckZones
      .filter((z) => z.id.includes('port'))
      .reduce((acc, z) => acc + z.currentPax, 0);
    const starboardPax = currentDeckZones
      .filter((z) => z.id.includes('starboard'))
      .reduce((acc, z) => acc + z.currentPax, 0);

    const lateralListDelta = portPax - starboardPax;

    return {
      totalCapacity,
      totalPax,
      deckUtilization,
      crowdedCount: crowdedZones.length,
      underUtilizedCount: underUtilizedZones.length,
      portPax,
      starboardPax,
      lateralListDelta,
      balanceAssessment:
        Math.abs(lateralListDelta) <= 5
          ? 'Perfect Trim (< 5 pax list variance)'
          : lateralListDelta > 5
          ? `Portside Listing (+${lateralListDelta} pax) — Direct to Starboard`
          : `Starboard Listing (+${Math.abs(lateralListDelta)} pax) — Direct to Portside`,
    };
  }, [currentDeckZones]);

  // D3 Color Interpolation Scale
  // 0% -> Emerald Green (#10b981), 50% -> Amber (#f59e0b), 85%+ -> Red / Crimson (#f43f5e)
  const d3ColorScale = useMemo(() => {
    return d3
      .scaleLinear<string>()
      .domain([0, 0.5, 0.75, 0.9, 1.0])
      .range(['#10b981', '#06b6d4', '#eab308', '#f97316', '#ef4444']);
  }, []);

  // Render D3 SVG Heatmap overlays
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    // Clear previous D3 dynamic overlays
    svg.selectAll('.d3-dynamic-layer').remove();

    const g = svg.append('g').attr('class', 'd3-dynamic-layer');

    // Create D3 Defs for gradients & glowing filters
    const defs = svg.select('defs');

    // D3 Density Polygons
    currentDeckZones.forEach((zone) => {
      const ratio = zone.currentPax / zone.capacity;
      const fillColor = d3ColorScale(ratio);
      const isSelected = zone.id === selectedZoneId;

      // Glow / border group
      const zoneGroup = g
        .append('g')
        .attr('class', `zone-group zone-${zone.id} cursor-pointer`)
        .on('click', () => {
          setSelectedZoneId(zone.id);
        });

      // Background Zone Polygon
      zoneGroup
        .append('path')
        .attr('d', zone.pathD)
        .attr('fill', fillColor)
        .attr('fill-opacity', ratio > 0.85 ? 0.65 : ratio > 0.6 ? 0.45 : 0.28)
        .attr('stroke', isSelected ? '#38bdf8' : fillColor)
        .attr('stroke-width', isSelected ? 3.5 : 1.5)
        .attr('stroke-dasharray', isSelected ? '4 2' : 'none')
        .attr('rx', 8)
        .style('transition', 'all 0.3s ease');

      // Passenger Density Heat Circles (D3 Particle Mesh representing people)
      const paxCount = zone.currentPax;
      const [cx, cy] = zone.center;
      const dotCount = Math.min(24, Math.ceil(paxCount / 2));

      // Deterministic particle positions centered around zone centroid
      for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * 2 * Math.PI;
        const radius = Math.sin(i * 1.7) * 22 + (i % 3) * 6;
        const px = cx + Math.cos(angle) * Math.min(35, radius);
        const py = cy + Math.sin(angle) * Math.min(18, radius);

        zoneGroup
          .append('circle')
          .attr('cx', px)
          .attr('cy', py)
          .attr('r', ratio > 0.85 ? 3.5 : 2.5)
          .attr('fill', ratio > 0.85 ? '#ffffff' : fillColor)
          .attr('fill-opacity', 0.8)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 0.5);
      }

      // Density badge label inside zone
      const badgeG = zoneGroup
        .append('g')
        .attr('transform', `translate(${cx}, ${cy - 12})`);

      badgeG
        .append('rect')
        .attr('x', -32)
        .attr('y', -10)
        .attr('width', 64)
        .attr('height', 20)
        .attr('rx', 6)
        .attr('fill', '#020617')
        .attr('fill-opacity', 0.85)
        .attr('stroke', isSelected ? '#38bdf8' : '#334155')
        .attr('stroke-width', 1);

      badgeG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .attr('fill', ratio > 0.85 ? '#f87171' : ratio > 0.6 ? '#fde047' : '#4ade80')
        .text(`${Math.round(ratio * 100)}%`);

      // Zone name label below
      zoneGroup
        .append('text')
        .attr('x', cx)
        .attr('y', cy + 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('fill', '#cbd5e1')
        .text(`${zone.currentPax}/${zone.capacity} pax`);
    });
  }, [currentDeckZones, selectedZoneId, d3ColorScale]);

  // Handle Simulating Boarding Stream
  const handleBoardPassengers = (batchCount: number) => {
    setIsSimulatingBoarding(true);
    // Find gangway or entry zone first
    setDeckZones((prev) => {
      return prev.map((z) => {
        if (z.id === 'zone-central-lobby' && z.deck === activeDeck) {
          const added = Math.min(batchCount, z.capacity - z.currentPax);
          return { ...z, currentPax: z.currentPax + added };
        }
        return z;
      });
    });

    addAuditLog(
      'Boarding Surge Simulated',
      'Boarding',
      `Turnstile injected +${batchCount} passengers into ${activeFerry.name} Central Boarding Concourse.`
    );

    setTimeout(() => setIsSimulatingBoarding(false), 800);
  };

  // Rebalance Crowd Redistribution
  const handleRedistributeCrowd = () => {
    setDeckZones((prev) => {
      // Find overloaded zones and shift 10 pax to underutilized zones
      return prev.map((z) => {
        if (z.id === 'zone-central-lobby') {
          return { ...z, currentPax: Math.max(25, z.currentPax - 16) };
        }
        if (z.id === 'zone-aft-port' || z.id === 'zone-aft-starboard') {
          return { ...z, currentPax: Math.min(z.capacity, z.currentPax + 8) };
        }
        return z;
      });
    });

    addAuditLog(
      'Crew Crowd Rebalancing Initiated',
      'Boarding',
      `Deck stewards announced seating availability in Aft Saloon to relieve Central Concourse congestion.`
    );
  };

  return (
    <div
      id="vessel-occupancy-heatmap-module"
      ref={containerRef}
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 ${className}`}
    >
      {/* Header & Vessel Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Vessel Occupancy & Deck Crowd Heatmap
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                D3 SCHEMATIC ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live spatial crowd density distribution across passenger decks to prevent bottle-necking and maintain vessel lateral trim
            </p>
          </div>
        </div>

        {/* Vessel Selector & Deck Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Vessel:</span>
            <select
              value={activeFerryId}
              onChange={(e) => setActiveFerryId(e.target.value)}
              className="bg-slate-950 text-white font-bold text-xs p-2 rounded-xl border border-slate-800"
            >
              {ferries.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.vesselId})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveDeck('main')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeDeck === 'main'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Main Saloon
            </button>
            <button
              onClick={() => setActiveDeck('upper')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeDeck === 'upper'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upper Promenade
            </button>
            <button
              onClick={() => setActiveDeck('cargo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeDeck === 'cargo'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vehicle / Cargo Deck
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Crowd Distribution KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">DECK OCCUPANCY LOAD</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              {crowdMetrics.totalPax} / {crowdMetrics.totalCapacity}
            </span>
            <span
              className={`text-xs font-bold font-mono ${
                crowdMetrics.deckUtilization >= 85
                  ? 'text-rose-400'
                  : crowdMetrics.deckUtilization >= 65
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {crowdMetrics.deckUtilization}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                crowdMetrics.deckUtilization >= 85
                  ? 'bg-rose-500'
                  : crowdMetrics.deckUtilization >= 65
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${crowdMetrics.deckUtilization}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">HIGH DENSITY CONGESTION</span>
          <div className="text-2xl font-black font-mono text-rose-400">
            {crowdMetrics.crowdedCount} <span className="text-xs text-slate-400 font-normal">zones &gt;85%</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Requires gate pacing</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">LATERAL WEIGHT BALANCE</span>
          <div className="text-base font-bold font-mono text-cyan-300">
            Port {crowdMetrics.portPax} vs {crowdMetrics.starboardPax} Stbd
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold block">
            {crowdMetrics.balanceAssessment}
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">CROWD CONTROLS</span>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => handleBoardPassengers(boardGroupRate)}
              disabled={isSimulatingBoarding}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all flex items-center gap-1"
            >
              <span>+ Board {boardGroupRate} Pax</span>
            </button>
            <button
              onClick={handleRedistributeCrowd}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-[11px] transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Rebalance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schematic Layout with D3 Heatmap Overlay */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              {activeDeck === 'main'
                ? 'Main Saloon Deck (Bridge Bow -> Stern)'
                : activeDeck === 'upper'
                ? 'Upper Promenade & VIP Observation Deck'
                : 'Lower Ro-Pax Vehicle & Ramp Deck'}
            </span>
          </div>

          {/* D3 Heat Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> &lt;50% Optimal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-yellow-500" /> 50-75% Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-orange-500" /> 75-85% Dense
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse" /> &gt;85% Critical
            </span>
          </div>
        </div>

        {/* D3 Rendered Interactive SVG Schematic */}
        <div className="relative w-full overflow-x-auto bg-slate-950 rounded-xl p-2 flex justify-center">
          <svg
            ref={svgRef}
            viewBox="0 0 650 260"
            className="w-full max-w-4xl h-auto select-none"
            style={{ minWidth: '600px', maxHeight: '320px' }}
          >
            <defs>
              {/* Radial gradient for gangway surge */}
              <radialGradient id="surgeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Vessel Schematic Hull Contour (Catamaran Wave Piercing Design) */}
            <g id="vessel-hull-outline" stroke="#334155" strokeWidth="2" fill="none">
              {/* Outer Hull */}
              <path
                d="M 50,130 C 50,40 180,30 520,30 C 570,30 620,60 620,130 C 620,200 570,230 520,230 C 180,230 50,220 50,130 Z"
                fill="#0b1329"
                stroke="#1e293b"
                strokeWidth="3"
              />

              {/* Waterline Bow Point */}
              <path d="M 30,130 L 50,110 L 50,150 Z" fill="#0284c7" />

              {/* Center aisle walkway */}
              <line x1="120" y1="130" x2="540" y2="130" stroke="#1e293b" strokeWidth="16" strokeDasharray="4 4" />

              {/* Gangway Boarding Arrows */}
              <g id="gangway-port-boarding" transform="translate(325, 15)">
                <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#0369a1" stroke="#38bdf8" />
                <text x="0" y="4" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold">
                  PORT GANGWAY
                </text>
              </g>

              <g id="gangway-stbd-boarding" transform="translate(325, 245)">
                <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#0369a1" stroke="#38bdf8" />
                <text x="0" y="4" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold">
                  STBD GANGWAY
                </text>
              </g>

              {/* Bow Indicator */}
              <text x="75" y="134" fontSize="9" fontWeight="bold" fill="#64748b" textAnchor="middle">
                BOW ▲
              </text>
              <text x="590" y="134" fontSize="9" fontWeight="bold" fill="#64748b" textAnchor="middle">
                ▼ STERN
              </text>
            </g>
          </svg>
        </div>

        {/* Selected Zone Deep Dive Card */}
        {selectedZone && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">{selectedZone.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedZone.currentPax / selectedZone.capacity >= 0.85
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : selectedZone.currentPax / selectedZone.capacity >= 0.6
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {Math.round((selectedZone.currentPax / selectedZone.capacity) * 100)}% Capacity (
                  {selectedZone.currentPax}/{selectedZone.capacity})
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {selectedZone.category === 'gangway'
                  ? 'Main boarding transit choke-point. Keep turnstile throughput regulated to 30 pax/min.'
                  : selectedZone.category === 'seating'
                  ? 'Standard bench and armrest seating. Egress gangways clear.'
                  : 'Designated SOLAS evacuation muster and lifejacket locker zone.'}
              </p>
            </div>

            {/* Crew Action Recommendation */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono uppercase">
                  CREW DISPATCH ACTION
                </span>
                <span className="text-xs font-bold text-cyan-300">
                  {selectedZone.currentPax / selectedZone.capacity >= 0.85
                    ? 'Direct Overflow to Aft Saloon'
                    : 'Clear for Rapid Boarding'}
                </span>
              </div>
              <button
                onClick={handleRedistributeCrowd}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Pace Boarding
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
