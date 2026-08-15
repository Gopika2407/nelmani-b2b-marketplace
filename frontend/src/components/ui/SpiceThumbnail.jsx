import React from 'react';
import { Leaf, Flame, Sparkles, Sprout, ShieldAlert, CircleDot } from 'lucide-react';

const SpiceThumbnail = ({ category = '', name = '', size = 'medium' }) => {
  const normalizedCat = (category || name || '').toLowerCase();

  const sizeStyles = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
  };

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 22,
  };

  let config = {
    bg: 'from-emerald-600/30 to-emerald-950/40 border-emerald-500/40 text-emerald-400',
    icon: Leaf,
    code: 'GRN'
  };

  if (normalizedCat.includes('cardamom')) {
    config = {
      bg: 'from-emerald-500/30 via-teal-600/20 to-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      icon: Leaf,
      code: 'CRD'
    };
  } else if (normalizedCat.includes('pepper')) {
    config = {
      bg: 'from-slate-700/40 via-zinc-800/30 to-black border-slate-600/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
      icon: CircleDot,
      code: 'PEP'
    };
  } else if (normalizedCat.includes('turmeric')) {
    config = {
      bg: 'from-amber-500/30 via-yellow-600/20 to-amber-950/50 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      icon: Sparkles,
      code: 'TUR'
    };
  } else if (normalizedCat.includes('clove')) {
    config = {
      bg: 'from-orange-800/30 via-amber-900/20 to-zinc-950/50 border-orange-600/40 text-orange-400',
      icon: Sprout,
      code: 'CLV'
    };
  } else if (normalizedCat.includes('ginger')) {
    config = {
      bg: 'from-yellow-700/30 via-amber-800/20 to-stone-950/50 border-yellow-600/40 text-yellow-300',
      icon: Sparkles,
      code: 'GNG'
    };
  } else if (normalizedCat.includes('chili') || normalizedCat.includes('chilli')) {
    config = {
      bg: 'from-red-600/30 via-rose-700/20 to-red-950/50 border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
      icon: Flame,
      code: 'CHL'
    };
  }

  const IconComponent = config.icon;

  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br border backdrop-blur-md shrink-0 font-bold ${sizeStyles[size]} ${config.bg}`}>
      <IconComponent size={iconSizes[size]} />
    </div>
  );
};

export default SpiceThumbnail;
