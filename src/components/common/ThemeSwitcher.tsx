import React from 'react';
import { useFerry } from '../../context/FerryContext';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'navbar' | 'compact' | 'expanded';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'navbar', className = '' }) => {
  const { theme, setTheme, toggleTheme } = useFerry();
  const isDark = theme === 'dark';

  if (variant === 'compact') {
    return (
      <button
        id="theme-switcher-compact"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-800 hover:border-cyan-500/50 shadow-sm'
            : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 shadow-sm'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode (Passenger View)' : 'Switch to Dark Mode (AIS Operations)'}
        aria-label="Toggle theme mode"
      >
        {isDark ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
      </button>
    );
  }

  return (
    <div
      id="theme-switcher-navbar"
      className={`inline-flex items-center p-1 rounded-xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      } ${className}`}
      role="radiogroup"
      aria-label="Theme mode selection"
    >
      {/* Light Mode Button */}
      <button
        type="button"
        id="theme-switch-light"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          !isDark
            ? 'bg-white text-amber-900 shadow-sm border border-amber-200 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Light Mode (High contrast daytime passenger interface)"
        aria-checked={!isDark}
        role="radio"
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
        <span className="hidden md:inline text-[11px]">Light</span>
      </button>

      {/* Dark Mode Button */}
      <button
        type="button"
        id="theme-switch-dark"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          isDark
            ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/40 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Dark Mode (High contrast nocturnal maritime operations)"
        aria-checked={isDark}
        role="radio"
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-400'}`} />
        <span className="hidden md:inline text-[11px]">Ops Dark</span>
      </button>
    </div>
  );
};
