import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { City } from '../types';
import {
  MapPin,
  Star,
  DollarSign,
  Clock,
  ArrowLeft,
  Plus,
  Compass,
  Bookmark,
  Sparkles,
} from 'lucide-react';

export const CityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.cities.getById(id).then((res) => {
      setCity(res.city);
      setLoading(false);
    });
  }, [id]);

  if (loading || !city) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading city details...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800">
        <div className="h-72 sm:h-96 relative">
          <img
            src={city.heroImage || city.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80'}
            alt={city.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>

        <div className="p-6 sm:p-8 space-y-4 -mt-24 relative z-10">
          <Link to="/cities" className="inline-flex items-center space-x-1 text-xs text-sky-400 font-semibold hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cities
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {city.region}
              </span>
              <h1 className="text-4xl font-black text-white mt-2">{city.name}</h1>
              <p className="text-sm font-semibold text-slate-300">{city.country}</p>
            </div>

            <Link
              to="/create-trip"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/25"
            >
              <Plus className="w-5 h-5" />
              <span>Plan Trip to {city.name}</span>
            </Link>
          </div>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">{city.description}</p>

          <div className="flex flex-wrap gap-6 pt-3 text-xs text-slate-300 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{city.popularity} / 5 Popularity Rating</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <DollarSign className="w-4 h-4" />
              <span>Cost Level: ${'$$$$$'.slice(0, Math.round(city.costIndex))}</span>
            </div>

            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <MapPin className="w-4 h-4" />
              <span>Coordinates: {city.latitude}, {city.longitude}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Activities Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-400" /> Top Curated Activities in {city.name}
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {city.activities?.length || 0} Experiences Available
          </span>
        </div>

        {!city.activities || city.activities.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400">No activities listed for this city.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {city.activities.map((activity) => (
              <div
                key={activity.id}
                className="glass-card rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between group hover:border-sky-500/40 transition-all"
              >
                <div>
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={activity.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80'}
                      alt={activity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-sky-300 border border-sky-500/30">
                      {activity.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                        {activity.name}
                      </h3>
                      <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold shrink-0">
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
                      <span className="font-extrabold text-emerald-400">
                        Est. ${activity.estimatedCost}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to="/create-trip"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Trip Itinerary</span>
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
