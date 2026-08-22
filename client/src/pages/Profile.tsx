import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { City } from '../types';
import {
  User as UserIcon,
  Mail,
  Lock,
  Globe,
  DollarSign,
  Camera,
  CheckCircle,
  AlertCircle,
  Bookmark,
  Trash2,
  AlertTriangle,
  X,
  Shield,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [defaultCurrency, setDefaultCurrency] = useState(user?.defaultCurrency || 'INR');

  const [savedCities, setSavedCities] = useState<City[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Delete Account Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setProfilePhoto(user.profilePhoto || '');
      setBio(user.bio || '');
      setLanguage(user.language || 'en');
      setDefaultCurrency(user.defaultCurrency || 'INR');
    }

    api.savedDestinations.getAll().then((res) => {
      setSavedCities(res.savedDestinations);
    }).catch(() => {});
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await api.users.updateProfile({
        name,
        email,
        profilePhoto,
        bio,
        language,
        defaultCurrency,
      });

      updateUser(res.user);
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedCity = async (cityId: string) => {
    try {
      await api.savedDestinations.toggle(cityId);
      setSavedCities(savedCities.filter((c) => c.id !== cityId));
    } catch (err) {
      console.error('Failed to remove saved city:', err);
    }
  };

  const handleDeleteAccountConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (confirmDeleteText !== 'DELETE') {
      setDeleteError('You must type DELETE in all uppercase to confirm.');
      return;
    }

    setDeleting(true);

    try {
      await api.users.deleteAccount(confirmDeleteText);
      logout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-2 text-center relative overflow-hidden">
        <h1 className="text-3xl font-black text-white">Account <span className="gradient-text">Settings & Profile</span></h1>
        <p className="text-sm text-slate-400">Manage your profile details, currency preferences, saved destinations, and security settings.</p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleUpdateProfile} className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-800">
          <div className="relative group shrink-0">
            <img
              src={profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={name}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-sky-500/30 shadow-2xl"
            />
            <label
              htmlFor="profile-file-input"
              className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity text-xs font-bold gap-1"
            >
              <Camera className="w-4 h-4" /> Change
            </label>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Upload Photo from Device Files
              </label>
              <input
                id="profile-file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                    if (!validTypes.includes(file.type.toLowerCase())) {
                      setError('Only JPG, JPEG, PNG, and WebP images are allowed.');
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Profile image size must be less than 5MB.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      if (reader.result) {
                        try {
                          const res = await api.upload.uploadImage(reader.result as string);
                          setProfilePhoto(res.url);
                        } catch (err: any) {
                          setError(err.message || 'Failed to upload profile photo');
                        }
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-500 file:text-white hover:file:bg-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Or Image URL
              </label>
              <div className="relative">
                <Camera className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="url"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name *</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Bio / Travel Philosophy</label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fellow explorers about your travel interests..."
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Default Currency Preference</label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
            >
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Language Preference</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
            >
              <option value="en">English (US)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="fr">French (Français)</option>
              <option value="es">Spanish (Español)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/20"
          >
            {loading ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>

      {/* Saved Destinations List */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-400" /> Bookmarked & Saved Destinations ({savedCities.length})
        </h2>

        {savedCities.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No saved destinations yet. Bookmark cities from City Discovery!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {savedCities.map((city) => (
              <div key={city.id} className="glass-card p-3 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <img src={city.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=100&q=80'} alt={city.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{city.name}</p>
                    <p className="text-[10px] text-slate-400">{city.country}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSavedCity(city.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400"
                  title="Remove saved city"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 bg-rose-950/10 space-y-4">
        <div className="flex items-center space-x-3 text-rose-400">
          <Shield className="w-6 h-6" />
          <div>
            <h3 className="text-base font-bold text-white">Danger Zone: Delete Account</h3>
            <p className="text-xs text-slate-400">Permanently remove your profile and all associated travel itineraries.</p>
          </div>
        </div>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20"
        >
          Permanently Delete Account
        </button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-rose-500/40 relative text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
            <p className="text-xs text-slate-300">
              This action is permanent and irreversible. All your trips, multi-city itineraries, and budget logs will be completely removed.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                ⚠️ {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccountConfirm} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Type <span className="font-bold text-rose-400 font-mono">DELETE</span> to confirm *
                </label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white uppercase"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20"
                >
                  {deleting ? 'Deleting Account...' : 'Confirm Permanent Deletion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
