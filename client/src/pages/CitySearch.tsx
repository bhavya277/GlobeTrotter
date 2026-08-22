import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { City, Trip } from '../types';
import {
  Search,
  MapPin,
  Filter,
  Bookmark,
  Star,
  DollarSign,
  ChevronRight,
  Plus,
  X,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export const CitySearch: React.FC = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [region, setRegion] = useState('all');
  const [minPopularity, setMinPopularity] = useState<number>(0);
  const [maxCost, setMaxCost] = useState<number>(5);
  const [sortBy, setSortBy] = useState('popularity');
  const [savedCityIds, setSavedCityIds] = useState<string[]>([]);

  // Add to Trip Modal State
  const [addToTripCity, setAddToTripCity] = useState<City | null>(null);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [stopStartDate, setStopStartDate] = useState('');
  const [stopEndDate, setStopEndDate] = useState('');
  const [addStopError, setAddStopError] = useState('');
  const [addStopSuccess, setAddStopSuccess] = useState('');

  const fetchCities = async () => {
    try {
      const res = await api.cities.getAll({
        search,
        country: country !== 'all' ? country : undefined,
        region: region !== 'all' ? region : undefined,
        minPopularity: minPopularity > 0 ? minPopularity : undefined,
        maxCost: maxCost < 5 ? maxCost : undefined,
        sortBy,
      });
      setCities(res.cities);
    } catch (err) {
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [search, country, region, minPopularity, maxCost, sortBy]);

  useEffect(() => {
    api.savedDestinations.getAll().then((res) => {
      setSavedCityIds(res.savedDestinations.map((c) => c.id));
    }).catch(() => {});
  }, []);

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

  const openAddToTripModal = async (city: City, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddToTripCity(city);
    setAddStopError('');
    setAddStopSuccess('');

    try {
      const res = await api.trips.getMyTrips();
      setUserTrips(res.trips);
      if (res.trips.length > 0) {
        setSelectedTripId(res.trips[0].id);
        const t = res.trips[0];
        setStopStartDate(new Date(t.startDate).toISOString().split('T')[0]);
        setStopEndDate(new Date(t.endDate).toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Failed to load trips for selection:', err);
    }
  };

  const handleAddStopToTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addToTripCity || !selectedTripId) return;

    setAddStopError('');
    setAddStopSuccess('');

    try {
      await api.trips.addStop(selectedTripId, {
        cityId: addToTripCity.id,
        startDate: stopStartDate,
        endDate: stopEndDate,
      });

      setAddStopSuccess(`Successfully added ${addToTripCity.name} to your trip!`);
      setTimeout(() => {
        setAddToTripCity(null);
        navigate(`/trip/${selectedTripId}/builder`);
      }, 1200);
    } catch (err: any) {
      setAddStopError(err.message || 'Failed to add stop to trip');
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
          Browse top travel cities across India & globally. Filter by popularity, region, and cost index (INR ₹).
        </p>

        {/* Search Input */}
        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city name, country (e.g., India, Japan, France)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input text-sm text-white placeholder-slate-500 shadow-xl"
          />
        </div>
      </div>

      {/* Advanced Filter Controls Row */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-bold text-slate-300">
          <Filter className="w-4 h-4 text-sky-400" />
          <span>Multi-Criteria Filters & Sorting</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white bg-slate-900"
            >
              <option value="all">All Regions</option>
              <option value="Asia">Asia</option>
              <option value="Europe">Europe</option>
              <option value="North America">North America</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white bg-slate-900"
            >
              <option value="all">All Countries</option>
              <option value="Japan">Japan</option>
              <option value="France">France</option>
              <option value="Italy">Italy</option>
              <option value="Indonesia">Indonesia</option>
              <option value="United States">United States</option>
              <option value="Spain">Spain</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Max Cost Level</label>
            <select
              value={maxCost}
              onChange={(e) => setMaxCost(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl glass-input text-white bg-slate-900"
            >
              <option value={5}>Any Cost Level</option>
              <option value={2}>Budget Friendly (₹₹)</option>
              <option value={3.5}>Moderate (₹₹₹)</option>
              <option value={4.5}>Luxury (₹₹₹₹₹)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-white bg-slate-900"
            >
              <option value="popularity">Most Popular ★</option>
              <option value="cost_asc">Cost: Low to High</option>
              <option value="cost_desc">Cost: High to Low</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>
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
          No cities found matching your filter criteria.
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
                      <span>Cost: {'₹₹₹₹₹'.slice(0, Math.round(city.costIndex))}</span>
                      <span className="text-sky-400 font-semibold">{city._count?.activities || 0} Activities</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => openAddToTripModal(city, e)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Trip</span>
                  </button>

                  <Link
                    to={`/cities/${city.id}`}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add City to Trip Modal */}
      {addToTripCity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-slate-800 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" /> Add {addToTripCity.name} as Trip Stop
              </h3>
              <button onClick={() => setAddToTripCity(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addStopError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                ⚠️ {addStopError}
              </div>
            )}

            {addStopSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {addStopSuccess}
              </div>
            )}

            {userTrips.length === 0 ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-xs text-slate-400">You don't have any active trips yet.</p>
                <Link
                  to="/create-trip"
                  className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-500"
                >
                  Create Trip First
                </Link>
              </div>
            ) : (
              <form onSubmit={handleAddStopToTrip} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Select Target Trip *
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => {
                      setSelectedTripId(e.target.value);
                      const t = userTrips.find((trip) => trip.id === e.target.value);
                      if (t) {
                        setStopStartDate(new Date(t.startDate).toISOString().split('T')[0]);
                        setStopEndDate(new Date(t.endDate).toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    {userTrips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Stop Arrival Date
                    </label>
                    <input
                      type="date"
                      required
                      value={stopStartDate}
                      onChange={(e) => setStopStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Stop Departure Date
                    </label>
                    <input
                      type="date"
                      required
                      value={stopEndDate}
                      onChange={(e) => setStopEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setAddToTripCity(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400"
                  >
                    Confirm & Add City Stop
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
