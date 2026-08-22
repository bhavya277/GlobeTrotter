import React from 'react';
import { Globe, Heart, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Globe<span className="gradient-text">Trotter</span>
            </span>
          </div>

          <p className="text-sm text-slate-400 text-center flex items-center gap-1.5">
            Empowering Personalized Travel Planning • Built with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> for Hackathon 2026
          </p>

          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> 100% Encrypted & Secure
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Intelligent Itineraries
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
