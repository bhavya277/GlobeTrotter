import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, City, Trip, TripStop } from '../types';
import {
  Search,
  Compass,
  Filter,
  Clock,
  DollarSign,
  Star,
  MapPin,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';

export const ActivitySearch: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxCost, setMaxCost] = useState<number>(10000);
  const [maxDuration, setMaxDuration] = useState<number>(360);

  // Add to Trip Stop Modal State
  const [targetActivity, setTargetActivity] = useState<Activity | null>(null);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const fetchActivities = async () => {
    try {
      const res = await api.activities.getAll({
        search,
        cityId: selectedCityId !== 'all' ? selectedCityId : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        maxCost: maxCost < 10000 ? maxCost : undefined,
        maxDuration: maxDuration < 360 ? maxDuration : undefined,
      });
      setActivities(res.activities);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [search, selectedCityId, selectedCategory, maxCost, maxDuration]);

  useEffect(() => {
    api.cities.getAll().then((res) => setCities(res.cities)).catch(() => {});
  }, []);

  const openAddModal = async (activity: Activity) => {
    setTargetActivity(activity);
    setAddError('');
    setAddSuccess('');

    try {
      const res = await api.trips.getMyTrips();
      setUserTrips(res.trips);
      if (res.trips.length > 0) {
        setSelectedTripId(res.trips[0].id);
        if (res.trips[0].stops && res.trips[0].stops.length > 0) {
          setSelectedStopId(res.trips[0].stops[0].id);
          setScheduledDate(new Date(res.trips[0].stops[0].startDate).toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    }
  };

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    const trip = userTrips.find((t) => t.id === tripId);
    if (trip && trip.stops && trip.stops.length > 0) {
      // Pre-select matching city stop if available
      const matchingStop = trip.stops.find((s) => s.cityId === targetActivity?.cityId);
      const chosenStop = matchingStop || trip.stops[0];
      setSelectedStopId(chosenStop.id);
      setScheduledDate(new Date(chosenStop.startDate).toISOString().split('T')[0]);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetActivity || !selectedStopId) return;

    setAddError('');
    setAddSuccess('');

    try {
      await api.tripActivities.add({
        tripStopId: selectedStopId,
        activityId: targetActivity.id,
        scheduledDate,
        startTime,
        endTime,
        customCost: targetActivity.estimatedCost,
      });

      setAddSuccess(`Added "${targetActivity.name}" to your itinerary stop!`);
      setTimeout(() => setTargetActivity(null), 1200);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add activity');
    }
  };

  const currentSelectedTrip = userTrips.find((t) => t.id === selectedTripId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 text-center max-w-3xl mx-auto relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mb-2 border border-sky-500/20">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white">
          Explore Unique <span className="gradient-text">Activities & Experiences</span>
        </h1>
        <p className="text-sm text-slate-400">
          Find curated tours, food walks, cultural monuments, and adventure experiences.
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities by name, category, or experience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input text-sm text-white placeholder-slate-500 shadow-xl"
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-bold text-slate-300">
          <Filter className="w-4 h-4 text-sky-400" />
          <span>Category & City Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">City</label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white bg-slate-900"
            >
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white bg-slate-900"
            >
              <option value="all">All Categories</option>
              <option value="Sightseeing">Sightseeing</option>
              <option value="Food">Food & Dining</option>
              <option value="Adventure">Adventure</option>
              <option value="Culture">Culture</option>
              <option value="Nightlife">Nightlife</option>
              <option value="Relaxation">Relaxation</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Max Cost (₹)</label>
            <input
              type="number"
              value={maxCost}
              onChange={(e) => setMaxCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Max Duration (mins)</label>
            <input
              type="number"
              value={maxDuration}
              onChange={(e) => setMaxDuration(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white"
            />
          </div>
        </div>
      </div>

      {/* Activity Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel h-80 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          No activities found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="glass-card rounded-3xl overflow-hidden border border-slate-800 hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={activity.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80'}
                    alt={activity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-sky-300 border border-slate-700">
                    {activity.category}
                  </span>
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1 border border-slate-700">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {activity.city?.name || 'City'}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                      {activity.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{activity.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{activity.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      {activity.durationMinutes} mins
                    </span>
                    <span className="font-bold text-emerald-400">
                      ₹{activity.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => openAddModal(activity)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Attach to Itinerary Stop</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Activity to Stop Modal */}
      {targetActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-slate-800 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" /> Attach Activity to Trip
              </h3>
              <button onClick={() => setTargetActivity(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">{targetActivity.name}</p>
              <p className="text-slate-400">City: <span className="text-sky-400 font-semibold">{targetActivity.city?.name}</span> • Est. Cost: ₹{targetActivity.estimatedCost}</p>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{addSuccess}</span>
              </div>
            )}

            {userTrips.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">You have no active trips. Create a trip first.</p>
            ) : (
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Trip</label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => handleTripChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    {userTrips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target City Stop *</label>
                  <select
                    value={selectedStopId}
                    onChange={(e) => {
                      setSelectedStopId(e.target.value);
                      const stop = currentSelectedTrip?.stops?.find((s) => s.id === e.target.value);
                      if (stop) {
                        setScheduledDate(new Date(stop.startDate).toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    {currentSelectedTrip?.stops?.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        Stop: {stop.city.name} ({new Date(stop.startDate).toLocaleDateString()} - {new Date(stop.endDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setTargetActivity(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
                  >
                    Confirm & Attach
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
