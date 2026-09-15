import React, { useState, useEffect, useCallback } from 'react';
import { useFerry } from '../../context/FerryContext';
import { VesselWeatherSafetyThreshold, Ferry } from '../../types';
import {
  CloudRain,
  Wind,
  Waves,
  AlertTriangle,
  ShieldAlert,
  Bell,
  BellRing,
  Radio,
  Sliders,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  Eye,
  Volume2,
  Sparkles,
  Info,
} from 'lucide-react';

interface WeatherSnapshot {
  windSpeedKnots: number;
  windGustKnots: number;
  windDirection: string;
  waveHeightM: number;
  swellPeriodSec: number;
  seaStateCode: number; // 1 = Calm to 6 = Very Rough
  conditionText: string;
  timestamp: string;
}

export interface WeatherPushAlert {
  id: string;
  timestamp: string;
  vesselClass: string;
  affectedVesselNames: string[];
  breachReason: string;
  severity: 'warning' | 'critical';
  recommendedDirective: string;
  acknowledged: boolean;
}

const DEFAULT_VESSEL_THRESHOLDS: VesselWeatherSafetyThreshold[] = [
  {
    vesselClass: 'Class A (Speed Catamaran)',
    maxWindKnots: 26,
    maxWaveHeightM: 1.6,
    maxSwellPeriodSec: 9.0,
    advisorySpeedCapKnots: 14,
  },
  {
    vesselClass: 'Class B (Standard Monohull)',
    maxWindKnots: 22,
    maxWaveHeightM: 1.3,
    maxSwellPeriodSec: 8.0,
    advisorySpeedCapKnots: 10,
  },
  {
    vesselClass: 'Class C (Heritage Launch)',
    maxWindKnots: 16,
    maxWaveHeightM: 0.9,
    maxSwellPeriodSec: 6.5,
    advisorySpeedCapKnots: 7,
  },
  {
    vesselClass: 'Class D (Vehicle Ro-Pax)',
    maxWindKnots: 32,
    maxWaveHeightM: 2.2,
    maxSwellPeriodSec: 11.0,
    advisorySpeedCapKnots: 12,
  },
];

export const WeatherThresholdMonitor: React.FC = () => {
  const {
    ferries,
    publishAlert,
    addAuditLog,
    playDistressAlarm,
    playRoutineChime,
    accessibilitySettings,
    theme,
  } = useFerry();

  const isDark = theme === 'dark';

  // Live Simulated/Monitored Weather State
  const [currentWeather, setCurrentWeather] = useState<WeatherSnapshot>({
    windSpeedKnots: 19.5,
    windGustKnots: 25.0,
    windDirection: 'WSW (245°)',
    waveHeightM: 1.15,
    swellPeriodSec: 7.2,
    seaStateCode: 3,
    conditionText: 'Moderate Coastal Chop with Gusting Offshore Breezes',
    timestamp: 'Live Active Telemetry',
  });

  const [thresholds, setThresholds] = useState<VesselWeatherSafetyThreshold[]>(
    DEFAULT_VESSEL_THRESHOLDS
  );
  const [activeAlerts, setActiveAlerts] = useState<WeatherPushAlert[]>([]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [lastEvaluatedTime, setLastEvaluatedTime] = useState<string>('');

  // Map ferries to vessel classes
  const getVesselsForClass = useCallback(
    (vClass: string): string[] => {
      if (vClass.includes('Class A')) {
        return ferries.filter((f) => f.type === 'Catamaran' || f.type === 'High-Speed Water Taxi').map((f) => f.name);
      }
      if (vClass.includes('Class B')) {
        return ferries.filter((f) => f.type === 'Passenger Cruiser').map((f) => f.name);
      }
      if (vClass.includes('Class C')) {
        return ['M.V. Elephanta Queen', 'Royal Elephanta Launch #2'];
      }
      if (vClass.includes('Class D')) {
        return ferries.filter((f) => f.type === 'Ro-Pax Ferry').map((f) => f.name);
      }
      return [];
    },
    [ferries]
  );

  // Core Evaluation Algorithm
  const evaluateWeatherThresholds = useCallback(
    (weather: WeatherSnapshot) => {
      const generatedAlerts: WeatherPushAlert[] = [];

      thresholds.forEach((t) => {
        const windExceeded = weather.windSpeedKnots > t.maxWindKnots;
        const waveExceeded = weather.waveHeightM > t.maxWaveHeightM;
        const swellExceeded = weather.swellPeriodSec > t.maxSwellPeriodSec;

        if (windExceeded || waveExceeded || swellExceeded) {
          const reasons: string[] = [];
          if (windExceeded) {
            reasons.push(`Wind ${weather.windSpeedKnots} kts > ${t.maxWindKnots} kts threshold`);
          }
          if (waveExceeded) {
            reasons.push(`Wave height ${weather.waveHeightM}m > ${t.maxWaveHeightM}m limit`);
          }
          if (swellExceeded) {
            reasons.push(`Swell period ${weather.swellPeriodSec}s exceeds wave resonance safety limit`);
          }

          const isCritical =
            weather.windSpeedKnots > t.maxWindKnots * 1.25 ||
            weather.waveHeightM > t.maxWaveHeightM * 1.25;

          const affectedShips = getVesselsForClass(t.vesselClass);

          generatedAlerts.push({
            id: `alert-weather-${t.vesselClass.slice(0, 7)}-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            vesselClass: t.vesselClass,
            affectedVesselNames: affectedShips,
            breachReason: reasons.join(' • '),
            severity: isCritical ? 'critical' : 'warning',
            recommendedDirective:
              t.vesselClass.includes('Class C')
                ? 'Impose immediate departure suspension at Apollo Bunder for wooden heritage craft.'
                : `Restrict maximum cruising speed to ${t.advisorySpeedCapKnots} kts and avoid shallow sandbars.`,
            acknowledged: false,
          });
        }
      });

      setActiveAlerts((prev) => {
        // Only trigger audio if new unacknowledged alerts arrive
        if (generatedAlerts.length > 0 && generatedAlerts.length !== prev.length) {
          const hasCritical = generatedAlerts.some((a) => a.severity === 'critical');
          if (hasCritical) {
            playDistressAlarm();
          } else {
            playRoutineChime();
          }
        }
        return generatedAlerts;
      });

      setLastEvaluatedTime(new Date().toLocaleTimeString());
    },
    [thresholds, getVesselsForClass, playDistressAlarm, playRoutineChime]
  );

  // Initial and reactive evaluation
  useEffect(() => {
    evaluateWeatherThresholds(currentWeather);
  }, [currentWeather, evaluateWeatherThresholds]);

  // Operational Directive Dispatch
  const handleTransmitDirective = (alert: WeatherPushAlert) => {
    publishAlert({
      title: `WEATHER SAFETY DIRECTIVE: ${alert.vesselClass}`,
      message: `${alert.breachReason}. Directive: ${alert.recommendedDirective}`,
      severity: alert.severity === 'critical' ? 'critical' : 'high',
      category: 'Weather Warning',
      validUntil: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      channels: ['Web', 'SMS'],
    });

    addAuditLog(
      'Weather Safety Directive Transmitted',
      'Operator',
      `Transmitted ${alert.vesselClass} weather restriction. Directive: ${alert.recommendedDirective}. Breach: ${alert.breachReason}.`
    );

    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleDismissAlert = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Weather Preset Scenarios
  const applyPreset = (preset: 'fair' | 'chop' | 'squall' | 'gale') => {
    if (preset === 'fair') {
      setCurrentWeather({
        windSpeedKnots: 11.0,
        windGustKnots: 15.0,
        windDirection: 'NW (315°)',
        waveHeightM: 0.55,
        swellPeriodSec: 5.2,
        seaStateCode: 2,
        conditionText: 'Smooth Waters, Light Sea Breeze',
        timestamp: 'Live Active Telemetry',
      });
    } else if (preset === 'chop') {
      setCurrentWeather({
        windSpeedKnots: 18.5,
        windGustKnots: 24.0,
        windDirection: 'W (270°)',
        waveHeightM: 1.1,
        swellPeriodSec: 7.0,
        seaStateCode: 3,
        conditionText: 'Moderate Coastal Chop (Class C Heritage Limit Breached)',
        timestamp: 'Live Active Telemetry',
      });
    } else if (preset === 'squall') {
      setCurrentWeather({
        windSpeedKnots: 27.5,
        windGustKnots: 34.0,
        windDirection: 'SW (225°)',
        waveHeightM: 1.85,
        swellPeriodSec: 9.4,
        seaStateCode: 4,
        conditionText: 'Monsoon Squall Line (Class A, B & C Thresholds Exceeded)',
        timestamp: 'Live Active Telemetry',
      });
    } else if (preset === 'gale') {
      setCurrentWeather({
        windSpeedKnots: 36.0,
        windGustKnots: 46.0,
        windDirection: 'SSW (205°)',
        waveHeightM: 2.6,
        swellPeriodSec: 12.0,
        seaStateCode: 5,
        conditionText: 'Severe Tropical Gale Warning (All Fleet Vessels Exceeded)',
        timestamp: 'Live Active Telemetry',
      });
    }
  };

  return (
    <div
      id="weather-threshold-monitor-service"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Vessel Class Weather Safety & Threshold Monitor
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                ACTIVE RADAR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated push alerts triggered when sea state or wind exceeds naval architect design thresholds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isSimulatorOpen
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Weather Spikes</span>
          </button>
        </div>
      </div>

      {/* Real-time Weather Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] block">SUSTAINED WIND</span>
          <span className="font-mono font-bold text-cyan-300 text-base mt-0.5 block">
            {currentWeather.windSpeedKnots} kts
          </span>
          <span className="text-slate-400 text-[10px]">Gusts to {currentWeather.windGustKnots} kts</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] block">WIND BEARING</span>
          <span className="font-bold text-white text-sm mt-0.5 block truncate">
            {currentWeather.windDirection}
          </span>
          <span className="text-slate-400 text-[10px]">Southwest Corridor</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] block">SIGNIFICANT WAVE SWELL</span>
          <span
            className={`font-mono font-bold text-base mt-0.5 block ${
              currentWeather.waveHeightM >= 1.5 ? 'text-amber-400' : 'text-white'
            }`}
          >
            {currentWeather.waveHeightM} m
          </span>
          <span className="text-slate-400 text-[10px]">Period: {currentWeather.swellPeriodSec}s</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] block">SEA STATE RATING</span>
          <span className="font-bold text-amber-300 text-sm mt-0.5 block">
            Code {currentWeather.seaStateCode} (Douglas)
          </span>
          <span className="text-slate-400 text-[10px] truncate">{currentWeather.conditionText}</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] block">THRESHOLD MONITOR STATUS</span>
          <span
            className={`font-bold text-sm mt-0.5 block ${
              activeAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {activeAlerts.length > 0 ? `${activeAlerts.length} Classes In Breach` : 'All Classes Safe'}
          </span>
          <span className="text-slate-500 text-[10px]">Eval: {lastEvaluatedTime || 'Continuous'}</span>
        </div>
      </div>

      {/* Simulator Controls Drawer */}
      {isSimulatorOpen && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800/60 space-y-3 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Live Sea State & Wind Injection Simulator:
            </span>
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => applyPreset('fair')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                Fair (11 kts)
              </button>
              <button
                onClick={() => applyPreset('chop')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300"
              >
                Chop (18.5 kts)
              </button>
              <button
                onClick={() => applyPreset('squall')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300"
              >
                Squall (27.5 kts)
              </button>
              <button
                onClick={() => applyPreset('gale')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-red-400 font-bold"
              >
                Gale (36 kts)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Wind Velocity: {currentWeather.windSpeedKnots} Knots</span>
                <span className="font-mono text-cyan-400">Scale: 5 - 45 kts</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="0.5"
                value={currentWeather.windSpeedKnots}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentWeather((prev) => ({
                    ...prev,
                    windSpeedKnots: val,
                    windGustKnots: Math.round(val * 1.3),
                    conditionText: val > 30 ? 'Severe Gale Force' : val > 22 ? 'Squally & Choppy' : 'Moderate',
                  }));
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Significant Wave Swell: {currentWeather.waveHeightM} Meters</span>
                <span className="font-mono text-cyan-400">Scale: 0.3 - 3.2 m</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="3.2"
                step="0.05"
                value={currentWeather.waveHeightM}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentWeather((prev) => ({
                    ...prev,
                    waveHeightM: val,
                    seaStateCode: val > 2.0 ? 5 : val > 1.25 ? 4 : val > 0.8 ? 3 : 2,
                  }));
                }}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Push Notifications Stream */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>Active Push Notifications: Safety Thresholds Exceeded</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Immediate operational directive transmission required
            </span>
          </div>

          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40'
                    : 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-extrabold text-sm sm:text-base ${
                            alert.severity === 'critical' ? 'text-red-300' : 'text-amber-300'
                          }`}
                        >
                          SAFETY LIMIT EXCEEDED: {alert.vesselClass}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {alert.timestamp}
                        </span>
                        {alert.acknowledged && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Directive Dispatched
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-200 mt-1 font-mono">{alert.breachReason}</p>

                      {alert.affectedVesselNames.length > 0 && (
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-300">Vessels in Service:</span>
                          <span>{alert.affectedVesselNames.join(', ')}</span>
                        </div>
                      )}

                      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                        <strong className="text-cyan-300">Standard Operational Directive: </strong>
                        <span>{alert.recommendedDirective}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleTransmitDirective(alert)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          alert.severity === 'critical'
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Transmit Directive to Vessels</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                      title="Dismiss Push Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>All 4 Vessel Classes are operating within certified design wind & sea state safety envelopes.</span>
          </div>
          <span className="font-mono text-emerald-400/80 text-[11px]">No Weather Push Alerts Active</span>
        </div>
      )}

      {/* Pre-defined Safety Threshold Reference Grid */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Pre-Defined Vessel Class Safety Thresholds
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {thresholds.map((t) => {
            const isBreached =
              currentWeather.windSpeedKnots > t.maxWindKnots ||
              currentWeather.waveHeightM > t.maxWaveHeightM;

            return (
              <div
                key={t.vesselClass}
                className={`p-3 rounded-xl border transition-all ${
                  isBreached
                    ? 'bg-red-950/30 border-red-800/60'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs truncate">{t.vesselClass}</span>
                  {isBreached && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                      EXCEEDED
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Max Wind:</span>
                    <span className={currentWeather.windSpeedKnots > t.maxWindKnots ? 'text-red-400 font-bold' : 'text-slate-200'}>
                      {t.maxWindKnots} kts
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Max Wave Swell:</span>
                    <span className={currentWeather.waveHeightM > t.maxWaveHeightM ? 'text-red-400 font-bold' : 'text-slate-200'}>
                      {t.maxWaveHeightM} m
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Speed Cap:</span>
                    <span className="text-cyan-300">{t.advisorySpeedCapKnots} kts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
