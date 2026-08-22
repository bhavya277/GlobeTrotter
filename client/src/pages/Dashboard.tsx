import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Trip, City } from '../types';
import {
  PlusCircle,
  MapPin,
  Calendar,
  DollarSign,
  Compass,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Sparkles,
  Globe,
  CheckCircle2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recommendedCities, setRecommendedCities] = useState<City[]>([]);
  const [savedCities, setSavedCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [tripsRes, citiesRes, savedRes] = await Promise.all([
          api.trips.getMyTrips(),
          api.cities.getAll({ sortBy: 'popularity' }),
          api.savedDestinations.getAll().catch(() => ({ savedDestinations: [] })),
        ]);
        setTrips(tripsRes.trips);
        setRecommendedCities(citiesRes.cities.slice(0, 3));
        setSavedCities(savedRes.savedDestinations);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalBudgetTracked = trips.reduce((acc, t) => acc + (t.totalBudget || 0), 0);
  const upcomingTrips = trips.filter((t) => new Date(t.startDate) >= new Date());
  const activeTrip = upcomingTrips[0] || trips[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Personalized Welcome Hero Banner */}
      <div className="relative glass-panel rounded-3xl p-8 overflow-hidden border border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={
                user?.profilePhoto ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
              }
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-sky-500/40 shadow-xl"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Welcome back, <span className="gradient-text">{user?.name || 'Traveler'}</span>!
                </h1>
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Plan multi-city expeditions, track budgets in INR (₹), and explore world destinations.
              </p>
            </div>
          </div>

          <Link
            to="/create-trip"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl font-extrabold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/25 transition-all duration-200 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Plan New Trip</span>
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar (INR ₹ Currency) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Expeditions</span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{trips.length}</p>
          <p className="text-[11px] text-slate-500">Persisted in database</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Upcoming Trips</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{upcomingTrips.length}</p>
          <p className="text-[11px] text-slate-500">Scheduled ahead</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Budget Tracked</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">₹{totalBudgetTracked.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">INR Currency (₹)</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Saved Places</span>
            <Bookmark className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{savedCities.length}</p>
          <p className="text-[11px] text-slate-500">Bookmarked destinations</p>
        </div>
      </div>

      {/* Active Trip Spotlight */}
      {activeTrip && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Current / Next Expedition Spotlight
            </h2>
            <Link to={`/trip/${activeTrip.id}/itinerary`} className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
              Full Itinerary View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <img
                src={activeTrip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80'}
                alt={activeTrip.name}
                className="w-24 h-24 rounded-2xl object-cover shrink-0"
              />
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {activeTrip.visibility}
                </span>
                <h3 className="text-xl font-extrabold text-white">{activeTrip.name}</h3>
                <p className="text-xs text-slate-400">
                  📅 {new Date(activeTrip.startDate).toLocaleDateString()} to {new Date(activeTrip.endDate).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeTrip.stops?.map((stop) => (
                    <span key={stop.id} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                      📍 {stop.city.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto shrink-0">
              <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                Budget: ₹{activeTrip.totalBudget?.toLocaleString()} INR
              </span>
              <div className="flex gap-2">
                <Link
                  to={`/trip/${activeTrip.id}/itinerary`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
                >
                  View Itinerary
                </Link>
                <Link
                  to={`/trip/${activeTrip.id}/builder`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                  Edit Stops
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Destinations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" /> Recommended Destinations (Popular in India & Abroad)
          </h2>
          <Link to="/cities" className="text-xs font-bold text-sky-400 hover:underline">
            View All Cities →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedCities.map((city) => (
            <div
              key={city.id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="h-40 relative">
                <img
                  src={city.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80'}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-sky-300">
                  {city.country}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-base font-bold text-white">{city.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{city.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Cost: {'₹₹₹₹₹'.slice(0, Math.round(city.costIndex))}</span>
                  <span className="text-amber-400 font-bold">★ {city.popularity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
