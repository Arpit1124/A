import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { StatusBadge } from '../common/StatusBadge';
import { Passenger, VehicleInfo, Booking } from '../../types';
import {
  Ticket,
  Calendar,
  Users,
  Car,
  Ship,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Download,
  Share2,
  Navigation,
  Compass,
  Radio,
  FileCheck,
} from 'lucide-react';
import { ContextAwareHelpTooltip } from './ContextAwareHelpTooltip';

export const BookingView: React.FC = () => {
  const {
    routes,
    ports,
    trips,
    ferries,
    createBooking,
    preselectedRouteIdForBooking,
    setPreselectedRouteIdForBooking,
    setActiveView,
    setSelectedFerryId,
  } = useFerry();

  // Wizard Steps: 1: Route & Pax -> 2: Ferry Selection -> 3: Pax Details -> 4: Payment -> 5: Issued Ticket
  const [step, setStep] = useState<number>(1);

  // Step 1 State
  const [selectedRouteId, setSelectedRouteId] = useState<string>(preselectedRouteIdForBooking || routes[0]?.id || '');
  const [travelDate, setTravelDate] = useState<string>('2026-09-05');
  const [adultCount, setAdultCount] = useState<number>(1);
  const [childCount, setChildCount] = useState<number>(0);
  const [seniorCount, setSeniorCount] = useState<number>(0);
  const [withVehicle, setWithVehicle] = useState<boolean>(false);
  const [vehicleType, setVehicleType] = useState<VehicleInfo['type']>('Hatchback / Sedan');
  const [vehicleReg, setVehicleReg] = useState<string>('');

  // Step 2 State
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  // Step 3 Passenger Details State (Default passenger primed for seamless test)
  const [passengerName, setPassengerName] = useState<string>('Arpit Sharma');
  const [email, setEmail] = useState<string>('arpitsharma1124@gmail.com');
  const [mobile, setMobile] = useState<string>('+91 98201 44510');
  const [age, setAge] = useState<number>(32);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [idType, setIdType] = useState<Passenger['idType']>('Aadhaar');
  const [idNumber, setIdNumber] = useState<string>('7845 9912 3014');
  const [accessibilityNeed, setAccessibilityNeed] = useState<Passenger['accessibilityNeed']>('None');
  const [emergencyName, setEmergencyName] = useState<string>('Neha Sharma');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('+91 98201 44511');
  const [emergencyRelation, setEmergencyRelation] = useState<string>('Spouse');

  // Step 4 Payment State
  const [paymentMethod, setPaymentMethod] = useState<Booking['paymentMethod']>('UPI');
  const [upiId, setUpiId] = useState<string>('arpitsharma@oksbi');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Step 5 Generated Booking
  const [issuedBooking, setIssuedBooking] = useState<Booking | null>(null);

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const originPort = ports.find((p) => p.id === activeRoute?.originPortId);
  const destPort = ports.find((p) => p.id === activeRoute?.destinationPortId);

  // Calculate pricing in INR
  const totalPassengerCount = adultCount + childCount + seniorCount;
  const baseRate = activeRoute?.baseFareInr || 180;
  const adultFare = adultCount * baseRate;
  const childFare = childCount * Math.round(baseRate * 0.5);
  const seniorFare = seniorCount * Math.round(baseRate * 0.7);
  const vehicleFare = withVehicle ? (activeRoute?.vehicleFareInr || 850) : 0;
  const totalFare = adultFare + childFare + seniorFare + vehicleFare;

  const availableTrips = trips.filter((t) => t.routeId === selectedRouteId);

  const handleSelectFerry = (tripId: string) => {
    setSelectedTripId(tripId);
    setStep(3);
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      const passengerList: Passenger[] = [
        {
          id: `p-${Date.now()}`,
          fullName: passengerName,
          email,
          mobile,
          age,
          gender,
          category: seniorCount > 0 ? 'Senior' : 'Adult',
          idType,
          idNumber,
          accessibilityNeed,
          emergencyContact: {
            name: emergencyName,
            phone: emergencyPhone,
            relation: emergencyRelation,
          },
        },
      ];

      // Add extra dummy passengers if count > 1
      for (let i = 1; i < totalPassengerCount; i++) {
        passengerList.push({
          id: `p-${Date.now()}-${i}`,
          fullName: `Co-Passenger ${i + 1}`,
          email,
          mobile,
          age: 28,
          gender: 'Female',
          category: 'Adult',
          idType: 'Aadhaar',
          idNumber: '•••• •••• 9920',
          accessibilityNeed: 'None',
          emergencyContact: {
            name: emergencyName,
            phone: emergencyPhone,
            relation: emergencyRelation,
          },
        });
      }

      const vehicleInfo: VehicleInfo | undefined = withVehicle
        ? {
            type: vehicleType,
            registrationNumber: vehicleReg || 'MH 02 CJ 7712',
            driverName: passengerName,
          }
        : undefined;

      const booking = createBooking({
        tripId: selectedTripId || availableTrips[0]?.id || 'trip-101',
        routeId: selectedRouteId,
        passengers: passengerList,
        vehicle: vehicleInfo,
        totalFareInr: totalFare,
        paymentMethod,
        bookedByEmail: email,
      });

      setIssuedBooking(booking);
      setIsProcessingPayment(false);
      setStep(5);
    }, 1200);
  };

  return (
    <div id="passenger-booking-system" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Step Indicator */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
          <Ticket className="w-3.5 h-3.5 text-cyan-400" />
          <span>FerryFlow Passenger & Ro-Pax Ticketing</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Ferry Passage Reservation</h1>
        <p className="text-xs text-slate-400">
          Real-time seat allocation, vehicle deck booking, and verified turnstile QR passes
        </p>
      </div>

      {/* Progress Wizard Bar */}
      <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-semibold">
        {[
          { num: 1, label: 'Route' },
          { num: 2, label: 'Select Ferry' },
          { num: 3, label: 'Passenger' },
          { num: 4, label: 'Payment' },
          { num: 5, label: 'Ticket' },
        ].map((s) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-all ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-[11px] ${isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: ROUTE, DATE & PASSENGERS */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in">
          <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <span>Step 1: Select Route, Date & Passenger Tier</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Route Selector */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Choose Ferry Route</label>
                <ContextAwareHelpTooltip
                  title="Maritime Route & Channel Navigation"
                  badge="SCHEDULED CROSSING"
                  description="Standard passenger fairway crossing connecting harbor piers. Sailing run times are hydrodynamically modeled based on typical Arabian Sea tidal currents."
                  detailsList={[
                    "Gateway ⇄ Mandwa: Ro-Pax capable, sheltered fairway crossing (~45 mins)",
                    "Bhaucha Dhakka ⇄ Mora Pier: Traditional catamaran commuter lane (~35 mins)",
                    "Gateway ⇄ Elephanta Caves: Heritage island tourist line (~50 mins)",
                  ]}
                  policyNote="Harbor speed limits enforced by Mumbai Port Trust and Indian Coast Guard."
                  position="bottom"
                />
              </div>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full bg-slate-950 text-white text-sm rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (₹{r.baseFareInr} base • ~{r.estimatedDurationMin} mins)
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Travel Date</label>
                <ContextAwareHelpTooltip
                  title="Travel Date & Peak Sailing Rules"
                  badge="DYNAMIC TARIFF"
                  description="Select your departure date. High-demand weekend voyages feature extra roll-on vehicle capacity and priority gangway boarding slots."
                  detailsList={[
                    "Advance booking guarantees reserved seating & vehicle deck slots",
                    "Tickets valid for specified sailing time with 60-min gate clearance buffer",
                  ]}
                  policyNote="Rescheduling allowed up to 4 hours prior without cancellation fees."
                  position="top"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-slate-950 text-white text-sm rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Origin & Destination Readout */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">DEPARTURE PORT</span>
                <span className="font-semibold text-slate-200">{originPort?.name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block">ARRIVAL PORT</span>
                <span className="font-semibold text-slate-200">{destPort?.name}</span>
              </div>
            </div>
          </div>

          {/* Passenger Tiers Counter */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase text-slate-400">Passenger Categories</h3>
              <span className="text-[11px] text-cyan-400 font-medium">Hover/focus info icons for discount terms</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Adult Category */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">Adult (12+ yrs)</span>
                    <ContextAwareHelpTooltip
                      title="Adult Passenger Fare (12+ Years)"
                      badge="STANDARD TARIFF"
                      description="Full base passenger fare for passengers aged 12 years and above. Grants unreserved upper and lower deck seating access."
                      detailsList={[
                        "20 kg carry-on luggage included without surcharge",
                        "Turnstile fast-track QR boarding pass included",
                        "Complimentary lifejacket safety briefing upon entry",
                      ]}
                      policyNote="Cancellable with full refund up to 2 hours prior to sailing."
                      position="top"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">₹{baseRate}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm font-bold w-4 text-center">{adultCount}</span>
                  <button
                    onClick={() => setAdultCount(adultCount + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Child Concession */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">Child (3-11 yrs)</span>
                    <ContextAwareHelpTooltip
                      title="Child Concession (50% OFF)"
                      badge="50% MMB DISCOUNT"
                      description="Pursuant to Maharashtra Maritime Board (MMB) coastal ferry tariffs, children aged 3 through 11 receive an automatic 50% discount on base fares."
                      detailsList={[
                        "Infants under 3 years travel FREE on an adult's lap",
                        "Dedicated child-sized lifejacket issued at boarding gangway",
                        "Stroller / pram space permitted in designated luggage bay",
                      ]}
                      policyNote="Proof of age (School ID / Birth Certificate / Aadhaar) may be requested at turnstile."
                      position="top"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                    <span>₹{Math.round(baseRate * 0.5)}</span>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1 rounded">50% OFF</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChildCount(Math.max(0, childCount - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm font-bold w-4 text-center">{childCount}</span>
                  <button
                    onClick={() => setChildCount(childCount + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Senior Citizen Concession */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">Senior (60+ yrs)</span>
                    <ContextAwareHelpTooltip
                      title="Senior Citizen Concession (30% OFF)"
                      badge="30% CITIZEN DISCOUNT"
                      description="Subsidized fare concession for citizens aged 60 and older. Includes priority ramp boarding and lower-deck reserved seating."
                      detailsList={[
                        "Lower-deck reserved seating near exit gangways",
                        "Complimentary wheelchair ramp escort available upon arrival",
                        "Express priority gate turnstile clearance lane",
                      ]}
                      policyNote="Valid government photo ID with DOB (Aadhaar, Voter Card, Passport) required at gate."
                      position="top"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                    <span>₹{Math.round(baseRate * 0.7)}</span>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1 rounded">30% OFF</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSeniorCount(Math.max(0, seniorCount - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm font-bold w-4 text-center">{seniorCount}</span>
                  <button
                    onClick={() => setSeniorCount(seniorCount + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Vehicle Space */}
          {activeRoute?.vehicleFareInr > 0 && (
            <div className="pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={withVehicle}
                        onChange={(e) => setWithVehicle(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                      />
                      <span>Add Vehicle Space on Ro-Pax Deck (+₹{activeRoute.vehicleFareInr})</span>
                    </label>
                    <ContextAwareHelpTooltip
                      title="Ro-Pax Drive-On Vehicle Deck Space"
                      badge="RO-PAX CAR DECK"
                      description="Secure parking bay on the ventilated lower vehicle deck. Driver passage is included with the vehicle ticket."
                      detailsList={[
                        "Hydraulic ramp roll-on/roll-off clearance for low-chassis cars",
                        "Vehicle tie-down and wheel chocks provided by maritime crew",
                        "Max vehicle height: 2.1 meters",
                      ]}
                      policyNote="Vehicles must arrive at Port Gate 30 minutes before sailing."
                      position="right"
                    />
                  </div>
                  <Car className="w-5 h-5 text-sky-400" />
                </div>

                {withVehicle && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-[11px] text-slate-400 block">Vehicle Category</label>
                        <ContextAwareHelpTooltip
                          title="Vehicle Categories & Dimensions"
                          badge="DECK SPECS"
                          description="Different deck slots are partitioned according to chassis weight and turning radius."
                          detailsList={[
                            "Hatchback/Sedan: Standard 4.2m bay",
                            "SUV/MUV: Heavy axle space (+₹150 tie-down surcharge)",
                            "Two-Wheeler: Motorcycle & scooter lash bay (50% vehicle tariff)",
                            "Commercial Van: Commercial delivery vehicle bay",
                          ]}
                          position="top"
                        />
                      </div>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as any)}
                        className="w-full bg-slate-900 text-white text-xs rounded-lg p-2 border border-slate-800"
                      >
                        <option value="Hatchback / Sedan">Hatchback / Sedan</option>
                        <option value="SUV / MUV">SUV / MUV (+₹150 surcharge)</option>
                        <option value="Two-Wheeler">Two-Wheeler Motorbike (50% off)</option>
                        <option value="Commercial Van">Commercial Van</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Vehicle Registration No.</label>
                      <input
                        type="text"
                        placeholder="e.g. MH 02 CJ 7712"
                        value={vehicleReg}
                        onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                        className="w-full bg-slate-900 text-white text-xs rounded-lg p-2 border border-slate-800 uppercase font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fare Summary & Step 1 Proceed */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <span className="text-slate-400 text-xs block">Estimated Fare</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">₹{totalFare}</span>
            </div>
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2"
            >
              <span>Search Available Ferries</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DISPLAY AVAILABLE FERRIES */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Step 2: Choose Your Ferry</h2>
              <p className="text-xs text-slate-400">
                Departures on {travelDate} for {totalPassengerCount} Passenger(s) • {activeRoute.name}
              </p>
            </div>
            <button onClick={() => setStep(1)} className="text-xs text-cyan-400 hover:underline">
              ← Change Route / Date
            </button>
          </div>

          <div className="space-y-3">
            {availableTrips.map((trip) => {
              const assignedFerry = ferries.find((f) => f.id === trip.ferryId);
              const availableSeats = trip.passengerCapacity - trip.bookedPassengers;

              return (
                <div
                  key={trip.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:border-cyan-500/50 transition-all shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                      <Ship className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-base">{assignedFerry?.name}</h3>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                          {assignedFerry?.vesselId}
                        </span>
                        <StatusBadge status={trip.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="font-mono text-cyan-300 font-bold text-sm">
                          {trip.scheduledDeparture} → {trip.scheduledArrival}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{activeRoute.estimatedDurationMin} min duration</span>
                        <span>•</span>
                        <span className="text-slate-400">Gate {trip.gateNumber}</span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        {assignedFerry?.type} • Skipper: {trip.captainName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs font-medium text-emerald-400">{availableSeats} seats available</div>
                      <div className="text-lg font-bold font-mono text-white">₹{totalFare}</div>
                    </div>

                    <button
                      onClick={() => handleSelectFerry(trip.id)}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/30 flex items-center gap-1.5"
                    >
                      <span>Select Ferry</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: PASSENGER INFORMATION FORM */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Step 3: Passenger Information</h2>
              <p className="text-xs text-slate-400">
                Government regulation requires passenger manifest details for maritime safety clearance
              </p>
            </div>
            <button onClick={() => setStep(2)} className="text-xs text-cyan-400 hover:underline">
              ← Back to Ferry Selection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-slate-300 font-semibold block">Full Legal Name (as per ID)</label>
                <ContextAwareHelpTooltip
                  title="Maritime Passenger Manifest Identity"
                  badge="DG SHIPPING RULE"
                  description="Directorate General of Shipping mandates exact legal name verification for harbor vessel departures."
                  detailsList={[
                    "Must match photo ID displayed at gate turnstiles",
                    "Used for Coast Guard safety muster roll manifests",
                  ]}
                  policyNote="Discrepancies may delay turnstile clearance."
                  position="top"
                />
              </div>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Arpit Sharma"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
                placeholder="arpitsharma1124@gmail.com"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Mobile Contact Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
                placeholder="+91 98201 44510"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-slate-300 font-semibold block">Government ID Type</label>
                <ContextAwareHelpTooltip
                  title="Accepted Harbor Photo Identification"
                  badge="SECURITY SCREENING"
                  description="Acceptable forms of government-issued credentials under Central Industrial Security Force (CISF) and Port Trust directives."
                  detailsList={[
                    "Aadhaar Card (Physical or m-Aadhaar)",
                    "Passport (Required for foreign passport holders)",
                    "Driving License / Voter Photo ID Card",
                  ]}
                  policyNote="Original or digital DigiLocker ID accepted at turnstile scanners."
                  position="top"
                />
              </div>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as any)}
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">ID Number</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
                placeholder="Last 4 digits or full ID"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-slate-300 font-semibold block">Accessibility Assistance</label>
                <ContextAwareHelpTooltip
                  title="Pier Accessibility & Wheelchair Support"
                  badge="PORT ASSISTANCE"
                  description="Pre-arranges dedicated assistance from the passenger terminal gate down the tidal gangway ramp onto the vessel."
                  detailsList={[
                    "Motorized and standard wheelchair escort available",
                    "Direct ramp clearance bypassing turnstile stairs",
                    "Priority boarding call 15 minutes before general passenger boarding",
                  ]}
                  policyNote="Complimentary port amenity with no supplemental fees."
                  position="top"
                />
              </div>
              <select
                value={accessibilityNeed}
                onChange={(e) => setAccessibilityNeed(e.target.value as any)}
                className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="None">None (Standard Boarding)</option>
                <option value="Wheelchair">Wheelchair Ramp / Elevator Needed</option>
                <option value="Assistance">Elderly / Walking Stick Assistance</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Emergency Contact Person & Phone</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Contact Mobile"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Passage manifest for <strong className="text-white">{passengerName}</strong>
            </div>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT SIMULATION */}
      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Step 4: Payment Confirmation</h2>
                <ContextAwareHelpTooltip
                  title="Instant Boarding QR & Turnstile Clearance"
                  badge="ZERO TRANSACTION FEE"
                  description="All payment modes issue an encrypted, high-contrast dynamic QR boarding pass valid at automated gate turnstiles."
                  detailsList={[
                    "UPI: Instant validation with zero PG surcharge",
                    "Stored directly in your virtual Digital Wallet for fast boarding",
                    "SMS & WhatsApp e-ticket dispatched within 3 seconds",
                  ]}
                  policyNote="Immediate 100% automated refund to source account upon sailing cancellation."
                  position="bottom"
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated Sandbox Payment Ready • Total Amount: <strong className="text-cyan-300 font-mono">₹{totalFare}</strong>
              </p>
            </div>
            <button onClick={() => setStep(3)} className="text-xs text-cyan-400 hover:underline">
              ← Edit Details
            </button>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { id: 'UPI', label: 'UPI / QR Code', icon: QrCode },
              { id: 'Credit/Debit Card', label: 'Debit / Card', icon: CreditCard },
              { id: 'Net Banking', label: 'Net Banking', icon: FileCheck },
              { id: 'Counter Cash', label: 'Pay at Terminal', icon: Ticket },
            ].map((pm) => {
              const Icon = pm.icon;
              const isSelected = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-[11px]">{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Payment Method Details */}
          {paymentMethod === 'UPI' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-xs">
              <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center">
                {/* SVG Mock UPI QR */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="30" height="30" fill="black" />
                  <rect x="15" y="15" width="20" height="20" fill="white" />
                  <rect x="20" y="20" width="10" height="10" fill="black" />
                  <rect x="60" y="10" width="30" height="30" fill="black" />
                  <rect x="65" y="15" width="20" height="20" fill="white" />
                  <rect x="70" y="20" width="10" height="10" fill="black" />
                  <rect x="10" y="60" width="30" height="30" fill="black" />
                  <rect x="15" y="65" width="20" height="20" fill="white" />
                  <rect x="20" y="70" width="10" height="10" fill="black" />
                  <rect x="50" y="50" width="15" height="15" fill="black" />
                  <rect x="75" y="65" width="15" height="15" fill="black" />
                </svg>
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-white text-sm">Scan QR with GPay / PhonePe / Paytm / BHIM</div>
                <div className="text-slate-400 text-[11px]">Or pay using UPI VPA:</div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'Credit/Debit Card' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Card Number (Sandbox Test Mode)</label>
                <input
                  type="text"
                  defaultValue="4532 •••• •••• 8912"
                  className="w-full bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Expiry</label>
                  <input
                    type="text"
                    defaultValue="08/29"
                    className="w-full bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">CVV</label>
                  <input
                    type="password"
                    defaultValue="•••"
                    className="w-full bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pay Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block">Total Payable</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">₹{totalFare}</span>
            </div>
            <button
              onClick={handleProcessPayment}
              disabled={isProcessingPayment}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pay ₹{totalFare} & Generate Digital Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: ISSUED DIGITAL TICKET WITH QR CODE */}
      {step === 5 && issuedBooking && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
            <p className="text-xs text-slate-400">
              Your digital ticket is ready for turnstile QR scanning at the terminal
            </p>
          </div>

          {/* The Physical Digital Ticket Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold">
                  FF
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">FerryFlow Digital Boarding Pass</h3>
                  <div className="text-xs font-mono text-cyan-400">Booking ID: {issuedBooking.bookingRef}</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Confirmed & Paid
              </span>
            </div>

            {/* Ticket Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">PRIMARY PASSENGER</span>
                <span className="font-bold text-white text-sm">{issuedBooking.passengers[0]?.fullName}</span>
                <span className="text-slate-400 text-[11px] block">{issuedBooking.passengers.length} Passenger(s)</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">VESSEL & TRIP</span>
                <span className="font-bold text-cyan-300 text-sm">River Star (FV-101)</span>
                <span className="text-slate-400 text-[11px] block">Gate G-1</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">SEAT NUMBERS</span>
                <span className="font-bold font-mono text-white text-sm">{issuedBooking.seatNumbers.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">DEPARTURE TIME</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">14:05 PM</span>
              </div>
            </div>

            {/* QR Code Segment */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                  {/* High-fidelity SVG QR Representation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect width="100" height="100" fill="white" />
                    <rect x="8" y="8" width="28" height="28" fill="#030712" />
                    <rect x="13" y="13" width="18" height="18" fill="white" />
                    <rect x="18" y="18" width="8" height="8" fill="#030712" />
                    <rect x="64" y="8" width="28" height="28" fill="#030712" />
                    <rect x="69" y="13" width="18" height="18" fill="white" />
                    <rect x="74" y="18" width="8" height="8" fill="#030712" />
                    <rect x="8" y="64" width="28" height="28" fill="#030712" />
                    <rect x="13" y="69" width="18" height="18" fill="white" />
                    <rect x="18" y="74" width="8" height="8" fill="#030712" />
                    <rect x="42" y="12" width="6" height="16" fill="#030712" />
                    <rect x="12" y="44" width="16" height="6" fill="#030712" />
                    <rect x="42" y="42" width="16" height="16" fill="#030712" />
                    <rect x="64" y="46" width="12" height="12" fill="#030712" />
                    <rect x="44" y="68" width="12" height="18" fill="#030712" />
                    <rect x="66" y="68" width="24" height="8" fill="#030712" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Official Turnstile Verification Barcode</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Payload: {issuedBooking.bookingRef}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Scannable on operator turnstiles & portable handhelds</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">TOTAL PAID</span>
                <span className="text-xl font-bold font-mono text-white">₹{issuedBooking.totalFareInr}</span>
                <span className="text-[10px] text-slate-400 block">{issuedBooking.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Post Booking Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setActiveView('live-tracking');
                setSelectedFerryId('ferry-101');
              }}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-cyan-950"
            >
              <Radio className="w-4 h-4" />
              <span>Track Ferry On Live Radar</span>
            </button>

            <button
              onClick={() => setActiveView('my-tickets')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>View in My Bookings</span>
            </button>

            <button
              onClick={() => {
                alert(`Digital Ticket ${issuedBooking.bookingRef} downloaded as PDF.`);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
