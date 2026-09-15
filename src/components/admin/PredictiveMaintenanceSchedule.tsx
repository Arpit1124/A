import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Ferry } from '../../types';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Ship,
  ShieldAlert,
  Bell,
  HardHat,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Layers,
} from 'lucide-react';

interface Props {
  ferries: Ferry[];
}

export const PredictiveMaintenanceSchedule: React.FC<Props> = ({ ferries }) => {
  const { publishAlert, theme } = useFerry();
  const isDark = theme === 'dark';

  const [notificationSent, setNotificationSent] = useState<{ [vesselId: string]: boolean }>({});
  const [filter, setFilter] = useState<'all' | 'warning' | 'compliant'>('all');

  const today = new Date('2026-09-06');

  // Enriched maintenance data calculator
  const maintenanceRecords = ferries.map((f) => {
    // Default fallback dates if not set on vessel
    const defaultDeadline =
      f.id === 'ferry-104'
        ? '2026-09-17' // 11 days away - Warning!
        : f.id === 'ferry-102'
        ? '2026-10-04' // 28 days away - Approaching
        : f.id === 'ferry-101'
        ? '2026-12-15'
        : '2027-03-20';

    const deadlineStr = f.hullInspectionDeadline || defaultDeadline;
    const deadlineDate = new Date(deadlineStr);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const opHours = f.operatingHoursSinceHullInspection || (f.id === 'ferry-104' ? 1945 : f.id === 'ferry-102' ? 1820 : 1240);
    const maxHours = f.maxOperatingHoursLimit || 2000;
    const hoursRatio = (opHours / maxHours) * 100;

    const conditionScore = f.hullConditionScore || (f.id === 'ferry-104' ? 68 : f.id === 'ferry-102' ? 81 : 94);
    const assignedYard = f.dryDockAssignedYard || (f.id === 'ferry-104' ? 'Mazagon Dock Yard #3' : 'Mumbai Port Trust Dry Dock');

    const isWarning = daysRemaining <= 30 || hoursRatio >= 90;
    const isCritical = daysRemaining <= 14 || hoursRatio >= 95;

    return {
      ferry: f,
      deadlineStr,
      daysRemaining,
      opHours,
      maxHours,
      hoursRatio,
      conditionScore,
      assignedYard,
      isWarning,
      isCritical,
      status: isCritical
        ? ('Mandatory Dry-Dock Approaching' as const)
        : isWarning
        ? ('Inspection Due Soon' as const)
        : ('Compliant' as const),
    };
  });

  const warningCount = maintenanceRecords.filter((r) => r.isWarning).length;
  const criticalCount = maintenanceRecords.filter((r) => r.isCritical).length;

  const filteredRecords = maintenanceRecords.filter((r) => {
    if (filter === 'warning') return r.isWarning;
    if (filter === 'compliant') return !r.isWarning;
    return true;
  });

  const handleTriggerWarning = (record: (typeof maintenanceRecords)[0]) => {
    publishAlert({
      title: `Mandatory Hull Inspection Statutory Notice: ${record.ferry.name}`,
      message: `Statutory Warning: Vessel ${record.ferry.name} (${record.ferry.vesselId}) is approaching its DG Shipping / MMB mandatory hull inspection deadline in ${record.daysRemaining} days (Operating hours: ${record.opHours}/${record.maxHours} hrs). Scheduled yard: ${record.assignedYard}. Service suspension risk if uninspected.`,
      severity: record.isCritical ? 'critical' : 'high',
      category: 'Port Advisory',
      affectedFerryId: record.ferry.id,
      affectedRouteId: record.ferry.currentRouteId || undefined,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      channels: ['Web', 'Push'],
    });

    setNotificationSent((prev) => ({ ...prev, [record.ferry.id]: true }));
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-2xl space-y-6 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Predictive Hull Maintenance & Dry-Dock Schedule
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                DG SHIPPING RULE 42
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ultrasonic hull plate thickness estimation, running hour fatigue indicators, and automated statutory inspection warnings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-xl border flex items-center text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-cyan-600 text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Vessels ({ferries.length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'warning'
                  ? 'bg-amber-600 text-white font-bold'
                  : isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              Warnings ({warningCount})
            </button>
            <button
              onClick={() => setFilter('compliant')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'compliant'
                  ? 'bg-emerald-600 text-white font-bold'
                  : isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Compliant ({ferries.length - warningCount})
            </button>
          </div>
        </div>
      </div>

      {/* Warning Notification Alert Banner */}
      {warningCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                Statutory Hull Inspection Deadlines Approaching
              </div>
              <div className="text-[11px] text-slate-300">
                {warningCount} vessel{warningCount === 1 ? '' : 's'} approaching mandatory bi-annual dry-dock inspection deadline ({criticalCount} critical &lt; 14 days). Immediate slot reservation required to prevent certification withdrawal.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const rec = maintenanceRecords.find((r) => r.isCritical) || maintenanceRecords[0];
              if (rec) handleTriggerWarning(rec);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950 flex items-center gap-1.5 transition-all"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Broadcast Fleetwide Notice</span>
          </button>
        </div>
      )}

      {/* Vessel Maintenance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRecords.map((item) => {
          const isSent = notificationSent[item.ferry.id];

          return (
            <div
              key={item.ferry.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.isCritical
                  ? isDark ? 'bg-slate-950 border-rose-900/60 shadow-rose-950/20' : 'bg-rose-50/50 border-rose-300 shadow-sm'
                  : item.isWarning
                  ? isDark ? 'bg-slate-950 border-amber-900/60 shadow-amber-950/20' : 'bg-amber-50/50 border-amber-300 shadow-sm'
                  : isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    item.isCritical
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : item.isWarning
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    <Ship className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.ferry.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">({item.ferry.vesselId})</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.ferry.type} • Reg: {item.ferry.registrationNumber}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${
                    item.isCritical
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : item.isWarning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {item.isWarning ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  <span>{item.status}</span>
                </span>
              </div>

              {/* Metrics & Wear Indicators */}
              <div className="py-3 space-y-3">
                {/* Inspection Countdown */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Mandatory Hull Deadline
                  </span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white mr-1.5">{item.deadlineStr}</span>
                    <span
                      className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        item.daysRemaining <= 14
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : item.daysRemaining <= 30
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.daysRemaining > 0 ? `${item.daysRemaining} days left` : 'OVERDUE'}
                    </span>
                  </div>
                </div>

                {/* Operating Hours Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Operating Hull Hours
                    </span>
                    <span className="font-mono text-slate-300">
                      <strong>{item.opHours.toLocaleString()}</strong> / {item.maxHours.toLocaleString()} hrs ({item.hoursRatio.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.hoursRatio >= 95
                          ? 'bg-rose-500'
                          : item.hoursRatio >= 90
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(item.hoursRatio, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Hull Condition & Yard Booking */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Hull Condition Index</span>
                    <span className={`font-mono font-bold ${
                      item.conditionScore < 75 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {item.conditionScore}% (Ultrasonic Grade)
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Dry Dock Berth</span>
                    <span className="font-medium text-slate-200 truncate block">
                      {item.assignedYard}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Certifier: Indian Register of Shipping (IRS)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerWarning(item)}
                    disabled={isSent}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSent
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : item.isWarning
                        ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Warning Broadcasted</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{item.isWarning ? 'Trigger Statutory Warning' : 'Send Inspection Notice'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
