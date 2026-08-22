import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { City } from '../types';
import { Bookmark, MapPin, Star, Trash2, ChevronRight } from 'lucide-react';

export const SavedDestinations: React.FC = () => {
  const [savedCities, setSavedCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await api.savedDestinations.getAll();
      setSavedCities(res.savedDestinations);
    } catch (err) {
      console.error('Error fetching saved destinations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (cityId: string) => {
    try {
      await api.savedDestinations.toggle(cityId);
      setSavedCities(savedCities.filter((c) => c.id !== cityId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Saved <span className="gradient-text">Destinations</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Your bookmarked travel cities and bucket list places.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="glass-panel h-64 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : savedCities.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 space-y-3">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No saved destinations yet</h3>
          <p className="text-xs text-slate-500">Explore the cities catalog to bookmark your dream places.</p>
          <Link to="/cities" className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400">
            Browse Cities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedCities.map((city) => (
            <div key={city.id} className="glass-card rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between group">
              <div>
                <div className="h-44 relative overflow-hidden">
                  <img src={city.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80'} alt={city.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <button
                    onClick={() => handleRemove(city.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/80 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{city.name}</h3>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {city.popularity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{city.country} • {city.region}</p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/cities/${city.id}`}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-sky-600 border border-slate-700 flex items-center justify-center space-x-1"
                >
                  <span>Explore Attractions</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
