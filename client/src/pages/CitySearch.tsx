import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { City } from '../types';
import {
  Search,
  MapPin,
  Filter,
  Bookmark,
  Star,
  DollarSign,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const CitySearch: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [savedCityIds, setSavedCityIds] = useState<string[]>([]);

  const fetchCities = async () => {
    try {
      const res = await api.cities.getAll({ search, region, sortBy });
      setCities(res.cities);
    } catch (err) {
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
    api.savedDestinations.getAll().then((res) => {
      setSavedCityIds(res.savedDestinations.map((c) => c.id));
    }).catch(() => {});
  }, [search, region, sortBy]);

  const handleToggleBookmark = async (cityId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.savedDestinations.toggle(cityId);
      if (res.saved) {
        setSavedCityIds([...savedCityIds, cityId]);
      } else {
        setSavedCityIds(savedCityIds.filter((id) => id !== cityId));
      }
    } catch (err) {
      console.error('Failed to bookmark city:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Hero */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 text-center max-w-3xl mx-auto relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mb-2 border border-sky-500/20">
          <MapPin className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white">
          Discover Global <span className="gradient-text">Destinations</span>
        </h1>
        <p className="text-sm text-slate-400">
          Browse top global travel cities, average costs, ratings, and curated activities.
        </p>

        {/* Big Search Input */}
        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city name, country, or region (e.g. Tokyo, France, Asia)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input text-sm text-white placeholder-slate-500 shadow-xl"
          />
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-300">Filter Region:</span>
          {['all', 'Asia', 'Europe', 'North America'].map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                region === r
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-300">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs text-white bg-slate-900"
          >
            <option value="popularity">Most Popular</option>
            <option value="cost_asc">Cost: Low to High</option>
            <option value="cost_desc">Cost: High to Low</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Cities Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel h-80 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : cities.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          No cities found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => {
            const isBookmarked = savedCityIds.includes(city.id);
            return (
              <div
                key={city.id}
                className="glass-card rounded-3xl overflow-hidden border border-slate-800 hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="h-52 relative overflow-hidden">
                    <img
                      src={city.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80'}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => handleToggleBookmark(city.id, e)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-amber-400 transition-colors"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-bold text-sky-300 border border-slate-700">
                      {city.region}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-extrabold text-white group-hover:text-sky-300 transition-colors">
                          {city.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{city.country}</p>
                      </div>
                      <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{city.popularity}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{city.description}</p>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                      <span>Cost Level: ${'$$$$$'.slice(0, Math.round(city.costIndex))}</span>
                      <span className="text-sky-400 font-semibold">{city._count?.activities || 0} Activities</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/cities/${city.id}`}
                    className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-sky-600 border border-slate-700 hover:border-sky-500 flex items-center justify-center space-x-2 transition-all"
                  >
                    <span>View Attractions & Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
