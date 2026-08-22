import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle,
  Circle,
  ArrowLeft,
  Layers,
  Sparkles,
} from 'lucide-react';

export const TripCalendar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.trips.getById(id).then((res) => {
      setTrip(res.trip);
      setLoading(false);
    });
  }, [id]);

  if (loading || !trip) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading timeline...</div>;
  }

  // Generate date range
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const days: Date[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold mb-1">
            <Link to={`/trip/${trip.id}/builder`} className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Itinerary Builder
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{trip.name} — Visual Timeline</h1>
          <p className="text-xs text-slate-400">Sequential day-by-day scheduled activities overview</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <span>{days.length} Total Days</span>
        </div>
      </div>

      {/* Timeline Days List */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-800 before:hidden md:before:block">
        {days.map((dayDate, dayIdx) => {
          const dateStr = dayDate.toISOString().split('T')[0];

          // Find activities across stops scheduled for this dayDate
          const dayActivities: { activity: any; stop: any }[] = [];
          trip.stops?.forEach((stop) => {
            stop.tripActivities?.forEach((act) => {
              const actDateStr = new Date(act.scheduledDate).toISOString().split('T')[0];
              if (actDateStr === dateStr) {
                dayActivities.push({ activity: act, stop });
              }
            });
          });

          return (
            <div key={dateStr} className="relative flex flex-col md:flex-row items-start gap-6 group">
              {/* Day Marker Badge */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex flex-col items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 border border-sky-400/30 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider">Day</span>
                <span className="text-base font-black leading-none">{dayIdx + 1}</span>
              </div>

              {/* Day Card Content */}
              <div className="flex-1 glass-card p-5 rounded-3xl border border-slate-800 space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-sky-400" />
                    {dayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    {dayActivities.length} Scheduled Events
                  </span>
                </div>

                {dayActivities.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Free day — No events scheduled for this date.</p>
                ) : (
                  <div className="space-y-3">
                    {dayActivities.map(({ activity: act, stop }) => {
                      const title = act.activity?.name || act.customName || 'Scheduled Event';
                      const cost = act.customCost ?? act.activity?.estimatedCost ?? 0;

                      return (
                        <div
                          key={act.id}
                          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between space-x-3"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-400" /> {stop.city.name} • {act.startTime || '10:00'} - {act.endTime || '12:00'}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                            ${cost}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
