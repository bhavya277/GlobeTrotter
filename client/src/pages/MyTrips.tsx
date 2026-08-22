import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip } from '../types';
import {
  Calendar,
  MapPin,
  PlusCircle,
  Search,
  Trash2,
  Share2,
  DollarSign,
  Edit,
  Globe,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';

export const MyTrips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [shareModalToken, setShareModalToken] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      const res = await api.trips.getMyTrips();
      setTrips(res.trips);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await api.trips.delete(id);
        setTrips(trips.filter((t) => t.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete trip');
      }
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.stops?.some((s) => s.city.name.toLowerCase().includes(search.toLowerCase()));

    const isUpcoming = new Date(t.startDate) >= new Date();
    if (filter === 'UPCOMING') return matchesSearch && isUpcoming;
    if (filter === 'PAST') return matchesSearch && !isUpcoming;
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            My <span className="gradient-text">Trips</span> & Expeditions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your past, present, and upcoming personalized travel plans.
          </p>
        </div>

        <Link
          to="/create-trip"
          className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 transition-all duration-200"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Plan New Trip</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search trips by title or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
          {(['ALL', 'UPCOMING', 'PAST'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              {tab === 'ALL' ? 'All Trips' : tab === 'UPCOMING' ? 'Upcoming' : 'Past Expeditions'}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel h-80 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-dashed border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Globe className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No trips found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'You haven’t planned any trips yet.'}
          </p>
          <Link
            to="/create-trip"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Trip</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={trip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80'}
                    alt={trip.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-sky-300 border border-sky-500/30">
                      {trip.visibility}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1 border border-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      {trip.name}
                    </h3>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                      ${trip.totalBudget?.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {trip.description || 'No description added yet.'}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {trip.stops?.map((stop) => (
                      <span
                        key={stop.id}
                        className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {stop.city.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-2 border-t border-slate-800/60 mt-4">
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Link
                    to={`/trip/${trip.id}/builder`}
                    className="py-2.5 text-center rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors"
                  >
                    Itinerary Builder
                  </Link>
                  <Link
                    to={`/trip/${trip.id}/budget`}
                    className="py-2.5 text-center rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    Budget & Expenses
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    onClick={() => setShareModalToken(trip.shareToken || 'demo')}
                    className="flex items-center space-x-1.5 text-slate-400 hover:text-sky-300 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>

                  <button
                    onClick={() => handleDelete(trip.id, trip.name)}
                    className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Link Modal */}
      {shareModalToken && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-slate-800 relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-sky-400" /> Share Public Itinerary
            </h3>
            <p className="text-xs text-slate-400">
              Anyone with this secret link can view this read-only itinerary and budget breakdown without logging in.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-sky-300 font-mono">
              <span className="truncate">{window.location.origin}/share/{shareModalToken}</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/${shareModalToken}`);
                  alert('Public link copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
              >
                Copy Link
              </button>

              <a
                href={`/share/${shareModalToken}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 flex items-center gap-1"
              >
                Open <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setShareModalToken(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
