import React, { useState, useEffect } from 'react';
import { Route } from '../../types';
import {
  Wind,
  Waves,
  Compass,
  Thermometer,
  Eye,
  Gauge,
  CloudSun,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Droplets,
  Navigation,
  ArrowUpRight,
  Clock,
  Radio,
} from 'lucide-react';

interface RouteMarineWeather {
  routeId: string;
  routeName: string;
  corridor: string;
  windSpeedKnots: number;
  windGustKnots: number;
  windDirection: string;
  windDegrees: number;
  beaufortScale: string;
  tideCurrentLevelM: number;
  tideTrend: 'Flooding (Rising)' | 'Ebbing (Falling)' | 'High Tide Peak' | 'Low Tide Slack';
  nextTideTime: string;
  nextTideType: 'High' | 'Low';
  nextTideHeightM: number;
  seaState: 'Sea State 2: Smooth / Slight Wavelets' | 'Sea State 3: Moderate Chop' | 'Sea State 4: Rough Swell';
  waveHeightM: number;
  wavePeriodSec: number;
  currentVelocityKnots: number;
  waterTempC: number;
  airTempC: number;
  visibilityKm: number;
  pressureHpa: number;
  advisory: string;
  advisoryLevel: 'safe' | 'caution' | 'ideal';
}

const INITIAL_WEATHER_DATA: RouteMarineWeather[] = [
  {
    routeId: 'route-1',
    routeName: 'Gateway of India ⇄ Mandwa (Alibaug)',
    corridor: 'South Mumbai Harbor to Alibaug Continental Fairway',
    windSpeedKnots: 13.8,
    windGustKnots: 17.5,
    windDirection: 'WSW',
    windDegrees: 245,
    beaufortScale: 'Force 4 — Moderate Breeze',
    tideCurrentLevelM: 2.45,
    tideTrend: 'High Tide Peak',
    nextTideTime: '18:40',
    nextTideType: 'Low',
    nextTideHeightM: 0.62,
    seaState: 'Sea State 3: Moderate Chop',
    waveHeightM: 0.85,
    wavePeriodSec: 4.6,
    currentVelocityKnots: 1.4,
    waterTempC: 27.8,
    airTempC: 30.5,
    visibilityKm: 9.5,
    pressureHpa: 1011.8,
    advisory: 'Standard navigation fairway clearance. Ro-Pax vehicles and catamarans cleared for full cruise speed.',
    advisoryLevel: 'safe',
  },
  {
    routeId: 'route-2',
    routeName: 'Bhaucha Dhakka ⇄ Mora Pier (Uran)',
    corridor: 'Thane Creek Marine Cross-Harbor Route',
    windSpeedKnots: 11.2,
    windGustKnots: 14.0,
    windDirection: 'W',
    windDegrees: 270,
    beaufortScale: 'Force 3 — Gentle Breeze',
    tideCurrentLevelM: 2.6,
    tideTrend: 'Flooding (Rising)',
    nextTideTime: '15:15',
    nextTideType: 'High',
    nextTideHeightM: 2.75,
    seaState: 'Sea State 2: Smooth / Slight Wavelets',
    waveHeightM: 0.55,
    wavePeriodSec: 3.8,
    currentVelocityKnots: 0.9,
    waterTempC: 28.1,
    airTempC: 31.0,
    visibilityKm: 8.5,
    pressureHpa: 1012.2,
    advisory: 'Sheltered harbor waters. Excellent sailing conditions for commuter launches and cargo barges.',
    advisoryLevel: 'ideal',
  },
  {
    routeId: 'route-3',
    routeName: 'Gateway ⇄ Elephanta Caves',
    corridor: 'Central Island Channel & Naval Anchorages',
    windSpeedKnots: 12.5,
    windGustKnots: 16.0,
    windDirection: 'SW',
    windDegrees: 225,
    beaufortScale: 'Force 4 — Moderate Breeze',
    tideCurrentLevelM: 2.38,
    tideTrend: 'High Tide Peak',
    nextTideTime: '19:10',
    nextTideType: 'Low',
    nextTideHeightM: 0.7,
    seaState: 'Sea State 2: Smooth / Slight Wavelets',
    waveHeightM: 0.65,
    wavePeriodSec: 4.2,
    currentVelocityKnots: 1.1,
    waterTempC: 27.6,
    airTempC: 30.2,
    visibilityKm: 10.0,
    pressureHpa: 1011.5,
    advisory: 'Tourist ferry corridor clear. Low swell around Elephanta Jetty pontoon.',
    advisoryLevel: 'ideal',
  },
  {
    routeId: 'route-4',
    routeName: 'Belapur ⇄ Mandwa Fast Taxi',
    corridor: 'Navi Mumbai Estuary to Alibaug Coastal Strip',
    windSpeedKnots: 15.2,
    windGustKnots: 19.8,
    windDirection: 'WNW',
    windDegrees: 290,
    beaufortScale: 'Force 4 — Moderate Breeze',
    tideCurrentLevelM: 2.15,
    tideTrend: 'Ebbing (Falling)',
    nextTideTime: '18:15',
    nextTideType: 'Low',
    nextTideHeightM: 0.5,
    seaState: 'Sea State 3: Moderate Chop',
    waveHeightM: 1.05,
    wavePeriodSec: 5.1,
    currentVelocityKnots: 1.8,
    waterTempC: 27.4,
    airTempC: 29.8,
    visibilityKm: 8.0,
    pressureHpa: 1010.9,
    advisory: 'Tidal rip observed at Karanja Shoal. Speedboats advised to maintain 18 knots cruise through creek mouth.',
    advisoryLevel: 'caution',
  },
];

interface MarineWeatherWidgetProps {
  onSelectRoute?: (routeId: string) => void;
}

export const MarineWeatherWidget: React.FC<MarineWeatherWidgetProps> = ({ onSelectRoute }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-1');
  const [weatherData, setWeatherData] = useState<RouteMarineWeather[]>(INITIAL_WEATHER_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  // Subtle natural fluctuation simulation for real-time marine instruments
  useEffect(() => {
    const timer = setInterval(() => {
      setWeatherData((prev) =>
        prev.map((item) => {
          const windDrift = Number((Math.random() * 0.4 - 0.2).toFixed(1));
          const waveDrift = Number((Math.random() * 0.04 - 0.02).toFixed(2));
          return {
            ...item,
            windSpeedKnots: Math.max(7, Math.min(24, Number((item.windSpeedKnots + windDrift).toFixed(1)))),
            waveHeightM: Math.max(0.3, Math.min(2.2, Number((item.waveHeightM + waveDrift).toFixed(2)))),
          };
        })
      );
      setLastUpdated('Updated 5s ago');
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setWeatherData((prev) =>
        prev.map((item) => ({
          ...item,
          windSpeedKnots: Number((item.windSpeedKnots + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        }))
      );
      setIsRefreshing(false);
      setLastUpdated('Just now');
    }, 600);
  };

  const currentRouteWeather =
    weatherData.find((w) => w.routeId === selectedRouteId) || weatherData[0];

  return (
    <div id="marine-weather-widget" className="w-full bg-slate-900/90 border border-cyan-800/40 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
      {/* Widget Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-950/90 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-inner">
            <Waves className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Live Marine Weather & Sea State Radar
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                PORTS METEOROLOGY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Current hydrographic sensors, wind velocity, tidal heights, and navigation clearance for major ferry channels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">{lastUpdated}</span>
          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh Marine Telemetry"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Major Routes Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {weatherData.map((rw) => {
          const isSelected = rw.routeId === selectedRouteId;
          return (
            <button
              key={rw.routeId}
              onClick={() => setSelectedRouteId(rw.routeId)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 border ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>{rw.routeName.split('(')[0]}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-slate-950/20 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {rw.windSpeedKnots} kts
              </span>
            </button>
          );
        })}
      </div>

      {/* Primary Marine Conditions Dashboard for Selected Route */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Wind Speed & Direction */}
        <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-900/60 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-cyan-400 flex items-center gap-1.5">
              <Wind className="w-4 h-4" /> Wind & Gusts
            </span>
            <span className="font-mono text-[11px] text-slate-400">Direction: {currentRouteWeather.windDirection}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              {currentRouteWeather.windSpeedKnots}
            </div>
            <div className="text-xs font-semibold text-cyan-300">knots</div>
            <div className="ml-auto text-xs text-slate-400 font-mono">
              Gusts: <span className="text-amber-300 font-bold">{currentRouteWeather.windGustKnots} kts</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <div className="text-slate-300 flex items-center gap-1.5">
              <Compass
                className="w-4 h-4 text-cyan-400 transition-transform duration-500"
                style={{ transform: `rotate(${currentRouteWeather.windDegrees}deg)` }}
              />
              <span className="font-mono">{currentRouteWeather.windDegrees}° {currentRouteWeather.windDirection}</span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">{currentRouteWeather.beaufortScale.split('—')[1]}</span>
          </div>
        </div>

        {/* 2. Tide Levels & Tidal Trend */}
        <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-900/60 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-sky-400 flex items-center gap-1.5">
              <Waves className="w-4 h-4" /> Tide Level
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              {currentRouteWeather.tideTrend}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-sky-300">
              +{currentRouteWeather.tideCurrentLevelM.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-slate-400">meters</div>
          </div>

          {/* Tide Progress Gauge Bar */}
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-sky-600 to-cyan-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (currentRouteWeather.tideCurrentLevelM / 3.0) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <span>Next {currentRouteWeather.nextTideType} Tide:</span>
            <span className="font-mono text-slate-200 font-semibold">
              {currentRouteWeather.nextTideTime} ({currentRouteWeather.nextTideHeightM}m)
            </span>
          </div>
        </div>

        {/* 3. Sea State & Wave Swell */}
        <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-900/60 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4" /> Sea State
            </span>
            <span className="font-mono text-[11px] text-emerald-400 font-semibold">WMO Scale 3</span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-300">
              {currentRouteWeather.waveHeightM}
            </div>
            <div className="text-xs font-semibold text-slate-400">meters (swell)</div>
            <div className="ml-auto text-xs text-slate-400 font-mono">
              Period: <span className="text-white font-bold">{currentRouteWeather.wavePeriodSec}s</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Surface Current:</span>
            <span className="font-mono text-slate-200 font-semibold">
              {currentRouteWeather.currentVelocityKnots} kts drift
            </span>
          </div>
        </div>

        {/* 4. Atmospheric & Navigation Visibility */}
        <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-900/60 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1.5">
              <CloudSun className="w-4 h-4" /> Atmospheric
            </span>
            <span className="font-mono text-[11px] text-slate-300">{currentRouteWeather.pressureHpa} hPa</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">WATER TEMP</span>
              <span className="font-mono text-cyan-300 font-bold text-lg flex items-center gap-1">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                {currentRouteWeather.waterTempC}°C
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">VISIBILITY</span>
              <span className="font-mono text-white font-bold text-lg flex items-center gap-1">
                <Eye className="w-4 h-4 text-amber-400" />
                {currentRouteWeather.visibilityKm} km
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Air Temp: {currentRouteWeather.airTempC}°C</span>
            <span className="text-emerald-400 font-semibold">Clear Optics</span>
          </div>
        </div>
      </div>

      {/* Marine Advisory & Safe Navigation Notice */}
      <div className="bg-slate-950/90 rounded-2xl p-4 border border-cyan-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 rounded-xl flex-shrink-0 ${
              currentRouteWeather.advisoryLevel === 'caution'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {currentRouteWeather.advisoryLevel === 'caution' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm">
                Harbor Navigation Advisory — {currentRouteWeather.routeName}
              </span>
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                  currentRouteWeather.advisoryLevel === 'caution'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {currentRouteWeather.advisoryLevel === 'caution' ? 'Caution Advised' : 'Cleared for Passage'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {currentRouteWeather.advisory}
            </p>
          </div>
        </div>

        {onSelectRoute && (
          <button
            onClick={() => onSelectRoute(currentRouteWeather.routeId)}
            className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <span>View Route Schedule</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
