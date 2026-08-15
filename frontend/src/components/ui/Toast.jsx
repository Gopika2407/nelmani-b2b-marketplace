import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50',
    error: 'bg-red-950/90 border-red-500/50 text-red-300 shadow-red-950/50',
    info: 'bg-amber-950/90 border-amber-500/50 text-amber-300 shadow-amber-950/50',
  };

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />,
    error: <AlertCircle size={18} className="text-red-400 shrink-0" />,
    info: <Info size={18} className="text-amber-400 shrink-0" />,
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 ${styles[type]}`}>
      {icons[type]}
      <span className="text-xs font-semibold">{message}</span>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-current transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
