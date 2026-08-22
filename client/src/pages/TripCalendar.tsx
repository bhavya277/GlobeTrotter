import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip, TripActivity, TripStop } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  CheckCircle,
  Circle,
  Plus,
  ArrowLeft,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';

interface DayItem {
  dateStr: string;
  dateObj: Date;
  dayIndex: number;
  cityName: string;
  stopId: string;
  activities: TripActivity[];
  isExpanded: boolean;
}

export const TripCalendar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState<DayItem[]>([]);
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'CALENDAR'>('TIMELINE');
  const [expandedDayDates, setExpandedDayDates] = useState<Record<string, boolean>>({});

  // Quick Edit Modal State
  const [editTarget, setEditTarget] = useState<TripActivity | null>(null);
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('10:00');
  const [editEndTime, setEditEndTime] = useState('12:00');
  const [editCost, setEditCost] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState('Sightseeing');
  const [modalError, setModalError] = useState('');

  const fetchTripDetails = async () => {
    if (!id) return;
    try {
      const res = await api.trips.getById(id);
      setTrip(res.trip);
      buildDayTimeline(res.trip);
    } catch (err) {
      console.error('Error fetching trip details:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildDayTimeline = (t: Trip) => {
    const tripStart = new Date(t.startDate);
    const tripEnd = new Date(t.endDate);
    const totalDays = Math.max(1, Math.ceil((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const generatedDays: DayItem[] = [];

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(tripStart);
      current.setDate(current.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];

      const matchingStop = t.stops?.find((s) => {
        const stopStart = new Date(s.startDate).toISOString().split('T')[0];
        const stopEnd = new Date(s.endDate).toISOString().split('T')[0];
        return dateStr >= stopStart && dateStr <= stopEnd;
      });

      const cityName = matchingStop?.city?.name || t.stops?.[0]?.city?.name || 'City';
      const stopId = matchingStop?.id || '';

      const dayActivities =
        matchingStop?.tripActivities
          ?.filter((a) => {
            const actDateStr = new Date(a.scheduledDate).toISOString().split('T')[0];
            return actDateStr === dateStr;
          })
          .sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

      generatedDays.push({
        dateStr,
        dateObj: current,
        dayIndex: i + 1,
        cityName,
        stopId,
        activities: dayActivities,
        isExpanded: expandedDayDates[dateStr] !== false,
      });
    }

    setDays(generatedDays);
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const toggleExpandDay = (dateStr: string) => {
    setExpandedDayDates((prev) => ({
      ...prev,
      [dateStr]: prev[dateStr] === false ? true : false,
    }));
  };

  const handleReorderActivity = async (dayActivities: TripActivity[], currentIndex: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= dayActivities.length) return;

    const newActs = [...dayActivities];
    const temp = newActs[currentIndex];
    newActs[currentIndex] = newActs[targetIndex];
    newActs[targetIndex] = temp;

    const orderedIds = newActs.map((a) => a.id);

    try {
      // API call -> Database persist -> Refreshed State
      await api.tripActivities.reorder(orderedIds);
      await fetchTripDetails();
    } catch (err) {
      console.error('Failed to reorder activities:', err);
    }
  };

  const openQuickEdit = (act: TripActivity) => {
    setEditTarget(act);
    setEditScheduledDate(new Date(act.scheduledDate).toISOString().split('T')[0]);
    setEditStartTime(act.startTime || '10:00');
    setEditEndTime(act.endTime || '12:00');
    setEditCost(act.customCost ?? act.activity?.estimatedCost ?? 0);
    setEditNotes(act.notes || '');
    setEditCategory(act.category || act.activity?.category || 'Sightseeing');
    setModalError('');
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setModalError('');

    try {
      // API call -> Database persist -> Refreshed State
      await api.tripActivities.update(editTarget.id, {
        scheduledDate: editScheduledDate,
        startTime: editStartTime,
        endTime: editEndTime,
        customCost: editCost,
        notes: editNotes,
        category: editCategory,
      });

      setEditTarget(null);
      await fetchTripDetails();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update scheduled activity');
    }
  };

  const handleToggleComplete = async (actId: string, currentStatus: boolean) => {
    try {
      await api.tripActivities.update(actId, { isCompleted: !currentStatus });
      await fetchTripDetails();
    } catch (err) {
      console.error('Failed to update activity completion status:', err);
    }
  };

  const handleDeleteActivity = async (actId: string) => {
    if (window.confirm('Are you sure you want to remove this activity from your itinerary schedule?')) {
      try {
        await api.tripActivities.delete(actId);
        await fetchTripDetails();
      } catch (err: any) {
        setError(err.message || 'Failed to delete activity');
      }
    }
  };

  if (loading || !trip) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading trip timeline & calendar...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold">
            <Link to="/my-trips" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> My Trips
            </Link>
            <span>/</span>
            <span className="text-slate-400">{trip.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{trip.name} — Interactive Calendar & Vertical Timeline</h1>
          <p className="text-xs text-slate-400">
            📅 {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()} • Reorder activities with instant database synchronization.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'TIMELINE' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vertical Timeline
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'CALENDAR' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Month Calendar
            </button>
          </div>

          <Link
            to={`/trip/${trip.id}/builder`}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </Link>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'TIMELINE' ? (
        /* Expandable Vertical Timeline */
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-800">
          {days.map((day) => {
            const isExpanded = expandedDayDates[day.dateStr] !== false;

            return (
              <div key={day.dateStr} className="relative pl-12 space-y-3">
                {/* Timeline Dot */}
                <div className="absolute left-4 top-5 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-slate-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>

                {/* Day Header Card */}
                <div
                  onClick={() => toggleExpandDay(day.dateStr)}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-sky-500/40 transition-all select-none"
                >
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-xl bg-sky-500/10 text-sky-400 text-xs font-extrabold border border-sky-500/20">
                      Day {day.dayIndex}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {day.dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      <span className="text-xs text-slate-400">📍 {day.cityName} • {day.activities.length} Scheduled</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-xs">{isExpanded ? 'Hide' : 'Expand'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expandable Activities List */}
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    {day.activities.length === 0 ? (
                      <div className="glass-card p-4 rounded-2xl border border-slate-800/60 text-xs text-slate-500 italic text-center">
                        No activities scheduled for this day yet.
                      </div>
                    ) : (
                      day.activities.map((act, actIdx) => {
                        const title = act.activity?.name || act.customName || 'Scheduled Event';
                        const category = act.activity?.category || act.category || 'General';
                        const cost = act.customCost ?? act.activity?.estimatedCost ?? 0;

                        return (
                          <div
                            key={act.id}
                            className={`glass-card p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                              act.isCompleted ? 'border-emerald-500/30 opacity-70 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start space-x-3 min-w-0">
                              <button
                                onClick={() => handleToggleComplete(act.id, act.isCompleted)}
                                className="mt-1 text-slate-400 hover:text-emerald-400"
                              >
                                {act.isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h4 className={`text-sm font-bold truncate ${act.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                                    {title}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-sky-400">
                                    {category}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-4 text-xs text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                                    {act.startTime || '10:00'} - {act.endTime || '12:00'}
                                  </span>
                                  <span className="font-bold text-emerald-400">
                                    {formatCurrency(cost, trip.currency)}
                                  </span>
                                </div>

                                {act.notes && <p className="text-xs text-slate-400 italic">"{act.notes}"</p>}
                              </div>
                            </div>

                            {/* Action Controls: Move Up, Move Down, Quick Edit, Delete */}
                            <div className="flex items-center space-x-2 shrink-0">
                              <div className="flex flex-col bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                                <button
                                  disabled={actIdx === 0}
                                  onClick={() => handleReorderActivity(day.activities, actIdx, 'UP')}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Move earlier in day"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={actIdx === day.activities.length - 1}
                                  onClick={() => handleReorderActivity(day.activities, actIdx, 'DOWN')}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Move later in day"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => openQuickEdit(act)}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700"
                                title="Quick Edit Event & Date"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700"
                                title="Delete Activity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar Month Grid View */
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {days.map((day) => (
              <div key={day.dateStr} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold">
                  <span className="text-sky-400">Day {day.dayIndex} — {day.dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <span className="text-slate-400">📍 {day.cityName}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {day.activities.length === 0 ? (
                    <span className="text-slate-500 italic text-[11px]">No events</span>
                  ) : (
                    day.activities.map((act) => (
                      <div key={act.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{act.activity?.name || act.customName}</span>
                        <span className="text-[10px] text-emerald-400 font-bold shrink-0">{formatCurrency(act.customCost ?? act.activity?.estimatedCost ?? 0, trip.currency)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-slate-800 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" /> Quick Edit & Shift Date
              </h3>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Shift Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={editScheduledDate}
                  onChange={(e) => setEditScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Food">Food & Dining</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Culture">Culture</option>
                    <option value="Nightlife">Nightlife</option>
                    <option value="Relaxation">Relaxation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editCost}
                    onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
                >
                  Save Changes & Refresh DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
