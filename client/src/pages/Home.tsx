import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Compass,
  MapPin,
  Calendar,
  DollarSign,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-20 py-8 overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 pt-8">
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Multi-City Travel Workspace</span>
        </span>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-tight">
          Plan, Organize & Visualize Your Dream <span className="gradient-text">Global Journeys</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          GlobeTrotter brings your travel plans to life. Craft multi-city itineraries, discover top curated experiences, track budget breakdowns in real-time, and share plans with ease.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/25 transition-all duration-200 hover:scale-[1.03] text-base flex items-center justify-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/25 transition-all duration-200 hover:scale-[1.03] text-base flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-slate-200 glass-panel hover:bg-slate-800 border border-slate-700 transition-colors text-base"
              >
                Try Demo Account
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white">
            Built for Modern <span className="gradient-text">Travelers</span>
          </h2>
          <p className="text-sm text-slate-400">Everything you need from planning to destination execution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-City Itineraries</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add multiple destination stops in sequence, set arrival dates, and organize your trip timeline seamlessly.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Financial Dashboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualize cost breakdowns with interactive Recharts diagrams. Track accommodation, food, activities, and transport expenses.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Secure Public Sharing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Share read-only access to your itineraries via secret tokenized share links while keeping private trips strictly protected.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
