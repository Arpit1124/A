import React, { useState } from 'react';
import { useFerry } from '../../context/FerryContext';
import { ServiceDelayPushBanner } from './ServiceDelayPushBanner';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import {
  Ship,
  Navigation,
  MapPin,
  Calendar,
  Ticket,
  Bell,
  Search,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  Compass,
  Radio,
  Clock,
  Sparkles,
  ArrowRight,
  Anchor,
  AlertTriangle,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Ear,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    alerts,
    ferries,
    trips,
    setIsSearchOpen,
    setIsStatusModalOpen,
    currentRole,
    setCurrentRole,
    setOperatorTab,
    bookings,
    theme,
    toggleTheme,
    t,
    setIsAccessibilityModalOpen,
    accessibilitySettings,
  } = useFerry();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const safeT = typeof t === 'function' ? t : (k: string) => k;

  const activeAlertsCount = alerts.filter((a) => a.active).length;
  const movingFerriesCount = ferries.filter((f) => f.speedKnots > 0).length;
  const hasActiveDelays =
    alerts.some((a) => a.active && (a.category === 'Delay' || a.title.toLowerCase().includes('delay'))) ||
    trips.some((tr) => tr.status === 'delayed' || tr.delayMinutes > 0) ||
    ferries.some((f) => f.status === 'delayed');

  const navItems = [
    { id: 'home', label: safeT('navHome'), icon: Ship },
    { id: 'live-tracking', label: safeT('navLiveTracking'), icon: Radio, badge: `${movingFerriesCount} Live` },
    { id: 'routes', label: safeT('navRoutes'), icon: Navigation },
    { id: 'ports', label: safeT('navPorts'), icon: MapPin },
    { id: 'book', label: safeT('navBook'), icon: Ticket, primary: true },
    { id: 'my-tickets', label: safeT('navTickets'), icon: Clock, badge: bookings.length > 0 ? `${bookings.length}` : undefined },
    { id: 'alerts', label: safeT('navAlerts'), icon: Bell, badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : undefined },
  ];

  const isDark = theme === 'dark';

  return (
    <header className={`${isDark ? 'bg-slate-950/95 border-b border-cyan-950/70' : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm'} sticky top-[37px] z-30 backdrop-blur-md transition-colors duration-200`}>
      {/* Automated Push-Notification-Style Banner */}
      <ServiceDelayPushBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Live Network Tag */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 p-0.5 shadow-lg shadow-cyan-900/40 group-hover:shadow-cyan-700/50 transition-all flex items-center justify-center">
                <div className={`w-full h-full ${isDark ? 'bg-slate-950' : 'bg-white'} rounded-[10px] flex items-center justify-center p-1`}>
                  <Logo size={26} variant="blue" className="group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-extrabold text-lg tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent' : 'text-slate-900'}`}>
                    FerryFlow
                  </span>
                  <span className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${isDark ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'}`}>
                    {isDark ? 'AIS Ops' : 'Passenger'}
                  </span>
                </div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium tracking-wide`}>
                  Real-Time Maritime Operations
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              if (item.primary) {
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => setActiveView(item.id)}
                    className={`ml-2 px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveView(item.id)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 relative ${
                    isActive
                      ? isDark
                        ? 'bg-slate-800 text-cyan-400 font-semibold'
                        : 'bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200'
                      : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        item.id === 'alerts'
                          ? isDark
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          : isDark
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                            : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Language Switcher, Theme Switcher, Search, System Status, Portal Portals */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Maritime i18n Language Switcher (EN / ES / FR) */}
            <LanguageSwitcher />

            {/* User-Controlled Theme Switcher */}
            <ThemeSwitcher />

            {/* Maritime Accessibility & Audible Signals Settings */}
            <button
              id="accessibility-settings-btn"
              onClick={() => setIsAccessibilityModalOpen(true)}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-cyan-400'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-cyan-700'
              }`}
              title="Maritime Accessibility & Audible Alerts Settings (SOLAS Audio Discrimination)"
              aria-label="Maritime Accessibility & Audible Alerts Settings"
            >
              {accessibilitySettings.audibleAlertsEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span className="hidden xl:inline text-[11px] font-semibold">Audio & Accessibility</span>
            </button>

            {/* Global Search Button */}
            <button
              id="global-search-btn"
              onClick={() => setIsSearchOpen(true)}
              className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-lg text-xs transition-colors ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Global Maritime Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden xl:inline text-[11px]">Quick Search</span>
              <kbd className={`hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono border rounded ${
                isDark ? 'bg-slate-950 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-300'
              }`}>
                ⌘K
              </kbd>
            </button>

            {/* System Status Pill */}
            <button
              id="system-status-btn"
              onClick={() => setIsStatusModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors border ${
                hasActiveDelays
                  ? isDark
                    ? 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-500/50 text-amber-200'
                    : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                  : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="Inspect System Status & Service Delays"
            >
              {hasActiveDelays ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="hidden md:inline font-mono font-semibold text-amber-500">Delay Active</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden md:inline font-mono">Systems OK</span>
                </>
              )}
            </button>

            {/* Command Center / Operator Portal Button */}
            <button
              id="nav-operator-portal-btn"
              onClick={() => {
                setCurrentRole('operator');
                setOperatorTab('overview');
                setActiveView('operator');
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                activeView === 'operator'
                  ? isDark
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-cyan-100 text-cyan-900 border-cyan-300 shadow-sm'
                  : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-500" />
              <span>Operations Portal</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-b px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Mobile Theme & Accessibility Switch Buttons */}
          <div className="pb-2 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsAccessibilityModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-cyan-300'
                  : 'bg-slate-100 border-slate-300 text-cyan-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audio & Accessibility</span>
            </button>
            <ThemeSwitcher />
          </div>

          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
            <button
              onClick={() => {
                setActiveView('operator');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              <span>Operator Portal</span>
            </button>
            <button
              onClick={() => {
                setActiveView('captain');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Captain Bridge</span>
            </button>
          </div>

          <div className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-900'
                        : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/40 text-current">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
