import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip, TripStop, TripActivity } from '../types';
import { RouteVisualization } from '../components/RouteVisualization';
import { formatCurrency } from '../utils/formatters';
import {
  Calendar as CalendarIcon,
  ListFilter,
  MapPin,
  Clock,
  DollarSign,
  Sun,
  Sunset,
  Moon,
  ArrowLeft,
  Share2,
  Printer,
  Sparkles,
  CheckCircle,
  Tag,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface DaySchedule {
  dayNumber: number;
  dateStr: string;
  dateObj: Date;
  cityName: string;
  cityCountry: string;
  activities: TripActivity[];
}

export const ItineraryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  useEffect(() => {
    if (id) {
      api.trips
        .getById(id)
        .then((res) => setTrip(res.trip))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !trip) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading itinerary view...</div>;
  }

  // Generate Day-wise organization
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);
  const totalDays = Math.max(1, Math.ceil((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const daySchedules: DaySchedule[] = [];

  for (let i = 0; i < totalDays; i++) {
    const currentDayDate = new Date(tripStart);
    currentDayDate.setDate(currentDayDate.getDate() + i);
    const dateStr = currentDayDate.toISOString().split('T')[0];

    // Find which city stop corresponds to this day
    const matchingStop = trip.stops?.find((s) => {
      const stopStart = new Date(s.startDate).toISOString().split('T')[0];
      const stopEnd = new Date(s.endDate).toISOString().split('T')[0];
      return dateStr >= stopStart && dateStr <= stopEnd;
    });

    const cityName = matchingStop?.city?.name || (trip.stops && trip.stops[0]?.city?.name) || 'City';
    const cityCountry = matchingStop?.city?.country || '';

    const dayActivities =
      matchingStop?.tripActivities?.filter((a) => {
        const actDateStr = new Date(a.scheduledDate).toISOString().split('T')[0];
        return actDateStr === dateStr;
      }) || [];

    daySchedules.push({
      dayNumber: i + 1,
      dateStr,
      dateObj: currentDayDate,
      cityName,
      cityCountry,
      activities: dayActivities,
    });
  }

  const filteredSchedules =
    selectedCityFilter === 'ALL'
      ? daySchedules
      : daySchedules.filter((d) => d.cityName === selectedCityFilter);

  const getTimeSlot = (timeStr?: string) => {
    if (!timeStr) return 'Morning';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold">
            <Link to="/my-trips" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> My Trips
            </Link>
            <span>/</span>
            <span className="text-slate-400">{trip.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{trip.name} — Itinerary Overview</h1>
          <p className="text-xs text-slate-400">
            📅 {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to{' '}
            {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Total Budget: {formatCurrency(trip.totalBudget || 0, trip.currency)}
          </p>
          {trip.stops && trip.stops.length > 0 && (
            <div className="pt-1">
              <RouteVisualization stops={trip.stops} variant="compact" />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'LIST' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Day-by-Day View</span>
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'CALENDAR' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1"
            title="Print / Save PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* City Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 print:hidden scrollbar-none">
        <button
          onClick={() => setSelectedCityFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCityFilter === 'ALL'
              ? 'bg-sky-500 text-white shadow-md'
              : 'glass-card text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          All Cities ({trip.stops?.length || 0})
        </button>

        {trip.stops?.map((stop) => (
          <button
            key={stop.id}
            onClick={() => setSelectedCityFilter(stop.city.name)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedCityFilter === stop.city.name
                ? 'bg-sky-500 text-white shadow-md'
                : 'glass-card text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{stop.city.name}</span>
          </button>
        ))}
      </div>

      {/* Structured Day-by-Day List View */}
      {viewMode === 'LIST' ? (
        <div className="space-y-8">
          {filteredSchedules.map((schedule) => {
            const morningActs = schedule.activities.filter((a) => getTimeSlot(a.startTime || undefined) === 'Morning');
            const afternoonActs = schedule.activities.filter((a) => getTimeSlot(a.startTime || undefined) === 'Afternoon');
            const eveningActs = schedule.activities.filter((a) => getTimeSlot(a.startTime || undefined) === 'Evening');

            return (
              <div
                key={schedule.dayNumber}
                className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-6 relative overflow-hidden"
              >
                {/* Day Header & City Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider">DAY</span>
                      <span className="text-lg font-black leading-none">{schedule.dayNumber}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">
                        {schedule.dateObj.toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {schedule.activities.length} Scheduled Activities
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-sky-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{schedule.cityName}</span>
                    {schedule.cityCountry && <span className="text-slate-500">, {schedule.cityCountry}</span>}
                  </div>
                </div>

                {/* Day Timeline Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Morning Block */}
                  <div className="glass-card p-4 rounded-2xl border border-slate-800/60 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">
                      <Sun className="w-4 h-4" />
                      <span>Morning (Before 12:00 PM)</span>
                    </div>

                    {morningActs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No morning activities scheduled.</p>
                    ) : (
                      <div className="space-y-2">
                        {morningActs.map((act) => (
                          <ActivityCard key={act.id} activity={act} currency={trip.currency} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Afternoon Block */}
                  <div className="glass-card p-4 rounded-2xl border border-slate-800/60 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 border-b border-slate-800 pb-2">
                      <Sun className="w-4 h-4 text-sky-400" />
                      <span>Afternoon (12:00 PM - 5:00 PM)</span>
                    </div>

                    {afternoonActs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No afternoon activities scheduled.</p>
                    ) : (
                      <div className="space-y-2">
                        {afternoonActs.map((act) => (
                          <ActivityCard key={act.id} activity={act} currency={trip.currency} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Evening Block */}
                  <div className="glass-card p-4 rounded-2xl border border-slate-800/60 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 border-b border-slate-800 pb-2">
                      <Moon className="w-4 h-4" />
                      <span>Evening (After 5:00 PM)</span>
                    </div>

                    {eveningActs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No evening activities scheduled.</p>
                    ) : (
                      <div className="space-y-2">
                        {eveningActs.map((act) => (
                          <ActivityCard key={act.id} activity={act} currency={trip.currency} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar Grid View */
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-sky-400" /> Itinerary Calendar Grid
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daySchedules.map((schedule) => (
              <div key={schedule.dayNumber} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold">
                  <span className="text-sky-400">Day {schedule.dayNumber} — {schedule.dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <span className="text-slate-400">📍 {schedule.cityName}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {schedule.activities.length === 0 ? (
                    <span className="text-slate-500 italic text-[11px]">Free Day</span>
                  ) : (
                    schedule.activities.map((act) => (
                      <div key={act.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{act.activity?.name || act.customName}</span>
                        <span className="text-[10px] text-emerald-400 font-bold shrink-0">₹{act.customCost ?? act.activity?.estimatedCost ?? 0}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityCard: React.FC<{ activity: TripActivity; currency: string }> = ({ activity, currency }) => {
  const title = activity.activity?.name || activity.customName || 'Scheduled Event';
  const category = activity.activity?.category || activity.category || 'General';
  const cost = activity.customCost ?? activity.activity?.estimatedCost ?? 0;
  const image = activity.activity?.image;

  return (
    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-sky-500/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white truncate">{title}</h4>
          <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            {category}
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-400 shrink-0">
          ₹{cost.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          {activity.startTime || '10:00'} - {activity.endTime || '12:00'}
        </span>
        {activity.isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
      </div>

      {activity.notes && (
        <p className="text-[10px] text-slate-400 italic line-clamp-1">"{activity.notes}"</p>
      )}
    </div>
  );
};
