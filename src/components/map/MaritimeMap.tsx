import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry, Port, Route } from '../../types';
import {
  Navigation,
  Anchor,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Wind,
  ShieldAlert,
  Radio,
  Eye,
  Info,
  Clock,
  Gauge,
  Users,
  Flame,
  Waves,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Sun,
  CloudRain,
} from 'lucide-react';

interface MaritimeMapProps {
  heightClass?: string;
  selectedFerry?: Ferry | null;
  onSelectFerry?: (ferry: Ferry | null) => void;
  showControls?: boolean;
  highlightRouteId?: string | null;
  mode?: 'interactive' | 'dashboard-hero' | 'passenger-track';
  showRouteHeatmapDefault?: boolean;
  showWeatherDefault?: boolean;
}

// Bounding box for Mumbai Harbour / Mandwa / Elephanta waterways
// Lat: ~18.78 to ~19.03 (North-South span ~0.25 deg)
// Lng: ~72.80 to ~73.05 (West-East span ~0.25 deg)
const MIN_LAT = 18.77;
const MAX_LAT = 19.03;
const MIN_LNG = 72.80;
const MAX_LNG = 73.06;

export const MaritimeMap: React.FC<MaritimeMapProps> = ({
  heightClass = 'h-[580px]',
  selectedFerry: externalSelectedFerry,
  onSelectFerry,
  showControls = true,
  highlightRouteId,
  mode = 'interactive',
  showRouteHeatmapDefault = false,
  showWeatherDefault = false,
}) => {
  const { ferries, ports, routes, selectedFerryId, setSelectedFerryId, trips, bookings, activeView, setActiveView } = useFerry();

  // Internal selection if not externally controlled
  const activeFerry = useMemo(() => {
    if (externalSelectedFerry !== undefined) return externalSelectedFerry;
    return ferries.find((f) => f.id === selectedFerryId) || null;
  }, [externalSelectedFerry, ferries, selectedFerryId]);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showFairway, setShowFairway] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(showWeatherDefault);
  const [showRouteHeatmap, setShowRouteHeatmap] = useState<boolean>(showRouteHeatmapDefault);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live Marine Weather State from Open-Meteo external API with reliable fallback
  const [marineWeather, setMarineWeather] = useState({
    windSpeedKnots: 14.2,
    windDirectionDeg: 245,
    windCompass: 'WSW',
    waveHeightM: 0.7,
    swellPeriodSec: 5.2,
    temperatureC: 29,
    visibilityKm: 9.5,
    seaCondition: 'Moderate Chop (Safe Navigation)',
    stormAlert: {
      active: false,
      severity: 'Normal',
      title: 'Arabian Sea All Clear',
      advisory: 'Standard fair-weather maritime protocol in effect across all channels.',
    },
    source: 'Harbor Buoy AIS-MET',
    lastUpdated: 'Just now',
  });

  // Fetch real-time weather from Open-Meteo API
  const fetchRealTimeWeather = async () => {
    setIsWeatherLoading(true);
    try {
      // Open-Meteo weather API for Mumbai Harbour (Lat: 18.922, Lng: 72.8346)
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=18.922&longitude=72.8346&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&wind_speed_unit=kn'
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.current) {
          const windKts = Math.round(data.current.wind_speed_10m || 14);
          const windDir = Math.round(data.current.wind_direction_10m || 240);
          const temp = Math.round(data.current.temperature_2m || 29);

          const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
          const compass = directions[Math.round((windDir % 360) / 22.5) % 16];

          // Compute estimated wave height from wind speed
          const waveHeight = +(0.3 + (windKts / 20) * 0.5).toFixed(1);
          const hasStorm = windKts > 24;

          setMarineWeather({
            windSpeedKnots: windKts,
            windDirectionDeg: windDir,
            windCompass: compass,
            waveHeightM: waveHeight,
            swellPeriodSec: +(4.5 + waveHeight * 1.2).toFixed(1),
            temperatureC: temp,
            visibilityKm: hasStorm ? 5.2 : 9.8,
            seaCondition: hasStorm ? 'Rough Waters / Caution' : windKts > 16 ? 'Breezy / Moderate Chop' : 'Calm Swell (Optimal)',
            stormAlert: {
              active: hasStorm,
              severity: hasStorm ? 'Warning' : 'Normal',
              title: hasStorm ? 'Monsoon Squall Alert: Strong Coastal Gusts' : 'Fair Harbor Transit Conditions',
              advisory: hasStorm
                ? 'MMB Seaworthiness Directive: Fast water taxis restricted to inner channel. Ro-Pax operating under escort.'
                : 'All maritime corridors safe for scheduled Catamaran and Ro-Pax passage.',
            },
            source: 'Open-Meteo Maritime API (Live)',
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    } catch {
      // Retain fallback data smoothly
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeWeather();
    const interval = setInterval(fetchRealTimeWeather, 60000); // 1 minute auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Compute Route Popularity & Corridor Traffic Heatmap based on booking data + live onboard pax
  const routePopularity = useMemo(() => {
    const stats: Record<
      string,
      {
        totalPax: number;
        bookingsCount: number;
        activeFerriesCount: number;
        densityCategory: 'Surge' | 'High' | 'Moderate' | 'Low';
        heatColor: string;
        glowColor: string;
        heatWidth: number;
      }
    > = {};

    routes.forEach((r) => {
      // 1. Count confirmed bookings for this route
      const routeBookings = bookings.filter((b) => {
        if (b.routeId === r.id) return true;
        const tr = trips.find((t) => t.id === b.tripId);
        return tr?.routeId === r.id;
      });

      const bookedPax = routeBookings.reduce((sum, b) => sum + (b.passengers?.length || 1), 0);

      // 2. Count active ferries currently underway on this route
      const activeFerriesOnRoute = ferries.filter((f) => f.currentRouteId === r.id);
      const onboardPax = activeFerriesOnRoute.reduce((sum, f) => sum + f.currentPassengers, 0);

      const totalPax = bookedPax + onboardPax;

      let densityCategory: 'Surge' | 'High' | 'Moderate' | 'Low' = 'Low';
      let heatColor = '#06b6d4'; // cyan
      let glowColor = 'rgba(6, 182, 212, 0.4)';
      let heatWidth = 14;

      if (totalPax > 300) {
        densityCategory = 'Surge';
        heatColor = '#f43f5e'; // rose-500
        glowColor = 'rgba(244, 63, 94, 0.65)';
        heatWidth = 32;
      } else if (totalPax > 150) {
        densityCategory = 'High';
        heatColor = '#f97316'; // orange-500
        glowColor = 'rgba(249, 115, 22, 0.55)';
        heatWidth = 24;
      } else if (totalPax > 50) {
        densityCategory = 'Moderate';
        heatColor = '#eab308'; // yellow-500
        glowColor = 'rgba(234, 179, 8, 0.45)';
        heatWidth = 18;
      }

      stats[r.id] = {
        totalPax,
        bookingsCount: routeBookings.length,
        activeFerriesCount: activeFerriesOnRoute.length,
        densityCategory,
        heatColor,
        glowColor,
        heatWidth,
      };
    });

    return stats;
  }, [bookings, routes, trips, ferries]);

  // Convert GPS (lat, lng) to SVG percentage (0 to 1000)
  const coordsToSvg = (lat: number, lng: number) => {
    // Normalization
    const xRatio = (lng - MIN_LNG) / (MAX_LNG - MIN_LNG);
    const yRatio = (MAX_LAT - lat) / (MAX_LAT - MIN_LAT); // Invert Y because lat increases Northward
    return {
      x: Math.max(10, Math.min(990, xRatio * 1000)),
      y: Math.max(10, Math.min(990, yRatio * 1000)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.8, prev - 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleFerryClick = (f: Ferry) => {
    if (onSelectFerry) {
      onSelectFerry(f);
    } else {
      setSelectedFerryId(f.id);
    }
  };

  const getStatusColor = (status: Ferry['status']) => {
    switch (status) {
      case 'on_time':
        return '#10b981'; // emerald-500
      case 'delayed':
        return '#f59e0b'; // amber-500
      case 'boarding':
        return '#06b6d4'; // cyan-500
      case 'approaching':
        return '#f97316'; // orange-500
      case 'emergency':
        return '#ef4444'; // red-500
      case 'docked':
        return '#94a3b8'; // slate-400
      case 'offline':
      default:
        return '#64748b'; // slate-500
    }
  };

  return (
    <div
      ref={containerRef}
      id="maritime-map-container"
      className={`relative w-full ${heightClass} ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen bg-slate-950' : ''
      } bg-[#071322] border border-cyan-950/60 rounded-xl overflow-hidden shadow-2xl select-none`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Background Nautical Grid & Bathymetry Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Live Sweep Radar Animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none opacity-15">
        <div className="w-full h-full rounded-full border border-cyan-500/20 animate-spin [animation-duration:16s] relative">
          <div className="absolute top-0 right-1/2 w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/20 to-transparent [clip-path:polygon(0_0,100%_100%,0_100%)] origin-bottom-right" />
        </div>
      </div>

      {/* SVG Navigational Chart */}
      <svg
        id="maritime-svg-chart"
        viewBox="0 0 1000 1000"
        className="w-full h-full transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <defs>
          <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="heatmap-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="fairwayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Bathymetry & Coastline Geometries (Mumbai Harbour & Elephanta Contours) */}
        {/* Mumbai Peninsula Coast (West) */}
        <path
          d="M 10 10 L 260 10 L 280 180 L 250 350 L 220 520 L 190 680 L 150 820 L 110 980 L 10 980 Z"
          fill="#0c1d33"
          stroke="#1e3a5f"
          strokeWidth="2"
        />
        {/* Mandwa / Alibaug Southern Shore */}
        <path
          d="M 120 980 L 400 980 L 520 890 L 580 840 L 490 770 L 380 780 L 270 850 Z"
          fill="#0c1d33"
          stroke="#1e3a5f"
          strokeWidth="2"
        />
        {/* Elephanta Island (Gharapuri) */}
        <path
          d="M 640 420 Q 690 390 730 430 Q 750 490 700 520 Q 630 500 640 420 Z"
          fill="#0f2642"
          stroke="#0284c7"
          strokeWidth="1.5"
        />
        {/* Butcher Island (Jawahar Dweep) */}
        <path
          d="M 520 360 Q 550 340 570 370 Q 560 410 530 400 Q 510 380 520 360 Z"
          fill="#0c1e36"
          stroke="#1e3a5f"
          strokeWidth="1"
        />
        {/* Navi Mumbai / Belapur Mainland (East) */}
        <path
          d="M 780 10 L 990 10 L 990 980 L 860 980 L 840 700 L 810 480 L 850 320 L 800 120 Z"
          fill="#0c1d33"
          stroke="#1e3a5f"
          strokeWidth="2"
        />

        {/* Nautical Soundings / Depth Contour Lines */}
        <path
          d="M 270 240 Q 380 340 420 540 T 360 760"
          fill="none"
          stroke="#0284c7"
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.3"
        />
        <text x="320" y="320" fill="#0284c7" fontSize="10" opacity="0.4" fontFamily="monospace">
          14.2m
        </text>
        <text x="440" y="550" fill="#0284c7" fontSize="10" opacity="0.4" fontFamily="monospace">
          18.6m (DEEP CHANNEL)
        </text>
        <text x="590" y="470" fill="#0284c7" fontSize="10" opacity="0.4" fontFamily="monospace">
          8.4m
        </text>

        {/* Fairway Shipping Corridors */}
        {showFairway && (
          <g id="fairway-corridors" opacity="0.35">
            <path
              d="M 280 220 L 360 420 L 430 650 L 460 780"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="24"
              strokeDasharray="6 8"
              opacity="0.15"
            />
            <path
              d="M 280 220 L 360 420 L 430 650 L 460 780"
              fill="none"
              stroke="#0284c7"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Lateral Sea Buoys */}
            <circle cx="360" cy="420" r="3" fill="#10b981" />
            <circle cx="380" cy="426" r="3" fill="#ef4444" />
          </g>
        )}

        {/* Route Popularity Heatmap Corridors Layer */}
        {showRouteHeatmap && (
          <g id="corridor-heatmap-layer">
            {routes.map((route) => {
              const pop = routePopularity[route.id];
              if (!pop) return null;
              const svgPoints = route.waypoints.map((wp) => coordsToSvg(wp.lat, wp.lng));
              const pathD = svgPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
              const midIdx = Math.floor(svgPoints.length / 2);
              const midPt = svgPoints[midIdx] || svgPoints[0];

              return (
                <g key={`heatmap-${route.id}`}>
                  {/* Broad thermal glow buffer */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={pop.heatColor}
                    strokeWidth={pop.heatWidth * 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.35"
                    filter="url(#heatmap-blur)"
                  />
                  {/* Dense corridor heat core */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={pop.heatColor}
                    strokeWidth={pop.heatWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.7"
                  />
                  {/* Animated surge pulse along high-traffic corridor */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={Math.max(2.5, pop.heatWidth * 0.28)}
                    strokeDasharray="14 32"
                    strokeLinecap="round"
                    opacity="0.75"
                  >
                    <animate attributeName="stroke-dashoffset" values="46;0" dur="2.2s" repeatCount="indefinite" />
                  </path>
                  {/* Midpoint Corridor Traffic Volume Badge */}
                  <g transform={`translate(${midPt.x}, ${midPt.y - 14})`}>
                    <rect
                      x="-65"
                      y="-11"
                      width="130"
                      height="20"
                      rx="6"
                      fill="#030712"
                      fillOpacity="0.88"
                      stroke={pop.heatColor}
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      🔥 {pop.totalPax} PAX ({pop.densityCategory.toUpperCase()})
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* Real-time Weather Marine Overlay in SVG */}
        {showWeatherOverlay && (
          <g id="weather-marine-overlay-svg" opacity="0.85">
            {/* Dynamic wind streamline vectors across harbour coordinates */}
            {[
              { x: 320, y: 310 },
              { x: 460, y: 260 },
              { x: 380, y: 460 },
              { x: 530, y: 440 },
              { x: 340, y: 620 },
              { x: 450, y: 660 },
              { x: 480, y: 810 },
              { x: 260, y: 770 },
            ].map((pt, i) => (
              <g
                key={`wind-vec-${i}`}
                transform={`translate(${pt.x}, ${pt.y}) rotate(${marineWeather.windDirectionDeg})`}
                opacity="0.8"
              >
                <line
                  x1="-24"
                  y1="0"
                  x2="24"
                  y2="0"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                >
                  <animate attributeName="stroke-dashoffset" values="28;0" dur="1.4s" repeatCount="indefinite" />
                </line>
                <polygon points="26,0 18,-4 18,4" fill="#38bdf8" />
              </g>
            ))}

            {/* Sea swell wave height contours */}
            <g opacity="0.5">
              <path
                d="M 230 670 Q 340 650 440 690 T 560 730"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="10 12"
              />
              <path
                d="M 250 710 Q 360 690 460 730 T 580 770"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="8 10"
              />
              <text x="290" y="730" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                ~{marineWeather.waveHeightM}m SWELL (PERIOD: {marineWeather.swellPeriodSec}s)
              </text>
            </g>

            {/* Storm Alert Warning Indicator if active */}
            {marineWeather.stormAlert.active && (
              <g transform="translate(360, 520)">
                <circle cx="0" cy="0" r="46" fill="#f43f5e" fillOpacity="0.15" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4">
                  <animate attributeName="r" values="36;56;36" dur="3s" repeatCount="indefinite" />
                </circle>
                <text x="0" y="4" textAnchor="middle" fill="#fda4af" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  ⚠ SQUALL GUST WARNING
                </text>
              </g>
            )}
          </g>
        )}

        {/* Route Lines */}
        {routes.map((route) => {
          const isHighlighted = highlightRouteId === route.id;
          const svgPoints = route.waypoints.map((wp) => coordsToSvg(wp.lat, wp.lng));
          const pathD = svgPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

          return (
            <g key={route.id} id={`route-${route.id}`}>
              <path
                d={pathD}
                fill="none"
                stroke={isHighlighted ? '#06b6d4' : '#0284c7'}
                strokeWidth={isHighlighted ? '3.5' : '2'}
                strokeDasharray={isHighlighted ? 'none' : '5 5'}
                opacity={isHighlighted ? 0.9 : 0.45}
              />
              {/* Waypoint markers */}
              {route.waypoints.map((wp, idx) => {
                const pt = coordsToSvg(wp.lat, wp.lng);
                return (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHighlighted ? 3 : 2}
                    fill={isHighlighted ? '#22d3ee' : '#38bdf8'}
                    opacity="0.6"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Port Geofence Rings & Terminals */}
        {ports.map((port) => {
          const pt = coordsToSvg(port.coordinates.lat, port.coordinates.lng);
          return (
            <g key={port.id} id={`port-${port.id}`} className="cursor-pointer">
              {/* Geofence 1.5km ring */}
              {showGeofences && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="52"
                  fill="#0284c7"
                  fillOpacity="0.04"
                  stroke="#0ea5e9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
              {/* Terminal Berth Symbol */}
              <circle cx={pt.x} cy={pt.y} r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <circle cx={pt.x} cy={pt.y} r="3" fill="#38bdf8" />

              {/* Port Code & Label */}
              <text
                x={pt.x}
                y={pt.y - 14}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize="11"
                fontWeight="bold"
                className="pointer-events-none drop-shadow-md"
              >
                {port.name}
              </text>
              <text
                x={pt.x}
                y={pt.y + 20}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
                className="pointer-events-none"
              >
                [{port.code}] • {port.activeFerriesCount} Ferries
              </text>
            </g>
          );
        })}

        {/* Vessel Breadcrumb Trails */}
        {showTrails &&
          ferries.map((ferry) => {
            if (!ferry.trail || ferry.trail.length < 2) return null;
            const pts = ferry.trail.map((t) => coordsToSvg(t.lat, t.lng));
            const pathStr = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
            return (
              <path
                key={`trail-${ferry.id}`}
                d={pathStr}
                fill="none"
                stroke={getStatusColor(ferry.status)}
                strokeWidth="1.5"
                strokeDasharray="2 3"
                opacity="0.4"
              />
            );
          })}

        {/* Smooth Animated Moving Ferries */}
        {ferries.map((ferry) => {
          const pt = coordsToSvg(ferry.position.lat, ferry.position.lng);
          const isSelected = activeFerry?.id === ferry.id;
          const color = getStatusColor(ferry.status);

          // Calculate heading velocity vector projection relative to vessel origin (0, 0)
          const rad = (ferry.heading * Math.PI) / 180;
          const vectorLength = Math.max(10, ferry.speedKnots * 0.95);
          const headRelX = Math.sin(rad) * vectorLength;
          const headRelY = -Math.cos(rad) * vectorLength;

          return (
            <g
              key={ferry.id}
              id={`ferry-marker-${ferry.vesselId}`}
              className="cursor-pointer group"
              transform={`translate(${pt.x}, ${pt.y})`}
              style={{
                transition: 'transform 1200ms cubic-bezier(0.25, 1, 0.5, 1)',
                willChange: 'transform',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleFerryClick(ferry);
              }}
            >
              {/* Emergency pulsing beacon ring */}
              {ferry.status === 'emergency' && (
                <circle cx="0" cy="0" r="24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <animate attributeName="r" values="10;36" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Hydrodynamic Stern Wake Ripple when Underway */}
              {ferry.speedKnots > 0 && (
                <g
                  transform={`rotate(${ferry.heading})`}
                  style={{ transition: 'transform 1200ms ease-out' }}
                >
                  <ellipse cx="0" cy="7" rx="4" ry="2" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.7">
                    <animate attributeName="ry" values="1;5;9" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="rx" values="2;7;13" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.3;0" dur="1.4s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="0" cy="11" rx="6" ry="3" fill="none" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5">
                    <animate attributeName="ry" values="2;7;13" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="rx" values="3;9;16" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.2;0" dur="1.8s" repeatCount="indefinite" />
                  </ellipse>
                </g>
              )}

              {/* Selected Target Reticle */}
              {isSelected && (
                <g>
                  <circle cx="0" cy="0" r="19" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 3">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 0 0"
                      to="360 0 0"
                      dur="10s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <line x1="-24" y1="0" x2="-14" y2="0" stroke="#22d3ee" strokeWidth="1.5" />
                  <line x1="14" y1="0" x2="24" y2="0" stroke="#22d3ee" strokeWidth="1.5" />
                  <line x1="0" y1="-24" x2="0" y2="-14" stroke="#22d3ee" strokeWidth="1.5" />
                  <line x1="0" y1="14" x2="0" y2="24" stroke="#22d3ee" strokeWidth="1.5" />
                </g>
              )}

              {/* Speed Vector Projection Line */}
              {ferry.speedKnots > 0 && (
                <line
                  x1="0"
                  y1="0"
                  x2={headRelX}
                  y2={headRelY}
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              )}

              {/* Directional Vessel Chevron Hull with smooth rotational steering */}
              <g
                transform={`rotate(${ferry.heading})`}
                style={{ transition: 'transform 1200ms ease-out' }}
              >
                <polygon
                  points="0,-10 7,8 0,4 -7,8"
                  fill={color}
                  stroke="#021124"
                  strokeWidth="1.5"
                  filter={isSelected ? 'url(#radar-glow)' : undefined}
                />
              </g>

              {/* Vessel Callout Tag Badge */}
              <g transform="translate(10, -10)">
                <rect
                  x="-2"
                  y="-11"
                  width={ferry.vesselId.length * 6.5 + 24}
                  height="16"
                  rx="3"
                  fill="#030b17"
                  fillOpacity="0.88"
                  stroke={isSelected ? '#22d3ee' : '#1e293b'}
                  strokeWidth="1"
                />
                <circle cx="5" cy="-3" r="2.5" fill={color} />
                <text x="12" y="0" fill="#f8fafc" fontSize="9" fontWeight="600" fontFamily="monospace">
                  {ferry.vesselId}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Real-Time Weather Overlay HUD */}
      {showWeatherOverlay && (
        <div className="absolute top-14 left-14 max-w-sm bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-2xl p-4 shadow-2xl z-20 space-y-3 animate-in fade-in slide-in-from-top-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
                <Wind className="w-4 h-4 animate-spin [animation-duration:8s]" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">Arabian Sea Harbor MET</div>
                <div className="text-[10px] text-sky-400 flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{marineWeather.source}</span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchRealTimeWeather}
              disabled={isWeatherLoading}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh live weather API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>

          {/* Meteorological Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-400" />
                <span>WIND SPEED & DIR</span>
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {marineWeather.windSpeedKnots} kts <span className="text-xs text-slate-400">({marineWeather.windCompass})</span>
              </div>
              <div className="text-[10px] text-slate-400">Heading: {marineWeather.windDirectionDeg}°</div>
            </div>

            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Waves className="w-3 h-3 text-sky-400" />
                <span>SWELL / WAVE HEIGHT</span>
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {marineWeather.waveHeightM} m
              </div>
              <div className="text-[10px] text-slate-400">Period: {marineWeather.swellPeriodSec}s swell</div>
            </div>

            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>TEMP / VISIBILITY</span>
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {marineWeather.temperatureC}°C
              </div>
              <div className="text-[10px] text-slate-400">Vis: {marineWeather.visibilityKm} km</div>
            </div>

            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>SEA CONDITION</span>
              </div>
              <div className="text-xs font-bold text-emerald-300 truncate mt-0.5">
                {marineWeather.seaCondition}
              </div>
              <div className="text-[10px] text-slate-400">Harbor Waters</div>
            </div>
          </div>

          {/* Storm Alert / Navigation Directive */}
          <div
            className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
              marineWeather.stormAlert.active
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : 'bg-cyan-950/30 border-cyan-800/60 text-cyan-200'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                marineWeather.stormAlert.active ? 'text-rose-400 animate-bounce' : 'text-cyan-400'
              }`}
            />
            <div>
              <div className="font-bold text-[11px]">{marineWeather.stormAlert.title}</div>
              <div className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                {marineWeather.stormAlert.advisory}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Popularity Heatmap Legend HUD */}
      {showRouteHeatmap && (
        <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md border border-rose-500/40 rounded-xl p-3 shadow-2xl z-20 text-xs max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs mb-2">
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Corridor Popularity Heatmap</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 inline-block" />
                <span className="text-slate-200">High Volume Surge</span>
              </span>
              <span className="font-mono text-rose-300 font-semibold">&gt; 300 Pax</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50 inline-block" />
                <span className="text-slate-200">High Traffic Corridor</span>
              </span>
              <span className="font-mono text-orange-300 font-semibold">150 - 300 Pax</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50 inline-block" />
                <span className="text-slate-200">Moderate Traffic</span>
              </span>
              <span className="font-mono text-yellow-300 font-semibold">50 - 150 Pax</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50 inline-block" />
                <span className="text-slate-200">Low / Commute</span>
              </span>
              <span className="font-mono text-cyan-300 font-semibold">&lt; 50 Pax</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
            Real-time thermal corridors visualized from current passenger bookings & AIS transponders.
          </div>
        </div>
      )}

      {/* Top Right Live Radar Telemetry Stamp */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur border border-cyan-800/40 rounded-lg px-3 py-1.5 text-[11px] font-mono text-cyan-400 pointer-events-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span>AIS RADAR ACTIVE</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">{ferries.filter((f) => f.speedKnots > 0).length} UNDERWAY</span>
      </div>

      {/* Map Control Toolbar */}
      {showControls && (
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-1 shadow-lg flex flex-col gap-1">
            <button
              id="map-zoom-in"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="map-zoom-out"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="map-zoom-reset"
              onClick={handleReset}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
              title="Reset View"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              id="map-fullscreen"
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Layer toggles */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-1 shadow-lg flex flex-col gap-1">
            <button
              onClick={() => setShowGeofences(!showGeofences)}
              className={`p-1.5 rounded text-xs transition-colors flex items-center justify-center ${
                showGeofences ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Toggle Geofence Zones"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFairway(!showFairway)}
              className={`p-1.5 rounded text-xs transition-colors flex items-center justify-center ${
                showFairway ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Toggle Shipping Fairways"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTrails(!showTrails)}
              className={`p-1.5 rounded text-xs transition-colors flex items-center justify-center ${
                showTrails ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Toggle AIS Vessel Trails"
            >
              <Radio className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowRouteHeatmap(!showRouteHeatmap)}
              className={`p-1.5 rounded text-xs transition-colors flex items-center justify-center ${
                showRouteHeatmap
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60 shadow-lg shadow-rose-950/40'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Toggle Route Popularity Heatmap (Booking Volume)"
            >
              <Flame className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
              className={`p-1.5 rounded text-xs transition-colors flex items-center justify-center ${
                showWeatherOverlay
                  ? 'bg-sky-950 text-sky-300 border border-sky-800/60 shadow-lg shadow-sky-950/40'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Toggle Real-Time Weather Overlay (Wind, Waves, Storms)"
            >
              <Wind className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Ferry Floating HUD Sheet (Bottom Left or Right) */}
      {activeFerry && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-4 shadow-2xl z-20 transition-all animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getStatusColor(activeFerry.status) }}
                />
                <h4 className="font-bold text-white text-base tracking-wide">
                  {activeFerry.name}
                </h4>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  {activeFerry.vesselId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeFerry.type} • {activeFerry.captainName}
              </p>
            </div>
            <button
              onClick={() => setSelectedFerryId(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 my-3 text-xs">
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-cyan-400" /> Speed
              </div>
              <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                {activeFerry.speedKnots} <span className="text-[10px] text-slate-400 font-normal">kts</span>
              </div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-cyan-400" /> Heading
              </div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {activeFerry.heading}°
              </div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Onboard
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                {activeFerry.currentPassengers} / {activeFerry.capacity}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Position:</span>
              <span className="font-mono text-slate-200">
                {activeFerry.position.lat.toFixed(4)}°N, {activeFerry.position.lng.toFixed(4)}°E
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="uppercase font-semibold tracking-wider text-[11px]" style={{ color: getStatusColor(activeFerry.status) }}>
                {activeFerry.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">AIS Transponder:</span>
              <span className="font-mono text-slate-400 text-[11px]">{activeFerry.aisIdentifier}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => {
                setActiveView('live-tracking');
                setSelectedFerryId(activeFerry.id);
              }}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/30"
            >
              <Eye className="w-3.5 h-3.5" /> Full Telemetry
            </button>
            <button
              onClick={() => {
                setActiveView('book');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-lg text-xs transition-colors"
            >
              Book Voyage
            </button>
          </div>
        </div>
      )}

      {/* Map Legend (Bottom Right) */}
      <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-3 bg-slate-950/80 backdrop-blur border border-slate-800/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>On Time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Delayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>Boarding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Approaching</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>Emergency</span>
        </div>
      </div>
    </div>
  );
};
