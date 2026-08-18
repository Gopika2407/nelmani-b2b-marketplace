import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 backdrop-blur-md shadow-md ${className}`}>
      <div className="flex items-center gap-1 px-2 text-slate-400">
        <Globe size={14} className="text-amber-400 animate-pulse" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
          language === 'ta'
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
};

export default LanguageToggle;
