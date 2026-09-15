import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry } from '../../types';
import {
  Ship,
  ArrowRightLeft,
  Fuel,
  Clock,
  Wrench,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Award,
  ChevronDown,
} from 'lucide-react';

interface Props {
  ferries: Ferry[];
}

export const VesselComparisonTool: React.FC<Props> = ({ ferries }) => {
  const { theme } = useFerry();
  const isDark = theme === 'dark';

  const [vesselAId, setVesselAId] = useState<string>(ferries[0]?.id || 'ferry-101');
  const [vesselBId, setVesselBId] = useState<string>(ferries[1]?.id || 'ferry-102');

  const vesselA = ferries.find((f) => f.id === vesselAId) || ferries[0];
  const vesselB = ferries.find((f) => f.id === vesselBId) || ferries[1] || ferries[0];

  // Synthesize rich operational metrics for the compared vessels
  const metricsA = useMemo(() => {
    if (!vesselA) return null;
    const fuelRate = vesselA.fuelConsumptionRateLitersPerHour || (vesselA.id === 'ferry-101' ? 78 : vesselA.id === 'ferry-102' ? 145 : 92);
    const uptime = vesselA.id === 'ferry-101' ? 98.6 : vesselA.id === 'ferry-102' ? 96.2 : vesselA.id === 'ferry-104' ? 91.8 : 97.4;
    const maintenanceCount = vesselA.id === 'ferry-104' ? 8 : vesselA.id === 'ferry-102' ? 5 : 3;
    const costPerNm = Math.round(fuelRate * 94 / (vesselA.speedKnots || 15)); // ₹94 per liter diesel
    const co2PerTripKg = Math.round(fuelRate * 2.68 * 0.8);

    const monthlyFuel = [
      { month: 'Apr', liters: Math.round(fuelRate * 180) },
      { month: 'May', liters: Math.round(fuelRate * 210) },
      { month: 'Jun', liters: Math.round(fuelRate * 160) },
      { month: 'Jul', liters: Math.round(fuelRate * 195) },
      { month: 'Aug', liters: Math.round(fuelRate * 205) },
      { month: 'Sep', liters: Math.round(fuelRate * 185) },
    ];

    const maintenanceLogs = [
      { date: '2026-08-14', type: 'Routine Oil & Filter Renewal', yard: 'Mazagon Dock', cost: '₹1,24,000', status: 'Completed' },
      { date: '2026-06-02', type: 'Turbocharger Clean & Bearing Check', yard: 'Mumbai Port Trust', cost: '₹2,80,000', status: 'Completed' },
      { date: '2026-02-18', type: 'Bi-annual Hull Hydro-Blasting', yard: 'MbPT Dry Dock #2', cost: '₹6,50,000', status: 'Completed' },
    ];

    return { fuelRate, uptime, maintenanceCount, costPerNm, co2PerTripKg, monthlyFuel, maintenanceLogs };
  }, [vesselA]);

  const metricsB = useMemo(() => {
    if (!vesselB) return null;
    const fuelRate = vesselB.fuelConsumptionRateLitersPerHour || (vesselB.id === 'ferry-101' ? 78 : vesselB.id === 'ferry-102' ? 145 : 92);
    const uptime = vesselB.id === 'ferry-101' ? 98.6 : vesselB.id === 'ferry-102' ? 96.2 : vesselB.id === 'ferry-104' ? 91.8 : 97.4;
    const maintenanceCount = vesselB.id === 'ferry-104' ? 8 : vesselB.id === 'ferry-102' ? 5 : 3;
    const costPerNm = Math.round(fuelRate * 94 / (vesselB.speedKnots || 15));
    const co2PerTripKg = Math.round(fuelRate * 2.68 * 0.8);

    const monthlyFuel = [
      { month: 'Apr', liters: Math.round(fuelRate * 180) },
      { month: 'May', liters: Math.round(fuelRate * 210) },
      { month: 'Jun', liters: Math.round(fuelRate * 160) },
      { month: 'Jul', liters: Math.round(fuelRate * 195) },
      { month: 'Aug', liters: Math.round(fuelRate * 205) },
      { month: 'Sep', liters: Math.round(fuelRate * 185) },
    ];

    const maintenanceLogs = [
      { date: '2026-08-28', type: 'Main Engine Injector Calibration', yard: 'MbPT Dry Dock #1', cost: '₹1,85,000', status: 'Completed' },
      { date: '2026-05-19', type: 'Auxiliary Generator Servicing', yard: 'Mazagon Yard', cost: '₹95,000', status: 'Completed' },
      { date: '2026-01-10', type: 'Bow Thruster Hydraulic Seals', yard: 'Mandwa Jetty Yard', cost: '₹3,40,000', status: 'Completed' },
    ];

    return { fuelRate, uptime, maintenanceCount, costPerNm, co2PerTripKg, monthlyFuel, maintenanceLogs };
  }, [vesselB]);

  // Max fuel benchmark for charting
  const maxFuelLiters = Math.max(
    ...metricsA.monthlyFuel.map((m) => m.liters),
    ...metricsB.monthlyFuel.map((m) => m.liters),
    1
  );

  return (
    <div
      id="vessel-comparison-tool"
      className={`p-6 rounded-2xl border shadow-2xl space-y-6 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Tool Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-900/30">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Fleet Vessel Performance Comparison</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                Side-by-Side Analytics
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Benchmark fuel consumption rates, service uptime, maintenance history, and operating costs
            </p>
          </div>
        </div>

        {/* Vessel Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/40">
            <span className="text-[11px] font-bold text-cyan-400 font-mono">Vessel A:</span>
            <select
              value={vesselAId}
              onChange={(e) => setVesselAId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {ferries.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  {f.name} ({f.vesselId})
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 font-bold text-xs">VS</span>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/40">
            <span className="text-[11px] font-bold text-indigo-400 font-mono">Vessel B:</span>
            <select
              value={vesselBId}
              onChange={(e) => setVesselBId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {ferries.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  {f.name} ({f.vesselId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Fuel Rate KPI */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold">Fuel Consumption</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono block">Vessel A</span>
              <span className="text-lg font-bold font-mono text-white">{metricsA.fuelRate} L/h</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-indigo-400 font-mono block">Vessel B</span>
              <span className="text-lg font-bold font-mono text-white">{metricsB.fuelRate} L/h</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            {metricsA.fuelRate < metricsB.fuelRate ? (
              <span className="text-emerald-400 font-bold">Vessel A consumes {Math.round((1 - metricsA.fuelRate / metricsB.fuelRate) * 100)}% less fuel</span>
            ) : metricsA.fuelRate > metricsB.fuelRate ? (
              <span className="text-emerald-400 font-bold">Vessel B consumes {Math.round((1 - metricsB.fuelRate / metricsA.fuelRate) * 100)}% less fuel</span>
            ) : (
              <span className="text-slate-400">Identical fuel consumption rate</span>
            )}
          </div>
        </div>

        {/* Fleet Uptime KPI */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold">Operating Uptime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono block">Vessel A</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{metricsA.uptime}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-indigo-400 font-mono block">Vessel B</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{metricsB.uptime}%</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Target SLA: 95.0% dispatch reliability
          </div>
        </div>

        {/* Operating Cost / NM */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold">Cost per Nautical Mile</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono block">Vessel A</span>
              <span className="text-lg font-bold font-mono text-white">₹{metricsA.costPerNm} /NM</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-indigo-400 font-mono block">Vessel B</span>
              <span className="text-lg font-bold font-mono text-white">₹{metricsB.costPerNm} /NM</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Based on ₹94/L marine diesel base
          </div>
        </div>

        {/* Passenger Capacity */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold">Capacity & Type</span>
            <Ship className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono block">Vessel A</span>
              <span className="text-lg font-bold font-mono text-white">{vesselA.capacity} Pax</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-indigo-400 font-mono block">Vessel B</span>
              <span className="text-lg font-bold font-mono text-white">{vesselB.capacity} Pax</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            {vesselA.vehicleCapacity ? `${vesselA.vehicleCapacity} Vehicles` : 'Passenger Only'} vs {vesselB.vehicleCapacity ? `${vesselB.vehicleCapacity} Vehicles` : 'Passenger Only'}
          </div>
        </div>
      </div>

      {/* Side-by-Side Monthly Fuel Consumption Chart */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>Side-by-Side Monthly Fuel Consumption (Liters)</span>
          </h3>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500" />
              <span className="text-slate-300 font-semibold">{vesselA.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500" />
              <span className="text-slate-300 font-semibold">{vesselB.name}</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="grid grid-cols-6 gap-3 pt-4">
          {metricsA.monthlyFuel.map((item, idx) => {
            const litersB = metricsB.monthlyFuel[idx]?.liters || 0;
            const heightPctA = Math.round((item.liters / maxFuelLiters) * 100);
            const heightPctB = Math.round((litersB / maxFuelLiters) * 100);

            return (
              <div key={item.month} className="flex flex-col items-center gap-2">
                <div className="w-full h-36 bg-slate-900/60 rounded-xl p-1.5 flex items-end justify-center gap-2 border border-slate-800">
                  {/* Bar A */}
                  <div
                    className="w-1/2 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-500 relative group"
                    style={{ height: `${heightPctA}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-cyan-300 text-[9px] font-mono px-1 rounded whitespace-nowrap pointer-events-none z-10 transition-opacity">
                      {item.liters} L
                    </div>
                  </div>

                  {/* Bar B */}
                  <div
                    className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-500 relative group"
                    style={{ height: `${heightPctB}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-indigo-300 text-[9px] font-mono px-1 rounded whitespace-nowrap pointer-events-none z-10 transition-opacity">
                      {litersB} L
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400 font-bold">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Maintenance History Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vessel A Maintenance Log */}
        <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>{vesselA.name} Maintenance Log</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Hull Score: {vesselA.hullConditionScore || 88}/100
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {metricsA.maintenanceLogs.map((log, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px]">{log.type}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{log.cost}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{log.date} • {log.yard}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{log.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vessel B Maintenance Log */}
        <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>{vesselB.name} Maintenance Log</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Hull Score: {vesselB.hullConditionScore || 82}/100
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {metricsB.maintenanceLogs.map((log, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px]">{log.type}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{log.cost}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{log.date} • {log.yard}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{log.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
