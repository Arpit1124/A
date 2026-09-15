import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { CrewMember, Ferry } from '../../types';
import {
  Users,
  Ship,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Award,
  Phone,
  ArrowRight,
  UserCheck,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

export const CrewManagementDashboard: React.FC = () => {
  const {
    crew,
    ferries,
    assignCrewMemberVessel,
    updateCrewMember,
    addCrewMember,
    renewCrewCertification,
    theme,
  } = useFerry();

  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [certFilter, setCertFilter] = useState<'all' | 'expiring' | 'expired' | 'valid'>('all');
  const [isAddCrewOpen, setIsAddCrewOpen] = useState(false);
  const [renewingCrewId, setRenewingCrewId] = useState<string | null>(null);
  const [newCertDate, setNewCertDate] = useState('2028-12-31');

  // New Crew Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CrewMember['role']>('Deckhand');
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newCertExpiry, setNewCertExpiry] = useState('2028-06-30');
  const [newVesselId, setNewVesselId] = useState<string>('');
  const [newPhone, setNewPhone] = useState('+91 98200 11223');

  const today = new Date('2026-09-06');

  // Compute certification health helper
  const getCertStatus = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired' as const, label: 'EXPIRED', days: diffDays };
    }
    if (diffDays <= 45) {
      return { status: 'expiring' as const, label: `Expiring in ${diffDays}d`, days: diffDays };
    }
    return { status: 'valid' as const, label: 'Compliant', days: diffDays };
  };

  // Metrics
  const metrics = useMemo(() => {
    let valid = 0;
    let expiring = 0;
    let expired = 0;
    let assigned = 0;

    crew.forEach((c) => {
      const cert = getCertStatus(c.certExpiry);
      if (cert.status === 'valid') valid++;
      else if (cert.status === 'expiring') expiring++;
      else expired++;

      if (c.assignedVesselId) assigned++;
    });

    return {
      total: crew.length,
      valid,
      expiring,
      expired,
      assigned,
      standby: crew.length - assigned,
    };
  }, [crew]);

  // Filtered Crew List
  const filteredCrew = useMemo(() => {
    return crew.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.certification.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === 'All' || member.role === selectedRole;

      const certInfo = getCertStatus(member.certExpiry);
      const matchesCert =
        certFilter === 'all' ||
        (certFilter === 'expiring' && certInfo.status === 'expiring') ||
        (certFilter === 'expired' && certInfo.status === 'expired') ||
        (certFilter === 'valid' && certInfo.status === 'valid');

      return matchesSearch && matchesRole && matchesCert;
    });
  }, [crew, searchQuery, selectedRole, certFilter]);

  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addCrewMember({
      name: newName.trim(),
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      role: newRole,
      certification: newCertNumber.trim() || `IND-STCW-${Math.floor(100000 + Math.random() * 900000)}`,
      certExpiry: newCertExpiry,
      assignedVesselId: newVesselId || undefined,
      contact: newPhone,
      availability: 'On Duty',
      experienceYears: 4,
    });

    setIsAddCrewOpen(false);
    setNewName('');
    setNewCertNumber('');
  };

  const handleQuickRenew = (crewId: string) => {
    renewCrewCertification(crewId, newCertDate);
    setRenewingCrewId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Supervisor Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-950/70">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Harbor Crew Rostering & Certification Tracking
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Directorate General of Shipping (DG Shipping) Seafarer Compliance, Vessel Billets & Shift Assignments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddCrewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-900/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Crew Member</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Bar if Certifications are Expiring/Expired */}
      {(metrics.expired > 0 || metrics.expiring > 0) && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                Mandatory DG Shipping Certification Warning
              </div>
              <div className="text-[11px] text-slate-300">
                {metrics.expired} staff {metrics.expired === 1 ? 'has' : 'have'} expired certifications and{' '}
                {metrics.expiring} {metrics.expiring === 1 ? 'is' : 'are'} due for renewal within 45 days. Expired crew cannot be deployed on active passenger runs.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCertFilter('expired')}
              className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-700/60 text-rose-300 text-xs font-bold"
            >
              View Expired ({metrics.expired})
            </button>
            <button
              onClick={() => setCertFilter('expiring')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-700/60 text-amber-300 text-xs font-bold"
            >
              View Expiring ({metrics.expiring})
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Total Roster</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.total}</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Full Maritime Personnel</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Assigned to Vessels</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">{metrics.assigned}</span>
            <Ship className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Active on 4 harbor routes</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Standby Pool</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-sky-300">{metrics.standby}</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Available for deployment</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">STCW Certified</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.valid}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Full Safety Compliance</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Cert Alerts</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-2xl font-bold font-mono ${metrics.expired > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
              {metrics.expired + metrics.expiring}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[11px] text-amber-400 mt-1 block">
            {metrics.expired} Expired • {metrics.expiring} Due
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-4 rounded-2xl border shadow-md flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search crew by name, role, or certification license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className={`text-xs p-2 rounded-xl border focus:outline-none ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="All">All Roles ({crew.length})</option>
            <option value="Captain">Captains</option>
            <option value="Chief Engineer">Chief Engineers</option>
            <option value="Deckhand">Deckhands</option>
            <option value="Safety Officer">Safety Officers</option>
            <option value="Ticket Collector">Ticket Collectors</option>
          </select>

          {/* Certification Status Filter */}
          <div className={`p-1 rounded-xl border flex items-center text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              onClick={() => setCertFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                certFilter === 'all'
                  ? 'bg-cyan-600 text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({crew.length})
            </button>
            <button
              onClick={() => setCertFilter('expiring')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                certFilter === 'expiring'
                  ? 'bg-amber-600 text-white font-bold'
                  : isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              Expiring ({metrics.expiring})
            </button>
            <button
              onClick={() => setCertFilter('expired')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                certFilter === 'expired'
                  ? 'bg-rose-600 text-white font-bold'
                  : isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Expired ({metrics.expired})
            </button>
            <button
              onClick={() => setCertFilter('valid')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                certFilter === 'valid'
                  ? 'bg-emerald-600 text-white font-bold'
                  : isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Compliant ({metrics.valid})
            </button>
          </div>
        </div>
      </div>

      {/* Crew Table & Assignment Matrix */}
      <div className={`rounded-2xl border shadow-xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-semibold uppercase text-[10px] tracking-wider ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <th className="py-3.5 px-4">Staff Member & Contact</th>
                <th className="py-3.5 px-4">Role & Experience</th>
                <th className="py-3.5 px-4">Assigned Vessel (Billet)</th>
                <th className="py-3.5 px-4">DG Shipping Cert & Expiry</th>
                <th className="py-3.5 px-4">Compliance Status</th>
                <th className="py-3.5 px-4 text-right">Supervisor Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredCrew.length > 0 ? (
                filteredCrew.map((member) => {
                  const assignedVessel = ferries.find((f) => f.id === member.assignedVesselId);
                  const certInfo = getCertStatus(member.certExpiry);
                  const isRenewing = renewingCrewId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors ${
                        certInfo.status === 'expired'
                          ? isDark ? 'bg-rose-950/15 hover:bg-rose-950/30' : 'bg-rose-50/60 hover:bg-rose-100/50'
                          : certInfo.status === 'expiring'
                          ? isDark ? 'bg-amber-950/15 hover:bg-amber-950/30' : 'bg-amber-50/60 hover:bg-amber-100/50'
                          : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span className={isDark ? 'text-white' : 'text-slate-900'}>{member.name}</span>
                          {member.availability === 'On Leave' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              ON LEAVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{member.contact || '+91 98200 00000'}</span>
                          <span>•</span>
                          <span>{member.employeeId}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                          {member.role}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {member.experienceYears || 5} yrs maritime exp • {member.availability}
                        </div>
                      </td>

                      {/* Vessel Assignment (Billet) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <select
                            value={member.assignedVesselId || ''}
                            onChange={(e) => assignCrewMemberVessel(member.id, e.target.value || undefined)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold focus:outline-none transition-colors ${
                              member.assignedVesselId
                                ? isDark ? 'bg-slate-950 border-slate-700 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-800'
                                : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                            }`}
                          >
                            <option value="">-- Standby Pool (Unassigned) --</option>
                            {ferries.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.type.split(' ')[0]})
                              </option>
                            ))}
                          </select>
                        </div>
                        {assignedVessel && (
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            Vessel Status: <span className="text-emerald-400 font-semibold">{assignedVessel.status}</span> ({assignedVessel.speedKnots} kts)
                          </div>
                        )}
                      </td>

                      {/* Cert & Expiry */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-semibold text-slate-300">
                          {member.certification}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" /> Expiry: {member.certExpiry}
                        </div>
                      </td>

                      {/* Compliance Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            certInfo.status === 'expired'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                              : certInfo.status === 'expiring'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {certInfo.status === 'expired' ? (
                            <XCircle className="w-3 h-3" />
                          ) : certInfo.status === 'expiring' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          <span>{certInfo.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isRenewing ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                            <input
                              type="date"
                              value={newCertDate}
                              onChange={(e) => setNewCertDate(e.target.value)}
                              className="p-1 rounded bg-slate-950 text-white border border-slate-700 text-xs font-mono"
                            />
                            <button
                              onClick={() => handleQuickRenew(member.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setRenewingCrewId(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setRenewingCrewId(member.id);
                                setNewCertDate('2028-12-31');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                certInfo.status === 'expired'
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-900/40'
                                  : certInfo.status === 'expiring'
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white font-bold'
                                  : isDark
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title="Renew DG Shipping Maritime Certificate"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Renew Cert</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No crew members match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll New Crew Member Modal */}
      {isAddCrewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Enroll Maritime Personnel</h3>
                  <p className="text-xs text-slate-400">DG Shipping certified crew onboarding form</p>
                </div>
              </div>
              <button onClick={() => setIsAddCrewOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCrew} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Captain Sudhir G. Kulkarni"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Maritime Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Captain">Master / Captain</option>
                    <option value="Chief Engineer">Chief Engineer</option>
                    <option value="Deckhand">Able Seaman / Deckhand</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Ticket Collector">Ticket Collector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">STCW / DG License #</label>
                  <input
                    type="text"
                    placeholder="IND-STCW-98214"
                    value={newCertNumber}
                    onChange={(e) => setNewCertNumber(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono uppercase ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Certificate Expiry *</label>
                  <input
                    type="date"
                    required
                    value={newCertExpiry}
                    onChange={(e) => setNewCertExpiry(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Vessel Assignment (Optional)</label>
                <select
                  value={newVesselId}
                  onChange={(e) => setNewVesselId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- Standby Pool (No initial vessel) --</option>
                  {ferries.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.vesselId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCrewOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
