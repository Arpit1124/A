export type FerryStatus =
  | 'on_time'
  | 'delayed'
  | 'boarding'
  | 'approaching'
  | 'emergency'
  | 'offline'
  | 'docked';

export type TripStatus =
  | 'scheduled'
  | 'boarding'
  | 'departed'
  | 'in_transit'
  | 'approaching'
  | 'arrived'
  | 'cancelled'
  | 'delayed'
  | 'emergency';

export type UserRole =
  | 'passenger'
  | 'captain'
  | 'crew'
  | 'port_staff'
  | 'operator'
  | 'fleet_manager'
  | 'safety_officer'
  | 'admin'
  | 'super_admin';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Waypoint extends Coordinates {
  name?: string;
  order: number;
}

export interface Ferry {
  id: string;
  vesselId: string; // e.g. "FV-101"
  name: string;
  registrationNumber: string;
  type: 'Catamaran' | 'Ro-Pax Ferry' | 'High-Speed Water Taxi' | 'Passenger Cruiser';
  capacity: number;
  vehicleCapacity: number;
  currentPassengers: number;
  currentVehicles: number;
  crewCount: number;
  captainName: string;
  status: FerryStatus;
  currentTripId?: string;
  currentRouteId?: string;
  currentPortId?: string;
  destinationPortId?: string;
  speedKnots: number;
  heading: number; // 0-359 degrees
  position: Coordinates;
  trail: Coordinates[];
  lastUpdate: string;
  manufacturer: string;
  builtYear: number;
  engineHealth: number; // 0-100%
  fuelLevel: number; // 0-100%
  safetyStatus: 'Certified' | 'Inspection Due' | 'Notice';
  gpsDeviceId: string;
  aisIdentifier: string;
  photoUrl: string;
  // Predictive Maintenance & Mandatory Hull Inspection
  hullInspectionDeadline?: string; // ISO Date string e.g. "2026-09-17"
  operatingHoursSinceHullInspection?: number; // e.g. 1940
  maxOperatingHoursLimit?: number; // e.g. 2000
  hullConditionScore?: number; // 0-100%
  dryDockAssignedYard?: string;
  hullInspectionStatus?: 'Compliant' | 'Approaching Deadline' | 'Overdue';
  fuelConsumptionRateLitersPerHour?: number;
}

export interface Port {
  id: string;
  code: string;
  name: string;
  city: string;
  coordinates: Coordinates;
  operationalStatus: 'operational' | 'congested' | 'maintenance' | 'closed';
  gates: {
    id: string;
    number: string;
    status: 'open' | 'boarding' | 'closed';
    assignedTripId?: string;
  }[];
  activeFerriesCount: number;
  waitingPassengers: number;
  weather: PortWeather;
  facilities: string[];
}

export interface PortWeather {
  temperatureC: number;
  condition: 'Sunny' | 'Partly Cloudy' | 'Breezy' | 'Moderate Chop' | 'Light Rain' | 'Rough Waters';
  windKnots: number;
  windDirection: string;
  visibilityKm: number;
  waveHeightM: number;
  advisory?: string;
}

export interface Route {
  id: string;
  name: string;
  originPortId: string;
  destinationPortId: string;
  intermediateStops: string[]; // Port IDs or stop names
  distanceKm: number;
  estimatedDurationMin: number;
  operatingDays: string[];
  baseFareInr: number;
  vehicleFareInr: number;
  status: 'active' | 'seasonal' | 'suspended';
  waypoints: Waypoint[];
}

export interface Trip {
  id: string;
  tripNumber: string;
  ferryId: string;
  routeId: string;
  originPortId: string;
  destinationPortId: string;
  captainId: string;
  captainName: string;
  scheduledDeparture: string; // ISO or HH:mm
  actualDeparture?: string;
  scheduledArrival: string;
  estimatedArrival: string;
  actualArrival?: string;
  status: TripStatus;
  delayMinutes: number;
  passengerCapacity: number;
  vehicleCapacity: number;
  bookedPassengers: number;
  boardedPassengers: number;
  bookedVehicles: number;
  gateNumber: string;
  gateStatus?: 'Scheduled' | 'Gate Assigned' | 'Boarding Open' | 'Final Call' | 'Gate Closed' | 'Delayed' | 'Standby';
  progressPercent: number;
  remainingDistanceKm: number;
}

export interface Passenger {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  category: 'Adult' | 'Child' | 'Senior' | 'Student' | 'Armed Forces';
  idType: 'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID';
  idNumber: string;
  accessibilityNeed?: 'Wheelchair' | 'Assistance' | 'None';
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface VehicleInfo {
  type: 'Two-Wheeler' | 'Hatchback / Sedan' | 'SUV / MUV' | 'Commercial Van';
  registrationNumber: string;
  driverName: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  tripId: string;
  routeId: string;
  ferryId: string;
  bookingDate: string;
  passengers: Passenger[];
  vehicle?: VehicleInfo;
  totalFareInr: number;
  paymentMethod: 'UPI' | 'Credit/Debit Card' | 'Net Banking' | 'FerryFlow Wallet' | 'Counter Cash';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  bookingStatus: 'confirmed' | 'boarded' | 'cancelled' | 'completed';
  seatNumbers: string[];
  qrPayload: string;
  bookedByEmail: string;
  ticketClass?: 'Premium' | 'Standard' | 'Business' | 'VIP';
  boardingGroup?: string;
}

export interface ManifestEntry {
  bookingId: string;
  bookingRef: string;
  passengerId: string;
  passengerName: string;
  category: string;
  seatNumber: string;
  ticketStatus: 'Valid' | 'Boarded' | 'No-Show' | 'Cancelled';
  boardedAt?: string;
  hasVehicle: boolean;
  vehicleReg?: string;
  accessibilityNeed?: string;
  isVip?: boolean;
}

export interface ServiceAlert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'Delay' | 'Cancellation' | 'Weather Warning' | 'Port Advisory' | 'Boarding Gate' | 'General';
  affectedRouteId?: string;
  affectedFerryId?: string;
  message: string;
  createdAt: string;
  validUntil: string;
  channels: ('Web' | 'Push' | 'SMS' | 'Email')[];
  active: boolean;
}

export interface EmergencyIncident {
  id: string;
  ferryId: string;
  ferryName: string;
  type:
    | 'Engine failure'
    | 'Medical emergency'
    | 'Collision risk'
    | 'Man overboard'
    | 'Fire'
    | 'Severe weather'
    | 'Navigation issue'
    | 'Security incident';
  timestamp: string;
  position: Coordinates;
  severity: 'critical' | 'urgent';
  passengersOnBoard: number;
  crewOnBoard: number;
  status: 'active' | 'dispatched' | 'contained' | 'resolved';
  timeline: { time: string; action: string; agent: string }[];
  nearestPortName: string;
  nearestPortDistanceKm: number;
  nearestVesselName: string;
  nearestVesselDistanceKm: number;
}

export interface CrewMember {
  id: string;
  name: string;
  employeeId: string;
  role: 'Captain' | 'First Officer' | 'Chief Engineer' | 'Deckhand' | 'Port Manager' | 'Ticketing Agent';
  contact: string;
  certification: string;
  certExpiry: string;
  assignedVesselId?: string;
  assignedPortId?: string;
  availability: 'On Duty' | 'Standby' | 'Resting' | 'On Leave';
  experienceYears: number;
}

export interface MaintenanceWorkOrder {
  id: string;
  vesselId: string;
  vesselName: string;
  type: 'Engine Overhaul' | 'Hull Inspection' | 'Navigational Sensor Calibration' | 'Safety Equipment' | 'Routine Service';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Urgent Due';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  technician: string;
  costInr: number;
  notes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole: string;
  action: string;
  category: 'Trip' | 'Boarding' | 'Emergency' | 'Alert' | 'System' | 'Booking' | 'Operator';
  details: string;
  ipAddress: string;
}

export interface PreDepartureChecklist {
  tripId: string;
  ferryId: string;
  captainName: string;
  timestamp: string;
  items: {
    id: string;
    title: string;
    checked: boolean;
    category: 'Engines & Power' | 'Navigation & Radar' | 'Safety & Life-Saving' | 'Port & Manifest';
  }[];
  isComplete: boolean;
  notes?: string;
}

export interface PassengerIncidentReport {
  id: string;
  timestamp: string;
  type:
    | 'Medical Emergency'
    | 'Lost Property'
    | 'Disruptive Passenger'
    | 'Safety Violation'
    | 'Accessibility Assistance'
    | 'Ticketing Dispute'
    | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  bookingRef?: string;
  passengerName?: string;
  passengerPhone?: string;
  seatNumbers?: string[];
  gateNumber: string;
  vesselName?: string;
  tripId?: string;
  description: string;
  actionTaken: string;
  staffName: string;
  staffBadgeId: string;
  status: 'Open' | 'Under Review' | 'First-Aid Rendered' | 'Item Cataloged' | 'Resolved' | 'Escalated to Port Security';
  itemCategory?: 'Smartphone' | 'Wallet / Cards' | 'Luggage / Bag' | 'Keys / Electronics' | 'IDs / Documents' | 'Other';
  itemStorageLocker?: string;
}

export interface MaintenanceLog {
  id: string;
  ferryId: string;
  vesselName: string;
  voyageRef: string;
  subsystem:
    | 'Main Propulsion'
    | 'Auxiliary Power'
    | 'Steering & Rudder'
    | 'Navigation & Radar'
    | 'Bilge & Pumping'
    | 'Bridge Wing & Wipers'
    | 'Passenger Deck & HVAC'
    | 'Gangway & Turnstiles'
    | 'Fire & Safety Systems';
  severity: 'Minor' | 'Advisory' | 'Moderate' | 'Urgent';
  title: string;
  description: string;
  deckLocation: string;
  reportedBy: string;
  crewRole: string;
  timestamp: string;
  voyagePhase: 'Pre-departure' | 'Fairway Transit' | 'High-Speed Cruise' | 'Berthing / Docked';
  status: 'Open' | 'Investigating' | 'Resolved';
  actionTaken?: string;
  resolutionNotes?: string;
}

export interface AccessibilitySettings {
  audibleAlertsEnabled: boolean;
  routineAlertsVolume: number; // 0 - 100
  distressAlertsVolume: number; // 0 - 100
  speechSynthesisEnabled: boolean;
  highContrastFlash: boolean;
  vibrationEnabled: boolean;
  distressBypassMute: boolean;
}

export interface EngineTelemetryRecord {
  id: string;
  vesselId: string;
  vesselName: string;
  timestamp: string;
  engineRpm: number;
  operatingHours: number;
  coolantTempC: number;
  oilPressureBar: number;
  oilTempC: number;
  exhaustGasTempC: number;
  vibrationRmsMmSec: number;
  fuelFlowRateLph: number;
  wearScorePercent: number;
  serviceRecommended: boolean;
  serviceReason?: string;
  maintenanceNotified: boolean;
  maintenanceNotifiedAt?: string;
  loggedBy: string;
}

export interface VesselWeatherSafetyThreshold {
  vesselClass: 'Class A (Speed Catamaran)' | 'Class B (Standard Monohull)' | 'Class C (Heritage Launch)' | 'Class D (Vehicle Ro-Pax)';
  maxWindKnots: number;
  maxWaveHeightM: number;
  maxSwellPeriodSec: number;
  advisorySpeedCapKnots: number;
}

export interface PassengerFeedback {
  id: string;
  tripId: string;
  bookingRef: string;
  vesselId: string;
  vesselName: string;
  routeId: string;
  routeName: string;
  passengerName: string;
  passengerEmail?: string;
  overallRating: number; // 1 - 5 stars
  // Specific requirement: capturing data on boarding speed
  boardingSpeedRating: number; // 1 - 5 stars
  boardingWaitMinutes: number;
  boardingSpeedNote?: string;
  // Specific requirement: capturing data on comfort
  comfortRating: number; // 1 - 5 stars
  comfortFactors: {
    seatingComfort: number; // 1 - 5
    airConditioningOrClimate: number; // 1 - 5
    rideSmoothnessAndRoll: number; // 1 - 5
    cleanliness: number; // 1 - 5
  };
  comments?: string;
  wouldRecommend: boolean;
  submittedAt: string;
}

export interface HourlyTelemetryReport {
  id: string;
  vesselId: string;
  vesselName: string;
  hourPeriod: string; // e.g. "13:00 - 14:00"
  timestamp: string;
  avgEngineRpm: number;
  peakEngineRpm: number;
  avgCoolantTempC: number;
  avgOilPressureBar: number;
  avgVibrationMmSec: number;
  totalFuelBurnLiters: number;
  nauticalMilesCovered: number;
  avgKnotsSpeed: number;
  healthStatus: 'Optimal' | 'Caution' | 'Service Required';
  captainNotes: string;
  exportedToAdmin: boolean;
  exportedAt?: string;
}

export interface BoardingStep {
  id: string;
  stepNumber: number;
  title: string;
  shortLabel: string;
  description: string;
  location: string;
  estimatedMinutes: number;
  status: 'completed' | 'current' | 'upcoming';
  mandatoryItems: string[];
  securityGuidelines: string[];
  terminalTip: string;
}



