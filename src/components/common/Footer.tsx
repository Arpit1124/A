import React from 'react';
import { useFerry } from '../../context/FerryContext';
import { Anchor, ShieldAlert, Phone, Globe, ExternalLink, Radio, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView, setCurrentRole, setOperatorTab, setIsStatusModalOpen } = useFerry();

  return (
    <footer className="bg-slate-950 border-t border-cyan-950/80 text-slate-400 text-xs mt-16">
      {/* Emergency & Maritime Advisory Bar */}
      <div className="bg-cyan-950/30 border-b border-cyan-900/30 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-cyan-300 font-medium">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Harbor Operations Broadcast: VHF Marine Ch 16 / Ch 12 • Port Control Dispatch Active</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1 text-red-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SAR Emergency Hotline: 1554 / +91 22 2261 4040</span>
            </span>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              <span>System Health: 99.98%</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                <Anchor className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">FerryFlow</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              "Know Where Your Ferry Is. Know When It Arrives." Production-ready maritime operations command platform
              and passenger passenger information network.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              AIS Engine v4.2 • Mumbai Harbor & Coastal Transit Zone
            </div>
          </div>

          {/* Col 2: Passenger Services */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-xs mb-3">Passenger Services</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveView('live-tracking')} className="hover:text-cyan-400 transition-colors">
                  Live Vessel Radar Tracking
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('book')} className="hover:text-cyan-400 transition-colors">
                  Book Ro-Pax & Ferry Tickets
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('routes')} className="hover:text-cyan-400 transition-colors">
                  Ferry Routes & Timetables
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('ports')} className="hover:text-cyan-400 transition-colors">
                  Port Terminals & Facilities
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('my-tickets')} className="hover:text-cyan-400 transition-colors">
                  Digital Tickets & Manifest Check
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Operations Command */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-xs mb-3">Operations Portals</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setCurrentRole('operator');
                    setOperatorTab('overview');
                    setActiveView('operator');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Operator Command Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentRole('operator');
                    setOperatorTab('boarding');
                    setActiveView('operator');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Digital Boarding & QR Scanner
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentRole('captain');
                    setActiveView('captain');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Captain Tactical Bridge
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentRole('operator');
                    setOperatorTab('emergency');
                    setActiveView('operator');
                  }}
                  className="hover:text-red-400 transition-colors text-red-400/90"
                >
                  Maritime Emergency Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentRole('admin');
                    setActiveView('admin');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  System Admin & Telemetry Logs
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Safety & Disclaimer */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-xs mb-3">Safety & Compliance</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Compliant with Directorate General of Shipping & Maharashtra Maritime Board safety guidelines.
            </p>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Simulation Mode:</span> Real-time coordinates and ETAs in
              this demonstration environment are generated by simulated marine AIS telemetry engines.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px]">
          <div>Copyright © 2026 FerryFlow. All rights reserved. Maritime Operations Command.</div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Carriage</span>
            <span className="hover:text-slate-300 cursor-pointer">Passenger Safety Charter</span>
            <span className="hover:text-slate-300 cursor-pointer">MMB Port Regulations</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
