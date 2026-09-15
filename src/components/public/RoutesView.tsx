import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Navigation, Clock, Calendar, Ticket, MapPin, ArrowRight, ShieldCheck, Ship } from 'lucide-react';

export const RoutesView: React.FC = () => {
  const { routes, ports, trips, ferries, setActiveView, setPreselectedRouteIdForBooking } = useFerry();
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const originPort = ports.find((p) => p.id === selectedRoute?.originPortId);
  const destPort = ports.find((p) => p.id === selectedRoute?.destinationPortId);

  const routeTrips = trips.filter((t) => t.routeId === selectedRoute?.id);

  const handleBookRoute = (routeId: string) => {
    setPreselectedRouteIdForBooking(routeId);
    setActiveView('book');
  };

  return (
    <div id="routes-schedules-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">
            Maritime Corridors
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Ferry Routes & Daily Timetables</h1>
          <p className="text-xs text-slate-400 mt-1">
            Official scheduled commuter, tourist, and Ro-Pax vehicle transit corridors across Mumbai Harbor & Mandwa
          </p>
        </div>

        <button
          onClick={() => handleBookRoute(selectedRoute?.id || '')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
        >
          <Ticket className="w-4 h-4" />
          <span>Book Tickets for This Route</span>
        </button>
      </div>

      {/* Route Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {routes.map((route) => {
          const isSelected = selectedRoute?.id === route.id;
          const orig = ports.find((p) => p.id === route.originPortId);
          const dest = ports.find((p) => p.id === route.destinationPortId);

          return (
            <div
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-xl ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono text-cyan-400 font-bold">{route.distanceKm} km</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3 text-cyan-400" /> ~{route.estimatedDurationMin} mins
                  </span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug mb-2">{route.name}</h3>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>From: {orig?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>To: {dest?.name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">From</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono">₹{route.baseFareInr}</span>
                  {route.vehicleFareInr > 0 && (
                    <span className="text-[10px] text-slate-400 block">+ ₹{route.vehicleFareInr} / Vehicle</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookRoute(route.id);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Book
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Route Detailed View: Waypoints & Today's Timetable */}
      {selectedRoute && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                <span>{selectedRoute.name}</span>
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                <span>Distance: {selectedRoute.distanceKm} Nautical / Metric km</span>
                <span>•</span>
                <span>Transit Duration: ~{selectedRoute.estimatedDurationMin} minutes</span>
                <span>•</span>
                <span>Operating Days: {selectedRoute.operatingDays.join(', ')}</span>
              </div>
            </div>

            <button
              onClick={() => handleBookRoute(selectedRoute.id)}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/30"
            >
              Select Departure & Reserve
            </button>
          </div>

          {/* Navigation Waypoints Visual Breadcrumb */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider mb-3">
              Fairway Navigational Waypoints
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {selectedRoute.waypoints.map((wp, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{wp.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {wp.lat.toFixed(3)}°N, {wp.lng.toFixed(3)}°E
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Departure Timetable */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider mb-3">
              Today's Scheduled Departures
            </h3>
            <div className="space-y-2">
              {routeTrips.length > 0 ? (
                routeTrips.map((trip) => {
                  const assignedFerry = ferries.find((f) => f.id === trip.ferryId);
                  const availableSeats = trip.passengerCapacity - trip.bookedPassengers;

                  return (
                    <div
                      key={trip.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                          <Ship className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-cyan-300">
                              {trip.scheduledDeparture} → {trip.scheduledArrival}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                              Gate {trip.gateNumber}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Vessel: <span className="text-slate-200 font-medium">{assignedFerry?.name} ({assignedFerry?.vesselId})</span> •{' '}
                            Skipper: {trip.captainName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs font-medium text-emerald-400">{availableSeats} seats available</div>
                          <div className="text-xs text-slate-400">
                            Base: <span className="font-mono font-bold text-white">₹{selectedRoute.baseFareInr}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookRoute(selectedRoute.id)}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Select Ferry
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                  No additional departures scheduled for this route today.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
