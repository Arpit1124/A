import React from 'react';
import { useFerry } from '../../context/FerryContext';
import { CheckCircle2, AlertTriangle, XCircle, Activity, Server, Radio, Database, CreditCard, Bell, Cpu, Shield } from 'lucide-react';

export const SystemStatusModal: React.FC = () => {
  const { isStatusModalOpen, setIsStatusModalOpen, systemHealth, ferries, trips, triggerSimulatedDelay, alerts } = useFerry();

  if (!isStatusModalOpen) return null;

  const services = [
    { name: 'Marine GPS Tracking Service', status: systemHealth.gpsService, icon: Radio, latency: '24ms', desc: 'Real-time NMEA & RTK differential positioning feed' },
    { name: 'AIS Transponder Ingestion Stream', status: systemHealth.aisFeed, icon: Activity, latency: '42ms', desc: 'Class A & B automatic identification system mesh' },
    { name: 'Realtime WebSocket Telemetry Engine', status: systemHealth.realtimeEngine, icon: Server, latency: '18ms', desc: 'Active subscriptions for vessel location & speed' },
    { name: 'FerryFlow Passenger Booking Engine', status: systemHealth.bookingGateway, icon: Cpu, latency: '35ms', desc: 'Seat allocation, manifest locking & pricing' },
    { name: 'Payment Gateway Integration (UPI / Cards)', status: systemHealth.paymentGateway, icon: CreditCard, latency: '112ms', desc: 'NPCI UPI & Payment aggregator sandbox bridges' },
    { name: 'Service Alert & Broadcast Dispatcher', status: systemHealth.alertBroadcast, icon: Bell, latency: '65ms', desc: 'Web push, SMS and email advisory channels' },
    { name: 'Core Maritime Database & Audit Logs', status: systemHealth.database, icon: Database, latency: '12ms', desc: 'High-availability read-replicas & event store' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Operational
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Degraded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" /> Offline
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-cyan-800/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={() => setIsStatusModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              All Systems Operational
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Real-time infrastructure health & marine sensor diagnostics
            </p>
          </div>
        </div>

        {/* Global summary chips */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400">Uptime (30d)</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">99.98%</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400">Telemetry Rate</div>
            <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">142 msgs/sec</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400">Tracked Assets</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {ferries.length} Ferries
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 text-cyan-400 border border-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-100">{srv.name}</div>
                    <div className="text-[10px] text-slate-400">{srv.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{srv.latency}</span>
                  {getStatusBadge(srv.status)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerSimulatedDelay(ferries[0]?.id || 'ferry-101', 15);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
              title="Test Push Banner on Navbar"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Service Delay (+15m)</span>
            </button>
          </div>
          <button
            onClick={() => setIsStatusModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
