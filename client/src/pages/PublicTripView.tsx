import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip } from '../types';
import { RouteVisualization } from '../components/RouteVisualization';
import { formatCurrency } from '../utils/formatters';
import {
  Share2,
  Copy,
  Check,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Globe,
  Sparkles,
  ExternalLink,
  Lock,
  AlertCircle,
  Twitter,
  MessageCircle,
} from 'lucide-react';

export const PublicTripView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copyingTrip, setCopyingTrip] = useState(false);

  useEffect(() => {
    if (token) {
      api.trips
        .getByShareToken(token)
        .then((res) => setTrip(res.trip))
        .catch((err) => setError(err.message || 'Shared itinerary not found or access denied.'))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyTripToAccount = async () => {
    if (!token) return;
    setCopyingTrip(true);
    try {
      const res = await api.trips.copy(token);
      alert('Trip copied successfully to your account!');
      navigate(`/trip/${res.trip.id}/builder`);
    } catch (err: any) {
      if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        alert('Please log in or sign up to copy this trip to your account!');
        navigate('/login');
      } else {
        alert(err.message || 'Failed to copy trip');
      }
    } finally {
      setCopyingTrip(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading shared itinerary...</div>;
  }

  if (error || !trip) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Itinerary Not Accessible</h2>
        <p className="text-sm text-slate-400">{error || 'This shared itinerary does not exist or has been set to private.'}</p>
        <Link to="/" className="inline-block px-5 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400">
          Back to GlobeTrotter Home
        </Link>
      </div>
    );
  }

  const shareUrl = window.location.href;
  const shareText = `Check out this amazing multi-city itinerary: ${trip.name} on GlobeTrotter!`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Shared Itinerary Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Public Read-Only View
              </span>
              <span className="text-xs text-slate-400">Planned by {trip.user?.name || 'Explorer'}</span>
            </div>
            <h1 className="text-3xl font-black text-white">{trip.name}</h1>
            <p className="text-xs text-slate-400">
              📅 {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()} • {trip.stops?.length || 0} Cities • Total Budget: {formatCurrency(trip.totalBudget || 0, trip.currency)}
            </p>
            {trip.stops && trip.stops.length > 0 && (
              <div className="pt-2">
                <RouteVisualization stops={trip.stops} variant="expanded" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleCopyTripToAccount}
              disabled={copyingTrip}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>{copyingTrip ? 'Copying...' : 'Copy Trip to My Account'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Social Sharing Actions Row */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Share with friends:</span>
          <div className="flex items-center space-x-3">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter / X</span>
            </a>
          </div>
        </div>
      </div>

      {/* Stops & Activities Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-400" /> Multi-City Expeditions & Scheduled Stops
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trip.stops?.map((stop, idx) => (
            <div key={stop.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 font-extrabold flex items-center justify-center text-xs border border-sky-500/20">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-extrabold text-white">{stop.city.name}, {stop.city.country}</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(stop.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(stop.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Scheduled Activities</h4>
                {stop.tripActivities && stop.tripActivities.length > 0 ? (
                  stop.tripActivities.map((act) => (
                    <div key={act.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{act.activity?.name || act.customName}</p>
                        <span className="text-[10px] text-slate-400">⏰ {act.startTime || '10:00'} - {act.endTime || '12:00'}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        ₹{(act.customCost ?? act.activity?.estimatedCost ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No scheduled activities for this stop.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
