import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Trash2,
  Lock,
  Activity,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
      ]);

      setStatsData(statsRes);
      setUsersList(usersRes.users);
    } catch (err: any) {
      console.error('Error loading admin dashboard:', err);
      setError(err.message || 'Access denied. Admin privileges required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.admin.updateUserRole(userId, newRole);
      setUsersList(usersList.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}" and all associated data?`)) {
      try {
        await api.admin.deleteUser(userId);
        setUsersList(usersList.filter((u) => u.id !== userId));
      } catch (err: any) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading admin analytics dashboard...</div>;
  }

  if (error || !statsData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Admin Access Restricted</h2>
        <p className="text-sm text-slate-400">{error || 'Server authorization failed. Only users with ADMIN role can access this page.'}</p>
      </div>
    );
  }

  const { stats, popularCities, popularActivities } = statsData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900/80 to-slate-950/30 space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">System Admin & Analytics Dashboard</h1>
            <p className="text-xs text-slate-400">Real-time system telemetry, engagement analytics, and user role management.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Total Users <Users className="w-4 h-4 text-sky-400" />
          </span>
          <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Total Trips <Calendar className="w-4 h-4 text-indigo-400" />
          </span>
          <p className="text-2xl font-black text-white">{stats.totalTrips}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Global Cities <Globe className="w-4 h-4 text-emerald-400" />
          </span>
          <p className="text-2xl font-black text-white">{stats.totalCities}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Activities Catalog <Activity className="w-4 h-4 text-amber-400" />
          </span>
          <p className="text-2xl font-black text-white">{stats.totalActivities}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            Logged Expenses <DollarSign className="w-4 h-4 text-purple-400" />
          </span>
          <p className="text-2xl font-black text-purple-400">{stats.totalExpenses}</p>
        </div>
      </div>

      {/* Analytics Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Cities Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" /> Top Booked Destinations (Stops Count)
          </h3>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularCities}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="cityName" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="stopCount" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Activities Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Top Scheduled Activities
          </h3>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularActivities}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="scheduledCount" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Registered Users & Role Management ({usersList.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="pb-3 px-2">User</th>
                <th className="pb-3 px-2">Email</th>
                <th className="pb-3 px-2">Role</th>
                <th className="pb-3 px-2">Joined Date</th>
                <th className="pb-3 px-2">Trips Count</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/50">
                  <td className="py-3 px-2 font-bold text-white flex items-center space-x-2">
                    <img src={u.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-2 text-slate-400">{u.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-2 font-bold text-sky-400">{u._count?.trips || 0}</td>
                  <td className="py-3 px-2 text-right space-x-2">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]"
                    >
                      {u.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
                    </button>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
