import React, { useState, useRef, useEffect } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Language } from '../../utils/translations';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, theme } = useFerry();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string; nativeName: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English (UK/IN)' },
    { code: 'es', label: 'Español', flag: '🇪🇸', nativeName: 'Español (Portuaria)' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', nativeName: 'Français (Maritime)' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="language-switcher-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
        }`}
        title="Switch Interface Language (English, Español, Français)"
        aria-label="Switch Interface Language"
      >
        <span className="text-sm leading-none">{currentLangObj.flag}</span>
        <span className="font-mono uppercase text-[11px] font-bold">{currentLangObj.code}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-48 rounded-xl shadow-2xl border p-1.5 z-50 text-xs ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/50 mb-1">
            Maritime i18n
          </div>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  isSelected
                    ? isDark
                      ? 'bg-cyan-950/60 text-cyan-300 font-bold'
                      : 'bg-cyan-50 text-cyan-700 font-bold'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div>
                    <div className="font-medium text-xs leading-tight">{lang.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{lang.nativeName}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
