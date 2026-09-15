import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Ferry,
  Port,
  Route,
  Trip,
  Booking,
  UserRole,
  ServiceAlert,
  EmergencyIncident,
  CrewMember,
  MaintenanceWorkOrder,
  AuditLog,
  PreDepartureChecklist,
  Passenger,
  VehicleInfo,
  AccessibilitySettings,
  PassengerFeedback,
  HourlyTelemetryReport,
} from '../types';
import {
  playRoutineNotificationSound,
  playMaritimeDistressAlarm,
  vocalizeBridgeAnnouncement,
  triggerMaritimeHaptic,
} from '../utils/audioAlerts';
import {
  INITIAL_FERRIES,
  INITIAL_PORTS,
  INITIAL_ROUTES,
  INITIAL_TRIPS,
  INITIAL_BOOKINGS,
  INITIAL_CREW,
  INITIAL_ALERTS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import {
  INITIAL_PASSENGER_FEEDBACKS,
  INITIAL_HOURLY_TELEMETRY_REPORTS,
} from '../data/feedbackAndReportsData';
import { Language, getTranslation } from '../utils/translations';

interface SystemHealth {
  gpsService: 'operational' | 'degraded' | 'offline';
  aisFeed: 'operational' | 'degraded' | 'offline';
  realtimeEngine: 'operational' | 'degraded' | 'offline';
  bookingGateway: 'operational' | 'degraded' | 'offline';
  paymentGateway: 'operational' | 'degraded' | 'offline';
  alertBroadcast: 'operational' | 'degraded' | 'offline';
  database: 'operational' | 'degraded' | 'offline';
}

export interface BookingValidationParams {
  tripId: string;
  routeId?: string;
  passengers: Passenger[];
  vehicle?: VehicleInfo;
  totalFareInr?: number;
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  remainingSeats: number;
  remainingVehicleSpots: number;
  trip?: Trip;
  route?: Route;
}

export function validateBookingRequest(
  data: BookingValidationParams,
  trips: Trip[],
  routes: Route[]
): BookingValidationResult {
  const errors: string[] = [];

  if (!data.tripId) {
    errors.push('Trip selection is required.');
  }

  const trip = trips.find((t) => t.id === data.tripId);
  if (!trip) {
    errors.push(`Trip '${data.tripId}' was not found.`);
  }

  const route = data.routeId
    ? routes.find((r) => r.id === data.routeId)
    : (trip ? routes.find((r) => r.id === trip.routeId) : undefined);

  if (!route && data.routeId) {
    errors.push(`Route '${data.routeId}' was not found.`);
  }

  if (trip && (trip.status === 'arrived' || trip.status === 'cancelled')) {
    errors.push(`Trip is currently ${trip.status} and cannot accept new bookings.`);
  }

  if (!data.passengers || data.passengers.length === 0) {
    errors.push('At least one passenger must be specified.');
  }

  const remainingSeats = trip ? Math.max(0, trip.passengerCapacity - trip.bookedPassengers) : 0;
  if (trip && data.passengers && data.passengers.length > remainingSeats) {
    errors.push(`Insufficient seats available. Requested ${data.passengers.length}, but only ${remainingSeats} remaining.`);
  }

  const remainingVehicleSpots = trip ? Math.max(0, trip.vehicleCapacity - trip.bookedVehicles) : 0;
  if (data.vehicle) {
    if (!trip || trip.vehicleCapacity <= 0 || !route || route.vehicleFareInr <= 0) {
      errors.push('The selected route or vessel does not support vehicle roll-on (Ro-Pax) transportation.');
    } else if (remainingVehicleSpots <= 0) {
      errors.push('Vehicle deck is fully booked for this departure.');
    }
  }

  if (data.passengers) {
    data.passengers.forEach((p, idx) => {
      if (!p.fullName || p.fullName.trim().length === 0) {
        errors.push(`Passenger #${idx + 1} full name is required.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    remainingSeats,
    remainingVehicleSpots,
    trip,
    route,
  };
}

interface FerryContextType {
  // Initialization state
  isInitialized: boolean;

  // Data
  ferries: Ferry[];
  ports: Port[];
  routes: Route[];
  trips: Trip[];
  bookings: Booking[];
  crew: CrewMember[];
  alerts: ServiceAlert[];
  emergencies: EmergencyIncident[];
  maintenance: MaintenanceWorkOrder[];
  auditLogs: AuditLog[];
  safetyChecklists: Record<string, PreDepartureChecklist>;

  // App Navigation & Role
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeView: string; // 'home' | 'live-tracking' | 'routes' | 'ports' | 'book' | 'my-tickets' | 'alerts' | 'operator' | 'captain' | 'admin'
  setActiveView: (view: string) => void;
  operatorTab: string;
  setOperatorTab: (tab: string) => void;
  selectedFerryId: string | null;
  setSelectedFerryId: (id: string | null) => void;
  selectedTripId: string | null;
  setSelectedTripId: (id: string | null) => void;

  // Simulation Controls
  isSimulationPlaying: boolean;
  setIsSimulationPlaying: (playing: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  triggerSimulatedDelay: (ferryId: string, minutes: number) => void;
  triggerEmergencySimulation: (ferryId: string, type: EmergencyIncident['type']) => void;
  resetSimulationData: () => void;
  simulatedTime: string;
  simulatedSeconds: number;

  // Actions
  validateBooking: (data: BookingValidationParams) => BookingValidationResult;
  createBooking: (data: {
    tripId: string;
    routeId: string;
    passengers: Passenger[];
    vehicle?: VehicleInfo;
    totalFareInr: number;
    paymentMethod: Booking['paymentMethod'];
    bookedByEmail: string;
  }) => Booking;
  cancelBooking: (bookingId: string) => void;
  scanTicket: (qrString: string) => {
    status: 'VALID' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
    booking?: Booking;
    trip?: Trip;
    ferry?: Ferry;
    passenger?: Passenger;
  };
  approveBoarding: (bookingId: string, passengerId: string) => boolean;
  updateTripStatus: (tripId: string, status: Trip['status'], delayMinutes?: number) => void;
  updateTripGate: (tripId: string, gateNumber: string, gateStatus?: Trip['gateStatus']) => void;
  updateTripDeparture: (tripId: string, scheduledDeparture: string, delayMinutes?: number) => void;
  addFerry: (ferry: Omit<Ferry, 'id' | 'trail' | 'lastUpdate'>) => void;
  updateFerry: (id: string, updates: Partial<Ferry>) => void;
  publishAlert: (alert: Omit<ServiceAlert, 'id' | 'createdAt' | 'active'>) => void;
  dismissAlert: (alertId: string) => void;
  declareEmergency: (ferryId: string, type: EmergencyIncident['type'], details?: string) => void;
  resolveEmergency: (emergencyId: string) => void;
  savePreDepartureChecklist: (checklist: PreDepartureChecklist) => void;
  addMaintenanceOrder: (order: Omit<MaintenanceWorkOrder, 'id'>) => void;
  assignCrewMemberVessel: (crewId: string, vesselId: string | undefined) => void;
  updateCrewMember: (crewId: string, updates: Partial<CrewMember>) => void;
  addCrewMember: (crew: Omit<CrewMember, 'id'>) => void;
  renewCrewCertification: (crewId: string, newExpiryDate: string) => void;
  addAuditLog: (action: string, category: string, details: string) => void;

  // UI Modals & Settings
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isStatusModalOpen: boolean;
  setIsStatusModalOpen: (open: boolean) => void;
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  preselectedRouteIdForBooking: string | null;
  setPreselectedRouteIdForBooking: (id: string | null) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  systemHealth: SystemHealth;
  liveFeedEvents: { id: string; time: string; text: string; type: 'info' | 'success' | 'warning' | 'alert' }[];

  // Global Maritime Accessibility & Audible Signals
  accessibilitySettings: AccessibilitySettings;
  updateAccessibilitySettings: (updates: Partial<AccessibilitySettings>) => void;
  isAccessibilityModalOpen: boolean;
  setIsAccessibilityModalOpen: (open: boolean) => void;
  playRoutineChime: () => void;
  playDistressAlarm: () => void;

  // Passenger Feedback (Admin Portal Only)
  passengerFeedbacks: PassengerFeedback[];
  submitPassengerFeedback: (feedback: Omit<PassengerFeedback, 'id' | 'submittedAt'>) => void;
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
  activeFeedbackTrip: Trip | null;
  setActiveFeedbackTrip: (trip: Trip | null) => void;
  activeFeedbackBookingRef: string | null;
  setActiveFeedbackBookingRef: (ref: string | null) => void;
  promptFeedbackForTrip: (trip: Trip, bookingRef?: string) => void;

  // Real-Time Telemetry Archive (Hourly Engine Performance Reports)
  hourlyTelemetryReports: HourlyTelemetryReport[];
  exportHourlyReportToAdmin: (reportId: string) => void;

  // Boarding Flow Guide Overlay
  isBoardingGuideOpen: boolean;
  setIsBoardingGuideOpen: (open: boolean) => void;
  activeBoardingGuideTrip: Trip | null;
  setActiveBoardingGuideTrip: (trip: Trip | null) => void;
  openBoardingGuide: (trip?: Trip | null) => void;
}

const FerryContext = createContext<FerryContextType | undefined>(undefined);

export const FerryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ferries, setFerries] = useState<Ferry[]>(INITIAL_FERRIES);
  const [ports, setPorts] = useState<Port[]>(INITIAL_PORTS);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [crew, setCrew] = useState<CrewMember[]>(INITIAL_CREW);
  const [alerts, setAlerts] = useState<ServiceAlert[]>(INITIAL_ALERTS);
  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceWorkOrder[]>(INITIAL_MAINTENANCE);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [safetyChecklists, setSafetyChecklists] = useState<Record<string, PreDepartureChecklist>>({
    'trip-103': {
      tripId: 'trip-103',
      ferryId: 'ferry-103',
      captainName: 'Capt. Amit Kulkarni',
      timestamp: '14:25',
      isComplete: true,
      items: [
        { id: 'c1', title: 'Twin diesel engines oil pressure & coolant temp verified', checked: true, category: 'Engines & Power' },
        { id: 'c2', title: 'Fuel bunkers checked (>85% operational capacity)', checked: true, category: 'Engines & Power' },
        { id: 'c3', title: 'Auxiliary generator & emergency battery bank operational', checked: true, category: 'Engines & Power' },
        { id: 'c4', title: 'Dual marine radar & AIS transponder active', checked: true, category: 'Navigation & Radar' },
        { id: 'c5', title: 'GPS position lock confirmed (<2.5m precision)', checked: true, category: 'Navigation & Radar' },
        { id: 'c6', title: 'VHF marine radios (Ch 16 & port dispatch) tested', checked: true, category: 'Navigation & Radar' },
        { id: 'c7', title: 'Life jackets count verified (220 adult + 30 child)', checked: true, category: 'Safety & Life-Saving' },
        { id: 'c8', title: 'Hydrostatic inflatable life rafts inspected', checked: true, category: 'Safety & Life-Saving' },
        { id: 'c9', title: 'Fire suppression system & manual extinguishers green', checked: true, category: 'Safety & Life-Saving' },
        { id: 'c10', title: 'Boarding ramps, safety railings, & gangway clear', checked: true, category: 'Port & Manifest' },
        { id: 'c11', title: 'Passenger headcount vs ticket manifest cross-checked', checked: true, category: 'Port & Manifest' },
        { id: 'c12', title: 'Harbor Master clearance obtained & weather verified', checked: true, category: 'Port & Manifest' },
      ],
    },
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('passenger');
  const [activeView, setActiveView] = useState<string>('home');
  const [operatorTab, setOperatorTab] = useState<string>('overview');
  const [selectedFerryId, setSelectedFerryId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Simulation
  const [isSimulationPlaying, setIsSimulationPlaying] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [simulatedSeconds, setSimulatedSeconds] = useState<number>(14 * 3600 + 26 * 60); // Starts at 14:26:00

  // Advance simulated clock smoothly
  useEffect(() => {
    if (!isSimulationPlaying) return;
    const interval = setInterval(() => {
      setSimulatedSeconds((prev) => (prev + Math.round(1 * simulationSpeed)) % 86400);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulationPlaying, simulationSpeed]);

  const simulatedTime = useMemo(() => {
    const hours = Math.floor(simulatedSeconds / 3600);
    const mins = Math.floor((simulatedSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, [simulatedSeconds]);

  // UI Modals
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [preselectedRouteIdForBooking, setPreselectedRouteIdForBooking] = useState<string | null>(null);
  
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('ferryflow_theme_mode');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const setTheme = useCallback((newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('ferryflow_theme_mode', newTheme);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('ferryflow_theme_mode', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // i18n Language support
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ferryflow_interface_lang');
      return (saved === 'en' || saved === 'es' || saved === 'fr') ? (saved as Language) : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ferryflow_interface_lang', lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback((key: string) => {
    return getTranslation(key, language);
  }, [language]);

  // Global Maritime Accessibility & Audible Signals
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('ferryflow_accessibility_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      audibleAlertsEnabled: true,
      routineAlertsVolume: 70,
      distressAlertsVolume: 95,
      speechSynthesisEnabled: true,
      highContrastFlash: true,
      vibrationEnabled: true,
      distressBypassMute: true,
    };
  });

  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState<boolean>(false);

  const updateAccessibilitySettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setAccessibilitySettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('ferryflow_accessibility_settings', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const playRoutineChime = useCallback(() => {
    if (!accessibilitySettings.audibleAlertsEnabled) return;
    playRoutineNotificationSound(accessibilitySettings.routineAlertsVolume);
    if (accessibilitySettings.vibrationEnabled) {
      triggerMaritimeHaptic(false);
    }
  }, [accessibilitySettings]);

  const playDistressAlarm = useCallback(() => {
    if (!accessibilitySettings.audibleAlertsEnabled && !accessibilitySettings.distressBypassMute) {
      return;
    }
    playMaritimeDistressAlarm(accessibilitySettings.distressAlertsVolume);
    if (accessibilitySettings.speechSynthesisEnabled) {
      vocalizeBridgeAnnouncement('Critical Maritime Safety Alert. Attention Bridge Watchstanders.');
    }
    if (accessibilitySettings.vibrationEnabled) {
      triggerMaritimeHaptic(true);
    }
  }, [accessibilitySettings]);

  const [liveFeedEvents, setLiveFeedEvents] = useState<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warning' | 'alert' }[]>([
    { id: 'ev-1', time: '14:32', text: 'FV-102 (Ocean Express) updated location — AIS speed 15.2 knots', type: 'info' },
    { id: 'ev-2', time: '14:31', text: 'Gate G-1: 18 passengers boarded onto River Star (Trip #FF-101)', type: 'success' },
    { id: 'ev-3', time: '14:29', text: 'FV-104 entered Island Terminal Elephanta 1.5 km maritime geofence', type: 'info' },
    { id: 'ev-4', time: '14:27', text: 'FV-102 reported minor delay of 8 minutes due to Mandwa car turnaround', type: 'warning' },
    { id: 'ev-5', time: '14:25', text: 'Boarding started at Gateway Terminal for Trip #FF-103', type: 'info' },
  ]);

  // Passenger Feedback (visible only to admins)
  const [passengerFeedbacks, setPassengerFeedbacks] = useState<PassengerFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('ferryflow_passenger_feedbacks');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PASSENGER_FEEDBACKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ferryflow_passenger_feedbacks', JSON.stringify(passengerFeedbacks));
    } catch {
      // ignore
    }
  }, [passengerFeedbacks]);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [activeFeedbackTrip, setActiveFeedbackTrip] = useState<Trip | null>(null);
  const [activeFeedbackBookingRef, setActiveFeedbackBookingRef] = useState<string | null>(null);

  // Real-Time Telemetry Archive (Hourly Engine Performance Reports)
  const [hourlyTelemetryReports, setHourlyTelemetryReports] = useState<HourlyTelemetryReport[]>(() => {
    try {
      const saved = localStorage.getItem('ferryflow_hourly_telemetry_reports');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_HOURLY_TELEMETRY_REPORTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ferryflow_hourly_telemetry_reports', JSON.stringify(hourlyTelemetryReports));
    } catch {
      // ignore
    }
  }, [hourlyTelemetryReports]);

  // Boarding Flow Guide Overlay
  const [isBoardingGuideOpen, setIsBoardingGuideOpen] = useState<boolean>(false);
  const [activeBoardingGuideTrip, setActiveBoardingGuideTrip] = useState<Trip | null>(null);

  const [systemHealth] = useState<SystemHealth>({
    gpsService: 'operational',
    aisFeed: 'operational',
    realtimeEngine: 'operational',
    bookingGateway: 'operational',
    paymentGateway: 'operational',
    alertBroadcast: 'operational',
    database: 'operational',
  });

  // State synchronization refs to prevent callback re-creation on simulation ticks
  const ferriesRef = useRef(ferries);
  const tripsRef = useRef(trips);
  const bookingsRef = useRef(bookings);
  const crewRef = useRef(crew);
  const emergenciesRef = useRef(emergencies);
  const alertsRef = useRef(alerts);
  const currentRoleRef = useRef(currentRole);

  useEffect(() => { ferriesRef.current = ferries; }, [ferries]);
  useEffect(() => { tripsRef.current = trips; }, [trips]);
  useEffect(() => { bookingsRef.current = bookings; }, [bookings]);
  useEffect(() => { crewRef.current = crew; }, [crew]);
  useEffect(() => { emergenciesRef.current = emergencies; }, [emergencies]);
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { currentRoleRef.current = currentRole; }, [currentRole]);

  // Lifecycle initialization state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('ferryflow_theme_mode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      }
    } catch {
      // Storage access gracefully handled
    }
    setIsInitialized(true);
  }, []);

  const addAuditLog = useCallback((action: string, category: AuditLog['category'], details: string) => {
    const role = currentRoleRef.current;
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userId: role === 'operator' ? 'OPR-104' : role === 'captain' ? 'CPT-101' : 'SYS-AUTOMATION',
      userRole: role,
      action,
      category,
      details,
      ipAddress: '10.240.12.88',
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 50)]);
  }, []);

  const promptFeedbackForTrip = useCallback((trip: Trip, bookingRef?: string) => {
    setActiveFeedbackTrip(trip);
    setActiveFeedbackBookingRef(bookingRef || null);
    setIsFeedbackModalOpen(true);
  }, []);

  const submitPassengerFeedback = useCallback(
    (feedbackData: Omit<PassengerFeedback, 'id' | 'submittedAt'>) => {
      const newFeedback: PassengerFeedback = {
        ...feedbackData,
        id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        submittedAt: new Date().toISOString(),
      };
      setPassengerFeedbacks((prev) => [newFeedback, ...prev]);
      addAuditLog(
        'Passenger Trip Feedback Submitted',
        'System',
        `Passenger rating logged for ${newFeedback.vesselName} (${newFeedback.routeName}). Speed rating: ${newFeedback.boardingSpeedRating}/5, Comfort: ${newFeedback.comfortRating}/5.`
      );
    },
    [addAuditLog]
  );

  const exportHourlyReportToAdmin = useCallback(
    (reportId: string) => {
      const report = hourlyTelemetryReports.find((r) => r.id === reportId);
      if (!report) return;

      const nowIso = new Date().toISOString();
      setHourlyTelemetryReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, exportedToAdmin: true, exportedAt: nowIso } : r))
      );

      const isServiceNeeded = report.healthStatus === 'Service Required' || report.healthStatus === 'Caution';
      const maintenanceOrder: MaintenanceWorkOrder = {
        id: `wo-export-${Date.now()}`,
        vesselId: report.vesselId,
        vesselName: report.vesselName,
        type: isServiceNeeded ? 'Engine Overhaul' : 'Routine Service',
        status: isServiceNeeded ? 'In Progress' : 'Completed',
        priority: report.healthStatus === 'Service Required' ? 'critical' : report.healthStatus === 'Caution' ? 'high' : 'medium',
        scheduledDate: new Date().toISOString().split('T')[0],
        technician: 'Harbor Drydock Engineering Team',
        costInr: isServiceNeeded ? 38500 : 8500,
        notes: `CAPTAIN LOG EXPORT (${report.hourPeriod}): Avg RPM: ${report.avgEngineRpm}, Coolant: ${report.avgCoolantTempC}°C, Vibration: ${report.avgVibrationMmSec} mm/s, Fuel Burn: ${report.totalFuelBurnLiters}L. Status: ${report.healthStatus}. Notes: ${report.captainNotes}`,
      };

      setMaintenance((prev) => [maintenanceOrder, ...prev]);

      addAuditLog(
        'Captain Telemetry Archive Exported',
        'System',
        `Master wheelhouse exported hourly telemetry report (${report.hourPeriod}) for ${report.vesselName} to AdminPortal maintenance queue.`
      );
    },
    [hourlyTelemetryReports, addAuditLog]
  );

  const openBoardingGuide = useCallback((trip?: Trip | null) => {
    if (trip) {
      setActiveBoardingGuideTrip(trip);
    } else {
      const upcoming = tripsRef.current.find((t) => t.status === 'scheduled' || t.status === 'boarding') || tripsRef.current[0];
      setActiveBoardingGuideTrip(upcoming || null);
    }
    setIsBoardingGuideOpen(true);
  }, []);

  // Realtime Simulation Loop
  useEffect(() => {
    if (!isSimulationPlaying) return;

    const intervalMs = 2500 / simulationSpeed;
    const timer = setInterval(() => {
      setFerries((prevFerries) => {
        return prevFerries.map((ferry) => {
          // If docked or offline or emergency, keep position
          if (ferry.status === 'docked' || ferry.status === 'offline' || ferry.status === 'emergency') {
            return ferry;
          }

          // Small natural movement for moving ferries
          const posLat = ferry.position?.lat ?? 18.922;
          const posLng = ferry.position?.lng ?? 72.834;
          const speedFactor = (ferry.speedKnots / 30) * 0.0015 * simulationSpeed;
          const rad = (ferry.heading * Math.PI) / 180;
          const deltaLat = Math.cos(rad) * speedFactor;
          const deltaLng = Math.sin(rad) * speedFactor;

          const rawLat = posLat + deltaLat;
          const rawLng = posLng + deltaLng;
          if (isNaN(rawLat) || isNaN(rawLng)) {
            return ferry;
          }

          const newLat = Number(rawLat.toFixed(6));
          const newLng = Number(rawLng.toFixed(6));

          // Natural small speed fluctuation
          const speedFluctuation = Number((Math.random() * 0.4 - 0.2).toFixed(1));
          const newSpeed = Math.max(8.0, Math.min(26.0, Number((ferry.speedKnots + speedFluctuation).toFixed(1))));

          // Keep a breadcrumb trail of last 6 positions
          const updatedTrail = [...(ferry.trail || []).slice(-7), { lat: newLat, lng: newLng }];

          return {
            ...ferry,
            position: { lat: newLat, lng: newLng },
            speedKnots: newSpeed,
            trail: updatedTrail,
            lastUpdate: 'Just now',
          };
        });
      });

      // Also advance progress on active trips
      setTrips((prevTrips) => {
        return prevTrips.map((trip) => {
          if (trip.status === 'in_transit' || trip.status === 'delayed') {
            const nextProgress = Math.min(99, trip.progressPercent + (1.2 * simulationSpeed));
            const remainingDist = Math.max(0.4, Number((trip.remainingDistanceKm * (1 - (nextProgress / 100))).toFixed(1)));
            const newStatus = nextProgress >= 90 ? 'approaching' : trip.status;
            return {
              ...trip,
              progressPercent: Math.round(nextProgress),
              remainingDistanceKm: remainingDist,
              status: newStatus,
            };
          }
          return trip;
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulationPlaying, simulationSpeed]);

  // Periodic random event simulation to make system feel truly alive
  useEffect(() => {
    if (!isSimulationPlaying) return;

    const eventInterval = setInterval(() => {
      const randomEvents = [
        { text: 'FV-101: AIS broadcast received — safe passage through Karanja Reef', type: 'info' as const },
        { text: 'Gateway Terminal: Automated turnaround queue clear on Berth 2', type: 'success' as const },
        { text: 'Tide sensor reading: Mandwa Pier water level at +2.1m (High tide cresting)', type: 'info' as const },
        { text: 'FV-105: VHF radio check completed with Harbor Control', type: 'info' as const },
        { text: 'Passenger flow: 34 tap-and-go contactless ticket validations at Gateway Gate G-1', type: 'success' as const },
      ];
      const ev = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setLiveFeedEvents((prev) => [{ id: `ev-${Date.now()}`, time: timeStr, text: ev.text, type: ev.type }, ...prev.slice(0, 15)]);
    }, 14000 / simulationSpeed);

    return () => clearInterval(eventInterval);
  }, [isSimulationPlaying, simulationSpeed]);

  const validateBooking = useCallback(
    (data: BookingValidationParams): BookingValidationResult => {
      return validateBookingRequest(data, tripsRef.current, routes);
    },
    [routes]
  );

  const createBooking = useCallback(
    ({
      tripId,
      routeId,
      passengers,
      vehicle,
      totalFareInr,
      paymentMethod,
      bookedByEmail,
    }: {
      tripId: string;
      routeId: string;
      passengers: Passenger[];
      vehicle?: VehicleInfo;
      totalFareInr: number;
      paymentMethod: Booking['paymentMethod'];
      bookedByEmail: string;
    }): Booking => {
      // Validate booking critical path
      const validation = validateBooking({ tripId, routeId, passengers, vehicle, totalFareInr });
      if (!validation.isValid) {
        throw new Error(`Booking validation failed: ${validation.errors.join(' ')}`);
      }

      const trip = tripsRef.current.find((t) => t.id === tripId);
      const bookingId = `book-${Date.now()}`;
      const bookingRef = `FF-BKG-${Math.floor(10000 + Math.random() * 90000)}`;

      const seatLetters = ['A', 'B', 'C', 'D'];
      const seatNumbers = passengers.map((_, i) => `${seatLetters[i % seatLetters.length]}-${Math.floor(10 + Math.random() * 30)}`);

      const newBooking: Booking = {
        id: bookingId,
        bookingRef,
        tripId,
        routeId,
        ferryId: trip?.ferryId || 'ferry-101',
        bookingDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        passengers,
        vehicle,
        totalFareInr,
        paymentMethod,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        seatNumbers,
        qrPayload: `FERRYFLOW|TICKET|${bookingRef}|${tripId}|${passengers[0]?.id || 'p1'}|VALID`,
        bookedByEmail,
      };

      setBookings((prev) => [newBooking, ...prev]);

      // Update trip booked passengers and vehicle capacity
      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? {
                ...t,
                bookedPassengers: t.bookedPassengers + passengers.length,
                bookedVehicles: vehicle ? t.bookedVehicles + 1 : t.bookedVehicles,
              }
            : t
        )
      );

      addAuditLog('New Booking Generated', 'Booking', `Created booking ${bookingRef} for ${passengers.length} passenger(s) on trip ${trip?.tripNumber || tripId}`);
      return newBooking;
    },
    [addAuditLog, validateBooking]
  );

  const cancelBooking = useCallback(
    (bookingId: string) => {
      const targetBooking = bookingsRef.current.find((b) => b.id === bookingId);
      if (!targetBooking) return;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, bookingStatus: 'cancelled', paymentStatus: 'refunded' } : b))
      );

      // Restore available seats and vehicle spots on the trip if active
      if (targetBooking.bookingStatus !== 'cancelled') {
        setTrips((prev) =>
          prev.map((t) =>
            t.id === targetBooking.tripId
              ? {
                  ...t,
                  bookedPassengers: Math.max(0, t.bookedPassengers - targetBooking.passengers.length),
                  bookedVehicles: targetBooking.vehicle ? Math.max(0, t.bookedVehicles - 1) : t.bookedVehicles,
                }
              : t
          )
        );
      }

      addAuditLog('Booking Cancelled', 'Booking', `Cancelled booking ${bookingId} and processed refund.`);
    },
    [addAuditLog]
  );

  const scanTicket = useCallback(
    (qrString: string) => {
      // Format: FERRYFLOW|TICKET|<bookingRef>|<tripId>|<passengerId>|<state>
      const parts = qrString.trim().split('|');
      let bookingRef = '';
      if (parts.length >= 3) {
        bookingRef = parts[2];
      } else {
        bookingRef = qrString.trim();
      }

      const booking = bookingsRef.current.find((b) => b.bookingRef.toLowerCase() === bookingRef.toLowerCase() || b.id === bookingRef);
      if (!booking) {
        return { status: 'INVALID' as const };
      }

      if (booking.bookingStatus === 'cancelled') {
        return { status: 'CANCELLED' as const, booking };
      }

      if (booking.bookingStatus === 'boarded') {
        return { status: 'ALREADY_USED' as const, booking };
      }

      const trip = tripsRef.current.find((t) => t.id === booking.tripId);
      const ferry = ferriesRef.current.find((f) => f.id === booking.ferryId);
      const passenger = booking.passengers[0];

      return {
        status: 'VALID' as const,
        booking,
        trip,
        ferry,
        passenger,
      };
    },
    []
  );

  const approveBoarding = useCallback(
    (bookingId: string, passengerId: string) => {
      const booking = bookingsRef.current.find((b) => b.id === bookingId);
      if (!booking) return false;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, bookingStatus: 'boarded' } : b))
      );

      setTrips((prev) =>
        prev.map((t) =>
          t.id === booking.tripId
            ? {
                ...t,
                boardedPassengers: Math.min(t.passengerCapacity, t.boardedPassengers + booking.passengers.length),
              }
            : t
        )
      );

      // Update ferry current passengers
      setFerries((prev) =>
        prev.map((f) =>
          f.id === booking.ferryId
            ? { ...f, currentPassengers: Math.min(f.capacity, f.currentPassengers + booking.passengers.length) }
            : f
        )
      );

      const passName = booking.passengers.find((p) => p.id === passengerId)?.fullName || booking.passengers[0]?.fullName || 'Passenger';
      addAuditLog('Boarding Approved', 'Boarding', `Boarded ${passName} (Booking: ${booking.bookingRef})`);
      setLiveFeedEvents((prev) => [
        {
          id: `ev-${Date.now()}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          text: `Boarding verified for ${passName} on Booking #${booking.bookingRef}`,
          type: 'success',
        },
        ...prev.slice(0, 15),
      ]);
      return true;
    },
    [addAuditLog]
  );

  const updateTripStatus = useCallback(
    (tripId: string, status: Trip['status'], delayMinutes = 0) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id === tripId) {
            return {
              ...t,
              status,
              delayMinutes: delayMinutes || t.delayMinutes,
              actualDeparture: status === 'departed' || status === 'in_transit' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t.actualDeparture,
            };
          }
          return t;
        })
      );
      addAuditLog('Trip Status Updated', 'Trip', `Trip ${tripId} changed status to ${status.toUpperCase()} (Delay: ${delayMinutes}m)`);
    },
    [addAuditLog]
  );

  const updateTripGate = useCallback(
    (tripId: string, gateNumber: string, gateStatus?: Trip['gateStatus']) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id === tripId) {
            return {
              ...t,
              gateNumber,
              gateStatus: gateStatus || t.gateStatus || 'Gate Assigned',
            };
          }
          return t;
        })
      );
      addAuditLog(
        'Gate Assignment Updated',
        'Boarding',
        `Trip ${tripId} assigned to ${gateNumber} (Status: ${gateStatus || 'Assigned'})`
      );
    },
    [addAuditLog]
  );

  const updateTripDeparture = useCallback(
    (tripId: string, scheduledDeparture: string, delayMinutes?: number) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id === tripId) {
            return {
              ...t,
              scheduledDeparture,
              delayMinutes: delayMinutes !== undefined ? delayMinutes : t.delayMinutes,
            };
          }
          return t;
        })
      );
      addAuditLog(
        'Trip Departure Rescheduled',
        'Trip',
        `Trip ${tripId} departure time updated to ${scheduledDeparture} (Delay: ${delayMinutes ?? 0}m)`
      );
    },
    [addAuditLog]
  );

  const addFerry = useCallback(
    (ferryData: Omit<Ferry, 'id' | 'trail' | 'lastUpdate'>) => {
      const newFerry: Ferry = {
        ...ferryData,
        id: `ferry-${Date.now()}`,
        trail: [ferryData.position],
        lastUpdate: 'Just now',
      };
      setFerries((prev) => [...prev, newFerry]);
      addAuditLog('Vessel Commissioned', 'System', `Added new vessel ${newFerry.vesselId} (${newFerry.name}) to fleet roster.`);
    },
    [addAuditLog]
  );

  const updateFerry = useCallback(
    (id: string, updates: Partial<Ferry>) => {
      setFerries((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
      addAuditLog('Vessel Updated', 'System', `Updated telemetry/parameters for ferry ${id}`);
    },
    [addAuditLog]
  );

  const publishAlert = useCallback(
    (alertData: Omit<ServiceAlert, 'id' | 'createdAt' | 'active'>) => {
      const newAlert: ServiceAlert = {
        ...alertData,
        id: `alert-${Date.now()}`,
        createdAt: 'Just now',
        active: true,
      };
      setAlerts((prev) => [newAlert, ...prev]);
      addAuditLog('Alert Published', 'Alert', `Published ${newAlert.severity.toUpperCase()} alert: "${newAlert.title}"`);
      setLiveFeedEvents((prev) => [
        {
          id: `ev-${Date.now()}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          text: `🚨 ADVISORY BROADCAST: ${newAlert.title}`,
          type: newAlert.severity === 'critical' ? 'alert' : 'warning',
        },
        ...prev.slice(0, 15),
      ]);
    },
    [addAuditLog]
  );

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const declareEmergency = useCallback(
    (ferryId: string, type: EmergencyIncident['type'], details?: string) => {
      const currentFerries = ferriesRef.current;
      const ferry = currentFerries.find((f) => f.id === ferryId) || currentFerries[0];
      const incidentId = `emg-${Date.now()}`;
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newEmergency: EmergencyIncident = {
        id: incidentId,
        ferryId: ferry.id,
        ferryName: `${ferry.name} (${ferry.vesselId})`,
        type,
        timestamp: nowStr,
        position: ferry.position,
        severity: 'critical',
        passengersOnBoard: ferry.currentPassengers,
        crewOnBoard: ferry.crewCount,
        status: 'active',
        timeline: [
          { time: nowStr, action: `🚨 Emergency declared: ${type}. Priority broadcast issued.`, agent: 'Operations Center' },
          { time: nowStr, action: `GPS Coordinates fixed at ${ferry.position.lat.toFixed(4)}°N, ${ferry.position.lng.toFixed(4)}°E`, agent: 'AIS Radar' },
          { time: nowStr, action: `Indian Coast Guard & Mumbai Port Trust SAR alerted.`, agent: 'Automated Dispatch' },
        ],
        nearestPortName: 'Gateway Terminal',
        nearestPortDistanceKm: 3.4,
        nearestVesselName: 'Coastal Runner (FV-104)',
        nearestVesselDistanceKm: 1.8,
      };

      setEmergencies((prev) => [newEmergency, ...prev]);

      // Update ferry status to emergency
      setFerries((prev) =>
        prev.map((f) => (f.id === ferryId ? { ...f, status: 'emergency', speedKnots: 0 } : f))
      );

      // Publish urgent alert
      publishAlert({
        title: `🚨 EMERGENCY DECLARED: ${ferry.name} (${type})`,
        severity: 'critical',
        category: 'Weather Warning',
        affectedFerryId: ferry.id,
        message: `Maritime emergency protocol activated for ${ferry.name}. Operations Command and SAR responders dispatched to ${ferry.position.lat.toFixed(4)}°N, ${ferry.position.lng.toFixed(4)}°E.`,
        validUntil: 'Until Resolved',
        channels: ['Web', 'Push', 'SMS'],
      });

      addAuditLog('🚨 EMERGENCY TRIGGERED', 'Emergency', `Critical incident on ${ferry.name}: ${type}. ${details || ''}`);
    },
    [publishAlert, addAuditLog]
  );

  const resolveEmergency = useCallback(
    (emergencyId: string) => {
      const emg = emergenciesRef.current.find((e) => e.id === emergencyId);
      if (!emg) return;

      setEmergencies((prev) => prev.filter((e) => e.id !== emergencyId));
      setFerries((prev) =>
        prev.map((f) => (f.id === emg.ferryId ? { ...f, status: 'docked' } : f))
      );

      addAuditLog('Emergency Resolved', 'Emergency', `Resolved incident ${emergencyId} for ${emg.ferryName}. Vessel status updated to Docked.`);
    },
    [addAuditLog]
  );

  const triggerSimulatedDelay = useCallback(
    (ferryId: string, minutes: number) => {
      const ferry = ferriesRef.current.find((f) => f.id === ferryId);
      if (!ferry) return;

      setFerries((prev) =>
        prev.map((f) => (f.id === ferryId ? { ...f, status: 'delayed' } : f))
      );

      if (ferry.currentTripId) {
        setTrips((prev) =>
          prev.map((t) => (t.id === ferry.currentTripId ? { ...t, status: 'delayed', delayMinutes: minutes } : t))
        );
      }

      publishAlert({
        title: `Simulated Delay: ${ferry.name} (+${minutes} mins)`,
        severity: 'medium',
        category: 'Delay',
        affectedFerryId: ferry.id,
        message: `${ferry.name} is experiencing a simulated operational delay of ${minutes} minutes. Passengers advised accordingly.`,
        validUntil: '1 hour',
        channels: ['Web', 'Push'],
      });
    },
    [publishAlert]
  );

  const triggerEmergencySimulation = useCallback(
    (ferryId: string, type: EmergencyIncident['type']) => {
      declareEmergency(ferryId, type, 'Simulated demonstration incident for Command Center review.');
    },
    [declareEmergency]
  );

  const resetSimulationData = useCallback(() => {
    setFerries(INITIAL_FERRIES);
    setTrips(INITIAL_TRIPS);
    setPorts(INITIAL_PORTS);
    setRoutes(INITIAL_ROUTES);
    setEmergencies([]);
    setAlerts(INITIAL_ALERTS);
    setSimulatedSeconds(14 * 3600 + 26 * 60);
    addAuditLog('Simulation Reset', 'System', 'Reverted fleet, trips, and geofence coordinates to baseline demonstration state.');
  }, [addAuditLog]);

  const savePreDepartureChecklist = useCallback(
    (checklist: PreDepartureChecklist) => {
      setSafetyChecklists((prev) => ({ ...prev, [checklist.tripId]: checklist }));
      addAuditLog('Checklist Saved', 'Trip', `Captain checklist submitted for Trip ${checklist.tripId} (${checklist.items.filter((i) => i.checked).length}/${checklist.items.length} passed).`);
    },
    [addAuditLog]
  );

  const addMaintenanceOrder = useCallback(
    (order: Omit<MaintenanceWorkOrder, 'id'>) => {
      const newOrder: MaintenanceWorkOrder = {
        ...order,
        id: `maint-${Date.now()}`,
      };
      setMaintenance((prev) => [newOrder, ...prev]);
      addAuditLog('Work Order Created', 'System', `Scheduled ${order.type} for vessel ${order.vesselName}`);
    },
    [addAuditLog]
  );

  const assignCrewMemberVessel = useCallback(
    (crewId: string, vesselId: string | undefined) => {
      setCrew((prev) =>
        prev.map((c) => (c.id === crewId ? { ...c, assignedVesselId: vesselId } : c))
      );
      const member = crewRef.current.find((c) => c.id === crewId);
      const vessel = ferriesRef.current.find((f) => f.id === vesselId);
      addAuditLog(
        'Crew Reassignment',
        'Operator',
        `Assigned ${member?.name || crewId} to ${vessel ? vessel.name : 'Unassigned / Standby Pool'}`
      );
    },
    [addAuditLog]
  );

  const updateCrewMember = useCallback(
    (crewId: string, updates: Partial<CrewMember>) => {
      setCrew((prev) =>
        prev.map((c) => (c.id === crewId ? { ...c, ...updates } : c))
      );
      addAuditLog('Crew Updated', 'Operator', `Updated record for staff ID ${crewId}`);
    },
    [addAuditLog]
  );

  const addCrewMember = useCallback(
    (newMemberData: Omit<CrewMember, 'id'>) => {
      const newMember: CrewMember = {
        ...newMemberData,
        id: `crew-${Date.now()}`,
      };
      setCrew((prev) => [newMember, ...prev]);
      addAuditLog('Crew Enrolled', 'Operator', `Enrolled new crew member ${newMember.name} (${newMember.role})`);
    },
    [addAuditLog]
  );

  const renewCrewCertification = useCallback(
    (crewId: string, newExpiryDate: string) => {
      setCrew((prev) =>
        prev.map((c) => (c.id === crewId ? { ...c, certExpiry: newExpiryDate } : c))
      );
      const member = crewRef.current.find((c) => c.id === crewId);
      addAuditLog(
        'Certification Renewed',
        'Operator',
        `DG Shipping certification renewed for ${member?.name || crewId} through ${newExpiryDate}`
      );
    },
    [addAuditLog]
  );

  const value = useMemo(
    () => ({
      isInitialized,
      ferries,
      ports,
      routes,
      trips,
      bookings,
      crew,
      alerts,
      emergencies,
      maintenance,
      auditLogs,
      safetyChecklists,
      currentRole,
      setCurrentRole,
      activeView,
      setActiveView,
      operatorTab,
      setOperatorTab,
      selectedFerryId,
      setSelectedFerryId,
      selectedTripId,
      setSelectedTripId,
      isSimulationPlaying,
      setIsSimulationPlaying,
      simulationSpeed,
      setSimulationSpeed,
      triggerSimulatedDelay,
      triggerEmergencySimulation,
      resetSimulationData,
      simulatedTime,
      simulatedSeconds,
      validateBooking,
      createBooking,
      cancelBooking,
      scanTicket,
      approveBoarding,
      updateTripStatus,
      updateTripGate,
      updateTripDeparture,
      addFerry,
      updateFerry,
      publishAlert,
      dismissAlert,
      declareEmergency,
      resolveEmergency,
      savePreDepartureChecklist,
      addMaintenanceOrder,
      assignCrewMemberVessel,
      updateCrewMember,
      addCrewMember,
      renewCrewCertification,
      addAuditLog,
      isSearchOpen,
      setIsSearchOpen,
      isStatusModalOpen,
      setIsStatusModalOpen,
      isBookingModalOpen,
      setIsBookingModalOpen,
      preselectedRouteIdForBooking,
      setPreselectedRouteIdForBooking,
      theme,
      setTheme,
      toggleTheme,
      language,
      setLanguage,
      t,
      systemHealth,
      liveFeedEvents,
      accessibilitySettings,
      updateAccessibilitySettings,
      isAccessibilityModalOpen,
      setIsAccessibilityModalOpen,
      playRoutineChime,
      playDistressAlarm,
      passengerFeedbacks,
      submitPassengerFeedback,
      isFeedbackModalOpen,
      setIsFeedbackModalOpen,
      activeFeedbackTrip,
      setActiveFeedbackTrip,
      activeFeedbackBookingRef,
      setActiveFeedbackBookingRef,
      promptFeedbackForTrip,
      hourlyTelemetryReports,
      exportHourlyReportToAdmin,
      isBoardingGuideOpen,
      setIsBoardingGuideOpen,
      activeBoardingGuideTrip,
      setActiveBoardingGuideTrip,
      openBoardingGuide,
    }),
    [
      isInitialized,
      ferries,
      ports,
      routes,
      trips,
      bookings,
      crew,
      alerts,
      emergencies,
      maintenance,
      auditLogs,
      safetyChecklists,
      currentRole,
      activeView,
      operatorTab,
      selectedFerryId,
      selectedTripId,
      isSimulationPlaying,
      simulationSpeed,
      triggerSimulatedDelay,
      triggerEmergencySimulation,
      resetSimulationData,
      simulatedTime,
      simulatedSeconds,
      validateBooking,
      createBooking,
      cancelBooking,
      scanTicket,
      approveBoarding,
      updateTripStatus,
      updateTripGate,
      updateTripDeparture,
      addFerry,
      updateFerry,
      publishAlert,
      dismissAlert,
      declareEmergency,
      resolveEmergency,
      savePreDepartureChecklist,
      addMaintenanceOrder,
      assignCrewMemberVessel,
      updateCrewMember,
      addCrewMember,
      renewCrewCertification,
      addAuditLog,
      isSearchOpen,
      isStatusModalOpen,
      isBookingModalOpen,
      preselectedRouteIdForBooking,
      theme,
      setTheme,
      toggleTheme,
      language,
      setLanguage,
      t,
      systemHealth,
      liveFeedEvents,
      accessibilitySettings,
      updateAccessibilitySettings,
      isAccessibilityModalOpen,
      setIsAccessibilityModalOpen,
      playRoutineChime,
      playDistressAlarm,
      passengerFeedbacks,
      submitPassengerFeedback,
      isFeedbackModalOpen,
      activeFeedbackTrip,
      activeFeedbackBookingRef,
      promptFeedbackForTrip,
      hourlyTelemetryReports,
      exportHourlyReportToAdmin,
      isBoardingGuideOpen,
      activeBoardingGuideTrip,
      openBoardingGuide,
    ]
  );

  return <FerryContext.Provider value={value}>{children}</FerryContext.Provider>;
};

export const useFerry = (): FerryContextType => {
  const context = useContext(FerryContext);
  if (!context) {
    throw new Error('useFerry must be used within a FerryProvider');
  }
  return context;
};
