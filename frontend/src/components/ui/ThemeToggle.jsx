import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md ${
        theme === 'dark'
          ? 'bg-slate-900/90 text-amber-400 border-slate-800 hover:border-amber-500/40 hover:bg-slate-800'
          : 'bg-white text-emerald-700 border-slate-300 hover:border-emerald-500/50 hover:bg-slate-50'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={14} className="text-amber-400 animate-spin-slow" />
          <span className="text-xs font-bold text-slate-200">Light</span>
        </>
      ) : (
        <>
          <Moon size={14} className="text-emerald-600" />
          <span className="text-xs font-bold text-slate-800">Dark</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
