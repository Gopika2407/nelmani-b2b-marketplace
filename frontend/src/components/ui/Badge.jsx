import React from 'react';
import { CheckCircle2, Clock, Truck, ShieldAlert, Award, PackageCheck, AlertCircle } from 'lucide-react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    // Order Statuses
    placed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    routed: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    pending_quality_approval: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    packed: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dispatched: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    delivered: 'bg-green-500/20 text-green-300 border-green-500/40',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',

    // Quality Grades
    'Grade A': 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    'Grade B': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'Grade C': 'bg-slate-500/15 text-slate-300 border-slate-500/30',

    // Roles
    admin: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    supplier: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    buyer: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',

    // Generic
    default: 'bg-slate-800/80 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const getIcon = (v) => {
    switch (v) {
      case 'confirmed':
      case 'delivered':
        return <CheckCircle2 size={12} className="mr-1 inline" />;
      case 'dispatched':
        return <Truck size={12} className="mr-1 inline" />;
      case 'pending_quality_approval':
        return <Clock size={12} className="mr-1 inline animate-pulse" />;
      case 'packed':
        return <PackageCheck size={12} className="mr-1 inline" />;
      case 'Grade A':
      case 'Grade B':
      case 'Grade C':
        return <Award size={12} className="mr-1 inline text-amber-400" />;
      case 'rejected':
      case 'danger':
        return <AlertCircle size={12} className="mr-1 inline" />;
      default:
        return null;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${variants[variant] || variants.default} ${className}`}>
      {getIcon(variant)}
      {children || variant.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

export default Badge;
