import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, Sparkles, ShieldCheck, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ContextAwareHelpTooltipProps {
  id?: string;
  title: string;
  description: string;
  badge?: string;
  policyNote?: string;
  detailsList?: string[];
  position?: 'top' | 'bottom' | 'right' | 'left';
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export const ContextAwareHelpTooltip: React.FC<ContextAwareHelpTooltipProps> = ({
  id,
  title,
  description,
  badge,
  policyNote,
  detailsList,
  position = 'top',
  children,
  iconOnly = false,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Dismiss on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div
      ref={triggerRef}
      id={id}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={(e) => {
        // Only close if focus moved outside the tooltip container
        if (!triggerRef.current?.contains(e.relatedTarget as Node)) {
          setIsVisible(false);
        }
      }}
    >
      {/* Trigger element: children or default help icon */}
      {children ? (
        <div className="inline-flex items-center w-full">{children}</div>
      ) : (
        <button
          type="button"
          tabIndex={0}
          aria-label={`Help information for ${title}`}
          aria-expanded={isVisible}
          className="p-1 text-slate-400 hover:text-cyan-300 focus:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-full transition-colors cursor-help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Floating Tooltip Box */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 6 : -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-slate-950/98 border border-cyan-500/50 shadow-2xl backdrop-blur-xl text-left pointer-events-none ${getPositionClasses()}`}
          >
            {/* Tooltip Header */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <h4 className="font-bold text-white text-xs tracking-tight">{title}</h4>
              </div>
              {badge && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono text-[9px] font-bold uppercase tracking-wider shrink-0">
                  <Tag className="w-2.5 h-2.5" />
                  <span>{badge}</span>
                </span>
              )}
            </div>

            {/* Description Text */}
            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{description}</p>

            {/* Details Bullet List if present */}
            {detailsList && detailsList.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] text-slate-400 border-t border-slate-900 pt-1.5">
                {detailsList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Policy Verification Note */}
            {policyNote && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-start gap-1.5 text-[10px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span>{policyNote}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
