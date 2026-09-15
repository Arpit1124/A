import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry, HourlyTelemetryReport } from '../../types';
import {
  Activity,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge,
  Thermometer,
  Wrench,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Fuel,
  Compass,
} from 'lucide-react';

interface RealTimeTelemetryArchiveProps {
  activeFerry: Ferry;
}

export const RealTimeTelemetryArchive: React.FC<RealTimeTelemetryArchiveProps> = ({ activeFerry }) => {
  const {
    hourlyTelemetryReports,
    exportHourlyReportToAdmin,
    addAuditLog,
    playRoutineChime,
  } = useFerry();

  const [filterHealth, setFilterHealth] = useState<'all' | 'Optimal' | 'Caution' | 'Service Required'>('all');
  const [justExportedId, setJustExportedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter reports for current active vessel or allow viewing all
  const vesselReports = hourlyTelemetryReports.filter(
    (r) => r.vesselId === activeFerry.id || r.vesselName.toLowerCase().includes(activeFerry.name.toLowerCase().split(' ')[0])
  );

  const displayedReports = (vesselReports.length > 0 ? vesselReports : hourlyTelemetryReports).filter((r) => {
    if (filterHealth === 'all') return true;
    return r.healthStatus === filterHealth;
  });

  const totalFuelLogged = displayedReports.reduce((acc, r) => acc + r.totalFuelBurnLiters, 0);
  const totalNauticalMiles = displayedReports.reduce((acc, r) => acc + r.nauticalMilesCovered, 0);
  const avgRpmAll = Math.round(
    displayedReports.reduce((acc, r) => acc + r.avgEngineRpm, 0) / (displayedReports.length || 1)
  );
  const exportedCount = displayedReports.filter((r) => r.exportedToAdmin).length;

  const handleExport = (report: HourlyTelemetryReport) => {
    exportHourlyReportToAdmin(report.id);
    setJustExportedId(report.id);
    playRoutineChime();
    setSuccessToast(`Dispatched ${report.hourPeriod} Telemetry Log for ${report.vesselName} directly to AdminPortal maintenance queue.`);
    setTimeout(() => {
      setSuccessToast(null);
      setJustExportedId(null);
    }, 4000);
  };

  const handleBatchExportAllPending = () => {
    const pending = displayedReports.filter((r) => !r.exportedToAdmin);
    if (pending.length === 0) {
      alert('All hourly telemetry reports are already exported to the AdminPortal.');
      return;
    }
    pending.forEach((r) => exportHourlyReportToAdmin(r.id));
    playRoutineChime();
    setSuccessToast(`Batch transmitted ${pending.length} hourly engineering reports to AdminPortal dry-dock maintenance staff.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-semibold">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Real-Time Telemetry Archive
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
                HOURLY ENGINE REPORTS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated mechanical logs for <strong className="text-cyan-300">{activeFerry.name}</strong> ({activeFerry.vesselId}) with direct export to AdminPortal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchExportAllPending}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Export All Pending to Admin</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Archived Hours
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{displayedReports.length}</span>
            <span className="text-xs text-slate-500 font-mono">intervals</span>
          </div>
          <p className="text-[10px] text-slate-400">Continuous 60-min engine telemetry slices</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            Mean Engine RPM
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{avgRpmAll}</span>
            <span className="text-xs text-indigo-400 font-mono">RPM</span>
          </div>
          <p className="text-[10px] text-slate-400">Peak observed: 1,920 RPM</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-emerald-400" />
            Fuel Burn Cumulative
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{totalFuelLogged.toFixed(1)}</span>
            <span className="text-xs text-emerald-400 font-mono">Liters</span>
          </div>
          <p className="text-[10px] text-slate-400">Across {totalNauticalMiles.toFixed(1)} Nautical Miles</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            Exported to Admin
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {exportedCount} / {displayedReports.length}
            </span>
            <span className="text-xs text-amber-400 font-mono">transferred</span>
          </div>
          <p className="text-[10px] text-slate-400">Directly queued in AdminPortal</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Filter Engine Health:</span>
          {(['all', 'Optimal', 'Caution', 'Service Required'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilterHealth(filter)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterHealth === filter
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter === 'all' ? 'All Hourly Reports' : filter}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Vessel Command: <strong className="text-cyan-400">{activeFerry.name}</strong>
        </div>
      </div>

      {/* Hourly Reports Cards Grid */}
      <div className="space-y-4">
        {displayedReports.map((report) => {
          const isOptimal = report.healthStatus === 'Optimal';
          const isCaution = report.healthStatus === 'Caution';
          const isService = report.healthStatus === 'Service Required';

          return (
            <div
              key={report.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all space-y-4 ${
                isService
                  ? 'border-red-600/80 bg-red-950/20'
                  : isCaution
                  ? 'border-amber-500/60 bg-amber-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isService
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : isCaution
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">
                        Hourly Telemetry Digest: {report.hourPeriod}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          isService
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : isCaution
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {report.healthStatus}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Logged for {report.vesselName} • {new Date(report.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Direct Export Action */}
                <div>
                  {report.exportedToAdmin ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Exported to AdminPortal</span>
                      {report.exportedAt && (
                        <span className="text-[10px] text-emerald-400/80">
                          ({new Date(report.exportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleExport(report)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/30 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Export Maintenance Log to AdminPortal</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Engine Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-sans">Avg Engine RPM</span>
                  <span className="text-cyan-400 font-bold text-sm">{report.avgEngineRpm} RPM</span>
                  <span className="text-[9px] text-slate-500 block">Peak {report.peakEngineRpm}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-sans">Coolant Temp</span>
                  <span
                    className={`font-bold text-sm ${
                      report.avgCoolantTempC > 85 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {report.avgCoolantTempC}°C
                  </span>
                  <span className="text-[9px] text-slate-500 block">Limit 92°C</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-sans">Oil Pressure</span>
                  <span className="text-indigo-400 font-bold text-sm">{report.avgOilPressureBar} bar</span>
                  <span className="text-[9px] text-slate-500 block">Nominal 4.2+</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-sans">Shaft Vibration</span>
                  <span
                    className={`font-bold text-sm ${
                      report.avgVibrationMmSec > 2.0 ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  >
                    {report.avgVibrationMmSec} mm/s
                  </span>
                  <span className="text-[9px] text-slate-500 block">ISO 10816 Class II</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-sans">Fuel Burn</span>
                  <span className="text-emerald-400 font-bold text-sm">{report.totalFuelBurnLiters} L</span>
                  <span className="text-[9px] text-slate-500 block">{(report.totalFuelBurnLiters / (report.nauticalMilesCovered || 1)).toFixed(1)} L/NM</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-sans">Distance Covered</span>
                  <span className="text-purple-400 font-bold text-sm">{report.nauticalMilesCovered} NM</span>
                  <span className="text-[9px] text-slate-500 block">{report.avgKnotsSpeed} kts avg</span>
                </div>
              </div>

              {/* Captain's Operational Log Remarks */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
                <Compass className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block text-[11px] uppercase tracking-wider font-mono">
                    Captain's Wheelhouse Remarks:
                  </span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{report.captainNotes}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
