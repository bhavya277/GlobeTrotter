import React from 'react';
import { Globe, Heart, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="GlobeTrotter Logo" className="h-10 w-auto rounded-lg shadow-sm" />
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            Empowering Personalized Travel Planning • Built with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> for Explorers Worldwide
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
