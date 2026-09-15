import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import {
  Volume2,
  VolumeX,
  ShieldAlert,
  BellRing,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Ear,
  Eye,
  Smartphone,
  Mic,
  Activity,
  Radio,
  Play,
  RotateCcw,
} from 'lucide-react';

export const AccessibilitySettingsModal: React.FC = () => {
  const {
    isAccessibilityModalOpen,
    setIsAccessibilityModalOpen,
    accessibilitySettings,
    updateAccessibilitySettings,
    playRoutineChime,
    playDistressAlarm,
    theme,
  } = useFerry();

  const isDark = theme === 'dark';

  const [activeTest, setActiveTest] = useState<'routine' | 'distress' | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  if (!isAccessibilityModalOpen) return null;

  const handleTestRoutine = () => {
    setActiveTest('routine');
    playRoutineChime();
    setTimeout(() => setActiveTest(null), 1200);
  };

  const handleTestDistress = () => {
    setActiveTest('distress');
    playDistressAlarm();
    setTimeout(() => setActiveTest(null), 2000);
  };

  const handleResetDefaults = () => {
    updateAccessibilitySettings({
      audibleAlertsEnabled: true,
      routineAlertsVolume: 70,
      distressAlertsVolume: 95,
      speechSynthesisEnabled: true,
      highContrastFlash: true,
      vibrationEnabled: true,
      distressBypassMute: true,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Ear className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="accessibility-settings-title"
                  className="text-lg sm:text-xl font-extrabold tracking-tight"
                >
                  Maritime Operations Accessibility & Audio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  SOLAS & STCW Compliant
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Calibrate audible alert discrimination for routine notifications vs. critical distress signals
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAccessibilityModalOpen(false)}
            className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
            aria-label="Close accessibility settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Master Audible Alerts Toggle Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              accessibilitySettings.audibleAlertsEnabled
                ? isDark
                  ? 'bg-cyan-950/40 border-cyan-500/40'
                  : 'bg-cyan-50 border-cyan-200'
                : isDark
                ? 'bg-slate-800/60 border-slate-700'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accessibilitySettings.audibleAlertsEnabled
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {accessibilitySettings.audibleAlertsEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm">Master Audible Audio Alerts</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {accessibilitySettings.audibleAlertsEnabled
                    ? 'Sound engine synthesized via Web Audio API'
                    : 'All non-critical audio chimes silenced'}
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={accessibilitySettings.audibleAlertsEnabled}
                onChange={(e) =>
                  updateAccessibilitySettings({ audibleAlertsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Sound Discrimination Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Audio Alert Profile Calibration</span>
              </h3>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Designed for noisy wheelhouses and engine rooms
              </span>
            </div>

            {/* Routine Notifications Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              } ${activeTest === 'routine' ? 'ring-2 ring-cyan-400' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Routine Maritime Notifications</div>
                    <div className="text-[11px] text-slate-400">
                      Gentle dual-tone harmonic chime (587Hz &rarr; 880Hz). Used for ticket validation, boarding status, and timetable updates.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTestRoutine}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-cyan-700 shadow-sm'
                  }`}
                  title="Test Routine Chime"
                >
                  <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  <span>Test Routine Chime</span>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-4">
                <span className="text-xs text-slate-400 shrink-0 w-24">Routine Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={accessibilitySettings.routineAlertsVolume}
                  disabled={!accessibilitySettings.audibleAlertsEnabled}
                  onChange={(e) =>
                    updateAccessibilitySettings({ routineAlertsVolume: Number(e.target.value) })
                  }
                  className="flex-1 accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <span className="text-xs font-mono w-10 text-right font-bold text-cyan-400">
                  {accessibilitySettings.routineAlertsVolume}%
                </span>
              </div>
            </div>

            {/* Critical Emergency Distress Signals Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-red-950/20 border-red-800/40' : 'bg-red-50/70 border-red-200'
              } ${activeTest === 'distress' ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-red-400 flex items-center gap-1.5">
                      <span>Critical Emergency Distress Signals</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                        HIGH PRIORITY
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      SOLAS-grade pulsating warble siren (800Hz / 1050Hz). Used for MAYDAY distress, weather threshold breach, and hull safety alerts.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTestDistress}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/30"
                  title="Test Emergency Distress Alarm"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Test Distress Siren</span>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-4">
                <span className="text-xs text-slate-400 shrink-0 w-24">Distress Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={accessibilitySettings.distressAlertsVolume}
                  onChange={(e) =>
                    updateAccessibilitySettings({ distressAlertsVolume: Number(e.target.value) })
                  }
                  className="flex-1 accent-red-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <span className="text-xs font-mono w-10 text-right font-bold text-red-400">
                  {accessibilitySettings.distressAlertsVolume}%
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="bypass-mute-toggle"
                  checked={accessibilitySettings.distressBypassMute}
                  onChange={(e) =>
                    updateAccessibilitySettings({ distressBypassMute: e.target.checked })
                  }
                  className="rounded border-red-700 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="bypass-mute-toggle" className="text-slate-300 cursor-pointer">
                  <strong>Life-Safety Override:</strong> Always sound distress alarms even if master audio is silenced.
                </label>
              </div>
            </div>
          </div>

          {/* Assistive Technologies & Accessibility Modes */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Multi-Sensory Accessibility & Assistive Modes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Screen Reader Voice Announcement */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                  isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-sky-400">
                  <Mic className="w-4 h-4" />
                  <span className="font-bold text-white">Voice Synthesizer</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Speaks vessel coordinates and weather directives aloud via Web Speech API.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={accessibilitySettings.speechSynthesisEnabled}
                    onChange={(e) =>
                      updateAccessibilitySettings({ speechSynthesisEnabled: e.target.checked })
                    }
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-slate-300 font-semibold">Enable Voice Alerts</span>
                </label>
              </div>

              {/* High Contrast Visual Flash */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                  isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <Activity className="w-4 h-4" />
                  <span className="font-bold text-white">Visual Strobe Beacon</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Flashes screen borders with high-contrast amber/red pulses for hearing-impaired crew.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={accessibilitySettings.highContrastFlash}
                    onChange={(e) =>
                      updateAccessibilitySettings({ highContrastFlash: e.target.checked })
                    }
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-slate-300 font-semibold">Visual Flash Mode</span>
                </label>
              </div>

              {/* Tactile Haptic Vibration */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                  isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  <span className="font-bold text-white">Haptic Vibration</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Sends vibration pulses to mobile devices for port gate crew and deckhands.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={accessibilitySettings.vibrationEnabled}
                    onChange={(e) =>
                      updateAccessibilitySettings({ vibrationEnabled: e.target.checked })
                    }
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-slate-300 font-semibold">Haptic Feedback</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            onClick={handleResetDefaults}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Restore Maritime Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}

            <button
              onClick={() => setIsAccessibilityModalOpen(false)}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
