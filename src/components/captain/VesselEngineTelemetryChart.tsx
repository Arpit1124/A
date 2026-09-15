import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Ferry } from '../../types';
import { Fuel, Gauge, Activity, Zap, TrendingDown, Clock, Layers, Droplets } from 'lucide-react';
import { useFerry } from '../../context/FerryContext';

interface Props {
  ferry: Ferry;
  throttleSpeed: number;
}

export const VesselEngineTelemetryChart: React.FC<Props> = ({ ferry, throttleSpeed }) => {
  const { theme } = useFerry();
  const isDark = theme === 'dark';

  const [timeRange, setTimeRange] = useState<'30m' | '60m' | 'voyage'>('30m');
  const [metricView, setMetricView] = useState<'dual' | 'fuel' | 'load'>('dual');

  // Compute real-time instant metrics based on throttleSpeed and ferry type
  const isRoPax = ferry.type.includes('Ro-Pax');
  const baseBurnMultiplier = isRoPax ? 3.2 : 2.4;
  
  // Real-time calculated values
  const currentSpeed = Math.max(0.5, throttleSpeed);
  const currentEngineLoad = Math.min(100, Math.round((currentSpeed / 22) * 85 + (isRoPax ? 8 : 4)));
  const currentFuelBurnLpH = Math.round((Math.pow(currentSpeed / 10, 1.8) * baseBurnMultiplier * 10 + 12) * 10) / 10;
  const currentFuelPerNM = Math.round((currentFuelBurnLpH / currentSpeed) * 100) / 100;
  const optimalCruiseSpeed = isRoPax ? 13.5 : 15.0;
  const isEcoRange = currentSpeed >= optimalCruiseSpeed - 2 && currentSpeed <= optimalCruiseSpeed + 1.5;

  // Generate historical timeline data leading to current moment
  const chartData = useMemo(() => {
    const pointsCount = timeRange === '30m' ? 12 : timeRange === '60m' ? 18 : 24;
    const data = [];
    const now = new Date();

    for (let i = pointsCount - 1; i >= 0; i--) {
      const pointTime = new Date(now.getTime() - i * 2.5 * 60 * 1000);
      const timeLabel = pointTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      // Factor in small simulated variations with current state as final point
      const progress = 1 - i / pointsCount;
      const speedVariation = i === 0 ? currentSpeed : Math.max(8, currentSpeed + Math.sin(i * 1.3) * 1.8);
      const engineLoad = i === 0
        ? currentEngineLoad
        : Math.min(96, Math.max(35, Math.round((speedVariation / 22) * 85 + (isRoPax ? 7 : 3) + Math.sin(i * 2) * 4)));
      
      const fuelBurnLpH = i === 0
        ? currentFuelBurnLpH
        : Math.round((Math.pow(speedVariation / 10, 1.8) * baseBurnMultiplier * 10 + 11 + Math.cos(i * 1.5) * 2) * 10) / 10;
      
      const fuelPerNM = Math.round((fuelBurnLpH / speedVariation) * 100) / 100;

      data.push({
        time: timeLabel,
        speed: Math.round(speedVariation * 10) / 10,
        engineLoad,
        fuelBurnLpH,
        fuelPerNM,
        ecoBaseline: 65, // Recommended eco-load %
      });
    }

    return data;
  }, [timeRange, currentSpeed, currentEngineLoad, currentFuelBurnLpH, isRoPax, baseBurnMultiplier]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border text-xs font-mono shadow-2xl backdrop-blur-md ${
          isDark ? 'bg-slate-950/95 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-300 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-4 pb-1.5 border-b border-slate-700/50 mb-1.5">
            <span className="font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{label} IST</span>
            </span>
            <span className="text-cyan-400 font-semibold">{data.speed} kts</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-400 flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Engine Load:
              </span>
              <span className="font-bold">{data.engineLoad}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-cyan-400 flex items-center gap-1">
                <Fuel className="w-3 h-3" /> Burn Rate:
              </span>
              <span className="font-bold">{data.fuelBurnLpH} L/h</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-amber-400 flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Efficiency:
              </span>
              <span className="font-bold">{data.fuelPerNM} L/NM</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`border rounded-2xl p-5 shadow-xl space-y-5 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-cyan-400" />
            <h3 className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Fuel Efficiency & Twin Marine Engine Load
            </h3>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time telemetry from {ferry.name} ({ferry.vesselId}) twin diesel propulsion control unit
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Filter */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 text-[11px] font-medium ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setMetricView('dual')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricView === 'dual'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dual Overlay
            </button>
            <button
              onClick={() => setMetricView('fuel')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricView === 'fuel'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fuel (L/h)
            </button>
            <button
              onClick={() => setMetricView('load')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricView === 'load'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Load (%)
            </button>
          </div>

          {/* Time Interval Selector */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 text-[11px] font-mono ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['30m', '60m', 'voyage'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 rounded-lg uppercase transition-all ${
                  timeRange === range
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Instant Fuel Burn */}
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>FUEL BURN</span>
            <Fuel className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
            {currentFuelBurnLpH} <span className="text-xs font-normal text-slate-400">L/h</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Avg: ~38.4 L/h cruise
          </div>
        </div>

        {/* Specific Efficiency */}
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>EFFICIENCY</span>
            <Droplets className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            {currentFuelPerNM} <span className="text-xs font-normal text-slate-400">L / NM</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Speed-normalized transit
          </div>
        </div>

        {/* Engine Load */}
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>ENGINE LOAD</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            {currentEngineLoad}%
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
            <span>Twin MTU 1,820 RPM</span>
          </div>
        </div>

        {/* Eco Index */}
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>ECO STATUS</span>
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base font-extrabold font-mono mt-1.5 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                isEcoRange
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isEcoRange ? 'OPTIMAL' : 'HIGH CRUISE'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isEcoRange ? 'Target: 14.5 kts achieved' : 'Suggest 14.5 kts for -12% burn'}
          </div>
        </div>
      </div>

      {/* Recharts Area / Line Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
            />

            {/* Left Y Axis: Fuel Burn (L/h) */}
            {(metricView === 'dual' || metricView === 'fuel') && (
              <YAxis
                yAxisId="left"
                stroke="#06b6d4"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                domain={['auto', 'auto']}
                unit=" L/h"
              />
            )}

            {/* Right Y Axis: Engine Load (%) */}
            {(metricView === 'dual' || metricView === 'load') && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                domain={[0, 100]}
                unit="%"
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              yAxisId="right"
              y={65}
              stroke="#eab308"
              strokeDasharray="4 4"
              label={{
                value: 'Eco Baseline (65%)',
                fill: '#eab308',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />

            {(metricView === 'dual' || metricView === 'fuel') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="fuelBurnLpH"
                name="Fuel Burn (L/h)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorFuel)"
              />
            )}

            {(metricView === 'dual' || metricView === 'load') && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="engineLoad"
                name="Engine Load (%)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLoad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer telemetry note */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
          <span>Fuel Flow Telemetry: <strong>Active NMEA 2000 Transducer Feed</strong></span>
        </div>
        <div className="font-mono text-cyan-400">
          Last Calibrated: 06-Sep-2026 (Voyage Logged)
        </div>
      </div>
    </div>
  );
};
