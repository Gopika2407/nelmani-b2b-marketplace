import React from 'react';

export const SkeletonCard = () => (
  <div className="panel-glass p-6 space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-3 w-24 skeleton" />
      <div className="h-8 w-8 rounded-xl skeleton" />
    </div>
    <div className="h-8 w-36 skeleton" />
    <div className="h-3 w-48 skeleton" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="panel-glass p-6 space-y-4">
    <div className="h-5 w-48 skeleton mb-6" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/60">
          <div className="h-8 w-8 rounded-lg skeleton shrink-0" />
          <div className="h-4 w-32 skeleton flex-1" />
          <div className="h-4 w-20 skeleton" />
          <div className="h-4 w-24 skeleton" />
          <div className="h-6 w-16 rounded-full skeleton" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonCard;
