import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry, Trip } from '../../types';
import {
  Fuel,
  Leaf,
  Gauge,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Wind,
  Zap,
  Sliders,
  Radio,
  Send,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface VesselEfficiencyData {
  ferry: Ferry;
  currentSpeed: number;
  optimalSpeed: number;
  currentFuelBurnLph: number;
  optimalFuelBurnLph: number;
  fuelSavedLph: number;
  fuelSavedPercent: number;
  co2CurrentKgPerHr: number;
  co2OptimalKgPerHr: number;
  co2SavedKgPerHr: number;
  etaTradeoffMinutes: number;
  status: 'Optimal' | 'Slightly High' | 'Excessive Burn' | 'Moored';
  ecoGrade: 'A+' | 'A' | 'B' | 'C';
}

// Marine diesel emits approx 2.68 kg CO2 per liter burned
const CO2_KG_PER_LITER = 2.68;
// Commercial marine diesel cost estimate ~ ₹94 / liter
const DIESEL_COST_PER_LITER_INR = 94;

export const FleetEfficiencyWidget: React.FC = () => {
  const { ferries, trips, updateFerry, publishAlert, addAuditLog } = useFerry();

  const [selectedVesselId, setSelectedVesselId] = useState<string>(ferries[0]?.id || '');
  const [speedAdjustmentOffset, setSpeedAdjustmentOffset] = useState<number>(0);
  const [advisorySentVessels, setAdvisorySentVessels] = useState<Record<string, boolean>>({});
  const [activeSimulationMode, setActiveSimulationMode] = useState<'standard' | 'eco_max' | 'balanced'>('balanced');

  // Calculate efficiency data for each ferry
  const fleetData: VesselEfficiencyData[] = useMemo(() => {
    return ferries.map((f) => {
      const isMoving = f.speedKnots > 1.0;
      const currentSpeed = f.speedKnots;

      // Base optimal cruising speed depends on vessel hull type
      let baseOptimal = 14.5;
      let baseBurnAtOptimal = 95; // Liters/hr

      if (f.type === 'High-Speed Water Taxi') {
        baseOptimal = 17.5;
        baseBurnAtOptimal = 70;
      } else if (f.type === 'Ro-Pax Ferry') {
        baseOptimal = 13.5;
        baseBurnAtOptimal = 140;
      } else if (f.type === 'Catamaran') {
        baseOptimal = 15.0;
        baseBurnAtOptimal = 110;
      } else {
        baseOptimal = 12.0;
        baseBurnAtOptimal = 80;
      }

      // Apply active operator simulation mode
      let targetOptimalSpeed = baseOptimal;
      if (activeSimulationMode === 'eco_max') {
        targetOptimalSpeed = Math.max(10, baseOptimal - 2.0);
      } else if (activeSimulationMode === 'standard') {
        targetOptimalSpeed = baseOptimal + 1.0;
      }

      // Speed offset slider impact
      targetOptimalSpeed = Math.max(10, targetOptimalSpeed + speedAdjustmentOffset);

      if (!isMoving) {
        return {
          ferry: f,
          currentSpeed: 0,
          optimalSpeed: 0,
          currentFuelBurnLph: 8.5, // Idling auxiliary generator
          optimalFuelBurnLph: 6.0,
          fuelSavedLph: 2.5,
          fuelSavedPercent: 29.4,
          co2CurrentKgPerHr: Number((8.5 * CO2_KG_PER_LITER).toFixed(1)),
          co2OptimalKgPerHr: Number((6.0 * CO2_KG_PER_LITER).toFixed(1)),
          co2SavedKgPerHr: Number((2.5 * CO2_KG_PER_LITER).toFixed(1)),
          etaTradeoffMinutes: 0,
          status: 'Moored',
          ecoGrade: 'A',
        };
      }

      // Hydrodynamic fuel law: fuel consumption scales non-linearly (~cubed with speed)
      // Fuel burn = baseBurn * (speed / optimalSpeed)^2.6
      const speedRatio = currentSpeed / baseOptimal;
      const currentFuelBurn =
        f.fuelConsumptionRateLitersPerHour ||
        Math.round(baseBurnAtOptimal * Math.pow(speedRatio, 2.5));

      const optimalRatio = targetOptimalSpeed / baseOptimal;
      const optimalFuelBurn = Math.round(baseBurnAtOptimal * Math.pow(optimalRatio, 2.5));

      const fuelSavedLph = Math.max(0, currentFuelBurn - optimalFuelBurn);
      const fuelSavedPercent = currentFuelBurn > 0 ? (fuelSavedLph / currentFuelBurn) * 100 : 0;

      const co2Current = currentFuelBurn * CO2_KG_PER_LITER;
      const co2Optimal = optimalFuelBurn * CO2_KG_PER_LITER;
      const co2Saved = Math.max(0, co2Current - co2Optimal);

      // Average trip distance ~ 12 nautical miles
      const currentTransitHours = 12 / Math.max(1, currentSpeed);
      const optimalTransitHours = 12 / Math.max(1, targetOptimalSpeed);
      const etaTradeoffMinutes = Math.max(0, Math.round((optimalTransitHours - currentTransitHours) * 60));

      let status: 'Optimal' | 'Slightly High' | 'Excessive Burn' | 'Moored' = 'Optimal';
      let ecoGrade: 'A+' | 'A' | 'B' | 'C' = 'A+';

      if (currentSpeed > targetOptimalSpeed + 2.5) {
        status = 'Excessive Burn';
        ecoGrade = 'C';
      } else if (currentSpeed > targetOptimalSpeed + 0.8) {
        status = 'Slightly High';
        ecoGrade = 'B';
      } else if (fuelSavedPercent <= 5) {
        status = 'Optimal';
        ecoGrade = 'A+';
      } else {
        status = 'Optimal';
        ecoGrade = 'A';
      }

      return {
        ferry: f,
        currentSpeed: Number(currentSpeed.toFixed(1)),
        optimalSpeed: Number(targetOptimalSpeed.toFixed(1)),
        currentFuelBurnLph: currentFuelBurn,
        optimalFuelBurnLph: optimalFuelBurn,
        fuelSavedLph: Number(fuelSavedLph.toFixed(1)),
        fuelSavedPercent: Number(fuelSavedPercent.toFixed(1)),
        co2CurrentKgPerHr: Number(co2Current.toFixed(1)),
        co2OptimalKgPerHr: Number(co2Optimal.toFixed(1)),
        co2SavedKgPerHr: Number(co2Saved.toFixed(1)),
        etaTradeoffMinutes,
        status,
        ecoGrade,
      };
    });
  }, [ferries, activeSimulationMode, speedAdjustmentOffset]);

  // Aggregate fleet metrics
  const aggregateMetrics = useMemo(() => {
    const moving = fleetData.filter((d) => d.status !== 'Moored');
    const totalCurrentBurn = fleetData.reduce((acc, d) => acc + d.currentFuelBurnLph, 0);
    const totalOptimalBurn = fleetData.reduce((acc, d) => acc + d.optimalFuelBurnLph, 0);
    const totalFuelSavedHr = Math.max(0, totalCurrentBurn - totalOptimalBurn);

    const totalCo2EmittedHr = fleetData.reduce((acc, d) => acc + d.co2CurrentKgPerHr, 0);
    const totalCo2SavedHr = fleetData.reduce((acc, d) => acc + d.co2SavedKgPerHr, 0);
    const dailyInrSaved = totalFuelSavedHr * 14 * DIESEL_COST_PER_LITER_INR; // 14 operating hours/day

    const avgSpeed =
      moving.length > 0
        ? (moving.reduce((acc, d) => acc + d.currentSpeed, 0) / moving.length).toFixed(1)
        : '0';
    const avgOptimalSpeed =
      moving.length > 0
        ? (moving.reduce((acc, d) => acc + d.optimalSpeed, 0) / moving.length).toFixed(1)
        : '0';

    return {
      totalCurrentBurn,
      totalOptimalBurn,
      totalFuelSavedHr,
      totalCo2EmittedHr,
      totalCo2SavedHr,
      dailyInrSaved,
      avgSpeed,
      avgOptimalSpeed,
      underwayCount: moving.length,
    };
  }, [fleetData]);

  // Chart data comparing Current vs Optimal Fuel Burn (L/h)
  const chartData = useMemo(() => {
    return fleetData.map((d) => ({
      name: d.ferry.name.split(' ')[0], // short name
      currentBurn: d.currentFuelBurnLph,
      optimalBurn: d.optimalFuelBurnLph,
      currentSpeed: d.currentSpeed,
      optimalSpeed: d.optimalSpeed,
      co2Saved: d.co2SavedKgPerHr,
    }));
  }, [fleetData]);

  // Dispatch advisory to captain
  const handleDispatchSpeedAdvisory = (vesselData: VesselEfficiencyData) => {
    const f = vesselData.ferry;
    setAdvisorySentVessels((prev) => ({ ...prev, [f.id]: true }));

    // Publish operational advisory alert
    publishAlert({
      title: `🌱 ECO-CRUISE SPEED ADVISORY: ${f.name}`,
      message: `Harbor Operations Dispatch: Cruising speed recommendation adjusted to ${vesselData.optimalSpeed} knots (current: ${vesselData.currentSpeed} kts). Projected fuel savings: -${vesselData.fuelSavedPercent}% with -${vesselData.co2SavedKgPerHr} kg CO₂/hr avoided. Schedule impact: +${vesselData.etaTradeoffMinutes} mins.`,
      severity: 'low',
      category: 'Port Advisory',
      affectedFerryId: f.id,
      validUntil: '2026-09-15T23:59:59Z',
      channels: ['Push', 'Web'],
    });

    addAuditLog(
      'Eco-Speed Advisory Dispatched',
      'Operator',
      `Sent optimal cruising speed advisory of ${vesselData.optimalSpeed} kts to ${f.name} (Capt. ${f.captainName}) to reduce emissions by ${vesselData.co2SavedKgPerHr} kg CO₂/hr.`
    );
  };

  const selectedData = fleetData.find((d) => d.ferry.id === selectedVesselId) || fleetData[0];

  return (
    <div
      id="fleet-efficiency-widget"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6 text-xs"
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-400">
            <Leaf className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">
                Fleet Fuel Efficiency & Emission Optimization Monitor
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Eco-Cruising AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Monitors real-time engine telemetry, hydrodynamic hull drag, and advises optimal speeds to curb marine carbon emissions.
            </p>
          </div>
        </div>

        {/* Eco Policy Modes */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSimulationMode('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSimulationMode === 'standard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Standard Transit
          </button>
          <button
            type="button"
            onClick={() => setActiveSimulationMode('balanced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSimulationMode === 'balanced'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Balanced Eco (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setActiveSimulationMode('eco_max')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSimulationMode === 'eco_max'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Max Carbon Reduction
          </button>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            Current Fuel Burn Rate
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {aggregateMetrics.totalCurrentBurn}{' '}
            <span className="text-xs text-slate-400 font-normal">L/hour</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across {aggregateMetrics.underwayCount} active underway vessels
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            Projected Fuel Savings
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            -{aggregateMetrics.totalFuelSavedHr.toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">L/hour</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 font-mono">
            Save ~₹{Math.round(aggregateMetrics.dailyInrSaved).toLocaleString('en-IN')}/day in marine diesel
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            CO₂ Carbon Abatement
          </span>
          <div className="text-2xl font-black font-mono text-emerald-300">
            -{aggregateMetrics.totalCo2SavedHr.toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">kg CO₂/hr</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Current emission: {aggregateMetrics.totalCo2EmittedHr.toFixed(0)} kg CO₂/hr
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
          <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            Cruising Speed Comparison
          </span>
          <div className="text-2xl font-black font-mono text-cyan-300">
            {aggregateMetrics.avgSpeed}{' '}
            <span className="text-xs text-slate-400 font-normal">kts</span>
            <span className="text-xs text-slate-500 mx-1.5">→</span>
            <span className="text-emerald-400">{aggregateMetrics.avgOptimalSpeed}</span>{' '}
            <span className="text-xs text-slate-400 font-normal">kts</span>
          </div>
          <div className="text-[11px] text-slate-400">Optimal target speed average</div>
        </div>
      </div>

      {/* Interactive Speed Calibration Slider */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Fine-tune Fleet Eco-Speed Target:</span>
          <span className="text-slate-400 text-[11px]">
            Adjust fleet-wide speed buffer ({speedAdjustmentOffset > 0 ? `+${speedAdjustmentOffset}` : speedAdjustmentOffset} kts)
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-slate-400 font-mono text-[10px]">-3 kts (High Eco)</span>
          <input
            type="range"
            min="-3"
            max="2"
            step="0.5"
            value={speedAdjustmentOffset}
            onChange={(e) => setSpeedAdjustmentOffset(parseFloat(e.target.value))}
            className="w-36 accent-cyan-500 cursor-pointer"
          />
          <span className="text-slate-400 font-mono text-[10px]">+2 kts (Express)</span>
          <button
            type="button"
            onClick={() => setSpeedAdjustmentOffset(0)}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Chart & Detailed Vessel Focus Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Comparative Recharts Chart */}
        <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-2">
              <Fuel className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Fuel Consumption: Current vs Recommended Cruising (L/hr)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              Lower is more sustainable
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'currentBurn') return [`${value} L/hr`, 'Current Fuel Burn'];
                    if (name === 'optimalBurn') return [`${value} L/hr`, 'Optimal Eco-Burn'];
                    return [value, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) =>
                    value === 'currentBurn'
                      ? 'Current Speed Burn (L/h)'
                      : 'Recommended Eco Speed Burn (L/h)'
                  }
                />
                <Bar dataKey="currentBurn" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimalBurn" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 Cols: Selected Vessel Card & Bridge Advisory Dispatch */}
        <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <Ship className="w-4 h-4 text-cyan-400" />
              <span>Vessel Optimization Spotlight</span>
            </span>
            <select
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-cyan-500"
            >
              {fleetData.map((d) => (
                <option key={d.ferry.id} value={d.ferry.id}>
                  {d.ferry.name} ({d.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div>
                <div className="font-bold text-white text-sm">{selectedData.ferry.name}</div>
                <div className="text-[11px] text-slate-400">
                  {selectedData.ferry.type} • Capt. {selectedData.ferry.captainName}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  selectedData.status === 'Optimal'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : selectedData.status === 'Excessive Burn'
                    ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                    : selectedData.status === 'Slightly High'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {selectedData.status} (Grade {selectedData.ecoGrade})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Current Speed Over Ground</span>
                <span className="text-cyan-300 font-bold text-base">
                  {selectedData.currentSpeed} kts
                </span>
                <span className="text-slate-400 text-[10px] block">Burn: {selectedData.currentFuelBurnLph} L/hr</span>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Recommended Cruising Speed</span>
                <span className="text-emerald-400 font-bold text-base">
                  {selectedData.optimalSpeed} kts
                </span>
                <span className="text-emerald-300 text-[10px] block">Burn: {selectedData.optimalFuelBurnLph} L/hr</span>
              </div>
            </div>

            <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Fuel Saved per Hour:</span>
                <strong className="text-emerald-400 font-mono">
                  {selectedData.fuelSavedLph} L ({selectedData.fuelSavedPercent}%)
                </strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>CO₂ Emission Abatement:</span>
                <strong className="text-emerald-300 font-mono">
                  -{selectedData.co2SavedKgPerHr} kg CO₂/hr
                </strong>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Crossing Time Trade-off:</span>
                <span className="text-slate-300 font-mono">
                  +{selectedData.etaTradeoffMinutes} min arrival difference
                </span>
              </div>
            </div>

            {/* Action button to dispatch advisory */}
            <button
              type="button"
              onClick={() => handleDispatchSpeedAdvisory(selectedData)}
              disabled={advisorySentVessels[selectedData.ferry.id]}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                advisorySentVessels[selectedData.ferry.id]
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black'
              }`}
            >
              {advisorySentVessels[selectedData.ferry.id] ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Advisory Active on Captain's Bridge</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Speed Recommendation to Bridge</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Fleet Efficiency Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-white text-xs flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Real-Time Fleet Telemetry & Carbon Emission Abatement Table</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Updated via AIS & engine CAN-bus
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Vessel & Type</th>
                <th className="py-2.5 px-3">Current Speed</th>
                <th className="py-2.5 px-3">Optimal Speed</th>
                <th className="py-2.5 px-3">Current Fuel Burn</th>
                <th className="py-2.5 px-3">Projected Savings</th>
                <th className="py-2.5 px-3">CO₂ Reduction</th>
                <th className="py-2.5 px-3">Schedule Impact</th>
                <th className="py-2.5 px-3">Efficiency Status</th>
                <th className="py-2.5 px-3 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {fleetData.map((item) => (
                <tr
                  key={item.ferry.id}
                  className={`hover:bg-slate-900/60 transition-colors ${
                    item.ferry.id === selectedVesselId ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-sans">
                    <div className="font-bold text-white text-xs">{item.ferry.name}</div>
                    <div className="text-[10px] text-slate-400">{item.ferry.vesselId} • {item.ferry.type}</div>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-cyan-300 font-bold">{item.currentSpeed} kts</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-emerald-400 font-bold">{item.optimalSpeed} kts</span>
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {item.currentFuelBurnLph} L/h
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-emerald-400 font-semibold">
                      -{item.fuelSavedLph} L/h ({item.fuelSavedPercent}%)
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-emerald-300 font-bold">
                      -{item.co2SavedKgPerHr} kg/h
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    +{item.etaTradeoffMinutes}m
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === 'Optimal'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : item.status === 'Excessive Burn'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : item.status === 'Slightly High'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => handleDispatchSpeedAdvisory(item)}
                      disabled={advisorySentVessels[item.ferry.id]}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
                        advisorySentVessels[item.ferry.id]
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                          : 'bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {advisorySentVessels[item.ferry.id] ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Notified</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Advise Speed</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
