import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip, TripStop, Activity, TripActivity } from '../types';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  MapPin,
  DollarSign,
  Share2,
  BarChart3,
  Layers,
  Sparkles,
  ArrowLeft,
  Search,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const ItineraryBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeDateStr, setActiveDateStr] = useState<string>('');

  // Add Activity Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cityActivities, setCityActivities] = useState<Activity[]>([]);
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom Activity State
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Sightseeing');
  const [customCost, setCustomCost] = useState<number>(20);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [notes, setNotes] = useState('');

  const fetchTripDetails = async () => {
    if (!id) return;
    try {
      const res = await api.trips.getById(id);
      setTrip(res.trip);

      if (res.trip.stops && res.trip.stops.length > 0) {
        if (!activeStopId) {
          setActiveStopId(res.trip.stops[0].id);
          setActiveDateStr(new Date(res.trip.stops[0].startDate).toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching trip details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const activeStop = trip?.stops?.find((s) => s.id === activeStopId);

  useEffect(() => {
    if (activeStop?.cityId) {
      api.activities.getAll({ cityId: activeStop.cityId }).then((res) => {
        setCityActivities(res.activities);
      });
    }
  }, [activeStopId, activeStop?.cityId]);

  const handleAddCatalogActivity = async (activity: Activity) => {
    if (!activeStopId || !activeDateStr) return;
    try {
      await api.tripActivities.add({
        tripStopId: activeStopId,
        activityId: activity.id,
        scheduledDate: activeDateStr,
        startTime: '10:00',
        endTime: '12:00',
        customCost: activity.estimatedCost,
        notes: `Added from ${activity.city?.name || 'city'} catalog`,
      });
      setIsAddModalOpen(false);
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add activity');
    }
  };

  const handleAddCustomActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStopId || !activeDateStr || !customName.trim()) return;

    try {
      await api.tripActivities.add({
        tripStopId: activeStopId,
        customName,
        category: customCategory,
        scheduledDate: activeDateStr,
        startTime,
        endTime,
        customCost,
        notes,
      });
      setIsAddModalOpen(false);
      setCustomName('');
      setNotes('');
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add custom activity');
    }
  };

  const handleToggleComplete = async (tripActivityId: string, currentStatus: boolean) => {
    try {
      await api.tripActivities.update(tripActivityId, { isCompleted: !currentStatus });
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to update activity status:', err);
    }
  };

  const handleDeleteActivity = async (tripActivityId: string) => {
    try {
      await api.tripActivities.delete(tripActivityId);
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to delete scheduled activity:', err);
    }
  };

  if (loading || !trip) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading itinerary builder...
      </div>
    );
  }

  // Filter activities for current active stop
  const scheduledActivities = activeStop?.tripActivities || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold">
            <Link to="/my-trips" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> My Trips
            </Link>
            <span>/</span>
            <span className="text-slate-400">{trip.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{trip.name} — Itinerary Builder</h1>
          <p className="text-xs text-slate-400">
            📅 {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()} • {trip.stops?.length || 0} Cities
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/trip/${trip.id}/budget`}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Budget Breakdown</span>
          </Link>

          <Link
            to={`/trip/${trip.id}/calendar`}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Timeline</span>
          </Link>
        </div>
      </div>

      {/* City Stops Tabs Row */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
        {trip.stops?.map((stop, idx) => {
          const isActive = stop.id === activeStopId;
          return (
            <button
              key={stop.id}
              onClick={() => {
                setActiveStopId(stop.id);
                setActiveDateStr(new Date(stop.startDate).toISOString().split('T')[0]);
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center space-x-2 border ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400 shadow-lg shadow-sky-500/20'
                  : 'glass-card text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <MapPin className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-400'}`} />
              <span>Stop {idx + 1}: {stop.city.name}</span>
              <span className="text-[10px] opacity-75">
                ({new Date(stop.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Board Layout */}
      {activeStop ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduled Itinerary List (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeStop.city.name}, {activeStop.city.country}</h3>
                  <p className="text-xs text-slate-400">
                    {scheduledActivities.length} Scheduled Activities
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-md shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </button>
            </div>

            {scheduledActivities.length === 0 ? (
              <div className="glass-panel p-10 rounded-3xl text-center space-y-3 border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">No activities scheduled for this stop</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Browse city attractions or create your custom scheduled events.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500"
                >
                  Explore Activity Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledActivities.map((act) => {
                  const title = act.activity?.name || act.customName || 'Scheduled Event';
                  const category = act.activity?.category || act.category || 'General';
                  const cost = act.customCost ?? act.activity?.estimatedCost ?? 0;
                  const img = act.activity?.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div
                      key={act.id}
                      className={`glass-card p-4 rounded-2xl border transition-all flex items-start space-x-4 ${
                        act.isCompleted
                          ? 'border-emerald-500/30 opacity-70 bg-emerald-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleComplete(act.id, act.isCompleted)}
                        className="mt-1 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        {act.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <img src={img} alt={title} className="w-16 h-16 rounded-xl object-cover shrink-0" />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-bold truncate ${act.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                            {title}
                          </h4>
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ${cost}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-sky-400" />
                            {act.startTime || '10:00'} - {act.endTime || '12:00'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                            {category}
                          </span>
                        </div>

                        {act.notes && (
                          <p className="text-xs text-slate-400 italic pt-1">
                            "{act.notes}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: City Info & Activity Highlights */}
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl space-y-4 border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> {activeStop.city.name} Highlights
              </h3>
              <p className="text-xs text-slate-400">
                {activeStop.city.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span>Cost Level: ${'$$$$$'.slice(0, Math.round(activeStop.city.costIndex))}</span>
                <span>Rating: ★ {activeStop.city.popularity}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-slate-400">
          No stop selected.
        </div>
      )}

      {/* Add Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" /> Add Activity to Itinerary
              </h3>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setIsCustomMode(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold ${!isCustomMode ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  City Catalog
                </button>
                <button
                  onClick={() => setIsCustomMode(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold ${isCustomMode ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Custom Activity
                </button>
              </div>
            </div>

            {!isCustomMode ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search catalog activities..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {cityActivities
                    .filter((a) => a.name.toLowerCase().includes(activitySearch.toLowerCase()))
                    .map((activity) => (
                      <div
                        key={activity.id}
                        className="glass-card p-3 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3 hover:border-sky-500/40 transition-all"
                      >
                        <img
                          src={activity.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=200&q=80'}
                          alt={activity.name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{activity.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{activity.description}</p>
                          <span className="text-[11px] font-semibold text-emerald-400">
                            Est. ${activity.estimatedCost} • {activity.durationMinutes} mins
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddCatalogActivity(activity)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddCustomActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Activity Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Sunset cocktails at rooftop lounge"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                    >
                      <option value="Sightseeing">Sightseeing</option>
                      <option value="Food">Food & Dining</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Nightlife">Nightlife</option>
                      <option value="Culture">Culture</option>
                      <option value="Relaxation">Relaxation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Estimated Cost ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customCost}
                      onChange={(e) => setCustomCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ticket reservation codes, addresses..."
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
                  >
                    Save Custom Activity
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsAddModalOpen(false)}
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
