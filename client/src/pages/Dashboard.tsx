import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Trip, City } from '../types';
import {
  Compass,
  Calendar,
  MapPin,
  PlusCircle,
  TrendingUp,
  DollarSign,
  Share2,
  Bookmark,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [featuredCities, setFeaturedCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsRes, citiesRes] = await Promise.all([
          api.trips.getMyTrips(),
          api.cities.getAll({ sortBy: 'popularity' }),
        ]);
        setTrips(tripsRes.trips);
        setFeaturedCities(citiesRes.cities.slice(0, 4));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalBudgetTracked = trips.reduce((acc, t) => acc + (t.totalBudget || 0), 0);
  const upcomingTrips = trips.filter((t) => new Date(t.startDate) >= new Date());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-slate-800 p-6 md:p-8">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-gradient-to-tr from-sky-500/20 to-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={user?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-sky-500/30 shadow-xl"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  Welcome back, <span className="gradient-text">{user?.name}</span>!
                </h1>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Ready to organize your next unforgettable journey?
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Link
              to="/create-trip"
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 transition-all duration-200 hover:scale-[1.02]"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Trip</span>
            </Link>
            <Link
              to="/cities"
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
            >
              <Compass className="w-5 h-5 text-sky-400" />
              <span>Explore</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Trips</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{trips.length}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Persisted in database</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{upcomingTrips.length}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Scheduled itineraries</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Budget Tracked</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">${totalBudgetTracked.toLocaleString()}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Across all trips</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saved Places</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">4</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Bookmarked destinations</span>
        </div>
      </div>

      {/* Main Content Split: My Active Trips & Featured Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Active Trips */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h2 className="text-xl font-bold text-white">My Active Itineraries</h2>
            </div>
            <Link to="/my-trips" className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">
              View All ({trips.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 animate-pulse">
              Loading your trips...
            </div>
          ) : trips.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center space-y-4 border border-dashed border-slate-700">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No trips created yet</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  Start your journey by creating your first trip and choosing destination stops.
                </p>
              </div>
              <Link
                to="/create-trip"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Your First Trip</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-sky-500/40 transition-all duration-200 group flex flex-col md:flex-row"
                >
                  <div className="md:w-56 h-48 md:h-auto relative overflow-hidden shrink-0">
                    <img
                      src={trip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80'}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-sky-300 border border-sky-500/30">
                      {trip.visibility}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                          {trip.name}
                        </h3>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          ${trip.totalBudget?.toLocaleString()} {trip.currency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {trip.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{trip.stops?.length || 0} Cities</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to={`/trip/${trip.id}/builder`}
                        className="flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors"
                      >
                        Itinerary Builder
                      </Link>
                      <Link
                        to={`/trip/${trip.id}/budget`}
                        className="py-2 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                      >
                        Budget
                      </Link>
                      <Link
                        to={`/trip/${trip.id}/calendar`}
                        className="py-2 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                      >
                        Timeline
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Popular Destinations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Popular Destinations</h2>
            </div>
            <Link to="/cities" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
              Explore All
            </Link>
          </div>

          <div className="space-y-4">
            {featuredCities.map((city) => (
              <div
                key={city.id}
                className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between space-x-4 hover:border-slate-700 transition-all"
              >
                <img
                  src={city.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80'}
                  alt={city.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{city.name}</h4>
                  <p className="text-xs text-slate-400">{city.country} • {city.region}</p>
                  <div className="flex items-center space-x-2 mt-1 text-[11px] text-amber-400">
                    <span>★ {city.popularity}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">Cost: ${'$$$$$'.slice(0, Math.round(city.costIndex))}</span>
                  </div>
                </div>
                <Link
                  to={`/cities/${city.id}`}
                  className="p-2 rounded-xl bg-slate-800 text-sky-400 hover:bg-sky-500 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
