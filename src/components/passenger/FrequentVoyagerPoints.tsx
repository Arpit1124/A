import React, { useState, useMemo } from 'react';
import { useFerry } from '../../context/FerryContext';
import { Booking } from '../../types';
import {
  Award,
  Sparkles,
  TrendingUp,
  Gift,
  CheckCircle2,
  ChevronRight,
  Anchor,
  Compass,
  Star,
  Shield,
  ArrowRight,
  Coffee,
  Car,
  Clock,
  Zap,
} from 'lucide-react';

interface Props {
  bookings: Booking[];
}

export interface LoyaltyTier {
  id: 'blue' | 'silver' | 'gold' | 'platinum';
  name: string;
  minPoints: number;
  maxPoints: number;
  perks: string[];
  badgeColor: string;
  gradient: string;
}

const TIERS: LoyaltyTier[] = [
  {
    id: 'blue',
    name: 'Blue Anchor',
    minPoints: 0,
    maxPoints: 499,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    gradient: 'from-sky-600 to-blue-700',
    perks: ['Standard digital boarding passes', 'SMS arrival ETA alerts', 'Access to offline ticket caching'],
  },
  {
    id: 'silver',
    name: 'Silver Mariner',
    minPoints: 500,
    maxPoints: 1499,
    badgeColor: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
    gradient: 'from-slate-500 to-slate-700',
    perks: ['Priority turnstile boarding at Gateway', 'Free tea/coffee voucher at Mandwa jetty', '5% Ro-Pax vehicle discount'],
  },
  {
    id: 'gold',
    name: 'Gold Commodore',
    minPoints: 1500,
    maxPoints: 2999,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    gradient: 'from-amber-500 to-yellow-600',
    perks: ['Upper deck priority seating upgrades', '15% Ro-Pax discount', 'Express vehicle disembarkation', 'Complimentary AC lounge access'],
  },
  {
    id: 'platinum',
    name: 'Platinum Admiral',
    minPoints: 3000,
    maxPoints: 99999,
    badgeColor: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
    gradient: 'from-cyan-500 to-indigo-600',
    perks: ['VIP Captain Bridge tour access', 'Zero-fee instant cancellation', 'Dedicated concierge gate lane', 'Complimentary guest vehicle pass yearly'],
  },
];

export const FrequentVoyagerPoints: React.FC<Props> = ({ bookings }) => {
  const { theme } = useFerry();
  const isDark = theme === 'dark';

  const [redeemedVoucher, setRedeemedVoucher] = useState<string | null>(null);
  const [bonusBonusAdded, setBonusPointsAdded] = useState<number>(0);

  // Calculate points:
  // Base 150 points per completed/confirmed booking + 10% of total fare paid
  const calculatedPoints = useMemo(() => {
    let total = 620; // Welcome base voyager points for active account
    bookings.forEach((b) => {
      // Completed or confirmed bookings earn voyage points
      const tripPoints = 150 + Math.round(b.totalFareInr * 0.1);
      total += tripPoints;
    });
    return total + bonusBonusAdded;
  }, [bookings, bonusBonusAdded]);

  // Current tier calculation
  const currentTier = useMemo(() => {
    if (calculatedPoints >= 3000) return TIERS[3];
    if (calculatedPoints >= 1500) return TIERS[2];
    if (calculatedPoints >= 500) return TIERS[1];
    return TIERS[0];
  }, [calculatedPoints]);

  // Next tier calculation
  const nextTier = useMemo(() => {
    if (currentTier.id === 'blue') return TIERS[1];
    if (currentTier.id === 'silver') return TIERS[2];
    if (currentTier.id === 'gold') return TIERS[3];
    return null;
  }, [currentTier]);

  const pointsToNextTier = nextTier ? nextTier.minPoints - calculatedPoints : 0;
  const progressPercent = nextTier
    ? Math.min(
        100,
        Math.max(0, Math.round(((calculatedPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100))
      )
    : 100;

  const handleRedeem = (perkName: string, requiredPoints: number) => {
    if (calculatedPoints >= requiredPoints) {
      setRedeemedVoucher(`VOYAGE-${Math.floor(1000 + Math.random() * 9000)}-${perkName.toUpperCase().slice(0, 4)}`);
      setTimeout(() => setRedeemedVoucher(null), 5000);
    }
  };

  return (
    <div
      id="frequent-voyager-points-tracker"
      className={`p-6 rounded-2xl border shadow-2xl space-y-6 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* 1. Header & Current Points Overview */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-900/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">Frequent Voyager Points & Tier Tracker</h2>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${currentTier.badgeColor}`}>
                {currentTier.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Accrue maritime miles & points automatically with every completed ferry crossing across Mumbai Harbour
            </p>
          </div>
        </div>

        {/* Current Total Balance Card */}
        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400">Available Balance</div>
            <div className="text-2xl font-black font-mono text-cyan-300 flex items-center justify-end gap-1">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{calculatedPoints.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-400">PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Progress Bar Towards Next Reward Tier */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Current Tier:</span>
            <span className="font-bold text-cyan-400">{currentTier.name}</span>
          </div>

          {nextTier ? (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>Next Tier:</span>
              <span className="font-bold text-amber-300">{nextTier.name}</span>
              <span className="text-slate-500 font-mono">({pointsToNextTier} pts needed)</span>
            </div>
          ) : (
            <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Highest Admiral Tier Unlocked!</span>
            </div>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full bg-gradient-to-r ${currentTier.gradient} transition-all duration-500 rounded-full relative`}
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>{currentTier.minPoints} PTS</span>
          <span>{progressPercent}% Journey Complete</span>
          <span>{nextTier ? `${nextTier.minPoints} PTS` : '3,000+ PTS'}</span>
        </div>
      </div>

      {/* 3. Tier Benefits Grid & Redeemable Perks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Active Tier Benefits & Redeemable Rewards</span>
          </h3>
          <span className="text-[11px] text-slate-400">Earn 150 pts + 10% fare on every journey</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Turnstile Priority Gate</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Skip standard terminal queues with designated Express Lane turnstiles at Gateway of India & Mandwa.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">Unlocked Active Perk</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Chai & Snacks Jetty Voucher</span>
                <Coffee className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Redeem 250 points for complimentary Masala Chai & snack basket at Mandwa Ro-Pax terminal cafe.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400">Cost: 250 pts</span>
              <button
                type="button"
                onClick={() => handleRedeem('Chai & Snacks', 250)}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold"
              >
                Redeem
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">₹150 Ro-Pax Vehicle Discount</span>
                <Car className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Apply a ₹150 instantaneous deduction against vehicle fare on your next Alibaug car transit booking.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400">Cost: 500 pts</span>
              <button
                type="button"
                onClick={() => handleRedeem('Vehicle Discount', 500)}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>

        {/* Redeemed Voucher Banner */}
        {redeemedVoucher && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>
                Voucher generated successfully! Use promo code <strong className="font-mono text-white underline">{redeemedVoucher}</strong> at checkout.
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300">Valid for 30 days</span>
          </div>
        )}
      </div>

      {/* 4. Recent Voyage Accrual History */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Recent Points Accrual History</span>
        </h4>
        <div className="space-y-1.5 text-xs">
          {bookings.slice(0, 3).map((b, idx) => (
            <div
              key={b.id || idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70 text-slate-300"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[11px] text-cyan-400 font-bold">{b.id}</span>
                <span className="text-slate-400">• Completed Voyage</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                +{150 + Math.round(b.totalFareInr * 0.1)} PTS
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
