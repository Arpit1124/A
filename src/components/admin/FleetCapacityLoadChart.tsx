import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Route } from '../../types';
import {
  TrendingUp,
  Users,
  Ship,
  BarChart3,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface DataPoint {
  time: string;
  hour: number;
  capacity: number;
  passengers: number;
  loadFactorPct: number;
  routeId: string;
  routeName: string;
}

interface FleetCapacityLoadChartProps {
  routes: Route[];
}

export const FleetCapacityLoadChart: React.FC<FleetCapacityLoadChartProps> = React.memo(({ routes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [metricView, setMetricView] = useState<'all' | 'loadFactor' | 'capacityVsPax'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'weekend' | 'monthly'>('today');
  const [containerWidth, setContainerWidth] = useState<number>(750);

  // Tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Observe container width dynamically to adapt D3 canvas to layout shifts
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Generate synthetic yet realistic hourly trend data per route
  const rawData: Record<string, DataPoint[]> = useMemo(() => {
    const hours = [
      { time: '06:00', hour: 6 },
      { time: '08:00', hour: 8 },
      { time: '10:00', hour: 10 },
      { time: '12:00', hour: 12 },
      { time: '14:00', hour: 14 },
      { time: '16:00', hour: 16 },
      { time: '18:00', hour: 18 },
      { time: '20:00', hour: 20 },
      { time: '22:00', hour: 22 },
    ];

    const routeProfiles: Record<string, { baseCap: number; morningPeak: number; eveningPeak: number; name: string }> = {
      'route-1': { baseCap: 600, morningPeak: 530, eveningPeak: 565, name: 'Gateway ⇄ Mandwa (Alibaug)' },
      'route-2': { baseCap: 400, morningPeak: 360, eveningPeak: 375, name: 'Bhaucha Dhakka ⇄ Mora Pier' },
      'route-3': { baseCap: 450, morningPeak: 390, eveningPeak: 340, name: 'Gateway ⇄ Elephanta Caves' },
      'route-4': { baseCap: 250, morningPeak: 235, eveningPeak: 240, name: 'Belapur ⇄ Mandwa Speedboat' },
    };

    const datasets: Record<string, DataPoint[]> = {};

    // For individual routes
    Object.entries(routeProfiles).forEach(([rId, profile]) => {
      datasets[rId] = hours.map(({ time, hour }) => {
        let pax = 0;
        let cap = profile.baseCap;

        // Morning and evening commuter peaks
        if (hour === 8 || hour === 10) {
          pax = Math.round(profile.morningPeak * (0.92 + Math.random() * 0.12));
        } else if (hour === 16 || hour === 18) {
          pax = Math.round(profile.eveningPeak * (0.94 + Math.random() * 0.1));
        } else if (hour === 12 || hour === 14) {
          pax = Math.round(profile.baseCap * 0.58 + Math.random() * 40);
        } else {
          pax = Math.round(profile.baseCap * 0.35 + Math.random() * 25);
        }

        pax = Math.min(cap, pax);
        const loadFactor = Math.round((pax / cap) * 100);

        return {
          time,
          hour,
          capacity: cap,
          passengers: pax,
          loadFactorPct: loadFactor,
          routeId: rId,
          routeName: profile.name,
        };
      });
    });

    // Combined 'all' routes aggregate
    datasets['all'] = hours.map(({ time, hour }, idx) => {
      const allAtHour = Object.keys(routeProfiles).map((id) => datasets[id][idx]);
      const totalCap = allAtHour.reduce((sum, d) => sum + d.capacity, 0);
      const totalPax = allAtHour.reduce((sum, d) => sum + d.passengers, 0);
      const avgLoadFactor = Math.round((totalPax / totalCap) * 100);

      return {
        time,
        hour,
        capacity: totalCap,
        passengers: totalPax,
        loadFactorPct: avgLoadFactor,
        routeId: 'all',
        routeName: 'All Fleet Routes (Fleet Aggregate)',
      };
    });

    return datasets;
  }, []);

  const currentData = rawData[selectedRouteId] || rawData['all'];

  // Summary Metrics for KPI cards
  const avgLoadFactor = Math.round(
    currentData.reduce((sum, d) => sum + d.loadFactorPct, 0) / currentData.length
  );
  const peakPoint = currentData.reduce((max, d) => (d.loadFactorPct > max.loadFactorPct ? d : max), currentData[0]);
  const totalDailyCapacity = currentData.reduce((sum, d) => sum + d.capacity, 0);
  const totalDailyPassengers = currentData.reduce((sum, d) => sum + d.passengers, 0);

  // Render D3 Visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = containerWidth || container.clientWidth || 750;
    const height = 360;
    const margin = { top: 25, right: 55, bottom: 45, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous render
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Defs for gradients and markers
    const defs = svg.append('defs');

    // Gradient for passenger area
    const paxGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-pax-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    paxGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.45);

    paxGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.02);

    // Gradient for load factor area
    const loadGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-load-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    loadGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.35);

    loadGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scalePoint<string>()
      .domain(currentData.map((d) => d.time))
      .range([0, innerWidth])
      .padding(0.15);

    const maxCapacity = d3.max(currentData, (d) => d.capacity) || 1000;
    const yScaleLeft = d3
      .scaleLinear()
      .domain([0, maxCapacity * 1.15])
      .range([innerHeight, 0])
      .nice();

    const yScaleRight = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScaleLeft)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.4);

    // X Axis
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    xAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px').attr('font-family', 'monospace');
    xAxis.select('.domain').attr('stroke', '#475569');

    // Left Y Axis (Pax & Capacity)
    if (metricView !== 'loadFactor') {
      const yAxisLeft = g.append('g').call(d3.axisLeft(yScaleLeft).ticks(5));
      yAxisLeft.selectAll('text').attr('fill', '#38bdf8').attr('font-size', '11px').attr('font-family', 'monospace');
      yAxisLeft.select('.domain').attr('stroke', '#475569');

      // Left axis label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#38bdf8')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text('PASSENGERS / SEATS');
    }

    // Right Y Axis (Load Factor %)
    if (metricView !== 'capacityVsPax') {
      const yAxisRight = g
        .append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(
          d3
            .axisRight(yScaleRight)
            .ticks(5)
            .tickFormat((d) => `${d}%`)
        );
      yAxisRight.selectAll('text').attr('fill', '#34d399').attr('font-size', '11px').attr('font-family', 'monospace');
      yAxisRight.select('.domain').attr('stroke', '#475569');

      // Right axis label
      g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('y', -innerWidth - 42)
        .attr('x', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#34d399')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text('LOAD FACTOR (%)');
    }

    // 1. Capacity Line (Dashed Slate/Sky)
    if (metricView !== 'loadFactor') {
      const capacityLine = d3
        .line<DataPoint>()
        .x((d) => xScale(d.time) || 0)
        .y((d) => yScaleLeft(d.capacity))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(currentData)
        .attr('fill', 'none')
        .attr('stroke', '#64748b')
        .attr('stroke-dasharray', '5 4')
        .attr('stroke-width', 2)
        .attr('d', capacityLine);
    }

    // 2. Passengers Shaded Area & Solid Curve
    if (metricView !== 'loadFactor') {
      const paxArea = d3
        .area<DataPoint>()
        .x((d) => xScale(d.time) || 0)
        .y0(innerHeight)
        .y1((d) => yScaleLeft(d.passengers))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(currentData)
        .attr('fill', 'url(#d3-pax-gradient)')
        .attr('d', paxArea);

      const paxLine = d3
        .line<DataPoint>()
        .x((d) => xScale(d.time) || 0)
        .y((d) => yScaleLeft(d.passengers))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(currentData)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2.5)
        .attr('d', paxLine);
    }

    // 3. Load Factor Curve & Area (Emerald)
    if (metricView !== 'capacityVsPax') {
      const loadArea = d3
        .area<DataPoint>()
        .x((d) => xScale(d.time) || 0)
        .y0(innerHeight)
        .y1((d) => yScaleRight(d.loadFactorPct))
        .curve(d3.curveMonotoneX);

      if (metricView === 'loadFactor') {
        g.append('path')
          .datum(currentData)
          .attr('fill', 'url(#d3-load-gradient)')
          .attr('d', loadArea);
      }

      const loadLine = d3
        .line<DataPoint>()
        .x((d) => xScale(d.time) || 0)
        .y((d) => yScaleRight(d.loadFactorPct))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(currentData)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 3)
        .attr('d', loadLine);

      // Load Factor Dots
      g.selectAll('.load-dot')
        .data(currentData)
        .enter()
        .append('circle')
        .attr('class', 'load-dot')
        .attr('cx', (d) => xScale(d.time) || 0)
        .attr('cy', (d) => yScaleRight(d.loadFactorPct))
        .attr('r', 4.5)
        .attr('fill', '#022c22')
        .attr('stroke', '#34d399')
        .attr('stroke-width', 2.5);
    }

    // 4. Interactive Overlay for Hover & Crosshairs
    const focusLine = g
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event);
        const eachBand = innerWidth / (currentData.length - 1);
        const index = Math.min(
          currentData.length - 1,
          Math.max(0, Math.round(mx / eachBand))
        );
        const point = currentData[index];

        if (point) {
          const posX = xScale(point.time) || 0;
          focusLine.attr('x1', posX).attr('x2', posX).style('opacity', 1);

          setHoveredPoint(point);
          setTooltipPos({
            x: margin.left + posX,
            y: margin.top + Math.min(my, innerHeight - 80),
          });
        }
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        setHoveredPoint(null);
        setTooltipPos(null);
      });
  }, [currentData, metricView, containerWidth]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Fleet Capacity & Passenger Load Factor Trends (D3.js)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                AIS Telemetry Stream
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive dual-axis D3 curves mapping seat capacity allocations against passenger boarding load factors
            </p>
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setMetricView('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                metricView === 'all'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Combined View
            </button>
            <button
              onClick={() => setMetricView('loadFactor')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                metricView === 'loadFactor'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Load Factor %
            </button>
            <button
              onClick={() => setMetricView('capacityVsPax')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                metricView === 'capacityVsPax'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Capacity vs Passengers
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Aggregate Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Avg Fleet Load Factor</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {avgLoadFactor}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across operating schedule</div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Peak Route Load</span>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {peakPoint.loadFactorPct}% <span className="text-xs text-slate-400 font-normal">at {peakPoint.time}</span>
          </div>
          <div className="text-[11px] text-cyan-300 mt-0.5 truncate">{peakPoint.routeName.split('(')[0]}</div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Scheduled Daily Seats</span>
            <Ship className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-300 mt-1">
            {totalDailyCapacity.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total capacity deployed</div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="text-slate-400 flex items-center justify-between">
            <span>Boarded Volume</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
            {totalDailyPassengers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tickets checked via turnstile</div>
        </div>
      </div>

      {/* Fleet Route Selector Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-cyan-400" /> Fleet Route:
        </span>
        {[
          { id: 'all', label: 'All Fleet Routes (Combined)' },
          { id: 'route-1', label: 'Gateway ⇄ Mandwa' },
          { id: 'route-2', label: 'Bhaucha Dhakka ⇄ Mora' },
          { id: 'route-3', label: 'Gateway ⇄ Elephanta' },
          { id: 'route-4', label: 'Belapur ⇄ Mandwa Fast Taxi' },
        ].map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelectedRouteId(rt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedRouteId === rt.id
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-bold'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {/* D3 Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800 p-2">
        <svg ref={svgRef} className="w-full block select-none" />

        {/* Interactive Tooltip Card */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-900 border border-cyan-500/50 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 backdrop-blur-md min-w-[200px]"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 font-mono">
              <span className="font-bold text-white">{hoveredPoint.time} Slot</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  hoveredPoint.loadFactorPct >= 80
                    ? 'bg-red-500/20 text-red-300'
                    : hoveredPoint.loadFactorPct >= 65
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {hoveredPoint.loadFactorPct >= 80 ? 'Peak Rush' : hoveredPoint.loadFactorPct >= 60 ? 'Moderate' : 'Off-Peak'}
              </span>
            </div>

            <div className="text-[11px] text-cyan-300 font-medium truncate">{hoveredPoint.routeName}</div>

            <div className="space-y-1 pt-1 font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Passengers Boarded:
                </span>
                <span className="font-bold text-white">{hoveredPoint.passengers.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Fleet Capacity:
                </span>
                <span>{hoveredPoint.capacity.toLocaleString()} seats</span>
              </div>

              <div className="flex items-center justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Load Factor:
                </span>
                <span className="text-sm">{hoveredPoint.loadFactorPct}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Notes */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span className="text-slate-300">Passenger Headcount Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-500 border-t border-dashed" />
            <span className="text-slate-400">Vessel Seat Capacity Allocated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
            <span className="text-emerald-300 font-medium">Load Factor Utilization %</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hover over D3 line markers to inspect hourly capacity ratios</span>
        </div>
      </div>
    </div>
  );
});
