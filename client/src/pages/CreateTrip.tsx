import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { City } from '../types';
import {
  Calendar,
  DollarSign,
  Globe,
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Lock,
  Eye,
} from 'lucide-react';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
];

export const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBudget, setTotalBudget] = useState<number>(2000);
  const [currency, setCurrency] = useState('USD');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC' | 'UNLISTED'>('PRIVATE');
  const [selectedCover, setSelectedCover] = useState(COVER_IMAGES[0]);

  // Cities State
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set default dates (today + 14 days)
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 7);

    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(future.toISOString().split('T')[0]);

    api.cities.getAll().then((res) => setCities(res.cities)).catch(console.error);
  }, []);

  const toggleCitySelection = (id: string) => {
    if (selectedCityIds.includes(id)) {
      setSelectedCityIds(selectedCityIds.filter((cId) => cId !== id));
    } else {
      setSelectedCityIds([...selectedCityIds, id]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Trip name is required');
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.trips.create({
        name,
        description,
        startDate,
        endDate,
        totalBudget,
        currency,
        visibility,
        coverPhoto: selectedCover,
        cityIds: selectedCityIds,
      });

      navigate(`/trip/${data.trip.id}/builder`);
    } catch (err: any) {
      setError(err.message || 'Failed to create trip');
      setLoading(false);
    }
  };

  const filteredCities = cities.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.country.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mb-3 border border-sky-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Create New <span className="gradient-text">Trip</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Step {step} of 3 — {step === 1 ? 'Trip Details' : step === 2 ? 'Select Destinations' : 'Review & Launch'}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full mt-6 overflow-hidden max-w-md mx-auto">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" /> Basic Trip Details
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Trip Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-white text-base placeholder-slate-500"
              placeholder="e.g., Summer European Tour 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm placeholder-slate-500 resize-none"
              placeholder="What makes this trip special? Add goals, sights, or notes..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Estimated Total Budget
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm bg-slate-900"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Trip Visibility & Security
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setVisibility('PRIVATE')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  visibility === 'PRIVATE'
                    ? 'bg-sky-500/10 border-sky-500 text-white'
                    : 'glass-card border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                  <Lock className="w-4 h-4 text-sky-400" />
                  <span>Private (Only Me)</span>
                </div>
                <p className="text-xs text-slate-400">Strictly protected. Requires login ownership check.</p>
              </div>

              <div
                onClick={() => setVisibility('PUBLIC')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  visibility === 'PUBLIC'
                    ? 'bg-sky-500/10 border-sky-500 text-white'
                    : 'glass-card border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Public Shared Link</span>
                </div>
                <p className="text-xs text-slate-400">Generates shareable read-only link for friends.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  setError('Please enter a trip name');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors"
            >
              <span>Next: Select Destinations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: City Destinations Selection */}
      {step === 2 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" /> Select Cities for Trip Stops
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {selectedCityIds.length} cities selected. We will automatically create initial stop dates for you.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search city or country..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-2">
            {filteredCities.map((city) => {
              const isSelected = selectedCityIds.includes(city.id);
              return (
                <div
                  key={city.id}
                  onClick={() => toggleCitySelection(city.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3 ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500 text-white shadow-md shadow-sky-500/10'
                      : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={city.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=150&q=80'}
                    alt={city.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate">{city.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{city.country}</p>
                  </div>
                  {isSelected && <CheckCircle className="w-5 h-5 text-sky-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors"
            >
              <span>Next: Cover & Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Cover Image & Launch */}
      {step === 3 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Choose Cover Image & Finalize
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COVER_IMAGES.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCover(imgUrl)}
                className={`h-28 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                  selectedCover === imgUrl ? 'border-sky-500 ring-2 ring-sky-500/40' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Summary Preview Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-sm">
            <h3 className="text-base font-bold text-white">{name}</h3>
            <p className="text-xs text-slate-400">{description || 'No description added'}</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-300">
              <span>📅 {startDate} to {endDate}</span>
              <span>💰 Budget: ${totalBudget} {currency}</span>
              <span>📍 {selectedCityIds.length} Selected Stops</span>
              <span>🔒 {visibility}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleCreate}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/30 transition-all duration-200"
            >
              {loading ? <span>Creating Trip...</span> : (
                <>
                  <span>Launch Itinerary Builder</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
