import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useFerry } from '../../context/FerryContext';
import {
  Users,
  Clock,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react';

export interface TerminalQueueCell {
  terminalId: string;
  terminalName: string;
  terminalCode: string;
  hour: number;
  timeLabel: string;
  passengersPerHour: number;
  avgWaitMinutes: number;
  queueLengthMeters: number;
  activeTurnstiles: number;
  totalTurnstiles: number;
  congestionLevel: 'low' | 'normal' | 'elevated' | 'critical';
  dayProfile: 'weekday' | 'weekend' | 'holiday';
}

export const TerminalQueueHeatmap: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { ports, theme } = useFerry();
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [metricMode, setMetricMode] = useState<'boarding' | 'queueTime' | 'queueLength'>('boarding');
  const [dayProfile, setDayProfile] = useState<'weekday' | 'weekend' | 'holiday'>('weekday');
  const [hoveredCell, setHoveredCell] = useState<TerminalQueueCell | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState<{ x: number; y: number } | null>(null);
  const [filterTerminal, setFilterTerminal] = useState<string>('all');

  const terminals = useMemo(() => [
    { id: 'port-gateway', name: 'Gateway of India Terminal', code: 'GW-T1', berths: 4, turnstiles: 6 },
    { id: 'port-mandwa', name: 'Mandwa Ro-Pax Terminal', code: 'MDW-T2', berths: 3, turnstiles: 5 },
    { id: 'port-bhaucha', name: 'Bhaucha Dhakka (Ferry Wharf)', code: 'BDK-T3', berths: 3, turnstiles: 4 },
    { id: 'port-elephanta', name: 'Elephanta Pier (Gharapuri)', code: 'ELE-T4', berths: 2, turnstiles: 3 },
    { id: 'port-belapur', name: 'Belapur Terminal (Navi Mumbai)', code: 'BLP-T5', berths: 2, turnstiles: 3 },
  ], []);

  const hours = useMemo(() => [
    { hour: 6, label: '06:00' },
    { hour: 7, label: '07:00' },
    { hour: 8, label: '08:00' },
    { hour: 9, label: '09:00' },
    { hour: 10, label: '10:00' },
    { hour: 11, label: '11:00' },
    { hour: 12, label: '12:00' },
    { hour: 13, label: '13:00' },
    { hour: 14, label: '14:00' },
    { hour: 15, label: '15:00' },
    { hour: 16, label: '16:00' },
    { hour: 17, label: '17:00' },
    { hour: 18, label: '18:00' },
    { hour: 19, label: '19:00' },
    { hour: 20, label: '20:00' },
    { hour: 21, label: '21:00' },
  ], []);

  // Generate deterministic realistic hourly queuing data based on passenger flow models
  const heatmapData: TerminalQueueCell[] = useMemo(() => {
    const cells: TerminalQueueCell[] = [];

    terminals.forEach((term) => {
      hours.forEach((h) => {
        let basePax = 180;
        let baseWait = 4;
        let baseQueue = 12;

        // Gateway Commuter & Tourist peaks
        if (term.id === 'port-gateway') {
          if (dayProfile === 'weekday') {
            if (h.hour >= 8 && h.hour <= 10) {
              basePax = 1350 + (h.hour === 9 ? 120 : 0);
              baseWait = 22;
              baseQueue = 78;
            } else if (h.hour >= 17 && h.hour <= 19) {
              basePax = 1240;
              baseWait = 19;
              baseQueue = 68;
            } else if (h.hour >= 11 && h.hour <= 15) {
              basePax = 620;
              baseWait = 8;
              baseQueue = 28;
            }
          } else if (dayProfile === 'weekend') {
            // Weekend tourist surge to Alibaug & Elephanta
            if (h.hour >= 9 && h.hour <= 13) {
              basePax = 1580;
              baseWait = 27;
              baseQueue = 95;
            } else if (h.hour >= 16 && h.hour <= 18) {
              basePax = 890;
              baseWait = 14;
              baseQueue = 45;
            }
          } else {
            // Holiday rush
            if (h.hour >= 9 && h.hour <= 14) {
              basePax = 1720;
              baseWait = 31;
              baseQueue = 110;
            }
          }
        }

        // Mandwa Return Commuter & Car Ro-Pax peaks
        else if (term.id === 'port-mandwa') {
          if (dayProfile === 'weekday') {
            if (h.hour >= 7 && h.hour <= 9) {
              basePax = 980;
              baseWait = 14;
              baseQueue = 48;
            } else if (h.hour >= 17 && h.hour <= 19) {
              basePax = 1420;
              baseWait = 24;
              baseQueue = 84;
            } else {
              basePax = 340;
              baseWait = 5;
              baseQueue = 16;
            }
          } else {
            // Weekend massive return surge Sunday evening
            if (h.hour >= 16 && h.hour <= 20) {
              basePax = 1650;
              baseWait = 29;
              baseQueue = 98;
            } else if (h.hour >= 10 && h.hour <= 13) {
              basePax = 740;
              baseWait = 11;
              baseQueue = 36;
            }
          }
        }

        // Bhaucha Dhakka
        else if (term.id === 'port-bhaucha') {
          if (h.hour >= 8 && h.hour <= 10) {
            basePax = 780;
            baseWait = 12;
            baseQueue = 38;
          } else if (h.hour >= 17 && h.hour <= 19) {
            basePax = 820;
            baseWait = 13;
            baseQueue = 42;
          } else {
            basePax = 220;
            baseWait = 4;
            baseQueue = 14;
          }
        }

        // Elephanta Island (Tourist outbound morning, return afternoon)
        else if (term.id === 'port-elephanta') {
          if (h.hour >= 10 && h.hour <= 12) {
            basePax = 560;
            baseWait = 8;
            baseQueue = 24;
          } else if (h.hour >= 15 && h.hour <= 18) {
            basePax = 1180;
            baseWait = 21;
            baseQueue = 65;
          } else {
            basePax = 90;
            baseWait = 2;
            baseQueue = 6;
          }
        }

        // Belapur Water Taxi
        else {
          if (h.hour >= 8 && h.hour <= 10) {
            basePax = 420;
            baseWait = 7;
            baseQueue = 22;
          } else if (h.hour >= 18 && h.hour <= 20) {
            basePax = 460;
            baseWait = 8;
            baseQueue = 26;
          } else {
            basePax = 110;
            baseWait = 2;
            baseQueue = 8;
          }
        }

        const congestion: TerminalQueueCell['congestionLevel'] =
          basePax >= 1300 || baseWait >= 22
            ? 'critical'
            : basePax >= 800 || baseWait >= 14
            ? 'elevated'
            : basePax >= 400
            ? 'normal'
            : 'low';

        cells.push({
          terminalId: term.id,
          terminalName: term.name,
          terminalCode: term.code,
          hour: h.hour,
          timeLabel: h.label,
          passengersPerHour: basePax,
          avgWaitMinutes: baseWait,
          queueLengthMeters: baseQueue,
          activeTurnstiles: congestion === 'critical' ? term.turnstiles : Math.max(2, term.turnstiles - 1),
          totalTurnstiles: term.turnstiles,
          congestionLevel: congestion,
          dayProfile,
        });
      });
    });

    return cells;
  }, [terminals, hours, dayProfile]);

  // Filtered heatmap dataset
  const filteredData = useMemo(() => {
    if (filterTerminal === 'all') return heatmapData;
    return heatmapData.filter((d) => d.terminalId === filterTerminal);
  }, [heatmapData, filterTerminal]);

  const displayedTerminals = useMemo(() => {
    if (filterTerminal === 'all') return terminals;
    return terminals.filter((t) => t.id === filterTerminal);
  }, [terminals, filterTerminal]);

  // D3 Heatmap Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 880;
    const margin = { top: 35, right: 30, bottom: 50, left: 160 };
    const innerWidth = width - margin.left - margin.right;
    const rowHeight = displayedTerminals.length > 2 ? 46 : 64;
    const innerHeight = displayedTerminals.length * rowHeight;
    const totalHeight = innerHeight + margin.top + margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${totalHeight}`).attr('width', '100%').attr('height', totalHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Hours of Day
    const xScale = d3
      .scaleBand()
      .range([0, innerWidth])
      .domain(hours.map((h) => h.label))
      .padding(0.08);

    // Y Scale: Terminals
    const yScale = d3
      .scaleBand()
      .range([0, innerHeight])
      .domain(displayedTerminals.map((t) => t.name))
      .padding(0.12);

    // Metric Value Extents
    const maxPax = d3.max(heatmapData, (d) => d.passengersPerHour) || 1800;
    const maxWait = d3.max(heatmapData, (d) => d.avgWaitMinutes) || 35;
    const maxQueue = d3.max(heatmapData, (d) => d.queueLengthMeters) || 120;

    // Color Scales: High-contrast Dark Maritime Heatmap Palette (Navy -> Cyan -> Amber -> Crimson Red)
    const colorScaleBoarding = d3
      .scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain([100, maxPax]);

    const colorScaleWaitTime = d3
      .scaleSequential()
      .interpolator(d3.interpolateMagma)
      .domain([2, maxWait]);

    const colorScaleQueue = d3
      .scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([5, maxQueue]);

    const getCellColor = (d: TerminalQueueCell) => {
      if (metricMode === 'boarding') return colorScaleBoarding(d.passengersPerHour);
      if (metricMode === 'queueTime') return colorScaleWaitTime(d.avgWaitMinutes);
      return colorScaleQueue(d.queueLengthMeters);
    };

    const getDisplayValue = (d: TerminalQueueCell) => {
      if (metricMode === 'boarding') return `${d.passengersPerHour}`;
      if (metricMode === 'queueTime') return `${d.avgWaitMinutes}m`;
      return `${d.queueLengthMeters}m`;
    };

    // Draw Heatmap Cells
    const cellGroups = g
      .selectAll('.cell')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', (d: any) => `translate(${xScale(d.timeLabel)},${yScale(d.terminalName)})`)
      .style('cursor', 'pointer');

    // Background Cell Rectangles
    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d: any) => getCellColor(d))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5)
      .style('transition', 'all 0.15s ease')
      .on('mouseenter', function (event: any, d: any) {
        d3.select(this)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2.5)
          .attr('filter', 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))');
        setHoveredCell(d);
        const rect = container.getBoundingClientRect();
        setTooltipCoords({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mousemove', (event: any) => {
        const rect = container.getBoundingClientRect();
        setTooltipCoords({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 1.5)
          .attr('filter', null);
        setHoveredCell(null);
      });

    // Cell Text Value Labels (if bandwidth is adequate)
    if (xScale.bandwidth() > 30) {
      cellGroups
        .append('text')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', yScale.bandwidth() / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'monospace')
        .attr('font-size', xScale.bandwidth() > 44 ? '11px' : '9px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .attr('fill', (d: any) => {
          const val = metricMode === 'boarding' ? d.passengersPerHour : d.avgWaitMinutes;
          const cutoff = metricMode === 'boarding' ? 800 : 16;
          return val > cutoff ? '#ffffff' : '#0f172a';
        })
        .text((d: any) => getDisplayValue(d));
    }

    // X-Axis (Hours of Day)
    const xAxis = d3.axisBottom(xScale).tickSize(0);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('dy', '1.2em')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600');

    // Y-Axis (Terminal Names)
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('dx', '-0.6em')
      .attr('fill', '#f8fafc')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .each(function (d: any) {
        // Truncate long terminal labels if needed
        const self = d3.select(this);
        const name = d as string;
        if (name.length > 24) {
          self.text(name.slice(0, 22) + '...');
        }
      });

    // Remove axis baseline lines for sleek modern aesthetic
    g.selectAll('.domain').remove();
  }, [filteredData, displayedTerminals, hours, metricMode, heatmapData]);

  // Overall Statistics from the Heatmap dataset
  const stats = useMemo(() => {
    const peakBoarding = [...heatmapData].sort((a, b) => b.passengersPerHour - a.passengersPerHour)[0];
    const peakWait = [...heatmapData].sort((a, b) => b.avgWaitMinutes - a.avgWaitMinutes)[0];
    const avgWait = (heatmapData.reduce((acc, c) => acc + c.avgWaitMinutes, 0) / heatmapData.length).toFixed(1);
    const totalDailyPax = heatmapData.reduce((acc, c) => acc + c.passengersPerHour, 0);

    return { peakBoarding, peakWait, avgWait, totalDailyPax };
  }, [heatmapData]);

  return (
    <div
      id="terminal-queue-heatmap-container"
      className={`p-5 rounded-2xl border shadow-xl space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } ${className}`}
    >
      {/* 1. Header & Metric Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-950/40">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Terminal Boarding & Turnstile Queue Heatmap (D3 Engine)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span>Peak Surge Analytics</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive D3 heatmap tracking hourly passenger throughput, turnstile wait times, and queue bottlenecks across Mumbai Harbour piers
            </p>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMetricMode('boarding')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              metricMode === 'boarding'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Boarding (pax/hr)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('queueTime')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              metricMode === 'queueTime'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Queue Wait Time (min)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('queueLength')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              metricMode === 'queueLength'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Queue Length (meters)</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Day Profile Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Day Profile:</span>
          {(['weekday', 'weekend', 'holiday'] as const).map((profile) => (
            <button
              key={profile}
              type="button"
              onClick={() => setDayProfile(profile)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                dayProfile === profile
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {profile === 'weekday' ? 'Standard Commute' : profile === 'weekend' ? 'Weekend Tourism' : 'Holiday Festival'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Terminal:</span>
          <select
            value={filterTerminal}
            onChange={(e) => setFilterTerminal(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Port Terminals (5)</option>
            {terminals.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. D3 SVG Heatmap Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800 p-3">
        <svg ref={svgRef} className="w-full min-w-[760px]" />

        {/* Floating Custom Interactive Tooltip */}
        {hoveredCell && tooltipCoords && (
          <div
            className="absolute z-20 pointer-events-none p-3.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl text-xs space-y-2 backdrop-blur-md transition-all duration-75"
            style={{
              left: Math.min(tooltipCoords.x + 15, (containerRef.current?.clientWidth || 800) - 260),
              top: Math.max(tooltipCoords.y - 120, 10),
              width: '240px',
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white text-xs">{hoveredCell.terminalName}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 font-semibold">
                {hoveredCell.timeLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Boarding Rate</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {hoveredCell.passengersPerHour} <span className="text-[10px] text-slate-400">pax/hr</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Turnstile Wait</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {hoveredCell.avgWaitMinutes} <span className="text-[10px] text-slate-400">mins</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Queue Length</span>
                <span className="font-mono font-bold text-sky-300 text-sm">
                  ~{hoveredCell.queueLengthMeters} <span className="text-[10px] text-slate-400">meters</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Active Gates</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {hoveredCell.activeTurnstiles} / {hoveredCell.totalTurnstiles}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-400 font-mono">Congestion Severity</span>
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase ${
                  hoveredCell.congestionLevel === 'critical'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : hoveredCell.congestionLevel === 'elevated'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {hoveredCell.congestionLevel}
              </span>
            </div>
          </div>
        )}

        {/* Heatmap Legend Bar */}
        <div className="flex items-center justify-between pt-2 px-2 text-[11px] text-slate-400 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <span>Flow Intensity:</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300">Off-Peak</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">Elevated</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">Critical Rush</span>
            </div>
          </div>
          <span className="font-mono text-[10px]">Hover any cell for pier turnstile allocation</span>
        </div>
      </div>

      {/* 4. Executive Queue Insights & Operational Guidance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Peak Harbor Bottleneck</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-bold text-white text-sm">
            {stats.peakBoarding?.terminalName.split(' ')[0]} at {stats.peakBoarding?.timeLabel}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.peakBoarding?.passengersPerHour} pax/hr with peak queue of {stats.peakBoarding?.avgWaitMinutes} min wait.
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Average Turnstile Wait</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-bold text-cyan-300 text-sm font-mono">{stats.avgWait} Minutes Average</div>
          <p className="text-[11px] text-slate-400">
            Across 16 operational hours and 5 regional harbour terminals.
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Turnstile Dispatch Action</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-bold text-emerald-300 text-sm">Deploy Standby Gates</div>
          <p className="text-[11px] text-slate-400">
            Recommend activating reserve Gate 4 & 5 at Mandwa during 17:00-19:00 evening return surge.
          </p>
        </div>
      </div>
    </div>
  );
};
