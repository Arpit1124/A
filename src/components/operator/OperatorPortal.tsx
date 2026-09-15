import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { MaritimeMap } from '../map/MaritimeMap';
import { FleetClusterOverviewMap } from '../map/FleetClusterOverviewMap';
import { StatusBadge } from '../common/StatusBadge';
import { CameraQrScanner } from './CameraQrScanner';
import { IncidentLoggingModal } from './IncidentLoggingModal';
import { CrewManagementDashboard } from './CrewManagementDashboard';
import { OperatorPushAlertSystem } from './OperatorPushAlertSystem';
import { BoardingEfficiencyChart } from './BoardingEfficiencyChart';
import { QuickBoardingToolbar } from './QuickBoardingToolbar';
import { CapacityTrendsWidget } from './CapacityTrendsWidget';
import { OperatorThirtyDayTrendsDashboard } from './OperatorThirtyDayTrendsDashboard';
import { VesselOccupancyHeatmap } from './VesselOccupancyHeatmap';
import { WeatherThresholdMonitor } from './WeatherThresholdMonitor';
import { FleetEfficiencyWidget } from './FleetEfficiencyWidget';
import { Logo } from '../common/Logo';
import { Trip, Ferry, Passenger, VehicleInfo, ServiceAlert, TripStatus, PassengerIncidentReport, EmergencyIncident } from '../../types';
import {
  LayoutDashboard,
  Ship,
  Navigation,
  QrCode,
  BarChart3,
  ShieldAlert,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Car,
  TrendingUp,
  Fuel,
  Leaf,
  Wrench,
  Radio,
  Search,
  Bell,
  BellRing,
  Sliders,
  DollarSign,
  Activity,
  Compass,
  HeartPulse,
  PackageSearch,
  FileText,
  Lock,
  Unlock,
  Layers,
  CheckSquare,
  Square,
  Volume2,
  Wind,
  CloudRain,
  Waves,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export const OperatorPortal: React.FC = () => {
  const {
    operatorTab,
    setOperatorTab,
    ferries,
    trips,
    routes,
    ports,
    bookings,
    crew,
    alerts,
    emergencies,
    addAuditLog,
    updateTripStatus,
    updateFerry,
    publishAlert,
    declareEmergency,
    scanTicket,
    approveBoarding,
    setActiveView,
    setCurrentRole,
    simulationSpeed,
  } = useFerry();

  // Emergency Lockdown State & Dedicated Crew Protocol Checklist
  const [isEmergencyLockdown, setIsEmergencyLockdown] = useState<boolean>(false);
  const [emergencyChecklist, setEmergencyChecklist] = useState<
    {
      id: string;
      title: string;
      category: string;
      regulation: string;
      completed: boolean;
      completedAt?: string;
      completedBy?: string;
    }[]
  >([
    {
      id: 'ep-1',
      title: 'Sound General Emergency Alarm (7 short blasts + 1 prolonged blast on ship horn)',
      category: 'Safety',
      regulation: 'SOLAS III/6.4',
      completed: false,
    },
    {
      id: 'ep-2',
      title: 'Broadcast MAYDAY / PAN-PAN Distress on VHF Marine Channel 16 (156.8 MHz) & DSC Alert',
      category: 'Communication',
      regulation: 'GMDSS / ITU-R M.493',
      completed: false,
    },
    {
      id: 'ep-3',
      title: 'Activate Vessel AIS-SART & 406 MHz Satellite EPIRB Distress Transponder',
      category: 'Communication',
      regulation: 'SOLAS IV/7',
      completed: false,
    },
    {
      id: 'ep-4',
      title: 'Muster Passengers at Designated Assembly Stations & Inspect Lifejackets (100% donning)',
      category: 'Evacuation',
      regulation: 'SOLAS III/7.2',
      completed: false,
    },
    {
      id: 'ep-5',
      title: 'Notify MRCC Mumbai (Indian Coast Guard +91-22-22614040) & Mumbai Port Trust SAR',
      category: 'Communication',
      regulation: 'IAMSAR Vol II',
      completed: false,
    },
    {
      id: 'ep-6',
      title: 'Isolate Quick-Closing Fuel Valves, Close Watertight Bulkhead Doors & Arm Bilge Pumps',
      category: 'Machinery',
      regulation: 'SOLAS II-1/13',
      completed: false,
    },
    {
      id: 'ep-7',
      title: 'Prepare Life Rafts (Hydrostatic Release Units) & Rig Scramble Recovery Nets',
      category: 'Evacuation',
      regulation: 'SOLAS III/13',
      completed: false,
    },
    {
      id: 'ep-8',
      title: 'Maintain Continuous VHF Radio Watch on Ch 16 & Transmit Live GPS Drift Vector',
      category: 'Safety',
      regulation: 'DG Shipping M.S. 2020',
      completed: false,
    },
  ]);

  const handleDeclareEmergencyImmediate = (
    ferryIdToTarget?: string,
    type?: EmergencyIncident['type'],
    notes?: string
  ) => {
    const targetId = ferryIdToTarget || emergencyFerryId || ferries[0]?.id || 'ferry-gateway-1';
    const targetFerry = ferries.find((f) => f.id === targetId) || ferries[0];
    const incidentType = type || emergencyType || 'Engine failure';
    const detailNotes =
      notes ||
      emergencyNotes ||
      'CRITICAL MARITIME DISTRESS SIGNAL BROADCAST: MAYDAY ON VHF CH 16. PRIORITY SEARCH AND RESCUE PROTOCOL ACTIVATED.';

    // 1. Immediately trigger distress signal
    declareEmergency(targetId, incidentType, detailNotes);

    // 2. Broadcast critical service alert
    publishAlert({
      title: `🚨 MAYDAY: DISTRESS SIGNAL ACTIVE - ${targetFerry.name.toUpperCase()}`,
      message: `Immediate emergency protocol active for ${targetFerry.name} (${targetFerry.vesselId}) at ${targetFerry.position.lat.toFixed(3)}°N, ${targetFerry.position.lng.toFixed(3)}°E. Non-essential operations suspended. Coast Guard MRCC notified.`,
      severity: 'critical',
      category: 'Port Advisory',
      affectedFerryId: targetId,
      validUntil: '2026-09-06T23:59:59Z',
      channels: ['Push', 'Web', 'SMS'],
    });

    // 3. Enable Emergency Lockdown mode
    setIsEmergencyLockdown(true);

    // 4. Switch to Emergency Center tab
    setOperatorTab('emergency');
    setIsEmergencyModalOpen(false);

    // 5. Add audit log
    addAuditLog(
      'Distress Signal Declared',
      'System',
      `High-priority emergency distress signal triggered for ${targetFerry.name}. Non-essential UI controls locked.`
    );
  };

  const handleToggleEmergencyChecklist = (itemId: string) => {
    setEmergencyChecklist((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const nextState = !item.completed;
          const nowStr = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          if (nextState) {
            addAuditLog(
              'Emergency Protocol Executed',
              'System',
              `Completed protocol: ${item.title} (${item.regulation})`
            );
          }
          return {
            ...item,
            completed: nextState,
            completedAt: nextState ? nowStr : undefined,
            completedBy: nextState ? 'Duty Watch Officer' : undefined,
          };
        }
        return item;
      })
    );
  };

  const handleStandDownEmergency = () => {
    setIsEmergencyLockdown(false);
    addAuditLog(
      'Distress Signal Stood Down',
      'System',
      'Harbor Operations stood down emergency lockdown. Standard UI controls restored.'
    );
  };

  // Passenger Incident Logging State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentPrefill, setIncidentPrefill] = useState<Partial<PassengerIncidentReport> | null>(null);
  const [incidents, setIncidents] = useState<PassengerIncidentReport[]>([
    {
      id: 'inc-101',
      timestamp: '2026-09-06T14:15:00Z',
      type: 'Lost Property',
      severity: 'Low',
      passengerName: 'Rohit K. Verma',
      passengerPhone: '+91 98201 55432',
      bookingRef: 'BK-2026-0901',
      gateNumber: 'Gate 2',
      vesselName: 'M.V. Mandwa Pride',
      tripId: 'TRP-101',
      description: 'Black leather wallet with Mumbai metro card and driver license misplaced near gate turnstile.',
      actionTaken: 'Item cataloged in security safe. Passenger notified via registered SMS.',
      staffName: 'Anand Patil',
      staffBadgeId: 'STAFF-MMB-409',
      status: 'Item Cataloged',
      itemCategory: 'Wallet / Cards',
      itemStorageLocker: 'Locker 3B (Terminal Security)',
    },
    {
      id: 'inc-102',
      timestamp: '2026-09-06T13:40:00Z',
      type: 'Medical Emergency',
      severity: 'High',
      passengerName: 'Kavita Deshmukh',
      passengerPhone: '+91 97654 32100',
      gateNumber: 'Gate 2',
      vesselName: 'M.V. Sea Breeze',
      tripId: 'TRP-103',
      description: 'Elderly passenger reported severe dizziness and dehydration in waiting lounge prior to boarding.',
      actionTaken: 'Harbor EMTs administered saline drip and oxygen; vitals returned to normal 120/80; boarding rescheduled to 16:30.',
      staffName: 'Sanjay Shinde',
      staffBadgeId: 'STAFF-MMB-412',
      status: 'First-Aid Rendered',
    },
  ]);

  const handleSaveIncident = (newIncident: PassengerIncidentReport) => {
    setIncidents((prev) => [newIncident, ...prev]);
  };

  // Create Trip Modal
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [newTripRouteId, setNewTripRouteId] = useState(routes[0]?.id || '');
  const [newTripFerryId, setNewTripFerryId] = useState(ferries[0]?.id || '');
  const [newTripDeparture, setNewTripDeparture] = useState('15:30');
  const [newTripGate, setNewTripGate] = useState('G-1');

  // Emergency SAR Modal
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState<
    'Engine failure' | 'Man overboard' | 'Medical emergency' | 'Collision risk'
  >('Engine failure');
  const [emergencyFerryId, setEmergencyFerryId] = useState(ferries[0]?.id || '');
  const [emergencyNotes, setEmergencyNotes] = useState(
    'Engine temperature elevated above 105°C in Mandwa fairway. Vessel drifting at 1.2 kts.'
  );

  // QR Turnstile Scanner Simulator
  const [activeBoardingTripId, setActiveBoardingTripId] = useState<string>(trips[0]?.id || '');
  const [scanInputRef, setScanInputRef] = useState<string>('BK-2026-0901');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  // Broadcast Alert Form
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('Swell Warning in Southern Channel');
  const [alertMessage, setAlertMessage] = useState(
    'Wave swells reaching 1.8m due to high tide. Proceed at cruising speed.'
  );
  const [alertSeverity, setAlertSeverity] = useState<ServiceAlert['severity']>('medium');

  // Overview Map Mode: Standard AIS Radar vs Regional Fuel Clusters Map
  const [overviewMapMode, setOverviewMapMode] = useState<'radar' | 'clusters'>('radar');

  const selectedBoardingTrip = trips.find((t) => t.id === activeBoardingTripId) || trips[0];
  const assignedFerryForBoarding = ferries.find((f) => f.id === selectedBoardingTrip?.ferryId);

  // Filtered Bookings for Boarding
  const tripBookings = bookings.filter((b) => b.tripId === selectedBoardingTrip?.id);
  const allTripPassengers = tripBookings.flatMap((b) =>
    b.passengers.map((p) => ({
      ...p,
      bookingRef: b.bookingRef,
      bookingId: b.id,
      boarded: b.bookingStatus === 'boarded',
    }))
  );

  const boardedCount = allTripPassengers.filter((p) => p.boarded).length;

  const handleCreateTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateTripOpen(false);
  };

  const handleScanBarcode = () => {
    if (!scanInputRef.trim()) return;
    const res = scanTicket(scanInputRef.trim());

    if (res.status === 'VALID' && res.booking) {
      if (res.booking.passengers[0]) {
        approveBoarding(res.booking.id, res.booking.passengers[0].id);
      }
      setScanResult({
        success: true,
        message: `VALID TURNSTILE PASS: Passenger manifest verified for ${res.booking.passengers[0]?.fullName} (Seats ${res.booking.seatNumbers.join(
          ', '
        )}).`,
      });
    } else {
      setScanResult({
        success: false,
        message: `INVALID OR UNRECOGNIZED PASS: Status is ${res.status}. Please check gate and trip details.`,
      });
    }
  };

  const handleTriggerEmergency = () => {
    handleDeclareEmergencyImmediate(emergencyFerryId, emergencyType, emergencyNotes);
    setIsEmergencyModalOpen(false);
  };

  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    publishAlert({
      title: alertTitle,
      message: alertMessage,
      severity: alertSeverity,
      category: 'Weather Warning',
      affectedRouteId: routes[0]?.id,
      validUntil: '2026-09-05T23:59:59Z',
      channels: ['Push', 'Web', 'SMS'],
    });
    setIsCreateAlertOpen(false);
  };

  // Recharts Analytics Datasets
  const hourlyPassengerData = [
    { hour: '07:00', passengers: 140, capacity: 400 },
    { hour: '08:00', passengers: 380, capacity: 400 },
    { hour: '09:00', passengers: 420, capacity: 500 },
    { hour: '10:00', passengers: 290, capacity: 400 },
    { hour: '11:00', passengers: 210, capacity: 400 },
    { hour: '12:00', passengers: 190, capacity: 400 },
    { hour: '13:00', passengers: 230, capacity: 400 },
    { hour: '14:00', passengers: 310, capacity: 400 },
    { hour: '15:00', passengers: 480, capacity: 500 },
    { hour: '16:00', passengers: 510, capacity: 500 },
    { hour: '17:00', passengers: 460, capacity: 500 },
    { hour: '18:00', passengers: 390, capacity: 400 },
  ];

  const routePerformanceData = [
    { name: 'Gateway-Mandwa', onTimePercent: 96, trips: 18, revenue: 145000 },
    { name: 'Mandwa-Gateway', onTimePercent: 93, trips: 18, revenue: 139000 },
    { name: 'Gateway-Elephanta', onTimePercent: 98, trips: 12, revenue: 84000 },
    { name: 'Bhaucha-Rewas', onTimePercent: 88, trips: 6, revenue: 44000 },
  ];

  const passengerCategoryData = [
    { name: 'Adult Commuter', value: 68, color: '#06b6d4' },
    { name: 'Ro-Pax Vehicles', value: 16, color: '#38bdf8' },
    { name: 'Senior Citizens', value: 10, color: '#10b981' },
    { name: 'Tourists / Kids', value: 6, color: '#f59e0b' },
  ];

  return (
    <div id="operator-command-center" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Operations Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-950/70">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-cyan-800/80 p-1 flex items-center justify-center text-cyan-400 shadow-md">
            <Logo size={32} variant="blue" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Harbor Operations Command Center</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                MMB DISPATCH TERMINAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified AIS radar tracking, trip scheduling, passenger manifests, and emergency response coordination
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateAlertOpen(true)}
            disabled={isEmergencyLockdown}
            title={
              isEmergencyLockdown
                ? 'Non-essential control disabled during active maritime distress protocol'
                : 'Broadcast Advisory'
            }
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              isEmergencyLockdown
                ? 'bg-slate-950 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300'
            }`}
          >
            {isEmergencyLockdown ? (
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Bell className="w-4 h-4 text-amber-400" />
            )}
            <span>Broadcast Advisory</span>
          </button>

          <div className="flex items-center rounded-xl bg-red-950 border border-red-700 p-0.5 shadow-lg shadow-red-950/50">
            <button
              id="declare-emergency-button"
              onClick={() => handleDeclareEmergencyImmediate()}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
            >
              <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
              <span>Declare Emergency</span>
            </button>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              title="Configure Incident Details"
              className="px-2 py-2 hover:bg-red-900 text-red-200 rounded-lg text-xs transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setCurrentRole('captain');
              setActiveView('captain');
            }}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Captain Bridge</span>
          </button>
        </div>
      </div>

      {/* EMERGENCY PROTOCOL ACTIVE - HIGH PRIORITY DISTRESS BANNER */}
      {isEmergencyLockdown && (
        <div className="bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-red-950/80 space-y-3 animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black animate-bounce shadow-lg shadow-red-600/50">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white tracking-wide">
                    MAYDAY DISTRESS PROTOCOL ACTIVATED
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600 text-white font-extrabold uppercase">
                    VHF CH 16 DISTRESS LIVE
                  </span>
                </div>
                <p className="text-xs text-red-200 mt-0.5">
                  Non-essential harbor UI controls are locked. Coast Guard MRCC Mumbai alerted. Follow dedicated emergency checklist below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOperatorTab('emergency')}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                <span>
                  Checklist (
                  {emergencyChecklist.filter((c) => c.completed).length} /{' '}
                  {emergencyChecklist.length})
                </span>
              </button>

              <button
                onClick={handleStandDownEmergency}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-700/60 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Stand Down Lockdown</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operator Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-medium">
        {[
          { id: 'overview', label: 'Overview & AIS Radar', icon: Activity },
          { id: 'efficiency', label: 'Fleet Efficiency & Eco-Speed', icon: Leaf, badge: 'Eco Carbon' },
          { id: 'deck_heatmap', label: 'Vessel Occupancy Heatmap (D3)', icon: Layers, badge: 'D3 Boarding' },
          { id: 'weather', label: 'Weather Threshold Monitor', icon: Wind, badge: 'Sea Safety' },
          { id: 'clusters', label: 'Fleet Fuel Clusters', icon: Fuel, badge: '4 Regions' },
          { id: 'push_alerts', label: 'Push Alert System', icon: BellRing, badge: 'Live' },
          { id: 'trips', label: 'Trip Schedules & Dispatch', icon: Navigation, badge: trips.length },
          { id: 'fleet', label: 'Fleet Telemetry & Vessels', icon: Ship, badge: ferries.length },
          { id: 'crew', label: 'Crew Management', icon: Users, badge: crew.length },
          { id: 'boarding', label: 'Gate QR Scanner & Manifest', icon: QrCode },
          { id: 'thirty_day_trends', label: '30-Day Throughput & Trends', icon: TrendingUp, badge: '30 Days' },
          { id: 'analytics', label: 'Passenger & Harbor Analytics', icon: BarChart3 },
          { id: 'emergency', label: 'Emergency Center', icon: ShieldAlert, danger: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = operatorTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setOperatorTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? tab.danger
                    ? 'bg-red-900 text-white font-bold'
                    : 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950 text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & AIS RADAR */}
      {operatorTab === 'overview' && (
        <div className="space-y-6">
          {/* Requirement: Quick Boarding toolbar for OperatorPortal */}
          <QuickBoardingToolbar
            trips={trips}
            ferries={ferries}
            routes={routes}
            ports={ports}
            onUpdateTripStatus={updateTripStatus}
            onPublishAlert={publishAlert}
          />

          {/* Executive KPI Metric Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Active Fleet</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold font-mono text-white">{ferries.length}</span>
                <Ship className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                {ferries.filter((f) => f.speedKnots > 0).length} Underway
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Scheduled Trips</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold font-mono text-cyan-300">{trips.length}</span>
                <Navigation className="w-5 h-5 text-sky-400" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Across 4 Harbor Routes</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">On-Time Reliability</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-400">94.2%</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">+1.4% vs 7-day average</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Daily Passengers</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold font-mono text-white">2,840</span>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Peak morning commute cleared</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">Estimated Revenue</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-300">₹4,12,000</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Direct + Online Booking</span>
            </div>
          </div>

          {/* AIS Tactical Radar Display or Regional Fleet Fuel Clusters Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                {overviewMapMode === 'radar'
                  ? 'Live AIS Marine Plotter & Geofence Approach Monitor'
                  : 'Harbour Regional Vessel Clusters & Fuel Telemetry Matrix'}
              </span>
              <div className="flex items-center gap-2">
                {/* Map Mode Toggle Switch */}
                <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOverviewMapMode('radar')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                      overviewMapMode === 'radar'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>AIS Radar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewMapMode('clusters')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                      overviewMapMode === 'clusters'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Fuel className="w-3 h-3" />
                    <span>Fuel Clusters</span>
                  </button>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 hidden sm:inline-block" />
                <span className="font-mono text-[11px] hidden sm:inline-block">
                  Refresh: {(2.5 / simulationSpeed).toFixed(1)}s
                </span>
              </div>
            </div>

            {overviewMapMode === 'radar' ? (
              <MaritimeMap heightClass="h-[520px]" showControls={true} />
            ) : (
              <FleetClusterOverviewMap />
            )}
          </div>

          {/* Quick Dispatch Table Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Active & Impending Dispatches</h3>
              <button
                onClick={() => setOperatorTab('trips')}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                View All Trips ({trips.length}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Trip ID</th>
                    <th className="pb-2">Route</th>
                    <th className="pb-2">Vessel</th>
                    <th className="pb-2">Sched. Dep</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Gate</th>
                    <th className="pb-2">Booked Pax</th>
                    <th className="pb-2 text-right">Quick Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {trips.slice(0, 4).map((t) => {
                    const r = routes.find((route) => route.id === t.routeId);
                    const f = ferries.find((ferry) => ferry.id === t.ferryId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-mono text-cyan-400 font-bold">{t.id}</td>
                        <td className="py-3 text-white">{r?.name}</td>
                        <td className="py-3 text-slate-300">
                          {f?.name} <span className="text-[10px] text-slate-500 font-mono">({f?.vesselId})</span>
                        </td>
                        <td className="py-3 font-mono text-slate-200">{t.scheduledDeparture}</td>
                        <td className="py-3">
                          <StatusBadge status={t.status} size="sm" />
                        </td>
                        <td className="py-3 font-mono text-slate-300">{t.gateNumber}</td>
                        <td className="py-3 font-mono text-emerald-400">
                          {t.bookedPassengers} / {t.passengerCapacity}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              updateTripStatus(t.id, t.status === 'in_transit' ? 'arrived' : 'in_transit');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                          >
                            Toggle Transit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Requirement: Capacity Trends widget for OperatorPortal */}
          <CapacityTrendsWidget trips={trips} ferries={ferries} routes={routes} />

          {/* Requirement: Fleet Efficiency Widget for OperatorPortal */}
          <FleetEfficiencyWidget />
        </div>
      )}

      {/* TAB: FLEET EFFICIENCY & ECO-SPEED */}
      {operatorTab === 'efficiency' && (
        <div className="space-y-6 animate-in fade-in">
          <FleetEfficiencyWidget />
        </div>
      )}

      {/* TAB: FLEET FUEL CLUSTERS */}
      {operatorTab === 'clusters' && (
        <div className="space-y-6">
          <FleetClusterOverviewMap />
        </div>
      )}

      {/* TAB 2: TRIPS & SCHEDULES DISPATCH */}
      {operatorTab === 'trips' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Trip Management & Harbor Dispatch</h2>
              <p className="text-xs text-slate-400">
                Control vessel assignments, trigger gate boarding, declare delay buffers, or launch new trips
              </p>
            </div>

            <button
              disabled={isEmergencyLockdown}
              onClick={() => setIsCreateTripOpen(true)}
              title={
                isEmergencyLockdown
                  ? 'Non-essential control disabled during active maritime distress protocol'
                  : 'Create New Trip'
              }
              className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 ${
                isEmergencyLockdown
                  ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950'
              }`}
            >
              {isEmergencyLockdown ? (
                <Lock className="w-4 h-4 text-rose-400" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Create New Trip {isEmergencyLockdown && '(Locked)'}</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">Trip ID</th>
                    <th className="pb-2.5">Corridor Route</th>
                    <th className="pb-2.5">Assigned Ferry</th>
                    <th className="pb-2.5">Departure</th>
                    <th className="pb-2.5">Arrival / ETA</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Capacity</th>
                    <th className="pb-2.5 text-right">Dispatch Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {trips.map((t) => {
                    const r = routes.find((route) => route.id === t.routeId);
                    const f = ferries.find((ferry) => ferry.id === t.ferryId);

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 font-mono text-cyan-400 font-bold">{t.id}</td>
                        <td className="py-3.5 text-white">{r?.name}</td>
                        <td className="py-3.5">
                          <div className="text-slate-200 font-semibold">{f?.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{f?.vesselId}</div>
                        </td>
                        <td className="py-3.5 font-mono text-slate-300">{t.scheduledDeparture}</td>
                        <td className="py-3.5 font-mono text-cyan-300 font-bold">{t.estimatedArrival}</td>
                        <td className="py-3.5">
                          <StatusBadge status={t.status} size="sm" />
                        </td>
                        <td className="py-3.5 font-mono text-slate-300">
                          {t.bookedPassengers} / {t.passengerCapacity}
                        </td>
                        <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {t.status !== 'boarding' && (
                            <button
                              onClick={() => updateTripStatus(t.id, 'boarding')}
                              className="px-2 py-1 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 text-sky-300 text-[11px] font-semibold"
                            >
                              Open Boarding
                            </button>
                          )}
                          {t.status !== 'in_transit' && (
                            <button
                              onClick={() => updateTripStatus(t.id, 'in_transit')}
                              className="px-2 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-[11px] font-semibold"
                            >
                              Depart
                            </button>
                          )}
                          {t.status !== 'delayed' && (
                            <button
                              onClick={() => updateTripStatus(t.id, 'delayed', 10)}
                              className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-800/60 text-amber-300 text-[11px] font-semibold"
                            >
                              +10m Delay
                            </button>
                          )}
                          {t.status !== 'arrived' && (
                            <button
                              onClick={() => updateTripStatus(t.id, 'arrived')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                            >
                              Arrived
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-Time Vessel Route Deviation & Mechanical Push Alert System */}
          <OperatorPushAlertSystem />
        </div>
      )}

      {/* TAB: PUSH NOTIFICATION ALERT SYSTEM */}
      {operatorTab === 'push_alerts' && <OperatorPushAlertSystem />}

      {/* TAB 3: FLEET MANAGEMENT */}
      {operatorTab === 'fleet' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Commercial Vessel Fleet Telemetry</h2>
            <p className="text-xs text-slate-400">
              Engine health diagnostics, fuel monitoring, seaworthiness compliance, and drydock scheduling
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ferries.map((f) => (
              <div
                key={f.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{f.name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                        {f.vesselId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{f.type}</div>
                  </div>
                  <StatusBadge status={f.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[10px] block">ENGINE HEALTH</span>
                    <span className="font-mono text-emerald-400 font-bold">{f.engineHealth}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">FUEL RESERVE</span>
                    <span className="font-mono text-cyan-300 font-bold">{f.fuelLevel}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">CRUISE SPEED</span>
                    <span className="font-mono text-white">{f.speedKnots} knots</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">CAPACITY LOAD</span>
                    <span className="font-mono text-indigo-300">
                      {f.currentPassengers}/{f.capacity}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div>
                    Master: <span className="text-slate-200 font-medium">{f.captainName}</span>
                  </div>
                  <div>
                    MMSI: <span className="font-mono text-slate-200">{f.aisIdentifier}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => updateFerry(f.id, { status: f.status === 'docked' ? 'on_time' : 'docked' })}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    {f.status === 'docked' ? 'Dispatch Vessel' : 'Set Docked'}
                  </button>
                  <button
                    onClick={() => updateFerry(f.id, { status: 'maintenance' as any })}
                    className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 text-xs font-semibold transition-colors"
                  >
                    Maintenance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DIGITAL BOARDING & QR MANIFEST SCANNER */}
      {operatorTab === 'boarding' && (
        <div className="space-y-6">
          {/* Quick Boarding toolbar */}
          <QuickBoardingToolbar
            trips={trips}
            ferries={ferries}
            routes={routes}
            ports={ports}
            onUpdateTripStatus={updateTripStatus}
            onPublishAlert={publishAlert}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Digital Boarding Gate & Manifest Turnstile</h2>
              <p className="text-xs text-slate-400">
                Scan passenger QR barcodes, verify vehicle deck loading, and confirm live boarding counts
              </p>
            </div>

            {/* Gate Controls & Incident Logger */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setIncidentPrefill({
                    gateNumber: `Gate ${selectedBoardingTrip.gateNumber}`,
                    tripId: selectedBoardingTrip.id,
                    vesselName: assignedFerryForBoarding?.name,
                  });
                  setIsIncidentModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/30 flex items-center gap-1.5 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Log Passenger Incident</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Active Gate Trip:</span>
                <select
                  value={activeBoardingTripId}
                  onChange={(e) => setActiveBoardingTripId(e.target.value)}
                  className="bg-slate-900 text-white text-xs p-2 rounded-xl border border-slate-800 focus:outline-none"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      Trip #{t.id} - Gate {t.gateNumber} ({t.scheduledDeparture})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Live Camera Optical QR Scanner & Hardware Verification */}
            <div className="lg:col-span-6 space-y-4">
              <CameraQrScanner
                activeGateNumber={`Gate ${selectedBoardingTrip.gateNumber}`}
                onScanComplete={(details) => {
                  setScanResult({
                    success: details.status === 'VALID',
                    message:
                      details.status === 'VALID'
                        ? `VALID TURNSTILE PASS: Passenger manifest verified for ${details.passengerName} (Seats: ${details.seatNumbers?.join(', ') || 'Deck'}).`
                        : `BOARDING DENIED: Status is ${details.status}. Please check gate and trip details.`,
                  });
                }}
              />

              {/* Barcode Ref Manual Input / Scanner Reader Fallback */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
                <label className="text-xs font-semibold text-slate-300">Manual Booking Reference Overwrite</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={scanInputRef}
                    onChange={(e) => setScanInputRef(e.target.value)}
                    placeholder="e.g. BK-2026-0901"
                    className="flex-1 bg-slate-950 text-white font-mono text-xs p-2.5 rounded-xl border border-slate-800 uppercase"
                  />
                  <button
                    onClick={handleScanBarcode}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Manual Verify
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Live Passenger Manifest & Vehicle Deck Roster */}
            <div className="lg:col-span-6 space-y-4">
              {/* Manifest Stats */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Gate Manifest for {assignedFerryForBoarding?.name}
                    </h3>
                    <div className="text-xs text-slate-400">
                      Departure {selectedBoardingTrip.scheduledDeparture} • Gate {selectedBoardingTrip.gateNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Boarded</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {boardedCount} / {allTripPassengers.length}
                    </span>
                  </div>
                </div>

                {/* Passenger Checklist */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {allTripPassengers.length > 0 ? (
                    allTripPassengers.map((p, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          p.boarded
                            ? 'bg-emerald-950/20 border-emerald-800/50 text-slate-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              p.boarded ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {p.boarded ? '✓' : idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white">{p.fullName}</div>
                            <div className="text-[10px] text-slate-500">
                              Ref: {p.bookingRef} • {p.category} ({p.idType}: {p.idNumber})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              p.boarded
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.boarded ? 'Boarded' : 'Waiting'}
                          </span>

                          <button
                            onClick={() => {
                              setIncidentPrefill({
                                passengerName: p.fullName,
                                passengerPhone: p.mobile,
                                bookingRef: p.bookingRef,
                                gateNumber: `Gate ${selectedBoardingTrip.gateNumber}`,
                                tripId: selectedBoardingTrip.id,
                                vesselName: assignedFerryForBoarding?.name,
                              });
                              setIsIncidentModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                            title="Log passenger incident or lost item"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Incident</span>
                          </button>

                          {!p.boarded && (
                            <button
                              onClick={() => {
                                approveBoarding(p.bookingId, p.id);
                              }}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold text-[11px]"
                            >
                              Check In
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No passengers booked for this scheduled trip yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Historical Passenger Boarding Efficiency & Ticket Validation Times Chart */}
          <BoardingEfficiencyChart />

          {/* Gate Incident Log Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Gate Incident & Occurrence Log</h3>
                  <p className="text-xs text-slate-400">
                    Active medical calls, lost property catalog, and turnstile disputes logged by staff
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIncidentPrefill(null);
                  setIsIncidentModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Incident Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-lg text-xs ${
                          inc.type === 'Medical Emergency'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : inc.type === 'Lost Property'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        }`}
                      >
                        {inc.type === 'Medical Emergency' ? (
                          <HeartPulse className="w-3.5 h-3.5" />
                        ) : inc.type === 'Lost Property' ? (
                          <PackageSearch className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-white">{inc.type}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inc.gateNumber} • {inc.vesselName || 'Pier Area'} • {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        inc.severity === 'High' || inc.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : inc.severity === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {inc.severity} Severity
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{inc.description}</p>

                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div>
                      <strong className="text-slate-300">Action:</strong> {inc.actionTaken}
                    </div>
                    {inc.passengerName && (
                      <div>
                        <strong className="text-slate-300">Passenger:</strong> {inc.passengerName}{' '}
                        {inc.passengerPhone && <span className="font-mono">({inc.passengerPhone})</span>}
                      </div>
                    )}
                    {inc.itemStorageLocker && (
                      <div className="text-amber-400">
                        <strong>Storage:</strong> {inc.itemStorageLocker} ({inc.itemCategory})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                    <span>Officer: {inc.staffName} ({inc.staffBadgeId})</span>
                    <span className="text-emerald-400 font-semibold">{inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: 30-DAY PASSENGER THROUGHPUT & BOOKING TRENDS */}
      {operatorTab === 'thirty_day_trends' && (
        <OperatorThirtyDayTrendsDashboard />
      )}

      {/* TAB 5: ANALYTICS & INSIGHTS */}
      {operatorTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Harbor Operations & Passenger Analytics</h2>
            <p className="text-xs text-slate-400">
              Corridor passenger velocity, route profitability, on-time performance distributions, and fleet utilization
            </p>
          </div>

          {/* 30-Day Passenger Throughput & Booking Trends Recharts Suite */}
          <OperatorThirtyDayTrendsDashboard />

          {/* Passenger Boarding Efficiency & Ticket Validation Times Chart */}
          <BoardingEfficiencyChart />

          {/* Requirement: Capacity Trends Widget */}
          <CapacityTrendsWidget trips={trips} ferries={ferries} routes={routes} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Commuter Flow Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Hourly Passenger Flow (Commuters)</h3>
                <span className="text-[10px] font-mono text-cyan-400">TODAY'S SURGE PATTERN</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyPassengerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Bar dataKey="passengers" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Actual Passengers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Passenger Demographics Pie */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Passenger Category Breakdown</h3>
                <span className="text-[10px] font-mono text-emerald-400">MANIFEST DISTRIBUTION</span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passengerCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {passengerCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Route Performance Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm">Route Reliability & Revenue Generation</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Route</th>
                    <th className="pb-2">Trips Today</th>
                    <th className="pb-2">On-Time Performance</th>
                    <th className="pb-2">Daily Revenue</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {routePerformanceData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-3 text-white font-bold">{r.name}</td>
                      <td className="py-3 font-mono text-slate-300">{r.trips}</td>
                      <td className="py-3 font-mono text-emerald-400">{r.onTimePercent}%</td>
                      <td className="py-3 font-mono text-cyan-300 font-bold">₹{r.revenue.toLocaleString()}</td>
                      <td className="py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Optimal
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: VESSEL OCCUPANCY HEATMAP (D3) */}
      {operatorTab === 'deck_heatmap' && (
        <div className="space-y-6">
          <VesselOccupancyHeatmap />
        </div>
      )}

      {/* TAB 6: EMERGENCY SAR & DEDICATED PROTOCOL CHECKLIST */}
      {operatorTab === 'emergency' && (
        <div className="space-y-6">
          {/* Emergency Alert & Distress Broadcast Header */}
          <div
            className={`border rounded-2xl p-6 shadow-2xl space-y-4 transition-all ${
              isEmergencyLockdown
                ? 'bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-red-500'
                : 'bg-red-950/30 border-red-800/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                    isEmergencyLockdown
                      ? 'bg-red-600 border-red-400 text-white animate-bounce shadow-lg shadow-red-600/50'
                      : 'bg-red-900/60 border-red-700 text-red-400'
                  }`}
                >
                  <ShieldAlert className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Maritime Emergency Response & SAR Protocol
                    </h2>
                    {isEmergencyLockdown ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600 text-white font-extrabold uppercase animate-pulse">
                        DISTRESS LOCKDOWN ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-800">
                        MONITORING / STANDBY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-200 mt-0.5">
                    GMDSS distress transponder coordination, nearest harbor asset triangulation, and Indian Coast Guard dispatch
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEmergencyLockdown ? (
                  <button
                    onClick={handleStandDownEmergency}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-red-700 text-red-200 text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span>Stand Down Distress Lockdown</span>
                  </button>
                ) : (
                  <button
                    id="declare-distress-emergency-tab-btn"
                    onClick={() => handleDeclareEmergencyImmediate()}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-red-950 animate-pulse"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Declare Emergency (MAYDAY)</span>
                  </button>
                )}

                <button
                  onClick={() => setIsEmergencyModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Configure Incident</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="bg-slate-950/90 p-4 rounded-xl border border-red-900/40 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">SAR Emergency Frequency</span>
                <span className="text-base font-bold font-mono text-red-400 block">VHF Marine Ch 16 (156.800 MHz)</span>
                <span className="text-slate-500 text-[10px]">Harbor Control Active Monitoring</span>
              </div>
              <div className="bg-slate-950/90 p-4 rounded-xl border border-red-900/40 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Coast Guard MRCC Mumbai</span>
                <span className="text-base font-bold font-mono text-white block">+91 22 2261 4040</span>
                <span className="text-emerald-400 text-[10px]">Direct Hotwire Operational</span>
              </div>
              <div className="bg-slate-950/90 p-4 rounded-xl border border-red-900/40 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Active Harbor Responders</span>
                <span className="text-base font-bold font-mono text-cyan-400 block">2 SAR Tugboats on Standby</span>
                <span className="text-slate-500 text-[10px]">Stationed at Apollo Bunder</span>
              </div>
            </div>
          </div>

          {/* DEDICATED EMERGENCY PROTOCOL CHECKLIST FOR THE CREW */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base tracking-tight">
                    Dedicated Emergency Protocol Checklist for Crew
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    IMO SOLAS / DG SHIPPING
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mandatory operational procedure checklist for bridge watchkeepers and deck officers during maritime distress
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-white">
                    {emergencyChecklist.filter((c) => c.completed).length} of {emergencyChecklist.length} Completed
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {Math.round((emergencyChecklist.filter((c) => c.completed).length / emergencyChecklist.length) * 100)}% Verified
                  </div>
                </div>

                <div className="w-28 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${(emergencyChecklist.filter((c) => c.completed).length / emergencyChecklist.length) * 100}%`,
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    const allDone = emergencyChecklist.every((c) => c.completed);
                    const nowStr = new Date().toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    setEmergencyChecklist((prev) =>
                      prev.map((item) => ({
                        ...item,
                        completed: !allDone,
                        completedAt: !allDone ? nowStr : undefined,
                        completedBy: !allDone ? 'Duty Watch Officer' : undefined,
                      }))
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  {emergencyChecklist.every((c) => c.completed) ? 'Reset Checklist' : 'Verify All Protocols'}
                </button>
              </div>
            </div>

            {/* Checklist Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {emergencyChecklist.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleEmergencyChecklist(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                    item.completed
                      ? 'bg-emerald-950/20 border-emerald-600/60 hover:border-emerald-500'
                      : isEmergencyLockdown
                      ? 'bg-slate-950 border-red-900/60 hover:border-red-600'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        className={`mt-0.5 p-1 rounded-md transition-colors ${
                          item.completed
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-900 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 font-bold" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            STEP {idx + 1}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                              item.category === 'Communication'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : item.category === 'Evacuation'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : item.category === 'Machinery'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {item.category}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {item.regulation}
                          </span>
                        </div>

                        <h4
                          className={`text-xs font-semibold mt-1 leading-snug ${
                            item.completed ? 'text-emerald-200 line-through' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                    <span className="text-slate-500">
                      {item.completed ? (
                        <span className="text-emerald-400">
                          ✓ Verified at {item.completedAt}
                        </span>
                      ) : (
                        <span className={isEmergencyLockdown ? 'text-red-400' : 'text-slate-500'}>
                          Pending Watchkeeper Signoff
                        </span>
                      )}
                    </span>
                    {item.completedBy && (
                      <span className="text-slate-400">{item.completedBy}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Emergency Transponder Readout */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Vessel Safety Check & Transponder Statuses</h3>
              <span className="text-[10px] font-mono text-slate-400">AIS CLASS-B ACTIVE MATRIX</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {ferries.map((f) => {
                const isDistressed = emergencies.some((e) => e.ferryId === f.id && e.status === 'active');
                return (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                      isDistressed
                        ? 'bg-red-950/40 border-red-600 shadow-md shadow-red-950/40 animate-pulse'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{f.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          isDistressed ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {isDistressed ? 'DISTRESS SIGNAL' : 'NORMAL'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Position: {f.position.lat.toFixed(3)}°N, {f.position.lng.toFixed(3)}°E
                    </div>
                    <div className="text-[11px] text-slate-400">Captain: {f.captainName}</div>
                    {isDistressed && (
                      <div className="text-[10px] font-mono text-red-300 bg-red-900/40 px-2 py-0.5 rounded">
                        AIS-SART Active • Ch 16 Beacon
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CREW MANAGEMENT & DG SHIPPING COMPLIANCE */}
      {operatorTab === 'crew' && <CrewManagementDashboard />}

      {/* TAB 8: REAL-TIME MARITIME WEATHER MONITORING & SAFETY THRESHOLDS */}
      {operatorTab === 'weather' && <WeatherThresholdMonitor />}

      {/* MODAL: CREATE TRIP */}
      {isCreateTripOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Schedule New Ferry Trip</h3>
              <button onClick={() => setIsCreateTripOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTripSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Maritime Route</label>
                <select
                  value={newTripRouteId}
                  onChange={(e) => setNewTripRouteId(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Assigned Commercial Ferry</label>
                <select
                  value={newTripFerryId}
                  onChange={(e) => setNewTripFerryId(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                >
                  {ferries.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.vesselId} - Cap {f.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Scheduled Departure Time</label>
                  <input
                    type="time"
                    value={newTripDeparture}
                    onChange={(e) => setNewTripDeparture(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Terminal Gate Assignment</label>
                  <input
                    type="text"
                    value={newTripGate}
                    onChange={(e) => setNewTripGate(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 font-mono"
                    placeholder="e.g. G-2"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTripOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Save & Publish Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRIGGER EMERGENCY SCENARIO */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/80 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <span>Declare Emergency Incident (SAR)</span>
              </div>
              <button onClick={() => setIsEmergencyModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Incident Classification</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value as any)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                >
                  <option value="Engine failure">Engine Failure / Fairway Drift</option>
                  <option value="Man overboard">Man Overboard (Code Oscar)</option>
                  <option value="Medical emergency">Critical Medical Evacuation (MEDEVAC)</option>
                  <option value="Collision risk">Collision Risk Alert</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Vessel in Distress</label>
                <select
                  value={emergencyFerryId}
                  onChange={(e) => setEmergencyFerryId(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                >
                  {ferries.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.vesselId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Incident Notes / AIS Coordinates</label>
                <textarea
                  rows={3}
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div className="bg-red-950/40 p-3 rounded-xl border border-red-900/60 text-red-300 text-[11px]">
                Triggering this incident will fix coordinates on the tactical radar, calculate the closest responder
                vessel, and broadcast an emergency AIS advisory across all channels.
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTriggerEmergency}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Broadcast Emergency Distress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BROADCAST ADVISORY */}
      {isCreateAlertOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Broadcast Maritime Notice</h3>
              <button onClick={() => setIsCreateAlertOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastAlert} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Advisory Title</label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Severity Tier</label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                >
                  <option value="low">Low Priority (Informational)</option>
                  <option value="medium">Medium (Weather / Swell Notice)</option>
                  <option value="high">High (Delay / Channel Restriction)</option>
                  <option value="critical">Critical (Service Suspension)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Detailed Advisory Message</label>
                <textarea
                  rows={3}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAlertOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PASSENGER INCIDENT & MEDICAL / LOST PROPERTY LOGGER */}
      <IncidentLoggingModal
        isOpen={isIncidentModalOpen}
        onClose={() => {
          setIsIncidentModalOpen(false);
          setIncidentPrefill(null);
        }}
        prefillData={incidentPrefill}
        onSaveIncident={handleSaveIncident}
        trips={trips}
        ferries={ferries}
      />
    </div>
  );
};
