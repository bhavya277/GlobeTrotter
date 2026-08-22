import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Globe, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.auth.login(email, password);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoUser = () => {
    setEmail('alex@globetrotter.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800 relative z-10">
        <div className="text-center space-y-3">
          <img src="/logo.png" alt="GlobeTrotter Logo" className="h-16 w-auto mx-auto rounded-2xl shadow-lg shadow-sky-500/20" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back to <span className="gradient-text">GlobeTrotter</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Log in to continue building your personalized travel adventures.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Demo login shortcut box */}
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sky-300">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Try quick demo account</span>
          </div>
          <button
            type="button"
            onClick={fillDemoUser}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-colors border border-sky-400/30"
          >
            Autofill Demo
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500"
                placeholder="alex@globetrotter.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
