import React, { useState, useMemo } from 'react';
import { Ferry } from '../../types';
import { useFerry } from '../../context/FerryContext';
import {
  Fuel,
  Sparkles,
  TrendingDown,
  Wind,
  Waves,
  Gauge,
  CheckCircle2,
  Sliders,
  DollarSign,
  Leaf,
  Clock,
  ArrowRight,
  Zap,
  Info,
  ChevronRight,
  Ship,
} from 'lucide-react';

interface FuelEfficiencyAdvisorProps {
  activeFerry: Ferry;
  throttleSpeed: number;
  onApplySpeed: (speed: number) => void;
  className?: string;
}

export const FuelEfficiencyAdvisor: React.FC<FuelEfficiencyAdvisorProps> = ({
  activeFerry,
  throttleSpeed,
  onApplySpeed,
  className = '',
}) => {
  const { addAuditLog } = useFerry();

  // Environmental conditions state with realistic marine baseline values
  const [tidalCurrentKnots, setTidalCurrentKnots] = useState<number>(1.6); // Opposing flood current (+1.6 kts)
  const [currentDirection, setCurrentDirection] = useState<'opposing' | 'following'>('opposing');
  const [windKnots, setWindKnots] = useState<number>(14); // 14 kts sea breeze
  const [windAngle, setWindAngle] = useState<'headwind' | 'tailwind' | 'crosswind'>('headwind');
  const [hullCondition, setHullCondition] = useState<'clean' | 'slight_fouling' | 'heavy_fouling'>('clean');
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(92); // ₹92/L Marine HSD
  const [isAppliedNotice, setIsAppliedNotice] = useState<boolean>(false);

  // Vessel Payload Factor from current passengers and vehicle capacity
  const payloadFactor = useMemo(() => {
    const paxRatio = activeFerry.currentPassengers / Math.max(1, activeFerry.capacity);
    const vehicleRatio =
      activeFerry.vehicleCapacity > 0
        ? activeFerry.currentVehicles / activeFerry.vehicleCapacity
        : 0;
    return Math.min(1.0, Math.max(0.3, (paxRatio + (activeFerry.vehicleCapacity > 0 ? vehicleRatio : paxRatio)) / 2));
  }, [activeFerry]);

  // Hydrodynamic resistance and fuel consumption computation engine
  // Based on Admiralty resistance coefficient: Power ~ Displ^(2/3) * V^3 modified for tidal and aero drag
  const calculations = useMemo(() => {
    const effectiveCurrent = currentDirection === 'opposing' ? tidalCurrentKnots : -tidalCurrentKnots;
    const windDragFactor =
      windAngle === 'headwind' ? 1 + (windKnots / 60) * 0.25 : windAngle === 'tailwind' ? 1 - (windKnots / 60) * 0.12 : 1.05;
    const hullDrag = hullCondition === 'clean' ? 1.0 : hullCondition === 'slight_fouling' ? 1.08 : 1.22;
    const displacementMultiplier = 0.85 + payloadFactor * 0.35;

    // Fuel Burn Curve function: liters/hour at speed v (knots)
    const calculateFuelRate = (v: number) => {
      if (v <= 0) return 6; // Idle generator auxiliary load: 6 L/h
      // Non-linear planing/displacement curve
      const speedOverWater = Math.max(0.5, v + effectiveCurrent);
      const baseConsumption = 8 + 0.022 * Math.pow(speedOverWater, 2.9);
      return Math.round(baseConsumption * windDragFactor * hullDrag * displacementMultiplier * 10) / 10;
    };

    // Current operating point
    const currentFuelRateLph = calculateFuelRate(throttleSpeed);

    // AI Optimal Eco-Cruise Point Finder
    // Optimize for fuel per nautical mile: FPM = LPH / V (ground speed)
    let bestSpeed = 14.5;
    let minFuelPerNm = 9999;

    for (let s = 10.0; s <= 22.0; s += 0.2) {
      const fuelRate = calculateFuelRate(s);
      const groundSpeed = Math.max(2, s - effectiveCurrent);
      const fuelPerNm = fuelRate / groundSpeed;
      if (fuelPerNm < minFuelPerNm) {
        minFuelPerNm = fuelPerNm;
        bestSpeed = Math.round(s * 10) / 10;
      }
    }

    const optimalSpeed = bestSpeed;
    const optimalFuelRateLph = calculateFuelRate(optimalSpeed);

    // Comparison Metrics across a typical passage (14.2 km ~ 7.67 NM)
    const passageNm = 7.67;
    const currentPassageHours = passageNm / Math.max(3, throttleSpeed);
    const optimalPassageHours = passageNm / Math.max(3, optimalSpeed);

    const currentTimeMin = Math.round(currentPassageHours * 60 * 10) / 10;
    const optimalTimeMin = Math.round(optimalPassageHours * 60 * 10) / 10;
    const deltaMinutes = Math.round((optimalTimeMin - currentTimeMin) * 10) / 10;

    const currentFuelTripLiters = Math.round(currentFuelRateLph * currentPassageHours * 10) / 10;
    const optimalFuelTripLiters = Math.round(optimalFuelRateLph * optimalPassageHours * 10) / 10;
    const litersSavedTrip = Math.max(0, Math.round((currentFuelTripLiters - optimalFuelTripLiters) * 10) / 10);
    const percentSavings =
      currentFuelRateLph > 0 ? Math.round(((currentFuelRateLph - optimalFuelRateLph) / currentFuelRateLph) * 100) : 0;

    const costSavedInr = Math.round(litersSavedTrip * fuelPricePerLiter);
    const co2SavedKg = Math.round(litersSavedTrip * 2.68 * 10) / 10; // 2.68 kg CO2 per liter of marine diesel

    // Speed curve samples from 10 to 22 knots for visual comparison
    const curvePoints = [10, 12, 14, 15, 16, 18, 20, 22].map((s) => ({
      speed: s,
      rate: calculateFuelRate(s),
      isCurrent: Math.abs(s - throttleSpeed) < 1.0,
      isOptimal: Math.abs(s - optimalSpeed) < 0.8,
    }));

    return {
      currentFuelRateLph,
      optimalSpeed,
      optimalFuelRateLph,
      currentTimeMin,
      optimalTimeMin,
      deltaMinutes,
      currentFuelTripLiters,
      optimalFuelTripLiters,
      litersSavedTrip,
      percentSavings,
      costSavedInr,
      co2SavedKg,
      curvePoints,
    };
  }, [
    throttleSpeed,
    tidalCurrentKnots,
    currentDirection,
    windKnots,
    windAngle,
    hullCondition,
    payloadFactor,
    fuelPricePerLiter,
  ]);

  const handleApplyOptimalSpeed = () => {
    onApplySpeed(calculations.optimalSpeed);
    setIsAppliedNotice(true);
    addAuditLog(
      'Fuel Efficiency Speed Applied',
      'System',
      `Master applied AI Eco-Speed recommendation of ${calculations.optimalSpeed} kts on ${activeFerry.name} (projected -${calculations.percentSavings}% fuel burn).`
    );
    setTimeout(() => setIsAppliedNotice(false), 3500);
  };

  return (
    <div
      id="fuel-efficiency-advisor-panel"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Hydrodynamic Fuel Efficiency Advisor
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                REAL-TIME HYDRO-AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculates optimum engine throttle speed factoring tidal flow, wind resistance, and passenger displacement
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyOptimalSpeed}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Eco-Cruise ({calculations.optimalSpeed} kts)</span>
          </button>
        </div>
      </div>

      {/* Applied Banner */}
      {isAppliedNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Throttle synchronized! Vessel cruising at optimal <strong>{calculations.optimalSpeed} kts</strong>.
              Conserving approximately {calculations.litersSavedTrip} Litres per trip.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-300">THROTTLE SET</span>
        </div>
      )}

      {/* Main KPI Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {/* Current Burn */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">CURRENT CONSUMPTION</span>
          <div className="text-2xl font-extrabold font-mono text-white">
            {calculations.currentFuelRateLph}{' '}
            <span className="text-xs font-normal text-slate-400">L/hour</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Throttle: <span className="font-mono text-cyan-300 font-bold">{throttleSpeed.toFixed(1)} kts</span>
          </div>
          <div className="text-slate-500 text-[10px]">Passage burn: {calculations.currentFuelTripLiters} L</div>
        </div>

        {/* AI Suggested Speed */}
        <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/40 space-y-1.5 relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              AI SWEET SPOT
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300 uppercase block">RECOMMENDED ECO-SPEED</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-300">
            {calculations.optimalSpeed}{' '}
            <span className="text-xs font-normal text-emerald-400/80">kts</span>
          </div>
          <div className="text-emerald-400 text-[11px] font-semibold">
            {calculations.optimalFuelRateLph} L/hour ({calculations.percentSavings > 0 ? `-${calculations.percentSavings}%` : 'At Optimum'})
          </div>
          <div className="text-slate-400 text-[10px]">Passage burn: {calculations.optimalFuelTripLiters} L</div>
        </div>

        {/* Financial & Environmental Yield */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">PROJECTED TRIP SAVINGS</span>
          <div className="text-2xl font-extrabold font-mono text-cyan-300">
            ₹{calculations.costSavedInr.toLocaleString()}
          </div>
          <div className="text-emerald-400 text-[11px] flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5" />
            <span>-{calculations.co2SavedKg} kg CO₂ / voyage</span>
          </div>
          <div className="text-slate-500 text-[10px]">{calculations.litersSavedTrip} Litres marine fuel saved</div>
        </div>

        {/* Schedule Tradeoff */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">SCHEDULE DURATION IMPACT</span>
          <div className="text-2xl font-extrabold font-mono text-amber-300 flex items-baseline gap-1">
            <span>+{Math.max(0, calculations.deltaMinutes)}</span>
            <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Passage: {calculations.optimalTimeMin}m (vs {calculations.currentTimeMin}m)
            </span>
          </div>
          <div className="text-emerald-400 text-[10px]">Well within buffer schedule window</div>
        </div>
      </div>

      {/* Fuel Consumption Curve & Spectrum */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span>Hydrodynamic Fuel Consumption Spectrum (L/hr vs Speed)</span>
          </span>
          <span className="font-mono text-slate-500 text-[11px]">
            Cubic hull resistance curve with real-time drag integration
          </span>
        </div>

        {/* Spectrum bars */}
        <div className="grid grid-cols-8 gap-2 pt-2 text-center font-mono text-xs">
          {calculations.curvePoints.map((pt) => {
            const isCurrent = Math.abs(pt.speed - throttleSpeed) < 1.0;
            const isOptimal = Math.abs(pt.speed - calculations.optimalSpeed) < 0.8;

            return (
              <div
                key={pt.speed}
                onClick={() => onApplySpeed(pt.speed)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isOptimal
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
                    : isCurrent
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-slate-400">{pt.speed} kts</div>
                <div className="text-sm font-extrabold mt-0.5">{pt.rate} <span className="text-[9px] font-normal">L/h</span></div>
                <div className="mt-1">
                  {isOptimal ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                      Optimal
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-bold">
                      Current
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-500">
                      {pt.speed > calculations.optimalSpeed ? '+Burn' : '-Spd'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Environmental Drag & Sea Condition Simulation Controls */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Environmental Conditions & Hydrodynamic Trim Parameters</span>
          </span>
          <span className="text-slate-400 text-[11px]">Adjust to simulate route weather variations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Tidal Current */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tidal Current Force:</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {tidalCurrentKnots} kts ({currentDirection})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3.5"
              step="0.1"
              value={tidalCurrentKnots}
              onChange={(e) => setTidalCurrentKnots(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => setCurrentDirection('opposing')}
                className={`px-2 py-0.5 rounded ${
                  currentDirection === 'opposing'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                Opposing (+Drag)
              </button>
              <button
                type="button"
                onClick={() => setCurrentDirection('following')}
                className={`px-2 py-0.5 rounded ${
                  currentDirection === 'following'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                Following (-Drag)
              </button>
            </div>
          </div>

          {/* Apparent Wind */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>Wind Velocity:</span>
              </span>
              <span className="font-mono text-sky-300 font-bold">
                {windKnots} kts ({windAngle})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={windKnots}
              onChange={(e) => setWindKnots(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500"
            />
            <div className="flex gap-1.5 text-[10px]">
              {(['headwind', 'crosswind', 'tailwind'] as const).map((angle) => (
                <button
                  key={angle}
                  type="button"
                  onClick={() => setWindAngle(angle)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    windAngle === angle
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>
          </div>

          {/* Hull & Payload Drag */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hull Bio-fouling & Load:</span>
              </span>
              <span className="font-mono text-emerald-300 font-bold">
                {Math.round(payloadFactor * 100)}% displacement
              </span>
            </div>
            <div className="flex gap-1.5 text-[10px] pt-1">
              {(['clean', 'slight_fouling', 'heavy_fouling'] as const).map((hull) => (
                <button
                  key={hull}
                  type="button"
                  onClick={() => setHullCondition(hull)}
                  className={`px-2 py-1 rounded flex-1 capitalize ${
                    hullCondition === hull
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {hull.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 pt-1">
              {activeFerry.currentPassengers} passengers + {activeFerry.currentVehicles} vehicles on board
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
