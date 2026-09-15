import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Fuel,
  Clock,
  Calendar,
  Download,
  Filter,
  Layers,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Ship,
  Leaf,
} from 'lucide-react';

interface DailyTelemetryMetric {
  date: string;
  dayLabel: string;
  passengersTotal: number;
  passengersCommuter: number;
  passengersTourist: number;
  fuelEfficiencyLitersPerNm: number;
  fuelLitersTotal: number;
  co2SavedTons: number;
  onTimeRatePercent: number;
  scheduledTrips: number;
  delayedTrips: number;
  weatherDelayMins: number;
  berthDelayMins: number;
}

// Generate realistic 30-day historical time-series data ending on Sep 10, 2026
const generateThirtyDayData = (): DailyTelemetryMetric[] => {
  const result: DailyTelemetryMetric[] = [];
  const baseDate = new Date('2026-08-12');

  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Weekend has higher tourist traffic, weekday has higher commuter volume
    const baseCommuter = isWeekend ? 1100 : 2600 + Math.floor(Math.sin(i) * 300);
    const baseTourist = isWeekend ? 2400 + Math.floor(Math.cos(i) * 400) : 450 + Math.floor(Math.sin(i * 1.5) * 150);
    const totalPassengers = baseCommuter + baseTourist;

    // Fuel efficiency gradually improves from ~12.8 L/NM to ~11.2 L/NM as hydrodynamic speed governor is deployed
    const fuelLperNm = Number((12.6 - (i * 0.045) + (isWeekend ? 0.3 : -0.2) + (Math.sin(i) * 0.25)).toFixed(2));
    const totalFuel = Math.round(totalPassengers * 0.48 * fuelLperNm);
    const co2Saved = Number((0.4 + (i * 0.02) + (Math.sin(i * 0.8) * 0.05)).toFixed(2));

    // On-time performance hovers around 94% - 98%, dip on monsoon days (around day 12-14)
    const isMonsoonSpike = i >= 11 && i <= 13;
    const onTimePercent = isMonsoonSpike
      ? Number((91.5 + Math.random() * 2).toFixed(1))
      : Number((95.2 + (Math.sin(i * 0.5) * 2.8)).toFixed(1));

    const scheduled = 38 + (isWeekend ? 6 : 0);
    const delayed = Math.round(scheduled * ((100 - onTimePercent) / 100));

    result.push({
      date: dateStr,
      dayLabel,
      passengersTotal: totalPassengers,
      passengersCommuter: baseCommuter,
      passengersTourist: baseTourist,
      fuelEfficiencyLitersPerNm: fuelLperNm,
      fuelLitersTotal: totalFuel,
      co2SavedTons: co2Saved,
      onTimeRatePercent: onTimePercent,
      scheduledTrips: scheduled,
      delayedTrips: delayed,
      weatherDelayMins: isMonsoonSpike ? 24 : Math.round(Math.random() * 8),
      berthDelayMins: Math.round(3 + Math.random() * 5),
    });
  }

  return result;
};

export const ThirtyDayMetricsVisualizer: React.FC = () => {
  const { theme } = useFerry();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'all' | 'passengers' | 'fuel' | 'ontime'>('all');
  const [timeRange, setTimeRange] = useState<'30' | '14' | '7'>('30');
  const [routeFilter, setRouteFilter] = useState<string>('all');

  const fullData = useMemo(() => generateThirtyDayData(), []);

  const data = useMemo(() => {
    const count = Number(timeRange);
    return fullData.slice(-count);
  }, [fullData, timeRange]);

  // Calculated aggregate KPIs
  const totalPassengers = useMemo(() => data.reduce((acc, cur) => acc + cur.passengersTotal, 0), [data]);
  const avgFuelEfficiency = useMemo(() => {
    const sum = data.reduce((acc, cur) => acc + cur.fuelEfficiencyLitersPerNm, 0);
    return (sum / data.length).toFixed(2);
  }, [data]);
  const avgOnTime = useMemo(() => {
    const sum = data.reduce((acc, cur) => acc + cur.onTimeRatePercent, 0);
    return (sum / data.length).toFixed(1);
  }, [data]);
  const totalCo2Saved = useMemo(() => {
    return data.reduce((acc, cur) => acc + cur.co2SavedTons, 0).toFixed(1);
  }, [data]);

  const handleExportCSV = () => {
    const headers = 'Date,Day,Total_Passengers,Commuter_Volume,Tourist_Volume,Fuel_Liters_Per_NM,Total_Fuel_Liters,CO2_Saved_Tons,On_Time_Percent,Scheduled_Trips,Delayed_Trips\n';
    const rows = data
      .map(
        (r) =>
          `${r.date},${r.dayLabel},${r.passengersTotal},${r.passengersCommuter},${r.passengersTourist},${r.fuelEfficiencyLitersPerNm},${r.fuelLitersTotal},${r.co2SavedTons},${r.onTimeRatePercent},${r.scheduledTrips},${r.delayedTrips}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferryflow-30day-analytics-${timeRange}days.csv`;
    a.click();
  };

  return (
    <div
      id="admin-30day-metrics-visualizer"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                30-Day Fleet Operations & Performance Analytics
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                RECHARTS SUITE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Longitudinal analysis of passenger volume trends, hydrodynamic fuel consumption, and on-time performance SLA
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {(['30', '14', '7'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-colors ${
                  timeRange === range
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range} Days
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>PASSENGER VOLUME</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {totalPassengers.toLocaleString()}
          </div>
          <div className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12.8% vs prior period
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>AVG FUEL CONSUMPTION</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-amber-300">
            {avgFuelEfficiency} <span className="text-xs font-normal text-slate-400">L/NM</span>
          </div>
          <div className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
            <Leaf className="w-3 h-3" /> {totalCo2Saved} MT CO₂ Offset
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>ON-TIME PERFORMANCE</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-400">
            {avgOnTime}%
          </div>
          <div className="text-slate-400 text-[11px]">
            Target SLA: 95.0% (Exceeded)
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>SCHEDULED SAILINGS</span>
            <Ship className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-sky-300">
            {data.reduce((acc, cur) => acc + cur.scheduledTrips, 0)}
          </div>
          <div className="text-slate-400 text-[11px]">
            {data.reduce((acc, cur) => acc + cur.delayedTrips, 0)} Weather/Traffic Holds
          </div>
        </div>
      </div>

      {/* Visualization Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All 3 Metric Views
        </button>
        <button
          onClick={() => setActiveTab('passengers')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'passengers'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Passenger Volume</span>
        </button>
        <button
          onClick={() => setActiveTab('fuel')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'fuel'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Fuel className="w-3.5 h-3.5 text-amber-400" />
          <span>Fuel Consumption</span>
        </button>
        <button
          onClick={() => setActiveTab('ontime')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ontime'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>On-Time Performance</span>
        </button>
      </div>

      {/* Chart 1: Passenger Volume Trends */}
      {(activeTab === 'all' || activeTab === 'passengers') && (
        <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Daily Passenger Volume Trends ({timeRange} Days)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Weekday morning/evening commuter transit vs weekend leisure & tourist spikes
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" /> Commuter
              </span>
              <span className="flex items-center gap-1 text-sky-300">
                <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" /> Tourist / Leisure
              </span>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCommuter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorTourist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dayLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="passengersCommuter"
                  name="Commuter Volume"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="url(#colorCommuter)"
                />
                <Area
                  type="monotone"
                  dataKey="passengersTourist"
                  name="Tourist Volume"
                  stackId="1"
                  stroke="#38bdf8"
                  fill="url(#colorTourist)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 2: Fuel Consumption Efficiency */}
      {(activeTab === 'all' || activeTab === 'fuel') && (
        <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" />
                <span>Fuel Consumption Efficiency: Liters per Nautical Mile (L/NM)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Hydrodynamic efficiency trajectory benchmarked against fleet baseline (12.0 L/NM target)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Actual L/NM
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block border-t border-dashed" /> 12.0 Target
              </span>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dayLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  domain={[9, 14]}
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'L/NM', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Total Liters', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="fuelLitersTotal"
                  name="Total Daily Liters Burned"
                  fill="#1e293b"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="fuelEfficiencyLitersPerNm"
                  name="Fuel Burn Rate (L/NM)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={12.0}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: '12.0 L/NM Target', fill: '#10b981', fontSize: 10, position: 'top' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 3: On-Time Performance Metrics */}
      {(activeTab === 'all' || activeTab === 'ontime') && (
        <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>On-Time Performance Metrics & Punctuality Ratio</span>
              </h3>
              <p className="text-xs text-slate-400">
                Daily adherence percentage against Mumbai Maritime Port Trust 95% SLA benchmark
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> On-Time %
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-3 h-3 bg-rose-500/60 inline-block rounded" /> Delayed Voyages
              </span>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dayLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="rate"
                  domain={[85, 100]}
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: '% Punctual', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Delays', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  yAxisId="count"
                  dataKey="delayedTrips"
                  name="Delayed Trips Count"
                  fill="#f43f5e"
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="onTimeRatePercent"
                  name="On-Time Rate %"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#10b981' }}
                />
                <ReferenceLine
                  yAxisId="rate"
                  y={95.0}
                  stroke="#06b6d4"
                  strokeDasharray="4 4"
                  label={{ value: '95% SLA Target', fill: '#06b6d4', fontSize: 10, position: 'top' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
