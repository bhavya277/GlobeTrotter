import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Trip, City } from '../types';
import {
  Compass,
  PlusCircle,
  Calendar,
  MapPin,
  TrendingUp,
  ArrowRight,
  Globe,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight,
  Bookmark,
  Activity,
  Layers,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recommendedCities, setRecommendedCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [tripsRes, citiesRes] = await Promise.all([
          api.trips.getMyTrips(),
          api.cities.getAll(),
        ]);
        setTrips(tripsRes.trips);
        setRecommendedCities(citiesRes.cities.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const nextUpcomingTrip = trips.find((t) => new Date(t.startDate) >= new Date()) || trips[0];

  const totalBudgetSpent = trips.reduce((acc, t) => {
    const tripExpenses = t.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    return acc + tripExpenses;
  }, 0);

  const totalDestinationsCount = trips.reduce((acc, t) => acc + (t.stops?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Personalized Hero Header */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Explorer Command Center
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Welcome back, {user?.name || 'Explorer'} 👋
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Where are we going <span className="gradient-text">next?</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              You have <span className="font-bold text-sky-400">{trips.length} active itineraries</span> across{' '}
              <span className="font-bold text-turquoise-400">{totalDestinationsCount} destinations</span> scheduled in your travel log.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/create-trip"
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl font-extrabold text-xs text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Plan New Expedition</span>
            </Link>

            <Link
              to="/cities"
              className="flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Compass className="w-4 h-4 text-turquoise-400" />
              <span>Explore Cities</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Active Trips <Calendar className="w-4 h-4 text-sky-400" />
          </span>
          <p className="text-2xl font-black text-white">{trips.length}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Cities Booked <MapPin className="w-4 h-4 text-turquoise-400" />
          </span>
          <p className="text-2xl font-black text-white">{totalDestinationsCount}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Total Logged Expenses <TrendingUp className="w-4 h-4 text-coral-500" />
          </span>
          <p className="text-2xl font-black text-coral-400">₹{totalBudgetSpent.toLocaleString()} INR</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Saved Destinations <Bookmark className="w-4 h-4 text-amber-400" />
          </span>
          <p className="text-2xl font-black text-amber-400">3 Saved</p>
        </div>
      </div>

      {/* 3. Next Upcoming Trip Hero & Route Visualization */}
      {nextUpcomingTrip && (
        <div className="glass-panel p-8 rounded-3xl border border-sky-500/30 bg-gradient-to-b from-navy-850 to-navy-900 space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                Next Upcoming Expedition
              </span>
              <h2 className="text-2xl font-black text-white mt-1">{nextUpcomingTrip.name}</h2>
              <p className="text-xs text-slate-400">
                📅 {new Date(nextUpcomingTrip.startDate).toLocaleDateString()} - {new Date(nextUpcomingTrip.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
                Budget: ₹{nextUpcomingTrip.totalBudget?.toLocaleString()} INR (₹)
              </span>

              <Link
                to={`/trip/${nextUpcomingTrip.id}/builder`}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-md shadow-sky-500/20"
              >
                Open Itinerary Builder
              </Link>
            </div>
          </div>

          {/* Route Stop Visualization Bar */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Multi-City Travel Route</h3>
            {nextUpcomingTrip.stops && nextUpcomingTrip.stops.length > 0 ? (
              <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
                {nextUpcomingTrip.stops.map((stop, idx) => (
                  <React.Fragment key={stop.id}>
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-white/10 shrink-0 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 font-black flex items-center justify-center text-xs border border-sky-500/30">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">{stop.city.name}</p>
                        <p className="text-[10px] text-slate-400">{stop.city.country}</p>
                      </div>
                    </div>
                    {nextUpcomingTrip.stops && idx < nextUpcomingTrip.stops.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No city stops added to this trip yet.</p>
            )}
          </div>
        </div>
      )}

      {/* 4. Recent Trips Library Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" /> Recent Travel Expeditions
          </h2>
          <Link to="/my-trips" className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
            View All Trips <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-dashed border-white/10">
            <Globe className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No trips in your travel library</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Start planning your first multi-city adventure with custom budget tracking and itinerary blocks.</p>
            <Link to="/create-trip" className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-sky-500">
              <PlusCircle className="w-4 h-4" />
              <span>Plan Your First Trip</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between group">
                <div>
                  <div className="h-44 relative overflow-hidden">
                    <img
                      src={trip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80'}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-navy-950/80 backdrop-blur-md text-sky-300 border border-sky-500/30">
                      {trip.visibility}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">{trip.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{trip.description || 'No description provided.'}</p>
                    <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
                      <span>{trip.stops?.length || 0} Cities</span>
                      <span className="font-extrabold text-emerald-400">₹{trip.totalBudget?.toLocaleString()} INR (₹)</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/trip/${trip.id}/builder`}
                    className="block w-full text-center py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
                  >
                    View & Edit Itinerary
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
