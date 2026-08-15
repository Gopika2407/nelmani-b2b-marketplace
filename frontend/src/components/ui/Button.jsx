import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md';

  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-950/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    gold: 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-amber-950/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    secondary: 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-emerald-500/40 hover:text-white',
    destructive: 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/40',
    outline: 'border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:bg-amber-500/10',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-none shadow-none',
  };

  const sizes = {
    small: 'px-3 py-1.5 text-xs gap-1.5',
    medium: 'px-4 py-2.5 text-sm gap-2',
    large: 'px-6 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="animate-spin text-current" size={size === 'small' ? 14 : size === 'large' ? 20 : 16} />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'small' ? 14 : size === 'large' ? 20 : 18} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'small' ? 14 : size === 'large' ? 20 : 18} />}
        </>
      )}
    </button>
  );
};

export default Button;
