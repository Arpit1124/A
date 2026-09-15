import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import {
  Clock,
  Zap,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Filter,
  BarChart3,
  SlidersHorizontal,
  Info,
  Layers,
} from 'lucide-react';

interface HourlyMetric {
  timeSlot: string;
  passengersValidated: number;
  avgValidationTimeSec: number;
  boardingEfficiencyPercent: number;
  gateTurnstileCount: number;
  slaTargetSec: number;
}

const fullDayEfficiencyData: HourlyMetric[] = [
  { timeSlot: '06:00', passengersValidated: 95, avgValidationTimeSec: 1.8, boardingEfficiencyPercent: 97.4, gateTurnstileCount: 2, slaTargetSec: 3.0 },
  { timeSlot: '07:00', passengersValidated: 280, avgValidationTimeSec: 2.1, boardingEfficiencyPercent: 96.1, gateTurnstileCount: 3, slaTargetSec: 3.0 },
  { timeSlot: '08:00', passengersValidated: 520, avgValidationTimeSec: 3.2, boardingEfficiencyPercent: 91.8, gateTurnstileCount: 4, slaTargetSec: 3.0 },
  { timeSlot: '09:00', passengersValidated: 580, avgValidationTimeSec: 3.4, boardingEfficiencyPercent: 89.6, gateTurnstileCount: 4, slaTargetSec: 3.0 },
  { timeSlot: '10:00', passengersValidated: 360, avgValidationTimeSec: 2.5, boardingEfficiencyPercent: 94.2, gateTurnstileCount: 3, slaTargetSec: 3.0 },
  { timeSlot: '11:00', passengersValidated: 220, avgValidationTimeSec: 2.0, boardingEfficiencyPercent: 96.8, gateTurnstileCount: 2, slaTargetSec: 3.0 },
  { timeSlot: '12:00', passengersValidated: 190, avgValidationTimeSec: 1.9, boardingEfficiencyPercent: 97.2, gateTurnstileCount: 2, slaTargetSec: 3.0 },
  { timeSlot: '13:00', passengersValidated: 240, avgValidationTimeSec: 2.2, boardingEfficiencyPercent: 95.5, gateTurnstileCount: 2, slaTargetSec: 3.0 },
  { timeSlot: '14:00', passengersValidated: 340, avgValidationTimeSec: 2.6, boardingEfficiencyPercent: 94.1, gateTurnstileCount: 3, slaTargetSec: 3.0 },
  { timeSlot: '15:00', passengersValidated: 490, avgValidationTimeSec: 3.1, boardingEfficiencyPercent: 92.3, gateTurnstileCount: 4, slaTargetSec: 3.0 },
  { timeSlot: '16:00', passengersValidated: 560, avgValidationTimeSec: 3.5, boardingEfficiencyPercent: 88.7, gateTurnstileCount: 4, slaTargetSec: 3.0 },
  { timeSlot: '17:00', passengersValidated: 530, avgValidationTimeSec: 3.0, boardingEfficiencyPercent: 92.9, gateTurnstileCount: 4, slaTargetSec: 3.0 },
  { timeSlot: '18:00', passengersValidated: 420, avgValidationTimeSec: 2.7, boardingEfficiencyPercent: 94.6, gateTurnstileCount: 3, slaTargetSec: 3.0 },
  { timeSlot: '19:00', passengersValidated: 290, avgValidationTimeSec: 2.3, boardingEfficiencyPercent: 96.0, gateTurnstileCount: 3, slaTargetSec: 3.0 },
  { timeSlot: '20:00', passengersValidated: 170, avgValidationTimeSec: 1.9, boardingEfficiencyPercent: 98.1, gateTurnstileCount: 2, slaTargetSec: 3.0 },
];

export const BoardingEfficiencyChart: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [viewMode, setViewMode] = useState<'combined' | 'validation_time' | 'efficiency'>('combined');

  const filteredData = fullDayEfficiencyData.filter((item) => {
    const hour = parseInt(item.timeSlot.split(':')[0], 10);
    if (timeFilter === 'morning') return hour >= 7 && hour <= 11;
    if (timeFilter === 'afternoon') return hour >= 12 && hour <= 17;
    if (timeFilter === 'evening') return hour >= 18 && hour <= 20;
    return true;
  });

  const totalPassengers = filteredData.reduce((acc, curr) => acc + curr.passengersValidated, 0);
  const avgValidationTime = (
    filteredData.reduce((acc, curr) => acc + curr.avgValidationTimeSec, 0) / (filteredData.length || 1)
  ).toFixed(2);
  const avgEfficiency = (
    filteredData.reduce((acc, curr) => acc + curr.boardingEfficiencyPercent, 0) / (filteredData.length || 1)
  ).toFixed(1);

  // Custom Recharts tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: HourlyMetric = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold">
            <span className="text-white font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Slot: {label}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {data.gateTurnstileCount} Turnstiles Active
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Validated Passengers:</span>
              <span className="font-bold text-white font-mono">{data.passengersValidated} pax</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Avg Validation Time:</span>
              <span
                className={`font-mono font-bold ${
                  data.avgValidationTimeSec <= 3.0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {data.avgValidationTimeSec}s
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Boarding Efficiency:</span>
              <span className="font-mono font-bold text-sky-400">{data.boardingEfficiencyPercent}%</span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
              <span className="text-slate-500">MMB Turnstile SLA:</span>
              <span className="text-slate-400 font-mono">&lt; 3.0s / passenger</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="boarding-efficiency-recharts-card"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6"
    >
      {/* Header with Title and Control Pills */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Historical Passenger Boarding Efficiency & Ticket Validation Times
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recharts analytics tracking hourly turnstile clearance latency, passenger throughput, and gate flow efficiency throughout the day.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Slot Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                timeFilter === 'all'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Day (06:00-20:00)
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('morning')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                timeFilter === 'morning'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Morning Peak
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('afternoon')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                timeFilter === 'afternoon'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Afternoon Peak
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('evening')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                timeFilter === 'evening'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evening
            </button>
          </div>

          {/* Metric View Mode */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                viewMode === 'combined'
                  ? 'bg-slate-800 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Combined Dual-Axis
            </button>
            <button
              type="button"
              onClick={() => setViewMode('validation_time')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                viewMode === 'validation_time'
                  ? 'bg-slate-800 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Validation Latency
            </button>
            <button
              type="button"
              onClick={() => setViewMode('efficiency')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                viewMode === 'efficiency'
                  ? 'bg-slate-800 text-emerald-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Efficiency %
            </button>
          </div>
        </div>
      </div>

      {/* KPI Performance Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Avg Validation Time</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1.5">
            <span>{avgValidationTime}s</span>
            <span className="text-[10px] text-emerald-400 font-normal">SLA &lt;3.0s</span>
          </div>
          <div className="text-[10px] text-slate-500">Scan-to-turnstile gate unlock</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Boarding Efficiency</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-1.5">
            <span>{avgEfficiency}%</span>
            <span className="text-[10px] text-slate-400 font-normal">Target &gt;90%</span>
          </div>
          <div className="text-[10px] text-slate-500">Gangway queue flow rate</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Total Validated Pax</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">{totalPassengers.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Filtered time range volume</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Turnstile SLA Success</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">99.2%</div>
          <div className="text-[10px] text-emerald-400">Zero gate congestion holds</div>
        </div>
      </div>

      {/* Main Recharts Chart */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 10, right: 25, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timeSlot" stroke="#64748b" fontSize={11} tickLine={false} />

            {/* Left Y-Axis: Passengers Validated */}
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{
                value: 'Pax Validated',
                angle: -90,
                position: 'insideLeft',
                fill: '#64748b',
                fontSize: 10,
                offset: 15,
              }}
            />

            {/* Right Y-Axis: Validation Time in Seconds or Efficiency % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              fontSize={11}
              domain={viewMode === 'efficiency' ? [80, 100] : [0, 5]}
              tickLine={false}
              label={{
                value: viewMode === 'efficiency' ? 'Efficiency %' : 'Validation (Sec)',
                angle: 90,
                position: 'insideRight',
                fill: '#64748b',
                fontSize: 10,
                offset: 10,
              }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              verticalAlign="bottom"
            />

            {/* SLA Reference Line at 3.0s */}
            {viewMode !== 'efficiency' && (
              <ReferenceLine
                yAxisId="right"
                y={3.0}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: '3.0s SLA Threshold',
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            {/* Bar: Passenger Volume */}
            {(viewMode === 'combined' || viewMode === 'validation_time') && (
              <Bar
                yAxisId="left"
                dataKey="passengersValidated"
                name="Passenger Boarding Volume"
                fill="#06b6d4"
                radius={[6, 6, 0, 0]}
                opacity={0.85}
              />
            )}

            {/* Line: Ticket Validation Time in seconds */}
            {(viewMode === 'combined' || viewMode === 'validation_time') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgValidationTimeSec"
                name="Avg Validation Time (seconds)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}

            {/* Line: Boarding Efficiency % */}
            {(viewMode === 'combined' || viewMode === 'efficiency') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="boardingEfficiencyPercent"
                name="Boarding Efficiency Rate (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray={viewMode === 'combined' ? '4 2' : undefined}
                dot={{ fill: '#10b981', r: 3 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes & Insights */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Morning peak (08:00 - 09:30) and evening peak (16:00 - 17:30) experienced an average +1.2s validation latency increase during heavy commuter vehicle scan cycles.
          </span>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Target Turnstile SLA: 3.0s • Target Boarding Efficiency: &gt;90%
        </div>
      </div>
    </div>
  );
};
