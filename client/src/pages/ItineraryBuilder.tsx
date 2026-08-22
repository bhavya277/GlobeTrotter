import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { IntelligencePanel } from '../components/IntelligencePanel';
import { Trip, TripStop, Activity, TripActivity, City } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  MapPin,
  DollarSign,
  BarChart3,
  Layers,
  Sparkles,
  ArrowLeft,
  Search,
  ChevronUp,
  ChevronDown,
  Edit2,
  X,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

export const ItineraryBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeDateStr, setActiveDateStr] = useState<string>('');

  // Add City Stop Modal
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [newStopStartDate, setNewStopStartDate] = useState('');
  const [newStopEndDate, setNewStopEndDate] = useState('');
  const [stopError, setStopError] = useState('');

  // Edit City Stop Dates Modal
  const [editStopTarget, setEditStopTarget] = useState<TripStop | null>(null);
  const [editStopStartDate, setEditStopStartDate] = useState('');
  const [editStopEndDate, setEditStopEndDate] = useState('');
  const [editStopNotes, setEditStopNotes] = useState('');

  // Add Activity Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cityActivities, setCityActivities] = useState<Activity[]>([]);
  const [activitySearch, setActivitySearch] = useState('');

  // Custom Activity State
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Sightseeing');
  const [customCost, setCustomCost] = useState<number>(500);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [notes, setNotes] = useState('');

  const fetchTripDetails = async () => {
    if (!id) return;
    try {
      const res = await api.trips.getById(id);
      setTrip(res.trip);

      if (res.trip.stops && res.trip.stops.length > 0) {
        if (!activeStopId || !res.trip.stops.some((s) => s.id === activeStopId)) {
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
    api.cities.getAll().then((res) => {
      setAvailableCities(res.cities);
      if (res.cities.length > 0) setSelectedCityId(res.cities[0].id);
    });
  }, [id]);

  const activeStop = trip?.stops?.find((s) => s.id === activeStopId);

  useEffect(() => {
    if (activeStop?.cityId) {
      api.activities.getAll({ cityId: activeStop.cityId }).then((res) => {
        setCityActivities(res.activities);
      });
    }
  }, [activeStopId, activeStop?.cityId]);

  const openAddStopModal = () => {
    if (!trip) return;
    setStopError('');
    setNewStopStartDate(new Date(trip.startDate).toISOString().split('T')[0]);
    setNewStopEndDate(new Date(trip.endDate).toISOString().split('T')[0]);
    setIsAddStopModalOpen(true);
  };

  const handleCreateStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !selectedCityId) return;

    setStopError('');

    try {
      await api.trips.addStop(trip.id, {
        cityId: selectedCityId,
        startDate: newStopStartDate,
        endDate: newStopEndDate,
      });

      setIsAddStopModalOpen(false);
      fetchTripDetails();
    } catch (err: any) {
      setStopError(err.message || 'Failed to add stop');
    }
  };

  const handleMoveStop = async (currentIndex: number, direction: 'UP' | 'DOWN') => {
    if (!trip || !trip.stops) return;
    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= trip.stops.length) return;

    const newStops = [...trip.stops];
    const temp = newStops[currentIndex];
    newStops[currentIndex] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    const orderedIds = newStops.map((s) => s.id);
    try {
      await api.trips.reorderStops(trip.id, orderedIds);
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to reorder stops:', err);
    }
  };

  const openEditStopModal = (stop: TripStop) => {
    setEditStopTarget(stop);
    setEditStopStartDate(new Date(stop.startDate).toISOString().split('T')[0]);
    setEditStopEndDate(new Date(stop.endDate).toISOString().split('T')[0]);
    setEditStopNotes(stop.notes || '');
    setStopError('');
  };

  const handleUpdateStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !editStopTarget) return;

    setStopError('');

    try {
      await api.trips.updateStop(trip.id, editStopTarget.id, {
        startDate: editStopStartDate,
        endDate: editStopEndDate,
        notes: editStopNotes,
      });
      setEditStopTarget(null);
      fetchTripDetails();
    } catch (err: any) {
      setStopError(err.message || 'Failed to update stop dates');
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!trip) return;
    if (window.confirm('Are you sure you want to remove this city stop from your itinerary?')) {
      try {
        await api.trips.deleteStop(trip.id, stopId);
        fetchTripDetails();
      } catch (err: any) {
        setStopError(err.message || 'Failed to remove stop');
      }
    }
  };

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
      setStopError(err.message || 'Failed to add activity');
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
      setStopError(err.message || 'Failed to add custom activity');
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

  // Drag and Drop Activity Reordering
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIndex || !activeStop) return;

    const newActivities = [...(activeStop.tripActivities || [])];
    const [movedItem] = newActivities.splice(draggedIdx, 1);
    newActivities.splice(dropIndex, 0, movedItem);

    const orderedActivityIds = newActivities.map((a) => a.id);
    setDraggedIdx(null);

    try {
      await api.tripActivities.reorder(orderedActivityIds);
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to reorder activities:', err);
      fetchTripDetails(); // Revert visual order on error
    }
  };

  if (loading || !trip) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading itinerary builder...</div>;
  }

  const scheduledActivities = activeStop?.tripActivities || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold">
            <Link to="/my-trips" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> My Trips
            </Link>
            <span>/</span>
            <span className="text-slate-400">{trip.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{trip.name} — Multi-City Itinerary Builder</h1>
          <p className="text-xs text-slate-400">
            📅 {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()} • {trip.stops?.length || 0} Ordered Cities • Budget: ₹{trip.totalBudget?.toLocaleString()} INR (₹)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openAddStopModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add City Stop</span>
          </button>

          <Link
            to={`/trip/${trip.id}/budget`}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Budget</span>
          </Link>
        </div>
      </div>

      {/* Multi-City Stop Selector & Reordering Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-sky-400" /> Ordered Multi-City Itinerary Stops ({trip.stops?.length || 0})</span>
          <span className="text-slate-500 text-[11px]">Reorder or edit dates for each city stop</span>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
          {trip.stops?.map((stop, idx) => {
            const isActive = stop.id === activeStopId;
            return (
              <div
                key={stop.id}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center space-x-3 border ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400 shadow-lg shadow-sky-500/20'
                    : 'glass-card text-slate-300 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <div
                  onClick={() => {
                    setActiveStopId(stop.id);
                    setActiveDateStr(new Date(stop.startDate).toISOString().split('T')[0]);
                  }}
                  className="cursor-pointer flex items-center space-x-2"
                >
                  <MapPin className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                  <div>
                    <span>Stop {idx + 1}: {stop.city.name}</span>
                    <span className="block text-[10px] opacity-75 font-normal">
                      {new Date(stop.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(stop.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 pl-2 border-l border-slate-700/60">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveStop(idx, 'UP')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move stop earlier"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === (trip.stops?.length || 1) - 1}
                    onClick={() => handleMoveStop(idx, 'DOWN')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move stop later"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditStopModal(stop)}
                    className="p-1 text-slate-400 hover:text-sky-300"
                    title="Edit stop dates"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteStop(stop.id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="Remove city stop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
                    {scheduledActivities.length} Scheduled Activities • Stop Dates: {new Date(activeStop.startDate).toLocaleDateString()} to {new Date(activeStop.endDate).toLocaleDateString()}
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
                <h4 className="text-base font-bold text-white">No activities scheduled for {activeStop.city.name}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Browse city attractions or add custom events for this stop.
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
                {scheduledActivities.map((act, actIndex) => {
                  const title = act.activity?.name || act.customName || 'Scheduled Event';
                  const category = act.activity?.category || act.category || 'General';
                  const cost = act.customCost ?? act.activity?.estimatedCost ?? 0;
                  const img = act.activity?.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div
                      key={act.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, actIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, actIndex)}
                      className={`glass-card p-4 rounded-2xl border transition-all flex items-start space-x-3 cursor-grab active:cursor-grabbing ${
                        draggedIdx === actIndex ? 'opacity-40 border-sky-400 border-dashed' : ''
                      } ${
                        act.isCompleted
                          ? 'border-emerald-500/30 opacity-70 bg-emerald-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-1 text-slate-500 hover:text-slate-300 cursor-grab" title="Drag to reorder">
                        <GripVertical className="w-5 h-5" />
                      </div>

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
                            {formatCurrency(cost, trip.currency)}
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

          {/* Right Panel: City Info */}
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl space-y-4 border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> {activeStop.city.name} Overview
              </h3>
              <p className="text-xs text-slate-400">{activeStop.city.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span>Cost Index: {'₹₹₹₹₹'.slice(0, Math.round(activeStop.city.costIndex))}</span>
                <span>Rating: ★ {activeStop.city.popularity}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-slate-400">No stop selected.</div>
      )}

      {/* Intelligence Layer Component */}
      <IntelligencePanel tripId={trip.id} />

      {/* Add City Stop Modal */}
      {isAddStopModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-slate-800 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" /> Add City Stop to Itinerary
              </h3>
              <button onClick={() => setIsAddStopModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {stopError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                ⚠️ {stopError}
              </div>
            )}

            <form onSubmit={handleCreateStop} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select City *</label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                >
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Arrival Date *</label>
                  <input
                    type="date"
                    required
                    value={newStopStartDate}
                    onChange={(e) => setNewStopStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={newStopEndDate}
                    onChange={(e) => setNewStopEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStopModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400">
                  Add Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit City Stop Modal */}
      {editStopTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-slate-800 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-400" /> Edit Stop Dates ({editStopTarget.city.name})
              </h3>
              <button onClick={() => setEditStopTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {stopError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                ⚠️ {stopError}
              </div>
            )}

            <form onSubmit={handleUpdateStop} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Arrival Date *</label>
                  <input
                    type="date"
                    required
                    value={editStopStartDate}
                    onChange={(e) => setEditStopStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={editStopEndDate}
                    onChange={(e) => setEditStopEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stop Notes</label>
                <textarea
                  rows={2}
                  value={editStopNotes}
                  onChange={(e) => setEditStopNotes(e.target.value)}
                  placeholder="Hotel reservations, transport details..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditStopTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400">
                  Save Stop Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" /> Add Activity to {activeStop?.city.name}
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
                            Est. {formatCurrency(activity.estimatedCost, trip.currency)} • {activity.durationMinutes} mins
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
                    placeholder="e.g. Sunset dinner at harbor viewpoint"
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
                      Estimated Cost ({trip.currency || 'INR'})
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
