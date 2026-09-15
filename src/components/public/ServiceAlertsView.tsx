import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Bell, AlertTriangle, ShieldAlert, Clock, Radio, CheckCircle2, Filter, Sparkles } from 'lucide-react';
import { ServiceAlert } from '../../types';
import { AIPredictiveDelayAdvisor } from './AIPredictiveDelayAdvisor';

export const ServiceAlertsView: React.FC = () => {
  const { alerts, routes, ferries, setActiveView, setPreselectedRouteIdForBooking } = useFerry();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'ai_predictive' | 'official'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  return (
    <div id="service-alerts-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">
            Maritime Notices
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Service Advisories & Live Alerts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time travel advisories, swell conditions, gate updates, and vessel delay notifications
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main View Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-semibold ${
                activeTab === 'all'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Notices & AI</span>
            </button>
            <button
              onClick={() => setActiveTab('ai_predictive')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-semibold ${
                activeTab === 'ai_predictive'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Delay Predictions</span>
            </button>
            <button
              onClick={() => setActiveTab('official')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-semibold ${
                activeTab === 'official'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Official Notices ({filteredAlerts.length})</span>
            </button>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors text-[11px] ${
                  severityFilter === sev
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI-Based Predictive Delay Module */}
      {(activeTab === 'all' || activeTab === 'ai_predictive') && (
        <AIPredictiveDelayAdvisor />
      )}

      {/* Officially Confirmed Maritime Notices Section */}
      {(activeTab === 'all' || activeTab === 'official') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Officially Confirmed Service Advisories ({filteredAlerts.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Verified by Harbor Master Operations</span>
          </div>

          {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const affectedRoute = routes.find((r) => r.id === alert.affectedRouteId);
            const affectedFerry = ferries.find((f) => f.id === alert.affectedFerryId);

            const isCritical = alert.severity === 'critical' || alert.severity === 'high';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCritical
                    ? 'bg-red-950/25 border-red-800/60 shadow-lg shadow-red-950/20'
                    : alert.severity === 'medium'
                    ? 'bg-amber-950/20 border-amber-800/50 shadow-md'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-lg ${
                        isCritical
                          ? 'bg-red-900/60 text-red-300'
                          : alert.severity === 'medium'
                          ? 'bg-amber-900/60 text-amber-300'
                          : 'bg-cyan-950 text-cyan-400'
                      }`}
                    >
                      {isCritical ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </span>
                    <h3 className="font-bold text-white text-base">{alert.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        isCritical
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : alert.severity === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {alert.severity} priority
                    </span>
                    <span className="text-slate-400">{alert.createdAt}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{alert.message}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    {affectedRoute && (
                      <span>
                        Affected Route: <strong className="text-slate-200">{affectedRoute.name}</strong>
                      </span>
                    )}
                    {affectedFerry && (
                      <span>
                        Vessel: <strong className="text-slate-200">{affectedFerry.name} ({affectedFerry.vesselId})</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Dispatched channels:</span>
                    {alert.channels.map((ch, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-white text-base">No Active Disruptions</h3>
            <p className="text-xs text-slate-400">All routes, fairway channels, and harbor berths are operating normally.</p>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
