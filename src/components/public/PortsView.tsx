import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { MapPin, Ship, Wind, Eye, Users, Clock, CheckCircle2, Waves, ArrowRight, ShieldCheck } from 'lucide-react';

export const PortsView: React.FC = () => {
  const { ports, ferries, trips, setActiveView, setPreselectedRouteIdForBooking } = useFerry();
  const [selectedPortId, setSelectedPortId] = useState<string>(ports[0]?.id || '');

  const selectedPort = ports.find((p) => p.id === selectedPortId) || ports[0];
  const portFerries = ferries.filter((f) => f.currentPortId === selectedPort?.id);

  return (
    <div id="ports-terminals-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">
            Harbor Infrastructure
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Ports & Passenger Terminals</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time terminal gates, waiting passenger occupancy, berthing statuses, and coastal weather telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>All 4 Harbor Terminals Fully Operational</span>
        </div>
      </div>

      {/* Port Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ports.map((port) => {
          const isSelected = selectedPort?.id === port.id;
          return (
            <div
              key={port.id}
              onClick={() => setSelectedPortId(port.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-xl ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                    {port.code}
                  </span>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                  </span>
                </div>

                <h3 className="font-bold text-white text-base mb-1">{port.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{port.city}</p>

                <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Ship className="w-3 h-3 text-cyan-400" /> Active Ferries:
                    </span>
                    <span className="font-mono text-white font-bold">{port.activeFerriesCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-sky-400" /> Waiting Passengers:
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{port.waitingPassengers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-slate-400" /> Weather:
                    </span>
                    <span className="text-slate-300 font-medium">
                      {port.weather.temperatureC}°C, {port.weather.condition}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-cyan-400 font-medium">
                <span>View Terminal Gates</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Terminal Deep Dive View */}
      {selectedPort && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedPort.name}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {selectedPort.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Coordinates: {selectedPort.coordinates.lat.toFixed(4)}°N, {selectedPort.coordinates.lng.toFixed(4)}°E •{' '}
                {selectedPort.city}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('book')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Book Departure from Here
              </button>
            </div>
          </div>

          {/* Meteorological & Environmental Sensors */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider mb-3">
              Meteorological & Sea State Conditions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Air Temp</span>
                <span className="text-base font-mono font-bold text-white mt-1 block">
                  {selectedPort.weather.temperatureC}° C
                </span>
                <span className="text-cyan-400 text-[10px]">{selectedPort.weather.condition}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Wind Velocity</span>
                <span className="text-base font-mono font-bold text-sky-400 mt-1 block">
                  {selectedPort.weather.windKnots} knots
                </span>
                <span className="text-slate-400 text-[10px]">Dir: {selectedPort.weather.windDirection}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Wave Swell Height</span>
                <span className="text-base font-mono font-bold text-indigo-400 mt-1 block">
                  {selectedPort.weather.waveHeightM} m
                </span>
                <span className="text-slate-400 text-[10px]">Safe for all hulls</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Navigational Visibility</span>
                <span className="text-base font-mono font-bold text-emerald-400 mt-1 block">
                  {selectedPort.weather.visibilityKm} km
                </span>
                <span className="text-slate-400 text-[10px]">Clear Fairway</span>
              </div>
            </div>
          </div>

          {/* Gates & Boarding Turnstiles */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider mb-3">
              Boarding Gates & Turnstiles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {selectedPort.gates.map((gate) => (
                <div key={gate.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-white">Gate {gate.number}</span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                        gate.status === 'boarding'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse'
                          : gate.status === 'open'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {gate.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {gate.assignedTripId ? `Assigned to Trip #${gate.assignedTripId}` : 'Standby for next arrival'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Passenger Terminal Amenities */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider mb-3">
              Terminal Facilities & Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedPort.facilities.map((fac, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 text-xs font-medium flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{fac}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
