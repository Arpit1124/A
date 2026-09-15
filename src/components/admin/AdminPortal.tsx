import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { FleetCapacityLoadChart } from './FleetCapacityLoadChart';
import { PredictiveMaintenanceSchedule } from './PredictiveMaintenanceSchedule';
import { TerminalQueueHeatmap } from './TerminalQueueHeatmap';
import { VesselComparisonTool } from './VesselComparisonTool';
import { EngineFailureForecastModule } from './EngineFailureForecastModule';
import { AccessibilityAuditTool } from './AccessibilityAuditTool';
import { AutomatedCrewRoster } from './AutomatedCrewRoster';
import { ThirtyDayMetricsVisualizer } from './ThirtyDayMetricsVisualizer';
import { CriticalEngineTelemetryLogger } from './CriticalEngineTelemetryLogger';
import { PassengerFeedbackViewer } from './PassengerFeedbackViewer';
import { Logo } from '../common/Logo';
import {
  Shield,
  Server,
  Database,
  RefreshCw,
  Sliders,
  Download,
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  Radio,
  Flame,
  ArrowRightLeft,
  Eye,
  BarChart3,
  Layers,
  Users,
  MessageSquare,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    ferries,
    trips,
    routes,
    ports,
    bookings,
    alerts,
    auditLogs,
    simulationSpeed,
    setSimulationSpeed,
    isSimulationPlaying,
    setIsSimulationPlaying,
    resetSimulationData,
    setActiveView,
  } = useFerry();

  const [logFilter, setLogFilter] = useState<string>('all');
  const [adminSection, setAdminSection] = useState<'all' | 'analytics' | 'feedback' | 'telemetry' | 'roster' | 'heatmap' | 'comparison' | 'engine' | 'audit' | 'logs'>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.category.toLowerCase() === logFilter.toLowerCase() || log.action.toLowerCase().includes(logFilter.toLowerCase());
  });

  const exportSystemData = () => {
    const data = {
      ferries,
      trips,
      routes,
      ports,
      bookings,
      alerts,
      auditLogs,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferryflow-telemetry-dump-${Date.now()}.json`;
    a.click();
  };

  return (
    <div id="admin-portal-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-950/70">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center text-cyan-400 shadow-md">
            <Logo size={32} variant="blue" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">System Administration & Telemetry</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                ROOT SYSADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live AIS transponder logs, WebSocket simulation controls, memory store telemetry, and audit exports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSystemData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Snapshot (JSON)</span>
          </button>
          <button
            onClick={resetSimulationData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>

      {/* Grid: Diagnostics + Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Simulation Clock</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {simulationSpeed}x Speed
          </div>
          <div className="text-emerald-400 text-[11px]">
            {isSimulationPlaying ? 'Active Telemetry Loop' : 'Paused'}
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Stored Bookings</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">{bookings.length} Records</div>
          <div className="text-slate-400 text-[11px]">In-Memory Local Reactive Store</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>AIS Vessel Telemetry</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{ferries.length} Transponders</div>
          <div className="text-slate-400 text-[11px]">Interval: 2.5s simulated tick</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Live Security Rules</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">RBAC Active</div>
          <div className="text-slate-400 text-[11px]">Passenger • Operator • Captain</div>
        </div>
      </div>

      {/* Administrative System Views Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setAdminSection('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'all'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Modules</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('analytics')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'analytics'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>30-Day Trends (Recharts)</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('feedback')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'feedback'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Passenger Feedback (Boarding & Comfort)</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('telemetry')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'telemetry'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Critical Engine Telemetry</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('roster')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'roster'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Automated Crew Roster</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('heatmap')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'heatmap'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Terminal Queue Heatmap (D3)</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('comparison')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'comparison'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
          <span>Vessel Comparison Tool</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('engine')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'engine'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Predictive Engine Failure Forecast</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('audit')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'audit'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>WCAG Accessibility Audit Tool</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('logs')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminSection === 'logs'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* 30-Day Recharts Data Visualization: Passenger Volume, Fuel Efficiency & On-Time Performance */}
      {(adminSection === 'all' || adminSection === 'analytics') && (
        <ThirtyDayMetricsVisualizer />
      )}

      {/* Passenger Feedback Archive: Boarding Speed & Vessel Comfort Ratings (Admin Exclusive) */}
      {(adminSection === 'all' || adminSection === 'feedback') && (
        <PassengerFeedbackViewer />
      )}

      {/* Critical Engine Telemetry Logger & Maintenance Notification System */}
      {(adminSection === 'all' || adminSection === 'telemetry') && (
        <CriticalEngineTelemetryLogger ferries={ferries} />
      )}

      {/* Automated Crew Roster & Shift Rotation Tool */}
      {(adminSection === 'all' || adminSection === 'roster') && (
        <AutomatedCrewRoster />
      )}

      {/* D3 Terminal Queue & Passenger Boarding Heatmap */}
      {(adminSection === 'all' || adminSection === 'heatmap') && (
        <TerminalQueueHeatmap />
      )}

      {/* Side-by-Side Vessel Performance Comparison Tool */}
      {(adminSection === 'all' || adminSection === 'comparison') && (
        <VesselComparisonTool ferries={ferries} />
      )}

      {/* Predictive Engine Failure Diagnostics & AI Telemetry Forecast */}
      {(adminSection === 'all' || adminSection === 'engine') && (
        <EngineFailureForecastModule ferries={ferries} />
      )}

      {/* Automated WCAG Accessibility Audit Tool */}
      {(adminSection === 'all' || adminSection === 'audit') && (
        <AccessibilityAuditTool />
      )}

      {/* Predictive Maintenance & Hull Inspection Schedule */}
      {(adminSection === 'all') && (
        <>
          <PredictiveMaintenanceSchedule ferries={ferries} />
          <FleetCapacityLoadChart routes={routes} />
        </>
      )}

      {/* Real-time System Telemetry Logs Terminal */}
      {(adminSection === 'all' || adminSection === 'logs') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">Real-time Telemetry & Event Audit Trail</h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {['all', 'Trip', 'Boarding', 'Emergency', 'Alert', 'System', 'Booking'].map((cat) => (
              <button
                key={cat}
                onClick={() => setLogFilter(cat)}
                className={`px-2.5 py-1 rounded-lg transition-colors capitalize ${
                  logFilter === cat
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-1 hover:bg-slate-900/60 px-2 rounded">
              <span className="text-slate-500 shrink-0">{log.timestamp}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 bg-cyan-500/15 text-cyan-300">
                {log.category}
              </span>
              <span className="text-amber-400 font-semibold shrink-0">{log.userRole}:</span>
              <span className="text-slate-300 leading-tight">{log.action} - {log.details}</span>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
