import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry, EngineTelemetryRecord } from '../../types';
import {
  Wrench,
  Gauge,
  Activity,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Ship,
  TrendingUp,
  Cpu,
  Zap,
  RotateCcw,
  ShieldCheck,
  Bell,
  Thermometer,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Props {
  ferries: Ferry[];
}

const INITIAL_TELEMETRY_LOGS: EngineTelemetryRecord[] = [
  {
    id: 'eng-log-101',
    vesselId: 'ferry-104',
    vesselName: 'M.V. Mandwa Pride',
    timestamp: '2026-09-10 14:15 IST',
    engineRpm: 1980,
    operatingHours: 1945,
    coolantTempC: 94.2,
    oilPressureBar: 3.4,
    oilTempC: 98.6,
    exhaustGasTempC: 512,
    vibrationRmsMmSec: 4.85,
    fuelFlowRateLph: 168.4,
    wearScorePercent: 92.5,
    serviceRecommended: true,
    serviceReason: 'Exceeded 1,900 operational hours & high crankcase vibration (4.85 mm/s) indicates cylinder liner wear.',
    maintenanceNotified: false,
    loggedBy: 'Chief Engineer K. Deshmukh',
  },
  {
    id: 'eng-log-102',
    vesselId: 'ferry-102',
    vesselName: 'M.V. Gateway Star',
    timestamp: '2026-09-10 13:40 IST',
    engineRpm: 1820,
    operatingHours: 1820,
    coolantTempC: 89.1,
    oilPressureBar: 4.1,
    oilTempC: 86.4,
    exhaustGasTempC: 465,
    vibrationRmsMmSec: 3.9,
    fuelFlowRateLph: 142.0,
    wearScorePercent: 81.0,
    serviceRecommended: true,
    serviceReason: 'Approaching 2,000 hr major maintenance window; recommended fuel injector nozzle recalibration.',
    maintenanceNotified: true,
    maintenanceNotifiedAt: '2026-09-10 11:20 IST',
    loggedBy: '1st Asst. Engineer R. Varma',
  },
  {
    id: 'eng-log-103',
    vesselId: 'ferry-101',
    vesselName: 'M.V. Mumbai Explorer',
    timestamp: '2026-09-10 12:05 IST',
    engineRpm: 1750,
    operatingHours: 1240,
    coolantTempC: 84.5,
    oilPressureBar: 4.8,
    oilTempC: 81.2,
    exhaustGasTempC: 420,
    vibrationRmsMmSec: 2.15,
    fuelFlowRateLph: 118.5,
    wearScorePercent: 46.0,
    serviceRecommended: false,
    maintenanceNotified: false,
    loggedBy: 'Chief Engineer M. Fernandez',
  },
  {
    id: 'eng-log-104',
    vesselId: 'ferry-103',
    vesselName: 'M.V. Elephanta Queen',
    timestamp: '2026-09-10 10:30 IST',
    engineRpm: 1620,
    operatingHours: 980,
    coolantTempC: 82.0,
    oilPressureBar: 5.0,
    oilTempC: 78.5,
    exhaustGasTempC: 395,
    vibrationRmsMmSec: 1.8,
    fuelFlowRateLph: 94.2,
    wearScorePercent: 34.0,
    serviceRecommended: false,
    maintenanceNotified: false,
    loggedBy: '2nd Asst. Engineer S. Patil',
  },
];

export const CriticalEngineTelemetryLogger: React.FC<Props> = ({ ferries }) => {
  const { addAuditLog, publishAlert, theme } = useFerry();
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState<EngineTelemetryRecord[]>(INITIAL_TELEMETRY_LOGS);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [notificationStatus, setNotificationStatus] = useState<{ [logId: string]: string }>({});

  // Form state for logging new telemetry
  const [formData, setFormData] = useState({
    vesselId: ferries[0]?.id || 'ferry-104',
    engineRpm: 1850,
    operatingHours: 1880,
    coolantTempC: 91.5,
    oilPressureBar: 3.8,
    oilTempC: 88.0,
    exhaustGasTempC: 485,
    vibrationRmsMmSec: 4.3,
    fuelFlowRateLph: 152.0,
    notes: 'Routine mid-voyage engine room watch inspection.',
  });

  // Calculate wear pattern and service requirement
  const calculateWear = (hours: number, vibration: number, coolant: number) => {
    const hoursRatio = (hours / 2000) * 60; // Max 60 pts
    const vibrationRatio = (vibration / 5.0) * 25; // Max 25 pts
    const thermalRatio = coolant > 90 ? 15 : 5; // Max 15 pts
    const totalScore = Math.min(99, Math.round(hoursRatio + vibrationRatio + thermalRatio));
    const isRecommended = totalScore >= 75 || hours >= 1800 || vibration >= 4.2;

    let reason = '';
    if (isRecommended) {
      if (hours >= 1800) {
        reason = `Operating hours (${hours} hrs) exceed 90% threshold for scheduled overhaul.`;
      } else if (vibration >= 4.2) {
        reason = `Excessive vibration (${vibration} mm/s RMS) detected in propulsion train.`;
      } else {
        reason = `Combined wear index of ${totalScore}% exceeds safe operating parameter.`;
      }
    }

    return { totalScore, isRecommended, reason };
  };

  const handleCreateTelemetryLog = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVessel = ferries.find((f) => f.id === formData.vesselId) || ferries[0];
    const { totalScore, isRecommended, reason } = calculateWear(
      Number(formData.operatingHours),
      Number(formData.vibrationRmsMmSec),
      Number(formData.coolantTempC)
    );

    const newRecord: EngineTelemetryRecord = {
      id: `eng-log-${Date.now()}`,
      vesselId: targetVessel.id,
      vesselName: targetVessel.name,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' IST',
      engineRpm: Number(formData.engineRpm),
      operatingHours: Number(formData.operatingHours),
      coolantTempC: Number(formData.coolantTempC),
      oilPressureBar: Number(formData.oilPressureBar),
      oilTempC: Number(formData.oilTempC),
      exhaustGasTempC: Number(formData.exhaustGasTempC),
      vibrationRmsMmSec: Number(formData.vibrationRmsMmSec),
      fuelFlowRateLph: Number(formData.fuelFlowRateLph),
      wearScorePercent: totalScore,
      serviceRecommended: isRecommended,
      serviceReason: reason || formData.notes,
      maintenanceNotified: false,
      loggedBy: 'Chief Engineer Log Desk',
    };

    setLogs([newRecord, ...logs]);
    addAuditLog(
      'Engine Telemetry Logged',
      'System',
      `Recorded engine telemetry for ${targetVessel.name}: ${formData.operatingHours} hrs, ${formData.vibrationRmsMmSec} mm/s, Wear: ${totalScore}%. ${isRecommended ? 'SERVICE RECOMMENDED.' : 'Nominal.'}`
    );

    setShowLogModal(false);
  };

  const handleNotifyMaintenance = (log: EngineTelemetryRecord) => {
    // Publish high priority alert
    publishAlert({
      title: `MAINTENANCE DISPATCH: Service Recommended for ${log.vesselName}`,
      message: `Engine wear pattern (${log.wearScorePercent}%) on ${log.vesselName} requires maintenance inspection. Telemetry reason: ${log.serviceReason || 'Operating hours threshold breached.'}`,
      severity: 'high',
      category: 'Port Advisory',
      validUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      channels: ['Web', 'SMS'],
    });

    addAuditLog(
      'Maintenance Staff Notified',
      'Admin',
      `Dispatched 'Service Recommended' priority notice to dry-dock engineering crew for ${log.vesselName} (Hours: ${log.operatingHours}).`
    );

    // Update log state
    setLogs((prev) =>
      prev.map((l) =>
        l.id === log.id
          ? {
              ...l,
              maintenanceNotified: true,
              maintenanceNotifiedAt: new Date().toLocaleTimeString() + ' IST',
            }
          : l
      )
    );

    setNotificationStatus((prev) => ({
      ...prev,
      [log.id]: `Maintenance Staff Notified (Ticket #ENG-${log.id.slice(-4)})`,
    }));

    setTimeout(() => {
      setNotificationStatus((prev) => {
        const next = { ...prev };
        delete next[log.id];
        return next;
      });
    }, 4000);
  };

  const filteredLogs = logs.filter((l) => {
    if (selectedVesselId === 'all') return true;
    return l.vesselId === selectedVesselId;
  });

  const serviceRecommendedCount = logs.filter((l) => l.serviceRecommended).length;

  return (
    <div
      id="critical-engine-telemetry-logger"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Critical Engine Telemetry & Maintenance Diagnostics
              </h2>
              {serviceRecommendedCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {serviceRecommendedCount} Service Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous operating hours logging, historical wear pattern modeling, and dry-dock maintenance notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedVesselId}
            onChange={(e) => setSelectedVesselId(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="all">All Fleet Vessels</option>
            {ferries.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.vesselId})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Log Engine Telemetry</span>
          </button>
        </div>
      </div>

      {/* Quick Diagnostic Wear Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">CRITICAL SERVICE INDICATOR</span>
          <div className="flex items-center justify-between pt-1">
            <span
              className={`text-xl font-bold font-mono ${
                serviceRecommendedCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {serviceRecommendedCount > 0 ? 'ACTION REQUIRED' : 'ALL NOMINAL'}
            </span>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-500">
            {serviceRecommendedCount} of {logs.length} logged vessel profiles exceed threshold
          </p>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">OPERATING HOURS LIMIT</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-bold font-mono text-white">2,000 hrs</span>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-[11px] text-slate-500">Scheduled complete propulsion overhaul cycle</p>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">VIBRATION LIMIT (ISO 10816)</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-bold font-mono text-cyan-300">4.5 mm/s</span>
            <Activity className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-[11px] text-slate-500">Propeller shaft & cylinder block velocity threshold</p>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">MAINTENANCE DISPATCH</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">Direct Link</span>
            <Wrench className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-500">Instant notification to dry dock repair engineers</p>
        </div>
      </div>

      {/* Telemetry Log Cards with 'Service Recommended' Status */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Vessel Engine Wear & Maintenance Telemetry Records</span>
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.map((log) => {
            const hasNotification = notificationStatus[log.id];

            return (
              <div
                key={log.id}
                className={`rounded-2xl p-5 border transition-all ${
                  log.serviceRecommended
                    ? 'bg-amber-950/25 border-amber-500/50 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Log Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        log.serviceRecommended
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <Ship className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-base">{log.vesselName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {log.vesselId}
                        </span>

                        {/* 'Service Recommended' Prominent Indicator */}
                        {log.serviceRecommended ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            SERVICE RECOMMENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            NOMINAL / SERVICE NOT DUE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Logged by {log.loggedBy}</span>
                        <span>•</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Action Button */}
                  <div className="flex items-center gap-2">
                    {log.serviceRecommended && (
                      <button
                        onClick={() => handleNotifyMaintenance(log)}
                        disabled={log.maintenanceNotified}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          log.maintenanceNotified
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                        }`}
                      >
                        {log.maintenanceNotified ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Staff Notified ({log.maintenanceNotifiedAt || 'Dispatched'})</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Notify Maintenance Staff</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Telemetry Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 py-3 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">OPERATING HOURS</span>
                    <span
                      className={`font-mono font-bold text-sm block mt-0.5 ${
                        log.operatingHours >= 1800 ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      {log.operatingHours.toLocaleString()} hrs
                    </span>
                    <span className="text-[10px] text-slate-400">Limit: 2,000 hrs</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">ENGINE SPEED</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm block mt-0.5">
                      {log.engineRpm} RPM
                    </span>
                    <span className="text-[10px] text-slate-400">Cruising load</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">COOLANT TEMP</span>
                    <span
                      className={`font-mono font-bold text-sm block mt-0.5 ${
                        log.coolantTempC >= 92 ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {log.coolantTempC}°C
                    </span>
                    <span className="text-[10px] text-slate-400">Max safe: 95°C</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">OIL PRESSURE</span>
                    <span className="font-mono font-bold text-white text-sm block mt-0.5">
                      {log.oilPressureBar} bar
                    </span>
                    <span className="text-[10px] text-slate-400">Temp: {log.oilTempC}°C</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">VIBRATION RMS</span>
                    <span
                      className={`font-mono font-bold text-sm block mt-0.5 ${
                        log.vibrationRmsMmSec >= 4.2 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {log.vibrationRmsMmSec} mm/s
                    </span>
                    <span className="text-[10px] text-slate-400">Limit: 4.5 mm/s</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">EXHAUST TEMP</span>
                    <span className="font-mono font-bold text-slate-200 text-sm block mt-0.5">
                      {log.exhaustGasTempC}°C
                    </span>
                    <span className="text-[10px] text-slate-400">Burn efficiency</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">WEAR INDEX</span>
                    <span
                      className={`font-mono font-bold text-sm block mt-0.5 ${
                        log.wearScorePercent >= 75 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {log.wearScorePercent}%
                    </span>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          log.wearScorePercent >= 75 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${log.wearScorePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reason & Advisory Footer */}
                {log.serviceReason && (
                  <div
                    className={`mt-2 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      log.serviceRecommended
                        ? 'bg-amber-950/60 border border-amber-800/60 text-amber-200'
                        : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <Wrench className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <strong className="text-amber-300">Wear Diagnosis & Recommendation: </strong>
                      <span>{log.serviceReason}</span>
                    </div>
                  </div>
                )}

                {hasNotification && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{hasNotification}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Logging New Engine Telemetry */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Gauge className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Record Engine Telemetry Reading</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTelemetryLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Vessel</label>
                <select
                  value={formData.vesselId}
                  onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:ring-1 focus:ring-amber-400"
                >
                  {ferries.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.vesselId}) - {f.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Operating Hours</label>
                  <input
                    type="number"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Engine RPM</label>
                  <input
                    type="number"
                    value={formData.engineRpm}
                    onChange={(e) => setFormData({ ...formData, engineRpm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Coolant Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.coolantTempC}
                    onChange={(e) => setFormData({ ...formData, coolantTempC: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vibration RMS (mm/s)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.vibrationRmsMmSec}
                    onChange={(e) => setFormData({ ...formData, vibrationRmsMmSec: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Oil Pressure (bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.oilPressureBar}
                    onChange={(e) => setFormData({ ...formData, oilPressureBar: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Fuel Flow (L/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.fuelFlowRateLph}
                    onChange={(e) => setFormData({ ...formData, fuelFlowRateLph: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Engineer Observation Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Calculate Wear & Save Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
