import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { MaritimeMap } from '../map/MaritimeMap';
import { FleetClusterOverviewMap } from '../map/FleetClusterOverviewMap';
import { StatusBadge } from '../common/StatusBadge';
import { RouteWeatherWidget } from '../live/RouteWeatherWidget';
import { LiveMarineWeatherModule } from '../live/LiveMarineWeatherModule';
import { EstimatedArrivalMargin } from '../tracking/EstimatedArrivalMargin';
import { DockingCountdownTimer } from '../tracking/DockingCountdownTimer';
import { Ferry, FerryStatus } from '../../types';
import {
  Ship,
  Search,
  Filter,
  Navigation,
  Gauge,
  Users,
  Compass,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Wrench,
  Shield,
  Phone,
  ArrowRight,
  ChevronRight,
  Anchor,
  Activity,
  Flame,
  Wind,
  Fuel,
  Sparkles,
} from 'lucide-react';

export const LiveTrackingView: React.FC = () => {
  const { ferries, routes, ports, trips, selectedFerryId, setSelectedFerryId, setActiveView } = useFerry();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'docking_timer' | 'arrival_margin' | 'telemetry' | 'crew' | 'safety' | 'maintenance'
  >('overview');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'ais_map' | 'fuel_clusters'>('ais_map');

  const selectedFerry = useMemo(() => {
    return ferries.find((f) => f.id === selectedFerryId) || ferries[0];
  }, [ferries, selectedFerryId]);

  const filteredFerries = useMemo(() => {
    return ferries.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.vesselId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.captainName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ferries, searchQuery, statusFilter]);

  const activeTrip = trips.find((t) => t.id === selectedFerry?.currentTripId);
  const currentRoute = routes.find((r) => r.id === selectedFerry?.currentRouteId);
  const currentPort = ports.find((p) => p.id === selectedFerry?.currentPortId);
  const destPort = ports.find((p) => p.id === selectedFerry?.destinationPortId);

  return (
    <div id="live-ferry-tracking-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Live Ferry Radar & AIS Fleet Tracker</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking {ferries.length} maritime assets across Mumbai Harbour, Mandwa Ro-Pax, and Elephanta Island channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-400 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AIS BEACON: 100% QUALITY</span>
          </div>
          <button
            onClick={() => setActiveView('book')}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            Book Passage
          </button>
        </div>
      </div>

      {/* Main Grid: Vessel List Sidebar + Full Maritime Interactive Radar Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Vessel Fleet Roster & Filters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vessel by name or ID (e.g. FV-101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['all', 'on_time', 'delayed', 'boarding', 'approaching', 'docked'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Vessel List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredFerries.map((f) => {
                const isSelected = selectedFerry?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFerryId(f.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-[10px] font-bold text-cyan-400">
                          {f.vesselId.replace('FV-', '')}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{f.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{f.type}</div>
                        </div>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 bg-slate-900/80 p-1.5 rounded-lg font-mono mt-2">
                      <div>
                        <span className="text-slate-500 block">SPD</span>
                        <span className="text-cyan-300 font-bold">{f.speedKnots} kts</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">HDG</span>
                        <span className="text-slate-200">{f.heading}°</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">PAX</span>
                        <span className="text-emerald-400 font-semibold">{f.currentPassengers}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Maritime Radar Display or Regional Fleet Fuel Clusters Overview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Display Mode:</span>
              <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('ais_map')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    viewMode === 'ais_map'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>AIS Transponder Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('fuel_clusters')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    viewMode === 'fuel_clusters'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>Regional Fuel Clusters</span>
                </button>
              </div>
            </div>

            {viewMode === 'ais_map' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    showHeatmap
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Corridor Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWeather(!showWeather)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    showWeather
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span>Weather {showWeather ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            )}
          </div>

          {viewMode === 'ais_map' ? (
            <>
              <MaritimeMap
                key={`map-${showHeatmap}-${showWeather}`}
                heightClass="h-[560px]"
                selectedFerry={selectedFerry}
                showControls={true}
                showRouteHeatmapDefault={showHeatmap}
                showWeatherDefault={showWeather}
              />
              {showWeather && (
                <LiveMarineWeatherModule selectedRouteId={selectedFerry?.currentRouteId} />
              )}
            </>
          ) : (
            <>
              <FleetClusterOverviewMap onSelectVessel={(id) => setSelectedFerryId(id)} />
              <LiveMarineWeatherModule selectedRouteId={selectedFerry?.currentRouteId} />
            </>
          )}
        </div>
      </div>

      {/* Dedicated Comprehensive Ferry Telemetry Sheet */}
      {selectedFerry && (
        <div id="vessel-telemetry-sheet" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 p-0.5 shadow-lg shadow-cyan-950">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Ship className="w-7 h-7 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{selectedFerry.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {selectedFerry.vesselId}
                  </span>
                  <StatusBadge status={selectedFerry.status} size="md" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Reg: {selectedFerry.registrationNumber} • {selectedFerry.type} • Built {selectedFerry.builtYear} by{' '}
                  {selectedFerry.manufacturer}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('book')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
              >
                Book This Ferry
              </button>
            </div>
          </div>

          {/* Telemetry Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-medium overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview & Route', icon: Navigation },
              { id: 'docking_timer', label: 'Time-to-Dock Countdown', icon: Clock, badge: 'Live AIS' },
              { id: 'arrival_margin', label: 'AI Arrival Margin', icon: Sparkles, badge: 'AI Live' },
              { id: 'telemetry', label: 'Live Telemetry & AIS', icon: Radio },
              { id: 'crew', label: 'Captain & Crew', icon: Users },
              { id: 'safety', label: 'Safety & Seaworthiness', icon: Shield },
              { id: 'maintenance', label: 'Engine Health', icon: Wrench },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Countdown Timer Section (shown in docking_timer tab and overview) */}
          {activeTab === 'docking_timer' && (
            <div className="space-y-4 animate-in fade-in">
              <DockingCountdownTimer
                selectedFerry={selectedFerry}
                route={currentRoute}
                trip={activeTrip}
                destPort={destPort}
              />
            </div>
          )}

          {/* Tab Content Panels */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Dynamic Countdown Timer Widget directly in overview */}
              <DockingCountdownTimer
                selectedFerry={selectedFerry}
                route={currentRoute}
                trip={activeTrip}
                destPort={destPort}
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Active Passage</span>
                  <div className="text-sm font-bold text-white">{currentRoute?.name || 'In Harbor Transit'}</div>
                  <div className="text-slate-400 text-[11px]">
                    Origin: <span className="text-slate-200">{currentPort?.name || 'Gateway Terminal'}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Destination: <span className="text-slate-200">{destPort?.name || 'Riverfront Mandwa'}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">Estimated Arrival</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                      AI Margin Active
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-300 flex items-baseline gap-1.5">
                    <span>{activeTrip?.estimatedArrival || '14:44'}</span>
                    <span className="text-xs text-slate-400 font-normal">± 2.4m</span>
                  </div>
                  <div className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>94% confidence • On track</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">Scheduled: {activeTrip?.scheduledArrival || '14:50'}</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Capacity & Load</span>
                  <div className="text-xl font-bold font-mono text-white">
                    {selectedFerry.currentPassengers} / {selectedFerry.capacity}{' '}
                    <span className="text-xs text-slate-400 font-normal">pax</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{ width: `${(selectedFerry.currentPassengers / selectedFerry.capacity) * 100}%` }}
                    />
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    {selectedFerry.vehicleCapacity > 0
                      ? `${selectedFerry.currentVehicles}/${selectedFerry.vehicleCapacity} vehicles loaded`
                      : 'Passenger-only Catamaran'}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Trip Progress</span>
                  <div className="text-xl font-bold font-mono text-cyan-400">
                    {activeTrip?.progressPercent || 68}% Complete
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Remaining:{' '}
                    <span className="font-mono font-bold text-white">
                      {activeTrip?.remainingDistanceKm || 6.2} km
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Updated: {selectedFerry.lastUpdate}</div>
                </div>
              </div>

              {/* AI Estimated Arrival Margin Analysis */}
              <EstimatedArrivalMargin
                ferry={selectedFerry}
                route={currentRoute}
                trip={activeTrip}
              />
            </div>
          )}

          {activeTab === 'arrival_margin' && (
            <div className="space-y-4">
              <EstimatedArrivalMargin
                ferry={selectedFerry}
                route={currentRoute}
                trip={activeTrip}
              />
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">GPS Latitude</div>
                <div className="text-base font-mono font-bold text-white mt-1">
                  {selectedFerry.position.lat.toFixed(5)}° N
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">GPS Longitude</div>
                <div className="text-base font-mono font-bold text-white mt-1">
                  {selectedFerry.position.lng.toFixed(5)}° E
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">AIS MMSI Transponder</div>
                <div className="text-base font-mono font-bold text-cyan-400 mt-1">
                  {selectedFerry.aisIdentifier}
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">GPS Device Telemetry ID</div>
                <div className="text-base font-mono font-bold text-slate-200 mt-1">
                  {selectedFerry.gpsDeviceId}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crew' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Master / Captain</span>
                <div className="text-base font-bold text-white mt-0.5">{selectedFerry.captainName}</div>
                <div className="text-slate-400 text-[11px]">DG Shipping Master Class 1 • 18 Years Experience</div>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400 text-[10px] block">Deck & Engineering Crew</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">{selectedFerry.crewCount} Personnel</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Bridge Comm Channel</span>
                  <span className="text-sm font-mono text-slate-200">VHF Ch 16 (Marine)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Seaworthiness Certification</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" /> Fully Certified (DG Shipping)
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Life Saving Appliances (LSA)</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block">
                  {selectedFerry.capacity + 40} Life Jackets + Inflatable Rafts
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Pre-Departure Checklist</span>
                <span className="text-sm font-bold text-cyan-400 mt-0.5 block">12 / 12 Checks Verified</span>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Engine Health Score</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-lg font-bold font-mono text-emerald-400">{selectedFerry.engineHealth}%</div>
                  <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedFerry.engineHealth}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Fuel Level</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-lg font-bold font-mono text-cyan-400">{selectedFerry.fuelLevel}%</div>
                  <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${selectedFerry.fuelLevel}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Next Scheduled Inspection</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">In 24 Days (Routine A-Check)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
