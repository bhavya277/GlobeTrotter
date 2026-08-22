import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

interface StopItem {
  id?: string;
  cityName?: string;
  city?: {
    name: string;
  };
}

interface RouteVisualizationProps {
  stops: StopItem[];
  variant?: 'compact' | 'expanded' | 'vertical';
  className?: string;
}

export const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  stops,
  variant = 'compact',
  className = '',
}) => {
  if (!stops || stops.length === 0) {
    return (
      <div className={`text-xs text-slate-500 italic ${className}`}>
        No cities added to route yet
      </div>
    );
  }

  const cityNames = stops.map((s) => s.cityName || s.city?.name || 'City');

  if (variant === 'vertical') {
    return (
      <div className={`space-y-2 relative pl-4 border-l-2 border-sky-500/30 ${className}`}>
        {cityNames.map((cityName, idx) => (
          <div key={idx} className="relative flex items-center space-x-2">
            <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-sky-400 border-2 border-slate-900 ring-2 ring-sky-500/20" />
            <span className="text-xs font-semibold text-slate-200">{cityName}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'expanded') {
    return (
      <div className={`flex flex-wrap items-center gap-2 py-2 ${className}`}>
        {cityNames.map((cityName, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{cityName}</span>
            </div>
            {idx < cityNames.length - 1 && (
              <ArrowRight className="w-4 h-4 text-sky-400/60 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`flex items-center space-x-1.5 text-xs font-medium text-slate-300 overflow-x-auto no-scrollbar py-0.5 ${className}`}>
      {cityNames.map((cityName, idx) => (
        <React.Fragment key={idx}>
          <span className="font-semibold text-white whitespace-nowrap">{cityName}</span>
          {idx < cityNames.length - 1 && (
            <span className="text-sky-400 font-bold px-0.5">&rarr;</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
