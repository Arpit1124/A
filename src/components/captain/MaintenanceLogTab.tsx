import React, { useState, useMemo } from 'react';
import { MaintenanceLog, Ferry } from '../../types';
import {
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  Search,
  Ship,
  User,
  MapPin,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Eye,
  Send,
} from 'lucide-react';

interface MaintenanceLogTabProps {
  activeFerry: Ferry;
}

const INITIAL_LOGS: MaintenanceLog[] = [
  {
    id: 'ML-2026-001',
    ferryId: 'ferry-101',
    vesselName: 'River Star',
    voyageRef: 'VOY-MUM-MAN-101',
    subsystem: 'Main Propulsion',
    severity: 'Minor',
    title: 'Starboard engine raw water strainer minor weed accumulation',
    description: 'Differential pressure gauge showed slight 0.2 bar increase after passing harbor fairway dredge zone. Strainer flushed on low throttle; temperature steady at 82°C.',
    deckLocation: 'Aft Engine Room • Stbd Sea Chest',
    reportedBy: 'Chief Engineer V. Patil',
    crewRole: 'Chief Engineer',
    timestamp: '2026-09-09 10:15:30',
    voyagePhase: 'Fairway Transit',
    status: 'Investigating',
    actionTaken: 'Inspected raw water intake and backflushed weed filter during fairway speed drop.',
  },
  {
    id: 'ML-2026-002',
    ferryId: 'ferry-101',
    vesselName: 'River Star',
    voyageRef: 'VOY-MUM-MAN-101',
    subsystem: 'Bridge Wing & Wipers',
    severity: 'Advisory',
    title: 'Port bridge wing windshield wiper blade chatter',
    description: 'During headwind spray conditions, port navigation view wiper showed intermittent chatter. Spray washer jet pressure verified normal.',
    deckLocation: 'Bridge Wheelhouse • Port Console',
    reportedBy: 'First Officer M. Nair',
    crewRole: 'First Officer',
    timestamp: '2026-09-09 09:40:12',
    voyagePhase: 'High-Speed Cruise',
    status: 'Open',
  },
  {
    id: 'ML-2026-003',
    ferryId: 'ferry-101',
    vesselName: 'River Star',
    voyageRef: 'VOY-MUM-MAN-098',
    subsystem: 'Passenger Deck & HVAC',
    severity: 'Minor',
    title: 'Main passenger cabin AC diffuser vent rattle',
    description: 'Slight resonance noise detected at 1,820 RPM near starboard exit bulkhead seating row 4. Tightened mounting clip on return voyage.',
    deckLocation: 'Main Passenger Saloon • Row 4 Starboard',
    reportedBy: 'Deckhand R. Shinde',
    crewRole: 'Deckhand',
    timestamp: '2026-09-08 16:20:05',
    voyagePhase: 'High-Speed Cruise',
    status: 'Resolved',
    actionTaken: 'Tightened diffuser clamp bracket with nylon grommet dampening.',
    resolutionNotes: 'Noise completely eliminated during sea trial leg #4.',
  },
  {
    id: 'ML-2026-004',
    ferryId: 'ferry-102',
    vesselName: 'Mumbai Breeze',
    voyageRef: 'VOY-MUM-ELE-202',
    subsystem: 'Gangway & Turnstiles',
    severity: 'Minor',
    title: 'Aft gangway hydraulic release valve micro-weep',
    description: 'Traces of hydraulic fluid observed near starboard ramp deployment cylinder seal. Level in header reservoir verified nominal.',
    deckLocation: 'Aft Vehicle Ramp • Starboard Hinge',
    reportedBy: 'Second Officer K. Joshi',
    crewRole: 'Second Officer',
    timestamp: '2026-09-09 08:30:45',
    voyagePhase: 'Berthing / Docked',
    status: 'Open',
    actionTaken: 'Wiped clean and placed absorbent pad; marked for shore mechanic seal replacement at overnight berth.',
  },
  {
    id: 'ML-2026-005',
    ferryId: 'ferry-103',
    vesselName: 'Mandwa King',
    voyageRef: 'VOY-MAN-MUM-304',
    subsystem: 'Navigation & Radar',
    severity: 'Advisory',
    title: 'Furuno AIS transponder secondary GPS antenna cable clip loose',
    description: 'Vessel AIS remained 100% operational on primary masthead dome; secondary backup antenna coax cable clip loose due to wind vibration.',
    deckLocation: 'Wheelhouse Mast • Flying Bridge',
    reportedBy: 'Capt. D. Sharma',
    crewRole: 'Captain',
    timestamp: '2026-09-09 07:15:10',
    voyagePhase: 'Pre-departure',
    status: 'Resolved',
    actionTaken: 'Secured with marine-grade UV zip ties and self-amalgamating silicone tape.',
    resolutionNotes: 'Verified rigid mounting before casting off lines.',
  },
];

export const MaintenanceLogTab: React.FC<MaintenanceLogTabProps> = ({ activeFerry }) => {
  const [logs, setLogs] = useState<MaintenanceLog[]>(() => {
    try {
      const saved = localStorage.getItem('ferryflow_maintenance_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LOGS;
  });

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Open' | 'Investigating' | 'Resolved'>('All');
  const [selectedSubsystemFilter, setSelectedSubsystemFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCurrentVesselOnly, setFilterCurrentVesselOnly] = useState<boolean>(true);
  const [resolvingLogId, setResolvingLogId] = useState<string | null>(null);
  const [resolutionInput, setResolutionInput] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subsystem: 'Main Propulsion' as MaintenanceLog['subsystem'],
    severity: 'Minor' as MaintenanceLog['severity'],
    deckLocation: '',
    description: '',
    voyagePhase: 'High-Speed Cruise' as MaintenanceLog['voyagePhase'],
    reportedBy: 'Capt. S. Rane',
    crewRole: 'Captain',
  });

  const saveLogs = (newLogs: MaintenanceLog[]) => {
    setLogs(newLogs);
    try {
      localStorage.setItem('ferryflow_maintenance_logs', JSON.stringify(newLogs));
    } catch {}
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newLog: MaintenanceLog = {
      id: `ML-2026-${String(logs.length + 1).padStart(3, '0')}`,
      ferryId: activeFerry.id,
      vesselName: activeFerry.name,
      voyageRef: `VOY-${activeFerry.vesselId}-${new Date().getHours()}${new Date().getMinutes()}`,
      subsystem: formData.subsystem,
      severity: formData.severity,
      title: formData.title.trim(),
      description: formData.description.trim() || 'Visual observation recorded by wheelhouse crew during sea passage.',
      deckLocation: formData.deckLocation.trim() || 'Main Deck',
      reportedBy: formData.reportedBy.trim(),
      crewRole: formData.crewRole.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      voyagePhase: formData.voyagePhase,
      status: 'Open',
    };

    saveLogs([newLog, ...logs]);
    setShowAddModal(false);
    setFormData({
      title: '',
      subsystem: 'Main Propulsion',
      severity: 'Minor',
      deckLocation: '',
      description: '',
      voyagePhase: 'High-Speed Cruise',
      reportedBy: 'Capt. S. Rane',
      crewRole: 'Captain',
    });
  };

  const handleStatusChange = (logId: string, newStatus: MaintenanceLog['status']) => {
    const updated = logs.map((log) => {
      if (log.id === logId) {
        return {
          ...log,
          status: newStatus,
          actionTaken:
            newStatus === 'Investigating'
              ? log.actionTaken || 'Crew assigned for mid-voyage visual and thermal inspection.'
              : log.actionTaken,
        };
      }
      return log;
    });
    saveLogs(updated);
  };

  const handleCompleteResolution = (logId: string) => {
    const updated = logs.map((log) => {
      if (log.id === logId) {
        return {
          ...log,
          status: 'Resolved' as const,
          resolutionNotes: resolutionInput || 'Resolved and cleared by wheelhouse crew.',
          actionTaken: log.actionTaken || 'Inspection and maintenance adjustments applied onboard.',
        };
      }
      return log;
    });
    saveLogs(updated);
    setResolvingLogId(null);
    setResolutionInput('');
  };

  // Quick Preset Logger
  const handleQuickPreset = (preset: {
    title: string;
    subsystem: MaintenanceLog['subsystem'];
    severity: MaintenanceLog['severity'];
    deckLocation: string;
    description: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      subsystem: preset.subsystem,
      severity: preset.severity,
      deckLocation: preset.deckLocation,
      description: preset.description,
    }));
    setShowAddModal(true);
  };

  // Filtered list
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterCurrentVesselOnly && log.ferryId !== activeFerry.id) return false;
      if (selectedStatusFilter !== 'All' && log.status !== selectedStatusFilter) return false;
      if (selectedSubsystemFilter !== 'All' && log.subsystem !== selectedSubsystemFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.title.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.deckLocation.toLowerCase().includes(q) ||
          log.reportedBy.toLowerCase().includes(q) ||
          log.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, activeFerry.id, filterCurrentVesselOnly, selectedStatusFilter, selectedSubsystemFilter, searchQuery]);

  // Status Counts
  const vesselLogs = useMemo(
    () => logs.filter((l) => (filterCurrentVesselOnly ? l.ferryId === activeFerry.id : true)),
    [logs, activeFerry.id, filterCurrentVesselOnly]
  );
  const openCount = vesselLogs.filter((l) => l.status === 'Open').length;
  const investigatingCount = vesselLogs.filter((l) => l.status === 'Investigating').length;
  const resolvedCount = vesselLogs.filter((l) => l.status === 'Resolved').length;

  return (
    <div id="maintenance-log-tab" className="space-y-6">
      {/* Top Banner & Overview Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Active Voyage Maintenance & Technical Log</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                  {activeFerry.name} ({activeFerry.vesselId})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Record and track minor vessel status issues, sensor anomalies, and technical observations during ongoing crossings
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="record-new-observation-btn"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record Technical Observation</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span>Open Issues</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{openCount}</div>
            <span className="text-[10px] text-slate-500">Require observation/action</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span>Under Investigation</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{investigatingCount}</div>
            <span className="text-[10px] text-slate-500">Crew monitoring underway</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span>Resolved Onboard</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{resolvedCount}</div>
            <span className="text-[10px] text-slate-500">Rectified during passage</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span>Technical Readiness</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
              {openCount === 0 ? '100%' : openCount <= 2 ? '97.5%' : '92.0%'}
            </div>
            <span className="text-[10px] text-emerald-400">Seaworthy for Fairway Transit</span>
          </div>
        </div>
      </div>

      {/* Quick Observation Templates Strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between pb-2 text-xs text-slate-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick-Log Voyage Observation Templates:</span>
          </span>
          <span className="text-[11px] text-slate-500 font-normal">Click to pre-fill active observation</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            {
              label: 'Propulsion: Strainer Differential Press',
              title: 'Main engine seawater raw strainer slight differential pressure',
              subsystem: 'Main Propulsion' as const,
              severity: 'Minor' as const,
              deckLocation: 'Engine Room • Raw Water Intake',
              description: 'Observed 0.2 bar differential rise after passing shallow silt corridor. Temperatures nominal at 82°C.',
            },
            {
              label: 'Wiper: Spray Wiper Blade Chatter',
              title: 'Wheelhouse windshield wiper chatter in salt spray',
              subsystem: 'Bridge Wing & Wipers' as const,
              severity: 'Advisory' as const,
              deckLocation: 'Bridge Console • Port Screen',
              description: 'Wiper blade tension requires minor adjustment; wash nozzle functional.',
            },
            {
              label: 'Saloon: Passenger AC Vent Resonance',
              title: 'Main passenger cabin air vent vibration rattle',
              subsystem: 'Passenger Deck & HVAC' as const,
              severity: 'Minor' as const,
              deckLocation: 'Saloon • Aft Starboard Overhead',
              description: 'Vibration detected during cruising RPM. Latch bracket requires rubber dampener.',
            },
            {
              label: 'Ro-Pax: Ramp Hinge Seal Moisture',
              title: 'Vehicle loading ramp hydraulic valve moisture check',
              subsystem: 'Gangway & Turnstiles' as const,
              severity: 'Minor' as const,
              deckLocation: 'Vehicle Deck • Aft Ramp Lock',
              description: 'Hydraulic cylinder clean; minor weep observed around bleed plug.',
            },
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPreset(preset)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          {(['All', 'Open', 'Investigating', 'Resolved'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedStatusFilter === status
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}

          {/* Current Vessel Only Toggle */}
          <button
            type="button"
            onClick={() => setFilterCurrentVesselOnly(!filterCurrentVesselOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filterCurrentVesselOnly
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>{filterCurrentVesselOnly ? `${activeFerry.name} Only` : 'All Fleet Vessels'}</span>
          </button>
        </div>

        {/* Subsystem & Search Input */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSubsystemFilter}
            onChange={(e) => setSelectedSubsystemFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs p-2 rounded-xl border border-slate-800"
          >
            <option value="All">All Subsystems</option>
            <option value="Main Propulsion">Main Propulsion</option>
            <option value="Auxiliary Power">Auxiliary Power</option>
            <option value="Steering & Rudder">Steering & Rudder</option>
            <option value="Navigation & Radar">Navigation & Radar</option>
            <option value="Bridge Wing & Wipers">Bridge Wing & Wipers</option>
            <option value="Passenger Deck & HVAC">Passenger Deck & HVAC</option>
            <option value="Gangway & Turnstiles">Gangway & Turnstiles</option>
            <option value="Fire & Safety Systems">Fire & Safety Systems</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search observations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 text-white text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 w-48"
            />
          </div>
        </div>
      </div>

      {/* Maintenance Logs List */}
      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isSelectedForResolve = resolvingLogId === log.id;

            return (
              <div
                key={log.id}
                id={`maintenance-log-${log.id}`}
                className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-lg transition-all space-y-3 ${
                  log.status === 'Open'
                    ? 'border-amber-500/40 hover:border-amber-500/70'
                    : log.status === 'Investigating'
                    ? 'border-sky-500/40 hover:border-sky-500/70'
                    : 'border-slate-800/80 opacity-85'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {log.id}
                      </span>
                      <h3 className="text-sm font-bold text-white">{log.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Ship className="w-3.5 h-3.5 text-cyan-400" />
                        <strong className="text-slate-200">{log.vesselName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{log.deckLocation}</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500 text-[11px]">{log.timestamp}</span>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-lg font-bold border ${
                        log.severity === 'Urgent'
                          ? 'bg-red-950/60 text-red-300 border-red-500/60'
                          : log.severity === 'Moderate'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/60'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {log.severity} Priority
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                        log.status === 'Resolved'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : log.status === 'Investigating'
                          ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {log.status === 'Resolved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : log.status === 'Investigating' ? (
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{log.status}</span>
                    </span>
                  </div>
                </div>

                {/* Description and Technical Notes */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <p>{log.description}</p>
                  {log.actionTaken && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-cyan-300 flex items-start gap-1.5">
                      <span className="font-semibold text-slate-400 shrink-0">Action Taken:</span>
                      <span>{log.actionTaken}</span>
                    </div>
                  )}
                  {log.resolutionNotes && (
                    <div className="mt-1 text-[11px] text-emerald-300 flex items-start gap-1.5">
                      <span className="font-semibold text-slate-400 shrink-0">Resolution Note:</span>
                      <span>{log.resolutionNotes}</span>
                    </div>
                  )}
                </div>

                {/* Subsystem, Voyage Phase & Crew Signature Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-800/60 text-slate-400">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-400 border border-slate-800">
                      {log.subsystem}
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-[11px] text-slate-400 border border-slate-800">
                      Phase: {log.voyagePhase}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Reported by: <strong className="text-slate-200">{log.reportedBy}</strong> ({log.crewRole})
                    </span>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-2">
                    {log.status === 'Open' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(log.id, 'Investigating')}
                        className="px-3 py-1 bg-sky-900/40 hover:bg-sky-800/60 text-sky-300 border border-sky-700/50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Start Investigation
                      </button>
                    )}

                    {log.status !== 'Resolved' && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingLogId(isSelectedForResolve ? null : log.id);
                          setResolutionInput('');
                        }}
                        className="px-3 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSelectedForResolve ? 'Cancel' : 'Resolve & Close'}</span>
                      </button>
                    )}

                    {log.status === 'Resolved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(log.id, 'Open')}
                        className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-[11px] font-mono"
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Resolution Notes Input */}
                {isSelectedForResolve && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/50 space-y-2 mt-2">
                    <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Record Onboard Resolution Details & Notes:</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Cleaned strainer, replaced washer seal, or cleared rattle with dampening shim..."
                      value={resolutionInput}
                      onChange={(e) => setResolutionInput(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setResolvingLogId(null)}
                        className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCompleteResolution(log.id)}
                        className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Confirm Issue Rectified
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-white text-base">No Matching Technical Logs</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All active voyage systems are operating within nominal parameters with no open observations.
            </p>
          </div>
        )}
      </div>

      {/* Record Observation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Record Active Voyage Observation</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Vessel: {activeFerry.name} ({activeFerry.vesselId})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Issue Summary / Title <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starboard engine raw water strainer slight temperature rise"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Subsystem Category</label>
                  <select
                    value={formData.subsystem}
                    onChange={(e) =>
                      setFormData({ ...formData, subsystem: e.target.value as MaintenanceLog['subsystem'] })
                    }
                    className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800"
                  >
                    <option value="Main Propulsion">Main Propulsion</option>
                    <option value="Auxiliary Power">Auxiliary Power</option>
                    <option value="Steering & Rudder">Steering & Rudder</option>
                    <option value="Navigation & Radar">Navigation & Radar</option>
                    <option value="Bilge & Pumping">Bilge & Pumping</option>
                    <option value="Bridge Wing & Wipers">Bridge Wing & Wipers</option>
                    <option value="Passenger Deck & HVAC">Passenger Deck & HVAC</option>
                    <option value="Gangway & Turnstiles">Gangway & Turnstiles</option>
                    <option value="Fire & Safety Systems">Fire & Safety Systems</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Observation Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value as MaintenanceLog['severity'] })
                    }
                    className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800"
                  >
                    <option value="Minor">Minor (Routine)</option>
                    <option value="Advisory">Advisory (Watch List)</option>
                    <option value="Moderate">Moderate (Check at Berth)</option>
                    <option value="Urgent">Urgent (Immediate Bridge Action)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Deck Location / Component</label>
                  <input
                    type="text"
                    placeholder="e.g. Engine Room Stbd Sea Chest"
                    value={formData.deckLocation}
                    onChange={(e) => setFormData({ ...formData, deckLocation: e.target.value })}
                    className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Voyage Phase</label>
                  <select
                    value={formData.voyagePhase}
                    onChange={(e) =>
                      setFormData({ ...formData, voyagePhase: e.target.value as MaintenanceLog['voyagePhase'] })
                    }
                    className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800"
                  >
                    <option value="Pre-departure">Pre-departure</option>
                    <option value="Fairway Transit">Fairway Transit</option>
                    <option value="High-Speed Cruise">High-Speed Cruise</option>
                    <option value="Berthing / Docked">Berthing / Docked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Technical Observation Details</label>
                <textarea
                  rows={3}
                  placeholder="Provide technical observations, meter readings (temp/pressure/RPM), sound observations, or initial actions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Logged By Crew Member</label>
                  <input
                    type="text"
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                    className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Crew Role</label>
                  <select
                    value={formData.crewRole}
                    onChange={(e) => setFormData({ ...formData, crewRole: e.target.value })}
                    className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800"
                  >
                    <option value="Captain">Captain</option>
                    <option value="First Officer">First Officer</option>
                    <option value="Chief Engineer">Chief Engineer</option>
                    <option value="Deckhand">Deckhand</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log Technical Observation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
