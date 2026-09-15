import React from 'react';
import { useFerry } from '../../context/FerryContext';
import { Play, Pause, FastForward, RotateCcw, AlertCircle, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { UserRole } from '../../types';

export const SimulationBar: React.FC = () => {
  const {
    isSimulationPlaying,
    setIsSimulationPlaying,
    simulationSpeed,
    setSimulationSpeed,
    triggerSimulatedDelay,
    triggerEmergencySimulation,
    resetSimulationData,
    currentRole,
    setCurrentRole,
    ferries,
    activeView,
    setActiveView,
  } = useFerry();

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'operator' || role === 'fleet_manager' || role === 'safety_officer') {
      setActiveView('operator');
    } else if (role === 'captain' || role === 'crew') {
      setActiveView('captain');
    } else if (role === 'admin' || role === 'super_admin') {
      setActiveView('admin');
    } else {
      setActiveView('home');
    }
  };

  return (
    <div
      id="simulation-control-bar"
      className="bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/20 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md"
    >
      {/* Simulation Live Indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-semibold text-[10px] tracking-wider uppercase shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          DEMO LIVE SIMULATION
        </span>
        <span className="text-slate-400 hidden sm:inline text-[11px]">
          Simulated GPS/AIS transponders updating every 2.5s
        </span>
      </div>

      {/* Playback & Speed Controls */}
      <div className="flex items-center gap-2">
        <button
          id="sim-play-pause-btn"
          onClick={() => setIsSimulationPlaying(!isSimulationPlaying)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
            isSimulationPlaying
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
          }`}
          title={isSimulationPlaying ? 'Pause live movement' : 'Resume live movement'}
        >
          {isSimulationPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3" />}
          <span>{isSimulationPlaying ? 'Pause Fleet' : 'Resume Fleet'}</span>
        </button>

        {/* Speed multipliers */}
        <div className="flex items-center bg-slate-800/80 rounded border border-slate-700 p-0.5">
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => setSimulationSpeed(speed)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                simulationSpeed === speed
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Quick Simulation Scenarios */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            id="sim-trigger-delay"
            onClick={() => triggerSimulatedDelay('ferry-101', 8)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950/40 border border-amber-600/40 text-amber-300 hover:bg-amber-900/50 transition-colors text-[10px]"
            title="Inject 8-min delay on River Star"
          >
            <AlertCircle className="w-2.5 h-2.5" />
            <span>+8m Delay</span>
          </button>
          <button
            id="sim-trigger-emergency"
            onClick={() => triggerEmergencySimulation('ferry-105', 'Engine failure')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-950/40 border border-red-600/50 text-red-300 hover:bg-red-900/50 transition-colors text-[10px]"
            title="Trigger simulated maritime engine emergency"
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>Simulate Emergency</span>
          </button>
          <button
            onClick={resetSimulationData}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset simulation to default state"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Role Switcher Pill */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold pl-1 flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-cyan-400" />
          Role:
        </span>
        <select
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          className="bg-slate-900 text-cyan-300 font-semibold text-xs rounded border border-cyan-900/60 px-2 py-0.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="passenger">Passenger</option>
          <option value="operator">Operations Center</option>
          <option value="captain">Bridge Captain</option>
          <option value="admin">Super Admin</option>
        </select>
      </div>
    </div>
  );
};
