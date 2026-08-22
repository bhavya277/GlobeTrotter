import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip } from '../types';
import {
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Share2,
  Lock,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

export const PublicTripView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.trips.getByShareToken(token)
      .then((res) => {
        setTrip(res.trip);
      })
      .catch((err) => {
        setError(err.message || 'Shared trip not found or link is private.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">Loading shared itinerary...</div>;
  }

  if (error || !trip) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-panel rounded-3xl text-center space-y-4 border border-rose-500/30">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Private Itinerary</h2>
        <p className="text-xs text-slate-400">{error || 'You do not have permission to view this itinerary.'}</p>
        <Link to="/" className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400">
          Go to GlobeTrotter Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Cover & Title Hero */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800">
        <div className="h-64 sm:h-80 relative">
          <img src={trip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'} alt={trip.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>

        <div className="p-6 sm:p-8 space-y-4 -mt-20 relative z-10">
          <div className="flex items-center space-x-3">
            <img src={trip.user?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} alt="Author" className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-400" />
            <span className="text-xs text-slate-300 font-semibold">Planned by {trip.user?.name || 'Traveler'}</span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Shared Public Itinerary</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">{trip.name}</h1>
          <p className="text-sm text-slate-300 max-w-2xl">{trip.description}</p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-sky-400" /> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Total Budget: ${trip.totalBudget?.toLocaleString()} {trip.currency}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-400" /> {trip.stops?.length || 0} Destination Stops</span>
          </div>
        </div>
      </div>

      {/* City Stops & Activities Showcase */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-sky-400" /> Day-by-Day Journey
        </h2>

        {trip.stops?.map((stop, stopIdx) => (
          <div key={stop.id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded-xl bg-sky-500/10 text-sky-400 text-xs font-bold border border-sky-500/20">
                  Stop {stopIdx + 1}
                </span>
                <h3 className="text-lg font-bold text-white">{stop.city.name}, {stop.city.country}</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {new Date(stop.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(stop.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-3">
              {stop.tripActivities?.map((act) => (
                <div key={act.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{act.activity?.name || act.customName}</h4>
                      <p className="text-[11px] text-slate-400">{act.startTime || '10:00'} - {act.endTime || '12:00'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">${act.customCost ?? act.activity?.estimatedCost ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
