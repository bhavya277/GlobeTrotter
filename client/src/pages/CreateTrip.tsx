import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { City } from '../types';
import {
  Compass,
  Calendar,
  DollarSign,
  Image,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Globe,
  MapPin,
  Lock,
} from 'lucide-react';

export const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBudget, setTotalBudget] = useState<number>(50000);
  const [currency, setCurrency] = useState('INR');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [coverPhoto, setCoverPhoto] = useState(
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
  );
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.cities.getAll().then((res) => setAvailableCities(res.cities)).catch(console.error);
  }, []);

  const toggleCitySelection = (cityId: string) => {
    if (selectedCityIds.includes(cityId)) {
      setSelectedCityIds(selectedCityIds.filter((id) => id !== cityId));
    } else {
      setSelectedCityIds([...selectedCityIds, cityId]);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter a trip name (at least 2 characters).');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!startDate || !endDate) {
        setError('Please select both start and end dates.');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setError('End date cannot be before start date.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (totalBudget < 0) {
        setError('Budget cannot be negative.');
        return;
      }
      setStep(4);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.trips.create({
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        coverPhoto,
        visibility,
        totalBudget,
        currency,
        cityIds: selectedCityIds,
      });

      navigate(`/trip/${res.trip.id}/builder`);
    } catch (err: any) {
      setError(err.message || 'Failed to create trip.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Step Indicator */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-white">Start Your <span className="gradient-text">New Journey</span></h1>
        <p className="text-xs text-slate-400">Step-by-step trip creation wizard with automated budget setup.</p>

        {/* Wizard Progress Bar */}
        <div className="flex items-center justify-center space-x-3 pt-4">
          {[
            { num: 1, label: 'Journey Name' },
            { num: 2, label: 'Dates & Cities' },
            { num: 3, label: 'Budget & Visibility' },
            { num: 4, label: 'Review & Cover' },
          ].map((s) => (
            <div key={s.num} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s.num
                    ? 'bg-sky-500 text-white ring-4 ring-sky-500/20'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-navy-800 text-slate-400 border border-white/10'
                }`}
              >
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step === s.num ? 'text-white' : 'text-slate-500'}`}>
                {s.label}
              </span>
              {s.num < 4 && <span className="text-slate-700 font-bold px-1">/</span>}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Name Your Journey */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-sky-400" /> Name Your Journey
            </h2>
            <p className="text-xs text-slate-400">Give your trip a memorable title (e.g., "Golden Triangle India Expedition").</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Trip Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Rajasthan & Goa Beaches"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Trip Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Describe your travel goals, highlights, or group members..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white resize-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              <span>Next: Dates & Cities</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Choose Dates & Initial Cities */}
      {step === 2 && (
        <form onSubmit={handleNextStep} className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-turquoise-400" /> Travel Dates & Destination Cities
            </h2>
            <p className="text-xs text-slate-400">Set overall start and end dates, and select initial cities to visit.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-300 uppercase">Select Cities to Include (Optional)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
              {availableCities.map((city) => {
                const isSelected = selectedCityIds.includes(city.id);
                return (
                  <button
                    type="button"
                    key={city.id}
                    onClick={() => toggleCitySelection(city.id)}
                    className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-500 text-white font-bold'
                        : 'bg-navy-850 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{city.name}</p>
                      <p className="text-[10px] text-slate-400">{city.country}</p>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-sky-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              <span>Next: Budget Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Budget & Visibility */}
      {step === 3 && (
        <form onSubmit={handleNextStep} className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-coral-500" /> Total Target Budget & Privacy
            </h2>
            <p className="text-xs text-slate-400">Set total expected spending cap in Indian Rupee (INR ₹).</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Total Target Budget (INR ₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Trip Privacy Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white bg-navy-900"
              >
                <option value="PRIVATE">Private (Only Accessible By Me)</option>
                <option value="PUBLIC">Public (Accessible via Unique Link)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              <span>Next: Review & Cover</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Cover Image Preview & Final Confirmation */}
      {step === 4 && (
        <form onSubmit={handleFinalSubmit} className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-amber-400" /> Cover Photo & Final Confirmation
            </h2>
            <p className="text-xs text-slate-400">Review your trip details and choose a cover photo background.</p>
          </div>

          {/* Live Cover Preview Card */}
          <div className="h-44 rounded-2xl overflow-hidden relative border border-white/10">
            <img src={coverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-black text-white">{name}</h3>
              <p className="text-xs text-slate-300">
                📅 {startDate} to {endDate} • Budget: ₹{totalBudget.toLocaleString()} INR (₹)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Cover Image URL</label>
            <input
              type="url"
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/25"
            >
              <span>{loading ? 'Creating Trip...' : 'Create Trip & Build Itinerary'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
