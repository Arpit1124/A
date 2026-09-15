import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry, Coordinates } from '../../types';
import {
  Ship,
  Fuel,
  TrendingDown,
  TrendingUp,
  Flame,
  Zap,
  Gauge,
  Compass,
  AlertTriangle,
  Info,
  DollarSign,
  CloudRain,
  Radio,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Layers,
  BarChart3,
  Leaf,
  Filter,
} from 'lucide-react';

export interface RegionalFleetCluster {
  id: string;
  name: string;
  code: string;
  centroid: Coordinates;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  description: string;
  vessels: FerryWithFuel[];
  totalFuelBurnLph: number;
  totalHourlyCostInr: number;
  totalCo2KgPerHour: number;
  avgSpeedKnots: number;
  avgFuelEfficiencyLpNm: number; // Liters per Nautical Mile
  dominantStatus: string;
}

export interface FerryWithFuel extends Ferry {
  fuelBurnLph: number;
  fuelEfficiencyLpNm: number;
  hourlyCostInr: number;
  engineRpm: number;
  engineLoadPct: number;
  fuelRemainingLiters: number;
  estimatedRangeHours: number;
  ecoMode: boolean;
}

// Calculate realistic fuel consumption telemetry for a ferry
export function calculateVesselFuelTelemetry(ferry: Ferry): FerryWithFuel {
  const isMoving = ferry.speedKnots > 0.5;
  const baseBurn =
    ferry.type === 'Ro-Pax Ferry'
      ? 135
      : ferry.type === 'Catamaran'
      ? 110
      : ferry.type === 'High-Speed Water Taxi'
      ? 78
      : 52;

  // Fuel consumption scales exponentially with speed: P ~ v^2.8
  const speedFactor = isMoving ? Math.pow(ferry.speedKnots / 16, 2.2) : 0.12; // 12% for idling auxiliary gen
  const healthPenalty = (100 - ferry.engineHealth) * 0.005; // degraded engine burns slightly more
  const rawBurn = baseBurn * speedFactor * (1 + healthPenalty);
  const fuelBurnLph = parseFloat(Math.max(12, rawBurn).toFixed(1));

  const fuelEfficiencyLpNm =
    isMoving && ferry.speedKnots > 0
      ? parseFloat((fuelBurnLph / ferry.speedKnots).toFixed(2))
      : 0;

  const dieselCostPerLiter = 94.5; // Commercial Marine Gas Oil INR/L
  const hourlyCostInr = Math.round(fuelBurnLph * dieselCostPerLiter);
  const totalTankCapacityL = ferry.type === 'Ro-Pax Ferry' ? 4500 : ferry.type === 'Catamaran' ? 2400 : 1200;
  const fuelRemainingLiters = Math.round((ferry.fuelLevel / 100) * totalTankCapacityL);
  const estimatedRangeHours = parseFloat((fuelRemainingLiters / (fuelBurnLph || 1)).toFixed(1));

  const engineRpm = isMoving ? Math.round(900 + (ferry.speedKnots / 25) * 1150) : 650;
  const engineLoadPct = isMoving ? Math.min(95, Math.round(30 + (ferry.speedKnots / 25) * 60)) : 18;

  return {
    ...ferry,
    fuelBurnLph,
    fuelEfficiencyLpNm,
    hourlyCostInr,
    engineRpm,
    engineLoadPct,
    fuelRemainingLiters,
    estimatedRangeHours,
    ecoMode: fuelEfficiencyLpNm > 0 && fuelEfficiencyLpNm < 6.5,
  };
}

export const FleetClusterOverviewMap: React.FC<{
  onSelectVessel?: (vesselId: string) => void;
  className?: string;
}> = ({ onSelectVessel, className = '' }) => {
  const { ferries, routes, setSelectedFerryId, setActiveView, theme } = useFerry();
  const isDark = theme === 'dark';

  const [selectedClusterId, setSelectedClusterId] = useState<string>('cluster-south-mumbai');
  const [selectedVesselDetail, setSelectedVesselDetail] = useState<FerryWithFuel | null>(null);
  const [fuelViewMetric, setFuelViewMetric] = useState<'burnRate' | 'efficiency' | 'cost'>('burnRate');
  const [ecoFilterOnly, setEcoFilterOnly] = useState<boolean>(false);

  // Define four strategic maritime operational sectors across Mumbai Harbour
  const clusters: RegionalFleetCluster[] = useMemo(() => {
    const enrichedFerries = ferries.map(calculateVesselFuelTelemetry);

    const regionDefs = [
      {
        id: 'cluster-south-mumbai',
        name: 'South Mumbai & Gateway Fairway',
        code: 'SMB-GW',
        centroid: { lat: 18.922, lng: 72.835 },
        bounds: { minLat: 18.90, maxLat: 18.95, minLng: 72.81, maxLng: 72.87 },
        description: 'Gateway of India harbor approaches, Radio Club anchorage, and Elephanta tourist channel.',
        matcher: (f: Ferry) =>
          f.position.lat >= 18.89 &&
          f.position.lat <= 18.95 &&
          f.position.lng >= 72.81 &&
          f.position.lng <= 72.87 &&
          !f.currentRouteId?.includes('mora'),
      },
      {
        id: 'cluster-mandwa-alibaug',
        name: 'Mandwa & Alibaug Coastal Corridor',
        code: 'MDW-ABG',
        centroid: { lat: 18.805, lng: 72.842 },
        bounds: { minLat: 18.76, maxLat: 18.86, minLng: 72.80, maxLng: 72.88 },
        description: 'Ro-Pax car ferry terminal, Rewas jetty, and open Arabian Sea coastal approaches.',
        matcher: (f: Ferry) =>
          f.position.lat < 18.86 ||
          f.currentRouteId?.includes('mandwa') ||
          f.destinationPortId === 'port-mandwa',
      },
      {
        id: 'cluster-central-harbour',
        name: 'Central Harbour & Bhaucha Dhakka',
        code: 'CHB-BDK',
        centroid: { lat: 18.948, lng: 72.875 },
        bounds: { minLat: 18.92, maxLat: 18.99, minLng: 72.84, maxLng: 72.93 },
        description: 'Ferry Wharf (Bhaucha Dhakka), Mora Pier, Butcher Island crude terminal channel, and Elephanta Island.',
        matcher: (f: Ferry) =>
          (f.position.lat >= 18.92 && f.position.lng >= 72.87 && f.position.lng < 72.94) ||
          f.currentRouteId?.includes('mora') ||
          f.currentRouteId?.includes('elephanta'),
      },
      {
        id: 'cluster-navi-mumbai',
        name: 'Navi Mumbai & Belapur Estuary',
        code: 'NMB-BLP',
        centroid: { lat: 18.995, lng: 72.985 },
        bounds: { minLat: 18.93, maxLat: 19.04, minLng: 72.94, maxLng: 73.04 },
        description: 'Panvel Creek channel, Belapur Water Taxi terminal, Nerul Jetty, and JNPT container port fairway.',
        matcher: (f: Ferry) =>
          f.position.lng >= 72.94 ||
          f.currentRouteId?.includes('belapur') ||
          f.destinationPortId === 'port-belapur',
      },
    ];

    // Assign vessels to regions cleanly
    const assignedIds = new Set<string>();
    const result: RegionalFleetCluster[] = regionDefs.map((def) => {
      const matched = enrichedFerries.filter((f) => {
        if (assignedIds.has(f.id)) return false;
        const matches = def.matcher(f);
        if (matches) assignedIds.add(f.id);
        return matches;
      });

      // If a vessel wasn't caught by matchers, place in closest centroid
      const totalBurn = matched.reduce((acc, v) => acc + v.fuelBurnLph, 0);
      const totalCost = matched.reduce((acc, v) => acc + v.hourlyCostInr, 0);
      const totalCo2 = parseFloat((totalBurn * 2.68).toFixed(1)); // 2.68 kg CO2/L marine fuel
      const avgSpeed = matched.length
        ? parseFloat((matched.reduce((acc, v) => acc + v.speedKnots, 0) / matched.length).toFixed(1))
        : 0;
      const movingVessels = matched.filter((v) => v.fuelEfficiencyLpNm > 0);
      const avgEfficiency = movingVessels.length
        ? parseFloat((movingVessels.reduce((acc, v) => acc + v.fuelEfficiencyLpNm, 0) / movingVessels.length).toFixed(2))
        : 5.8;

      return {
        id: def.id,
        name: def.name,
        code: def.code,
        centroid: def.centroid,
        bounds: def.bounds,
        description: def.description,
        vessels: matched,
        totalFuelBurnLph: parseFloat(totalBurn.toFixed(1)),
        totalHourlyCostInr: totalCost,
        totalCo2KgPerHour: totalCo2,
        avgSpeedKnots: avgSpeed,
        avgFuelEfficiencyLpNm: avgEfficiency,
        dominantStatus: matched.some((v) => v.status === 'delayed')
          ? 'Delayed Vessels'
          : matched.some((v) => v.speedKnots > 0)
          ? 'Active Cruising'
          : 'Docked / Anchored',
      };
    });

    // Catch any leftover vessels and assign to south-mumbai
    const unassigned = enrichedFerries.filter((f) => !assignedIds.has(f.id));
    if (unassigned.length > 0 && result[0]) {
      result[0].vessels.push(...unassigned);
      result[0].totalFuelBurnLph = parseFloat(
        result[0].vessels.reduce((acc, v) => acc + v.fuelBurnLph, 0).toFixed(1)
      );
      result[0].totalHourlyCostInr = result[0].vessels.reduce((acc, v) => acc + v.hourlyCostInr, 0);
      result[0].totalCo2KgPerHour = parseFloat((result[0].totalFuelBurnLph * 2.68).toFixed(1));
    }

    return result;
  }, [ferries]);

  const activeCluster = useMemo(() => {
    return clusters.find((c) => c.id === selectedClusterId) || clusters[0];
  }, [clusters, selectedClusterId]);

  // Total Fleet Fuel Aggregates
  const totalFleetBurnLph = useMemo(() => {
    return parseFloat(clusters.reduce((acc, c) => acc + c.totalFuelBurnLph, 0).toFixed(1));
  }, [clusters]);

  const totalFleetHourlyCostInr = useMemo(() => {
    return clusters.reduce((acc, c) => acc + c.totalHourlyCostInr, 0);
  }, [clusters]);

  const totalFleetCo2KgPerHour = useMemo(() => {
    return parseFloat((totalFleetBurnLph * 2.68).toFixed(1));
  }, [totalFleetBurnLph]);

  // Projected SVG coordinates converter
  // Mumbai coordinates mapping: Lat 18.75 to 19.05, Lng 72.80 to 73.05
  const projectToSvg = (coords: Coordinates, width = 740, height = 480) => {
    const minLat = 18.76;
    const maxLat = 19.04;
    const minLng = 72.80;
    const maxLng = 73.04;

    const x = ((coords.lng - minLng) / (maxLng - minLng)) * (width - 80) + 40;
    const y = ((maxLat - coords.lat) / (maxLat - minLat)) * (height - 80) + 40;
    return { x, y };
  };

  const handleFocusVessel = (vessel: FerryWithFuel) => {
    setSelectedFerryId(vessel.id);
    if (onSelectVessel) {
      onSelectVessel(vessel.id);
    }
  };

  return (
    <div
      id="fleet-regional-clusters-overview-container"
      className={`rounded-2xl border p-4 sm:p-5 shadow-2xl transition-colors space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } ${className}`}
    >
      {/* 1. Header & Live Fuel Burn Tickers */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-cyan-500 text-white shadow-lg shadow-amber-950/40">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Fleet Regional Clusters & Real-Time Fuel Telemetry
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>4 Maritime Sectors</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              High-level geospatial vessel clustering with hydrodynamic fuel burn rate, propulsion telemetry, and carbon footprint
            </p>
          </div>
        </div>

        {/* Global Fleet Fuel KPI Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Fleet Burn Rate</span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-sm font-extrabold text-amber-300">{totalFleetBurnLph}</span>
              <span className="text-[10px] text-slate-400">L/h</span>
            </div>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Fleet Fuel Cost</span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-sm font-extrabold text-emerald-400">₹{totalFleetHourlyCostInr.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">/hr</span>
            </div>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">CO2 Emissions</span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-sm font-extrabold text-sky-300">{totalFleetCo2KgPerHour}</span>
              <span className="text-[10px] text-slate-400">kg/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Maritime Cluster Map & Interactive Fuel Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT / CENTER: Interactive Maritime Cluster Map (SVG Radar Display) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-3 relative overflow-hidden flex flex-col justify-between">
          {/* Map Controls Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10 pb-2 border-b border-slate-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Harbour Geographic Clusters</span>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setFuelViewMetric('burnRate')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  fuelViewMetric === 'burnRate'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Burn Rate (L/h)
              </button>
              <button
                type="button"
                onClick={() => setFuelViewMetric('efficiency')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  fuelViewMetric === 'efficiency'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Efficiency (L/NM)
              </button>
              <button
                type="button"
                onClick={() => setFuelViewMetric('cost')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  fuelViewMetric === 'cost'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hourly Cost (₹)
              </button>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[360px] sm:h-[420px] rounded-xl overflow-hidden bg-slate-950 border border-slate-900 select-none">
            <svg
              viewBox="0 0 740 480"
              className="w-full h-full"
              style={{ background: 'radial-gradient(circle at 40% 45%, #082136 0%, #030d17 80%)' }}
            >
              <defs>
                {/* Sector Glow Filter */}
                <filter id="cluster-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="channel-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              {/* Grid Lines for Nautical Coordinates */}
              {[100, 200, 300, 400].map((y) => (
                <line key={`h-${y}`} x1="0" y1={y} x2="740" y2={y} stroke="#0e3352" strokeWidth="0.8" strokeDasharray="4 6" />
              ))}
              {[150, 300, 450, 600].map((x) => (
                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="480" stroke="#0e3352" strokeWidth="0.8" strokeDasharray="4 6" />
              ))}

              {/* Stylized Mumbai Shorelines & Fairway Outlines */}
              {/* Western Shoreline (South Mumbai Peninsula: Colaba to Worli) */}
              <path
                d="M 120 40 Q 140 100 150 180 T 165 240 Q 168 280 155 310 Q 145 340 135 380 L 70 380 L 70 40 Z"
                fill="#0f2638"
                stroke="#1e4464"
                strokeWidth="1.5"
                opacity="0.85"
              />
              <text x="100" y="220" fill="#38bdf8" fontSize="11" fontWeight="bold" opacity="0.6">
                MUMBAI PENINSULA
              </text>
              <text x="145" y="270" fill="#94a3b8" fontSize="9" opacity="0.8">
                Gateway of India
              </text>

              {/* Eastern Shoreline (Navi Mumbai / JNPT / Uran / Mandwa) */}
              <path
                d="M 520 40 Q 510 110 520 180 T 500 280 Q 480 340 440 390 T 360 450 L 720 450 L 720 40 Z"
                fill="#0f2638"
                stroke="#1e4464"
                strokeWidth="1.5"
                opacity="0.85"
              />
              <text x="560" y="140" fill="#38bdf8" fontSize="11" fontWeight="bold" opacity="0.6">
                NAVI MUMBAI (BELAPUR)
              </text>
              <text x="540" y="270" fill="#94a3b8" fontSize="9" opacity="0.8">
                JNPT Container Terminals
              </text>
              <text x="400" y="440" fill="#94a3b8" fontSize="9" opacity="0.8">
                Mandwa / Alibaug
              </text>

              {/* Elephanta Island (Center Harbour) */}
              <ellipse cx="380" cy="210" rx="26" ry="18" fill="#13334c" stroke="#2563eb" strokeWidth="1" />
              <text x="355" y="214" fill="#38bdf8" fontSize="9" fontWeight="600">
                Elephanta
              </text>

              {/* Butcher Island (Jawahar Dweep) */}
              <ellipse cx="320" cy="180" rx="14" ry="10" fill="#13334c" stroke="#0284c7" strokeWidth="1" />
              <text x="305" y="183" fill="#64748b" fontSize="7">
                Butcher Is.
              </text>

              {/* Navigation Corridors / Fairway Channels */}
              <path
                d="M 175 270 Q 260 340 370 410"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <path
                d="M 175 270 Q 280 240 370 215"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.4"
              />
              <path
                d="M 210 160 Q 380 200 480 240"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.4"
              />
              <path
                d="M 370 410 Q 480 320 540 160"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.4"
              />

              {/* Render Individual Vessel AIS Dots with Wake trail */}
              {clusters.flatMap((cluster) =>
                cluster.vessels.map((vessel) => {
                  const pt = projectToSvg(vessel.position);
                  const isSelected = selectedVesselDetail?.id === vessel.id;
                  return (
                    <g
                      key={vessel.id}
                      className="cursor-pointer transition-transform hover:scale-125"
                      onClick={() => {
                        setSelectedClusterId(cluster.id);
                        setSelectedVesselDetail(vessel);
                      }}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 6 : 4}
                        fill={vessel.speedKnots > 0 ? '#38bdf8' : '#64748b'}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      {vessel.speedKnots > 0 && (
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x + Math.sin((vessel.heading * Math.PI) / 180) * 12}
                          y2={pt.y - Math.cos((vessel.heading * Math.PI) / 180) * 12}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      )}
                    </g>
                  );
                })
              )}

              {/* Render Cluster Centroid Nodes with Interactive Fuel Badges */}
              {clusters.map((cluster) => {
                const pt = projectToSvg(cluster.centroid);
                const isSelected = selectedClusterId === cluster.id;
                const vesselCount = cluster.vessels.length;
                const totalBurn = cluster.totalFuelBurnLph;

                // Color based on burn rate intensity
                const clusterColor =
                  totalBurn >= 200 ? '#f59e0b' : totalBurn >= 100 ? '#06b6d4' : '#10b981';

                return (
                  <g
                    key={cluster.id}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => {
                      setSelectedClusterId(cluster.id);
                      setSelectedVesselDetail(cluster.vessels[0] || null);
                    }}
                  >
                    {/* Animated Pulsing Outer Wave Ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 48 : 36}
                      fill={clusterColor}
                      fillOpacity={isSelected ? 0.18 : 0.08}
                      stroke={clusterColor}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : '3 3'}
                      filter="url(#cluster-glow)"
                    />

                    {/* Inner Cluster Capsule */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 24 : 20}
                      fill="#030d17"
                      stroke={clusterColor}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />

                    {/* Vessel count inside node */}
                    <text
                      x={pt.x}
                      y={pt.y - 2}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={isSelected ? '12' : '11'}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {vesselCount}
                    </text>
                    <text
                      x={pt.x}
                      y={pt.y + 9}
                      textAnchor="middle"
                      fill={clusterColor}
                      fontSize="7"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      VESSELS
                    </text>

                    {/* Floating Telemetry Tag Pill */}
                    <g transform={`translate(${pt.x - 55}, ${pt.y + 26})`}>
                      <rect
                        width="110"
                        height="24"
                        rx="6"
                        fill="#091824"
                        fillOpacity="0.95"
                        stroke={isSelected ? clusterColor : '#1e3a5f'}
                        strokeWidth={isSelected ? 1.5 : 1}
                      />
                      <text
                        x="55"
                        y="11"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                        fontWeight="600"
                      >
                        {cluster.code}
                      </text>
                      <text
                        x="55"
                        y="20"
                        textAnchor="middle"
                        fill={clusterColor}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {fuelViewMetric === 'burnRate'
                          ? `${cluster.totalFuelBurnLph} L/h`
                          : fuelViewMetric === 'efficiency'
                          ? `${cluster.avgFuelEfficiencyLpNm} L/NM`
                          : `₹${cluster.totalHourlyCostInr.toLocaleString()}/h`}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Quick Sector Switching Pills Overlay */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 overflow-x-auto bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800">
              {clusters.map((c) => {
                const isSelected = c.id === selectedClusterId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClusterId(c.id);
                      setSelectedVesselDetail(c.vessels[0] || null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{c.name.split('&')[0].trim()}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-950 text-cyan-300">
                      {c.vessels.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Selected Cluster Interactive Fuel Consumption Popup / Detail Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Active Cluster Header Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                  Active Cluster Sector
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight">{activeCluster.name}</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                {activeCluster.code}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">{activeCluster.description}</p>

            {/* Cluster Real-Time Fuel Matrix */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Burn Rate</span>
                <span className="text-base font-extrabold font-mono text-amber-300">
                  {activeCluster.totalFuelBurnLph}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">Liters/Hour</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cluster Fuel Cost</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  ₹{activeCluster.totalHourlyCostInr.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">per hour</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CO2 Emissions</span>
                <span className="text-base font-extrabold font-mono text-sky-300">
                  {activeCluster.totalCo2KgPerHour}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">kg/hr CO2</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Avg Speed: {activeCluster.avgSpeedKnots} knots</span>
              <span className="text-cyan-400 font-mono">
                Efficiency Index: {activeCluster.avgFuelEfficiencyLpNm} L/NM
              </span>
            </div>
          </div>

          {/* Vessels In This Cluster: Fuel Consumption Breakdown */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Vessel Fuel Breakdown ({activeCluster.vessels.length})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Click to Inspect</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeCluster.vessels.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No vessels currently positioned in this corridor.
                </div>
              ) : (
                activeCluster.vessels.map((vessel) => {
                  const isSelected = selectedVesselDetail?.id === vessel.id;
                  return (
                    <div
                      key={vessel.id}
                      onClick={() => setSelectedVesselDetail(vessel)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-700 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{vessel.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {vessel.vesselId}
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-amber-300 text-xs">
                          {vessel.fuelBurnLph} L/h
                        </span>
                      </div>

                      {/* Fuel Tank Level Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Fuel Tank ({vessel.fuelRemainingLiters.toLocaleString()} L)</span>
                          <span className={vessel.fuelLevel > 30 ? 'text-emerald-400' : 'text-amber-400'}>
                            {vessel.fuelLevel}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              vessel.fuelLevel > 50
                                ? 'bg-emerald-400'
                                : vessel.fuelLevel > 25
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${vessel.fuelLevel}%` }}
                          />
                        </div>
                      </div>

                      {/* Speed, Engine RPM, and Cost Breakdown */}
                      <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-slate-400 font-mono border-t border-slate-800/80">
                        <div>
                          <span>Speed: </span>
                          <span className="text-slate-200 font-bold">{vessel.speedKnots} kts</span>
                        </div>
                        <div>
                          <span>Engine: </span>
                          <span className="text-cyan-300 font-bold">{vessel.engineRpm} RPM</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold">₹{vessel.hourlyCostInr}/h</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="pt-2 flex items-center justify-between gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFocusVessel(vessel);
                              setActiveView('live-tracking');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors flex items-center gap-1 text-[10px]"
                          >
                            <Compass className="w-3 h-3" />
                            <span>Track on AIS Radar</span>
                          </button>
                          <span className="text-[10px] text-slate-400">
                            Range: ~{vessel.estimatedRangeHours} hrs
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
