import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  BrainCircuit,
  TrendingDown,
  Clock,
  Compass,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface IntelligenceData {
  budgetOptimizer: Array<{
    title: string;
    percentageShare: number;
    insight: string;
    suggestion: string;
    type: 'warning' | 'info';
  }>;
  dailyBalance: Array<{
    dateStr: string;
    activityCount: number;
    estimatedHours: number;
    insight: string;
    recommendation: string;
    isOverloaded: boolean;
  }>;
  travelFlow: {
    totalDistanceKm: number;
    stopsCount: number;
    routeLegs: Array<{ from: string; to: string; distanceKm: number }>;
    isFlowEfficient: boolean;
    flowInsight: string;
  };
  personalizedRecommendations: Array<{
    id: string;
    name: string;
    cityName: string;
    category: string;
    estimatedCost: number;
    rating: number;
    image: string;
    reason: string;
  }>;
}

export const IntelligencePanel: React.FC<{ tripId: string }> = ({ tripId }) => {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      api.intelligence
        .getTripIntelligence(tripId)
        .then((res) => setData(res.intelligence))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [tripId]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 animate-pulse space-y-3">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="h-20 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (!data) return null;

  const { budgetOptimizer, dailyBalance, travelFlow, personalizedRecommendations } = data;

  return (
    <div className="space-y-6">
      {/* Intelligence Header */}
      <div className="glass-panel p-6 rounded-3xl border border-sky-500/30 bg-gradient-to-r from-sky-950/30 via-slate-900/80 to-indigo-950/30 space-y-2 relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Trip Intelligence & Smart Optimization Layer
            </h2>
            <p className="text-xs text-slate-300">
              Context-aware insights for budget concentration, daily pacing, route flow, and explicit recommendation reasons.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Smart Budget Optimizer */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-400" /> Smart Budget Optimizer
          </h3>

          {budgetOptimizer.length === 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Balanced Expenditure: No single city or activity category dominates your budget excessively.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetOptimizer.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    item.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      {item.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                      {item.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-[11px]">
                      {item.percentageShare}% Share
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{item.insight}</p>
                  <p className="text-xs text-slate-400 italic">💡 Suggestion: {item.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Smart Daily Balance */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Smart Daily Pacing Balance
          </h3>

          {dailyBalance.length === 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Optimal Daily Schedule: Your daily activity count and planned travel hours are nicely distributed.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyBalance.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0" />
                      Overloaded Day Detected
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-[11px] text-amber-400">
                      {item.activityCount} Events (~{item.estimatedHours} hrs)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{item.insight}</p>
                  <p className="text-xs text-slate-400 italic">💡 Recommendation: {item.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Travel Flow Intelligence (Route Distance & Sequencing) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" /> Travel Flow & Route Distance Intelligence
          </h3>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            Total Transit: {travelFlow.totalDistanceKm.toLocaleString()} km
          </span>
        </div>

        <p className="text-xs text-slate-300">{travelFlow.flowInsight}</p>

        {travelFlow.routeLegs.length > 0 && (
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
            {travelFlow.routeLegs.map((leg, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs shrink-0 flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-bold text-white">{leg.from}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="font-bold text-white">{leg.to}</span>
                <span className="text-slate-400 text-[11px] pl-2 border-l border-slate-800">
                  ({leg.distanceKm} km)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Personalized Recommendations with EXPLICIT VISIBLE REASONS */}
      {personalizedRecommendations.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Tailored Experience Recommendations
          </h3>
          <p className="text-xs text-slate-400">
            Curated based on your selected cities, saved destinations, and activity category preferences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalizedRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-sky-500/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{rec.name}</h4>
                    <span className="text-xs font-bold text-emerald-400 shrink-0">₹{rec.estimatedCost.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-sky-400 font-semibold">
                      {rec.category}
                    </span>
                    <span>📍 {rec.cityName}</span>
                  </div>

                  {/* EXPLICIT VISIBLE RATIONALE (Mandatory Phase 9 Rule) */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-sky-300 flex items-start space-x-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                    <span>{rec.reason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
