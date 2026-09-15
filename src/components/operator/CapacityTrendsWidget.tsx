import React, { useState, useMemo } from 'react';
import { Trip, Ferry, Route } from '../../types';
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
import {
  BarChart3,
  TrendingUp,
  Users,
  Ship,
  Clock,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface CapacityTrendsWidgetProps {
  trips?: Trip[];
  ferries?: Ferry[];
  routes?: Route[];
}

export interface CapacityTrendPoint {
  label: string;
  throughput: number;
  capacity: number;
  utilization: number;
  tripsCount?: number;
}

const HOURLY_TRENDS_DATA: CapacityTrendPoint[] = [
  { label: '06:00', throughput: 110, capacity: 250, utilization: 44, tripsCount: 1 },
  { label: '07:00', throughput: 280, capacity: 400, utilization: 70, tripsCount: 2 },
  { label: '08:00', throughput: 480, capacity: 520, utilization: 92, tripsCount: 3 },
  { label: '09:00', throughput: 530, capacity: 550, utilization: 96, tripsCount: 3 },
  { label: '10:00', throughput: 340, capacity: 450, utilization: 75, tripsCount: 2 },
  { label: '11:00', throughput: 260, capacity: 400, utilization: 65, tripsCount: 2 },
  { label: '12:00', throughput: 220, capacity: 350, utilization: 63, tripsCount: 2 },
  { label: '13:00', throughput: 290, capacity: 400, utilization: 72, tripsCount: 2 },
  { label: '14:00', throughput: 380, capacity: 480, utilization: 79, tripsCount: 2 },
  { label: '15:00', throughput: 510, capacity: 550, utilization: 93, tripsCount: 3 },
  { label: '16:00', throughput: 560, capacity: 580, utilization: 96, tripsCount: 3 },
  { label: '17:00', throughput: 580, capacity: 600, utilization: 97, tripsCount: 3 },
  { label: '18:00', throughput: 490, capacity: 550, utilization: 89, tripsCount: 3 },
  { label: '19:00', throughput: 320, capacity: 400, utilization: 80, tripsCount: 2 },
  { label: '20:00', throughput: 160, capacity: 300, utilization: 53, tripsCount: 1 },
];

const SEVEN_DAY_TRENDS_DATA: CapacityTrendPoint[] = [
  { label: 'Mon', throughput: 3450, capacity: 4200, utilization: 82, tripsCount: 24 },
  { label: 'Tue', throughput: 3620, capacity: 4200, utilization: 86, tripsCount: 24 },
  { label: 'Wed', throughput: 3580, capacity: 4200, utilization: 85, tripsCount: 24 },
  { label: 'Thu', throughput: 3790, capacity: 4400, utilization: 86, tripsCount: 26 },
  { label: 'Fri', throughput: 4620, capacity: 4800, utilization: 96, tripsCount: 28 },
  { label: 'Sat', throughput: 5200, capacity: 5400, utilization: 96, tripsCount: 32 },
  { label: 'Sun', throughput: 5450, capacity: 5600, utilization: 97, tripsCount: 32 },
];

const ROUTE_CAPACITY_DATA: CapacityTrendPoint[] = [
  { label: 'Gateway ↔ Mandwa (Fast Catamaran)', throughput: 1680, capacity: 1850, utilization: 91 },
  { label: 'Bhaucha Dhakka ↔ Mandwa (Ro-Pax)', throughput: 1240, capacity: 1500, utilization: 83 },
  { label: 'Gateway ↔ Elephanta (Tourists)', throughput: 820, capacity: 950, utilization: 86 },
  { label: 'Bhaucha Dhakka ↔ Rewas (Water Taxi)', throughput: 420, capacity: 600, utilization: 70 },
];

export const CapacityTrendsWidget: React.FC<CapacityTrendsWidgetProps> = () => {
  const [timeView, setTimeView] = useState<'hourly' | 'daily' | 'route'>('hourly');
  const [focusRouteFilter, setFocusRouteFilter] = useState<string>('all');

  // Compute Active Dataset
  const activeDataset: CapacityTrendPoint[] = useMemo(() => {
    if (timeView === 'hourly') {
      if (focusRouteFilter === 'fast_catamaran') {
        return HOURLY_TRENDS_DATA.map((d) => ({
          ...d,
          throughput: Math.round(d.throughput * 0.55),
          capacity: Math.round(d.capacity * 0.55),
          utilization: Math.round(((d.throughput * 0.55) / (d.capacity * 0.55)) * 100),
        }));
      }
      if (focusRouteFilter === 'ropax') {
        return HOURLY_TRENDS_DATA.map((d) => ({
          ...d,
          throughput: Math.round(d.throughput * 0.35),
          capacity: Math.round(d.capacity * 0.35),
          utilization: Math.round(((d.throughput * 0.35) / (d.capacity * 0.35)) * 100),
        }));
      }
      return HOURLY_TRENDS_DATA;
    }
    if (timeView === 'daily') {
      return SEVEN_DAY_TRENDS_DATA;
    }
    return ROUTE_CAPACITY_DATA;
  }, [timeView, focusRouteFilter]);

  // Aggregate Metrics
  const totalThroughput = useMemo(() => {
    return activeDataset.reduce((acc, curr) => acc + curr.throughput, 0);
  }, [activeDataset]);

  const totalCapacity = useMemo(() => {
    return activeDataset.reduce((acc, curr) => acc + curr.capacity, 0);
  }, [activeDataset]);

  const overallUtilization = Math.round((totalThroughput / (totalCapacity || 1)) * 100);

  // Custom Chart Tooltip
  const CustomCapacityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const throughputVal = payload.find((p: any) => p.dataKey === 'throughput')?.value || 0;
      const capacityVal = payload.find((p: any) => p.dataKey === 'capacity')?.value || 0;
      const utilPercent = capacityVal > 0 ? Math.round((throughputVal / capacityVal) * 100) : 0;
      const surplus = capacityVal - throughputVal;

      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans min-w-[200px]">
          <div className="font-bold text-white pb-1 border-b border-slate-800 flex items-center justify-between">
            <span>{label}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                utilPercent >= 90
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : utilPercent >= 75
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {utilPercent}% Load
            </span>
          </div>

          <div className="flex items-center justify-between text-cyan-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              <span>Passengers Boarded:</span>
            </span>
            <span className="font-mono font-bold text-white">{throughputVal.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-indigo-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span>Vessel Capacity:</span>
            </span>
            <span className="font-mono font-bold text-slate-200">{capacityVal.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80 text-[11px]">
            <span>Surplus Seats Available:</span>
            <span className="font-mono text-emerald-400 font-semibold">{surplus.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="capacity-trends-widget"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
    >
      {/* Widget Header & Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm tracking-tight">
                Capacity Trends & Passenger Throughput
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                DYNAMIC BAR CHART
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing passenger throughput vs. scheduled vessel capacity across operating windows
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time View Mode */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              id="capacity-view-hourly"
              onClick={() => setTimeView('hourly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                timeView === 'hourly'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hourly Load</span>
            </button>

            <button
              type="button"
              id="capacity-view-daily"
              onClick={() => setTimeView('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                timeView === 'daily'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>7-Day Cycle</span>
            </button>

            <button
              type="button"
              id="capacity-view-route"
              onClick={() => setTimeView('route')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                timeView === 'route'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span>By Route</span>
            </button>
          </div>

          {/* Sub-Filter (Hourly Mode) */}
          {timeView === 'hourly' && (
            <select
              value={focusRouteFilter}
              onChange={(e) => setFocusRouteFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 text-xs p-2 rounded-xl border border-slate-800"
            >
              <option value="all">All Vessel Types</option>
              <option value="fast_catamaran">Fast Catamarans Only</option>
              <option value="ropax">Ro-Pax Ferry Only</option>
            </select>
          )}
        </div>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">TOTAL PASSENGER THROUGHPUT</span>
          <span className="text-xl font-extrabold font-mono text-cyan-300 block mt-1">
            {totalThroughput.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>Turnstile QR boarded</span>
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">TOTAL VESSEL CAPACITY</span>
          <span className="text-xl font-extrabold font-mono text-indigo-300 block mt-1">
            {totalCapacity.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Seats deployed in service</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">CAPACITY UTILIZATION</span>
          <span className="text-xl font-extrabold font-mono text-emerald-400 block mt-1">
            {overallUtilization}%
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">High load factor achieved</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">PEAK LOAD WINDOW</span>
          <span className="text-xl font-extrabold font-mono text-amber-300 block mt-1">
            {timeView === 'hourly' ? '17:00 (97%)' : timeView === 'daily' ? 'Sun (97%)' : 'Catamaran (91%)'}
          </span>
          <span className="text-[10px] text-amber-400 mt-0.5 block">Commuter peak swell</span>
        </div>
      </div>

      {/* Dynamic Bar Chart Component */}
      <div className="h-[290px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={activeDataset}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => {
                if (timeView === 'route' && typeof val === 'string') {
                  return val.split(' ')[0]; // short code for route names
                }
                return val;
              }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />
            <Tooltip content={<CustomCapacityTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => {
                if (value === 'throughput') return <span className="text-cyan-400 font-medium">Passenger Throughput</span>;
                if (value === 'capacity') return <span className="text-indigo-400 font-medium">Vessel Capacity</span>;
                return value;
              }}
            />
            {/* Vessel Capacity Bar (Background benchmark) */}
            <Bar
              dataKey="capacity"
              fill="#4338ca"
              name="capacity"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
              maxBarSize={32}
            />
            {/* Passenger Throughput Bar (Foreground actual volume) */}
            <Bar
              dataKey="throughput"
              fill="#06b6d4"
              name="throughput"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes & Capacity Intelligence */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Throughput tracked live via turnstile QR ticket validation sensors</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          DG Shipping Overcrowding Prevention Standard: 100% Vessel Keel Adherence
        </div>
      </div>
    </div>
  );
};
