import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null, // e.g. { value: 12.5, isPositive: true, period: 'vs last week' }
  emptyState = null, // e.g. { message: 'No revenue yet — orders will appear here' }
  accentColor = 'gold', // 'gold' | 'emerald' | 'cyan' | 'amber'
  className = '',
}) => {
  const isZeroOrEmpty = value === 0 || value === '0' || value === 'Rs. 0' || value === 'Rs. 0.00';

  const accentStyles = {
    gold: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      valueText: 'text-gold-gradient',
      glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      valueText: 'text-emerald-gradient',
      glow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
    },
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      valueText: 'text-cyan-300',
      glow: 'hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]',
    },
    amber: {
      border: 'hover:border-orange-500/40',
      iconBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      valueText: 'text-orange-400',
      glow: 'hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)]',
    },
  };

  const style = accentStyles[accentColor] || accentStyles.gold;

  return (
    <div className={`panel-glass p-6 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${style.border} ${style.glow} ${className}`}>
      {/* Header row: Title & Icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border backdrop-blur-md ${style.iconBg}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {/* Main Value or Empty State */}
      {isZeroOrEmpty && emptyState ? (
        <div className="my-2 py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-2">
          <Info size={16} className="text-amber-400 shrink-0" />
          <span className="text-xs text-slate-400 leading-tight">
            {emptyState.message || 'No records logged yet.'}
          </span>
        </div>
      ) : (
        <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight my-1 ${style.valueText}`}>
          {value}
        </div>
      )}

      {/* Footer row: Trend & Subtitle */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs">
        {subtitle && <span className="text-slate-400">{subtitle}</span>}

        {trend && (
          <div className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
            trend.isPositive === null 
              ? 'bg-slate-800 text-slate-400'
              : trend.isPositive 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/15 text-red-400 border border-red-500/20'
          }`}>
            {trend.isPositive === null ? (
              <Minus size={12} />
            ) : trend.isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            {trend.period && <span className="text-[10px] opacity-75 font-normal ml-0.5">{trend.period}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
