import React from 'react';
import { Sprout, Sparkles } from 'lucide-react';

const Logo = ({ size = 'medium', className = '' }) => {
  const iconSizes = {
    small: 20,
    medium: 26,
    large: 36,
  };

  const fontSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-transparent border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
        <Sprout size={iconSizes[size]} className="text-amber-400" />
        <Sparkles size={12} className="absolute -top-1 -right-1 text-emerald-400 animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-wider font-heading text-gold-gradient ${fontSizes[size]}`}>
          NELMANI
        </span>
        <span className="text-[10px] font-semibold tracking-widest text-emerald-400/80 uppercase -mt-1">
          AGRI-COMMODITY EXCHANGE
        </span>
      </div>
    </div>
  );
};

export default Logo;
