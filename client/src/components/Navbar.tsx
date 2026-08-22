import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  MapPin,
  Calendar,
  Bookmark,
  User as UserIcon,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Globe,
  Settings,
  ShieldAlert,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-400 to-coral-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <Globe className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Globe<span className="gradient-text">Trotter</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/cities"
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/cities')
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <MapPin className="w-4 h-4 text-turquoise-400" />
                <span>Explore Cities</span>
              </Link>
              <Link
                to="/activities"
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/activities')
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Activities</span>
              </Link>
              <Link
                to="/my-trips"
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/my-trips')
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>My Trips</span>
              </Link>
              <Link
                to="/saved"
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/saved')
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bookmark className="w-4 h-4 text-coral-500" />
                <span>Saved</span>
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/admin')
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm'
                      : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          )}

          {/* Right Action Section */}
          <div className="hidden md:flex items-center space-x-4 shrink-0">
            {user ? (
              <>
                <Link
                  to="/create-trip"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/20 transition-all duration-200 hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Plan New Trip</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2.5 p-1.5 rounded-full hover:bg-white/5 transition-colors border border-white/10"
                  >
                    <img
                      src={user.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/40"
                    />
                    <span className="text-xs font-bold text-slate-200 max-w-[110px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-2xl py-2 border border-white/10 z-50 space-y-1"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-white/10">
                        <p className="text-xs font-bold text-white">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5"
                      >
                        <Settings className="w-4 h-4 text-sky-400" />
                        <span>Profile & Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs font-bold text-coral-500 hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/20 transition-all duration-200"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-white/10 px-4 pt-2 pb-6 space-y-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
              >
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/cities"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
              >
                <MapPin className="w-4 h-4 text-turquoise-400" />
                <span>Explore Cities</span>
              </Link>
              <Link
                to="/activities"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Explore Activities</span>
              </Link>
              <Link
                to="/my-trips"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>My Trips</span>
              </Link>
              <Link
                to="/create-trip"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Plan a Trip</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
              >
                <UserIcon className="w-4 h-4 text-coral-500" />
                <span>Profile Settings</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-coral-500 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl text-xs font-extrabold text-white bg-sky-500 shadow-md shadow-sky-500/20"
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Phase 21) */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl flex items-center justify-around py-2 px-3">
          <Link to="/dashboard" aria-label="Dashboard" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${isActive('/dashboard') ? 'text-sky-400' : 'text-slate-400'}`}>
            <Compass className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link to="/my-trips" aria-label="My Trips" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${isActive('/my-trips') ? 'text-sky-400' : 'text-slate-400'}`}>
            <Calendar className="w-5 h-5" />
            <span>Trips</span>
          </Link>
          <Link to="/create-trip" aria-label="Plan a Trip" className="flex flex-col items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30 -mt-5 border-2 border-slate-950 hover:scale-105 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </Link>
          <Link to="/cities" aria-label="Explore Destinations" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${isActive('/cities') ? 'text-sky-400' : 'text-slate-400'}`}>
            <MapPin className="w-5 h-5" />
            <span>Explore</span>
          </Link>
          <Link to="/profile" aria-label="Profile Settings" className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${isActive('/profile') ? 'text-sky-400' : 'text-slate-400'}`}>
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </div>
      )}
    </header>
  );
};
