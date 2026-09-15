import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Ticket,
  IndianRupee,
  Calendar,
  Download,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Ship,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
} from 'lucide-react';
import { useFerry } from '../../context/FerryContext';

interface DayMetric {
  date: string;
  dayLabel: string;
  isWeekend: boolean;
  totalPassengers: number;
  commuters: number;
  tourists: number;
  vehicles: number;
  totalBookings: number;
  webBookings: number;
  appBookings: number;
  walkInBookings: number;
  grossRevenue: number;
  capacityUtilization: number;
  onTimePercent: number;
}

// Generate realistic 30-day historical time-series
const generate30DayMetrics = (): DayMetric[] => {
  const list: DayMetric[] = [];
  const baseDate = new Date('2026-08-12T00:00:00Z');

  for (let i = 0; i < 30; i++) {
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + i);

    const dayOfWeek = cur.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = cur.toISOString().split('T')[0];
    const dayLabel = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Weekdays have high commuters (~2400-3100), weekends have high tourists (~2200-3300)
    const commuters = isWeekend
      ? Math.floor(950 + Math.sin(i * 0.9) * 150)
      : Math.floor(2650 + Math.sin(i * 1.4) * 420 + (i * 18));

    const tourists = isWeekend
      ? Math.floor(2550 + Math.cos(i * 0.7) * 480 + (i * 25))
      : Math.floor(580 + Math.sin(i * 1.8) * 160);

    const vehicles = isWeekend
      ? Math.floor(180 + Math.sin(i) * 35)
      : Math.floor(290 + Math.cos(i) * 45);

    const totalPassengers = commuters + tourists;

    // Booking channel distributions
    const appBookings = Math.floor(totalPassengers * 0.52);
    const webBookings = Math.floor(totalPassengers * 0.31);
    const walkInBookings = Math.max(0, totalPassengers - appBookings - webBookings);
    const totalBookings = Math.floor(totalPassengers * 0.88); // some group tickets

    // Financial revenue calculation (average ₹145 - ₹175 per passenger + vehicle fees)
    const avgFare = isWeekend ? 190 : 155;
    const grossRevenue = (totalPassengers * avgFare) + (vehicles * 850);

    // Fleet capacity utilization percentage
    const maxCapacity = isWeekend ? 5800 : 5400;
    const capacityUtilization = Math.min(98.5, parseFloat(((totalPassengers / maxCapacity) * 100).toFixed(1)));

    // On-time dispatch rate
    const onTimePercent = parseFloat((94.2 + Math.sin(i * 1.2) * 3.8).toFixed(1));

    list.push({
      date: dateStr,
      dayLabel,
      isWeekend,
      totalPassengers,
      commuters,
      tourists,
      vehicles,
      totalBookings,
      webBookings,
      appBookings,
      walkInBookings,
      grossRevenue,
      capacityUtilization,
      onTimePercent,
    });
  }

  return list;
};

export const OperatorThirtyDayTrendsDashboard: React.FC = () => {
  const { ferries, routes, trips } = useFerry();

  const [dateRange, setDateRange] = useState<'30' | '14' | '7'>('30');
  const [metricView, setMetricView] = useState<'all' | 'passengers' | 'bookings' | 'revenue'>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  const raw30DayData = useMemo(() => generate30DayMetrics(), []);

  // Filter based on selected timeframe
  const filteredData = useMemo(() => {
    const days = parseInt(dateRange, 10);
    const sliced = raw30DayData.slice(-days);

    // If a specific route is filtered, scale data slightly to simulate route proportion
    if (selectedRoute === 'gateway_mandwa') {
      return sliced.map((d) => ({
        ...d,
        totalPassengers: Math.round(d.totalPassengers * 0.58),
        commuters: Math.round(d.commuters * 0.62),
        tourists: Math.round(d.tourists * 0.54),
        totalBookings: Math.round(d.totalBookings * 0.58),
        grossRevenue: Math.round(d.grossRevenue * 0.61),
      }));
    } else if (selectedRoute === 'ferry_wharf_mora') {
      return sliced.map((d) => ({
        ...d,
        totalPassengers: Math.round(d.totalPassengers * 0.26),
        commuters: Math.round(d.commuters * 0.28),
        tourists: Math.round(d.tourists * 0.21),
        totalBookings: Math.round(d.totalBookings * 0.25),
        grossRevenue: Math.round(d.grossRevenue * 0.23),
      }));
    } else if (selectedRoute === 'belapur_elephanta') {
      return sliced.map((d) => ({
        ...d,
        totalPassengers: Math.round(d.totalPassengers * 0.16),
        commuters: Math.round(d.commuters * 0.1),
        tourists: Math.round(d.tourists * 0.25),
        totalBookings: Math.round(d.totalBookings * 0.17),
        grossRevenue: Math.round(d.grossRevenue * 0.16),
      }));
    }

    return sliced;
  }, [raw30DayData, dateRange, selectedRoute]);

  // Aggregate Metrics over the chosen period
  const totalPassengersSum = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.totalPassengers, 0),
    [filteredData]
  );
  const totalBookingsSum = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.totalBookings, 0),
    [filteredData]
  );
  const totalGrossRevenueSum = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.grossRevenue, 0),
    [filteredData]
  );
  const avgDailyThroughput = useMemo(
    () => Math.round(totalPassengersSum / filteredData.length),
    [totalPassengersSum, filteredData]
  );
  const avgCapacityUtilization = useMemo(
    () => (filteredData.reduce((acc, d) => acc + d.capacityUtilization, 0) / filteredData.length).toFixed(1),
    [filteredData]
  );
  const peakDay = useMemo(() => {
    return filteredData.reduce((max, d) => (d.totalPassengers > max.totalPassengers ? d : max), filteredData[0]);
  }, [filteredData]);

  // Download CSV export
  const handleExportCSV = () => {
    const headers = 'Date,Day,Total_Passengers,Commuters,Tourists,Vehicles,Total_Bookings,Web_Bookings,App_Bookings,Walk_In,Gross_Revenue_INR,Capacity_Utilization_Pct,On_Time_SLA_Pct\n';
    const rows = filteredData
      .map(
        (r) =>
          `${r.date},${r.dayLabel},${r.totalPassengers},${r.commuters},${r.tourists},${r.vehicles},${r.totalBookings},${r.webBookings},${r.appBookings},${r.walkInBookings},${r.grossRevenue},${r.capacityUtilization},${r.onTimePercent}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ferryflow-operator-throughput-booking-trends-${dateRange}days.csv`;
    link.click();
  };

  return (
    <div
      id="operator-30day-recharts-dashboard"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6"
    >
      {/* Dashboard Top Header & Filtering Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                30-Day Passenger Throughput & Booking Trends
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                RECHARTS MARITIME ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Corridor commuter velocity, tourist surges, booking channel splits, and harbor passenger volume SLA
            </p>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Corridor/Route Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              aria-label="Filter by corridor route"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Mumbai Fairways</option>
              <option value="gateway_mandwa" className="bg-slate-900 text-white">Gateway ⇄ Mandwa Corridor</option>
              <option value="ferry_wharf_mora" className="bg-slate-900 text-white">Bhaucha Dhakka ⇄ Mora</option>
              <option value="belapur_elephanta" className="bg-slate-900 text-white">Belapur ⇄ Elephanta</option>
            </select>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {(['30', '14', '7'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
                  dateRange === range
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range} Days
              </button>
            ))}
          </div>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Passenger Throughput */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shadow-md hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Throughput ({dateRange}d)</span>
            </span>
            <span className="text-emerald-400 flex items-center font-mono text-[11px] font-bold">
              +14.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {totalPassengersSum.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Avg: <span className="text-slate-300 font-mono font-semibold">{avgDailyThroughput.toLocaleString()}</span> passengers/day
          </p>
        </div>

        {/* Total Bookings */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shadow-md hover:border-sky-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-sky-400" />
              <span>Confirmed Bookings</span>
            </span>
            <span className="text-sky-400 font-mono text-[11px] font-bold">88.4% QR Pass</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {totalBookingsSum.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Avg: <span className="text-slate-300 font-mono font-semibold">{Math.round(totalBookingsSum / filteredData.length).toLocaleString()}</span> bookings/day
          </p>
        </div>

        {/* Gross Booking Revenue */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shadow-md hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span>Gross Fare Yield</span>
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold">+18.1%</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ₹{(totalGrossRevenueSum / 100000).toFixed(2)}L
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Turnstile & Digital Bookings
          </p>
        </div>

        {/* Capacity Utilization */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shadow-md hover:border-violet-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>Fleet Load Factor</span>
            </span>
            <span className="text-violet-400 font-mono text-[11px] font-bold">Optimal</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {avgCapacityUtilization}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Certified passenger ceiling
          </p>
        </div>

        {/* Peak Throughput Day */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shadow-md hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Peak Day Volume</span>
            </span>
            <span className="text-amber-400 font-mono text-[10px] uppercase font-bold">{peakDay?.dayLabel}</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">
            {peakDay?.totalPassengers.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Weekend leisure surge
          </p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'all', label: 'Overview: Throughput & Bookings' },
          { id: 'passengers', label: 'Passenger Throughput (Commuter vs Tourist)' },
          { id: 'bookings', label: 'Booking Trends & Channels' },
          { id: 'revenue', label: 'Revenue & Yield Trajectory' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMetricView(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              metricView === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="space-y-6">
        {/* CHART 1: Primary Passenger Throughput vs Booking Trends (Composed Chart) */}
        {(metricView === 'all' || metricView === 'passengers') && (
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>30-Day Daily Passenger Throughput vs Booking Volume</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total boarding passengers (shaded area) superimposed with confirmed booking count and commuter velocity
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" /> Total Passengers
                </span>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-3 h-3 rounded-sm bg-sky-400 inline-block" /> Commuters
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Tourists
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Bookings
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCommuter" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(val: any, name: string) => {
                      if (name === 'grossRevenue') return [`₹${Number(val).toLocaleString()}`, 'Fare Revenue'];
                      return [Number(val).toLocaleString(), name];
                    }}
                  />
                  <ReferenceLine y={3000} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target 3,000/day', fill: '#f59e0b', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="totalPassengers"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorThroughput)"
                    name="Total Passengers"
                  />
                  <Bar dataKey="commuters" fill="#38bdf8" radius={[3, 3, 0, 0]} name="Commuters" maxBarSize={20} />
                  <Bar dataKey="tourists" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Tourists" maxBarSize={20} />
                  <Line
                    type="monotone"
                    dataKey="totalBookings"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                    name="Confirmed Bookings"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: Booking Channel Trends (App vs Web vs Turnstile Walk-In) */}
        {(metricView === 'all' || metricView === 'bookings') && (
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-sky-400" />
                  <span>30-Day Booking Channel Dynamics (Mobile App vs Web vs Pier Walk-In)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Daily distribution of passenger bookings across digital self-service channels and counter turnstiles
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" /> Mobile App (52%)
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Web Portal (31%)
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block" /> Turnstile Walk-In (17%)
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="appBookings" stackId="channel" fill="#06b6d4" name="Mobile App" />
                  <Bar dataKey="webBookings" stackId="channel" fill="#6366f1" name="Web Portal" />
                  <Bar dataKey="walkInBookings" stackId="channel" fill="#64748b" name="Pier Walk-in / Kiosk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: Gross Revenue & Capacity Utilization SLA */}
        {(metricView === 'all' || metricView === 'revenue') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue Trend Area */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase font-mono text-emerald-400">Daily Gross Revenue</h4>
                  <p className="text-[11px] text-slate-400">Daily fare collection across passenger & vehicle tiers</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  ₹ INR
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Gross Revenue']}
                    />
                    <Area type="monotone" dataKey="grossRevenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Capacity Utilization Line */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase font-mono text-violet-400">Fleet Capacity Utilization SLA</h4>
                  <p className="text-[11px] text-slate-400">Percentage of certified vessel seats filled per sailing</p>
                </div>
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800">
                  TARGET: 80-95%
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[60, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(val: any) => [`${val}%`, 'Load Factor']}
                    />
                    <ReferenceLine y={85} stroke="#a855f7" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="capacityUtilization" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Corridor Insights & Operational Takeaways */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white">Harbor Dispatch Intelligence</h4>
            <p className="text-slate-400">
              Tourist traffic peaks on Saturday & Sunday (+172% vs Wednesday baseline). Recommend deploying Ocean Express & Ro-Pax Mandwa Voyager on 30-min headway.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[11px]">
            94.8% SLA MET
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold text-[11px]">
            30-DAY REPORT VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
};
