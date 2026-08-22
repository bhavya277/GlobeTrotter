import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="h-40 rounded-2xl skeleton-shimmer"></div>
      <div className="space-y-2">
        <div className="h-6 skeleton-shimmer rounded-lg w-3/4"></div>
        <div className="h-4 skeleton-shimmer rounded-lg w-1/2"></div>
      </div>
      <div className="pt-2 flex justify-between">
        <div className="h-8 skeleton-shimmer rounded-xl w-24"></div>
        <div className="h-8 skeleton-shimmer rounded-xl w-20"></div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
