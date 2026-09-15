import React from 'react';
import { FerryStatus, TripStatus } from '../../types';
import { CheckCircle2, Clock, PlayCircle, AlertTriangle, ShieldAlert, Anchor, Radio } from 'lucide-react';

interface StatusBadgeProps {
  status: FerryStatus | TripStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const normalized = status.toLowerCase();

  let bgClass = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon = <Radio className="w-3 h-3" />;
  let label = status.replace('_', ' ');

  if (normalized === 'on_time' || normalized === 'arrived' || normalized === 'certified' || normalized === 'operational') {
    bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    label = normalized === 'on_time' ? 'On Time' : label;
  } else if (normalized === 'delayed' || normalized === 'inspection due' || normalized === 'medium') {
    bgClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    icon = <Clock className="w-3 h-3 text-amber-400" />;
    label = normalized === 'delayed' ? 'Delayed' : label;
  } else if (normalized === 'boarding') {
    bgClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    icon = <PlayCircle className="w-3 h-3 text-cyan-400" />;
    label = 'Boarding';
  } else if (normalized === 'in_transit' || normalized === 'departed') {
    bgClass = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    icon = <Radio className="w-3 h-3 text-sky-400" />;
    label = normalized === 'in_transit' ? 'In Transit' : 'Departed';
  } else if (normalized === 'approaching') {
    bgClass = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    icon = <Clock className="w-3 h-3 text-orange-400" />;
    label = 'Approaching Port';
  } else if (normalized === 'emergency' || normalized === 'critical' || normalized === 'cancelled') {
    bgClass = 'bg-red-500/15 text-red-400 border-red-500/40 animate-pulse';
    icon = <ShieldAlert className="w-3 h-3 text-red-400" />;
    label = normalized === 'emergency' ? 'Emergency' : label;
  } else if (normalized === 'docked') {
    bgClass = 'bg-slate-800 text-slate-300 border-slate-700';
    icon = <Anchor className="w-3 h-3 text-slate-400" />;
    label = 'Docked';
  }

  const sizeClass =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-3 py-1 gap-1.5'
      : 'text-xs px-2 py-0.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium uppercase tracking-wider rounded-full border ${bgClass} ${sizeClass}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
