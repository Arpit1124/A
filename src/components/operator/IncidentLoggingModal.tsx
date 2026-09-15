import React, { useState, useEffect } from 'react';
import { PassengerIncidentReport, Trip, Ferry } from '../../types';
import {
  AlertTriangle,
  HeartPulse,
  PackageSearch,
  ShieldAlert,
  UserCheck,
  X,
  CheckCircle2,
  FileText,
  Clock,
  MapPin,
  Ship,
  Phone,
  Lock,
} from 'lucide-react';
import { useFerry } from '../../context/FerryContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: Partial<PassengerIncidentReport> | null;
  onSaveIncident: (incident: PassengerIncidentReport) => void;
  trips: Trip[];
  ferries: Ferry[];
}

export const IncidentLoggingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  prefillData,
  onSaveIncident,
  trips,
  ferries,
}) => {
  const { theme } = useFerry();
  const isDark = theme === 'dark';

  const [type, setType] = useState<PassengerIncidentReport['type']>('Medical Emergency');
  const [severity, setSeverity] = useState<PassengerIncidentReport['severity']>('Medium');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [gateNumber, setGateNumber] = useState('Gate 2');
  const [tripId, setTripId] = useState(trips[0]?.id || '');
  const [vesselName, setVesselName] = useState(ferries[0]?.name || '');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [status, setStatus] = useState<PassengerIncidentReport['status']>('First-Aid Rendered');
  const [staffName, setStaffName] = useState('Anand Patil');
  const [staffBadgeId, setStaffBadgeId] = useState('STAFF-MMB-409');
  const [itemCategory, setItemCategory] = useState<PassengerIncidentReport['itemCategory']>('Wallet / Cards');
  const [itemStorageLocker, setItemStorageLocker] = useState('Locker 3B (Terminal Security)');

  useEffect(() => {
    if (prefillData) {
      if (prefillData.type) setType(prefillData.type);
      if (prefillData.severity) setSeverity(prefillData.severity);
      if (prefillData.passengerName) setPassengerName(prefillData.passengerName);
      if (prefillData.passengerPhone) setPassengerPhone(prefillData.passengerPhone);
      if (prefillData.bookingRef) setBookingRef(prefillData.bookingRef);
      if (prefillData.gateNumber) setGateNumber(prefillData.gateNumber);
      if (prefillData.tripId) setTripId(prefillData.tripId);
      if (prefillData.vesselName) setVesselName(prefillData.vesselName);
      if (prefillData.description) setDescription(prefillData.description);
      if (prefillData.actionTaken) setActionTaken(prefillData.actionTaken);
      if (prefillData.status) setStatus(prefillData.status);
    }
  }, [prefillData, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: 'medical_faint' | 'lost_phone' | 'dispute') => {
    if (preset === 'medical_faint') {
      setType('Medical Emergency');
      setSeverity('High');
      setDescription('Passenger experienced mild heat exhaustion and dizziness while queuing at turnstile.');
      setActionTaken('Escorted to terminal air-conditioned first-aid bay; vitals stabilized; rehydration fluids administered.');
      setStatus('First-Aid Rendered');
    } else if (preset === 'lost_phone') {
      setType('Lost Property');
      setSeverity('Low');
      setDescription('Passenger reports leaving black iPhone 14 with blue case on passenger lounge bench near Gate 2.');
      setActionTaken('Logged with security desk. Broadcast radio alert to floor cleaning crew.');
      setStatus('Item Cataloged');
      setItemCategory('Smartphone');
      setItemStorageLocker('Locker 2A (Gate Dispatch)');
    } else if (preset === 'dispute') {
      setType('Ticketing Dispute');
      setSeverity('Medium');
      setDescription('QR code scan displayed expired voyage pass; passenger insists ticket was booked for 15:30 departure.');
      setActionTaken('Cross-checked against database manifest; verified payment ID; re-issued valid boarding barcode.');
      setStatus('Resolved');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIncident: PassengerIncidentReport = {
      id: `inc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      passengerName: passengerName.trim() || undefined,
      passengerPhone: passengerPhone.trim() || undefined,
      bookingRef: bookingRef.trim() || undefined,
      gateNumber,
      tripId,
      vesselName,
      description,
      actionTaken,
      staffName,
      staffBadgeId,
      status,
      itemCategory: type === 'Lost Property' ? itemCategory : undefined,
      itemStorageLocker: type === 'Lost Property' ? itemStorageLocker : undefined,
    };

    onSaveIncident(newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Log Passenger Incident / Occurrence</h2>
              <p className="text-xs text-slate-400">
                Official Maritime Gate Log • Medical, Lost Property & Disciplinary Reporting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('medical_faint')}
              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <HeartPulse className="w-3.5 h-3.5" /> Medical First-Aid
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('lost_phone')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/50 text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <PackageSearch className="w-3.5 h-3.5" /> Lost Property
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('dispute')}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" /> Ticket Resolution
            </button>
          </div>

          {/* Incident Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-300">
                Incident Category *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Medical Emergency">Medical Emergency / First Aid</option>
                <option value="Lost Property">Lost Property / Left Luggage</option>
                <option value="Disruptive Passenger">Disruptive Passenger / Unruly Behavior</option>
                <option value="Safety Violation">Safety Violation / Deck Breach</option>
                <option value="Accessibility Assistance">Accessibility / Wheelchair Escort</option>
                <option value="Ticketing Dispute">Ticketing Dispute / QR Error</option>
                <option value="Other">Other Operational Incident</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-300">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                  severity === 'Critical'
                    ? 'bg-rose-950 border-rose-700 text-rose-300 font-bold'
                    : severity === 'High'
                    ? 'bg-amber-950 border-amber-700 text-amber-300 font-bold'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Low">Low - Informational / Minor</option>
                <option value="Medium">Medium - Requires Staff Action</option>
                <option value="High">High - Emergency or Police / Paramedic</option>
                <option value="Critical">Critical - Life Safety / Immediate Halt</option>
              </select>
            </div>
          </div>

          {/* Passenger & Ticket Information */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Passenger & Location Context
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Passenger Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Rao"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98201 XXXXX"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs font-mono ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Booking Ref / PNR</label>
                <input
                  type="text"
                  placeholder="BK-2026-0901"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs font-mono uppercase ${
                    isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-cyan-700 font-bold'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Terminal Gate</label>
                <select
                  value={gateNumber}
                  onChange={(e) => setGateNumber(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Gate 1">Gate 1 (Bhaucha Dhakka)</option>
                  <option value="Gate 2">Gate 2 (Gateway North Ferry Pier)</option>
                  <option value="Gate 3">Gate 3 (Gateway Speedboat Jetty)</option>
                  <option value="Gate 4">Gate 4 (Mandwa Ro-Pax Berth)</option>
                  <option value="Gate 5">Gate 5 (Elephanta Jetty)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Active Trip</label>
                <select
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      Trip #{t.id} ({t.scheduledDeparture})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vessel</label>
                <select
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {ferries.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name} ({f.vesselId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conditional Lost Property Fields */}
          {type === 'Lost Property' && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <PackageSearch className="w-3.5 h-3.5" />
                Lost Property Cataloging Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Item Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as any)}
                    className={`w-full p-2 rounded-lg border text-xs ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Smartphone">Smartphone / Tablet</option>
                    <option value="Wallet / Cards">Wallet / Currency / Cards</option>
                    <option value="Luggage / Bag">Luggage / Handbag / Backpack</option>
                    <option value="Keys / Electronics">Keys / Smart Watch / Headphones</option>
                    <option value="IDs / Documents">Aadhaar / Passport / Travel Docs</option>
                    <option value="Other">Other Personal Effect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Secure Storage Locker</label>
                  <input
                    type="text"
                    value={itemStorageLocker}
                    onChange={(e) => setItemStorageLocker(e.target.value)}
                    placeholder="e.g. Locker 3B (Terminal Security)"
                    className={`w-full p-2 rounded-lg border text-xs ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Narrative & Action Taken */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Incident Occurrence Narrative *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe clearly what happened, location on vessel or gate, witnesses, and immediate observations..."
              className={`w-full p-3 rounded-xl border text-xs ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Immediate Mitigation & Action Taken *
            </label>
            <textarea
              rows={2}
              required
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Rendered oxygen first aid; dispatched terminal EMTs; cataloged item in secure locker..."
              className={`w-full p-3 rounded-xl border text-xs ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Incident Status & Officer Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Open">Open - Pending Action</option>
                <option value="First-Aid Rendered">First-Aid Rendered</option>
                <option value="Item Cataloged">Item Cataloged / Safekept</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved / Closed</option>
                <option value="Escalated to Port Security">Escalated to Port Police</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Reporting Officer</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Staff Badge ID</label>
              <input
                type="text"
                value={staffBadgeId}
                onChange={(e) => setStaffBadgeId(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-900/30 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Incident in Harbor Manifest</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
