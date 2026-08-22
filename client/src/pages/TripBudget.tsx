import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip, Expense } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  ArrowLeft,
  PieChart as PieIcon,
  TrendingUp,
  Calendar,
  Building2,
  Utensils,
  Car,
  Ticket,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';

interface ExpenseSummaryData {
  summary: {
    currency: string;
    totalBudget: number;
    totalTripCost: number;
    totalLoggedCost: number;
    activityTotalCost: number;
    remainingBudget: number;
    isOverBudget: boolean;
    overBudgetAmount: number;
    topExcessCategory: string;
    totalDays: number;
    averageDailyCost: number;
    targetDailyBudget: number;
    overBudgetDaysCount: number;
  };
  categoryTotals: Record<string, number>;
  dailyBreakdown: Array<{
    dateStr: string;
    cost: number;
    isOverBudget: boolean;
    targetBudget: number;
  }>;
  cityBreakdown: Array<{
    stopId: string;
    cityName: string;
    activitiesCost: number;
    loggedExpensesCost: number;
    totalCost: number;
  }>;
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Transport: '#38bdf8',
  Stay: '#818cf8',
  Activities: '#34d399',
  Meals: '#fbbf24',
  Shopping: '#f472b6',
  Other: '#a78bfa',
};

export const TripBudget: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [budgetData, setBudgetData] = useState<ExpenseSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Expense Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<'Transport' | 'Stay' | 'Activities' | 'Meals' | 'Shopping' | 'Other'>('Meals');
  const [expenseAmount, setExpenseAmount] = useState<number>(500);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseStopId, setExpenseStopId] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchBudgetDetails = async () => {
    if (!id) return;
    try {
      const [tripRes, summaryRes] = await Promise.all([
        api.trips.getById(id),
        api.expenses.getByTrip(id),
      ]);

      setTrip(tripRes.trip);
      setBudgetData(summaryRes);

      if (summaryRes.dailyBreakdown.length > 0 && !expenseDate) {
        setExpenseDate(summaryRes.dailyBreakdown[0].dateStr);
      }
    } catch (err) {
      console.error('Error fetching trip budget details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetDetails();
  }, [id]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !expenseDescription.trim()) return;

    setModalError('');

    try {
      await api.expenses.create({
        tripId: id,
        tripStopId: expenseStopId || undefined,
        category: expenseCategory,
        amount: expenseAmount,
        currency: trip?.currency || 'INR',
        description: expenseDescription,
        date: expenseDate,
      });

      setIsAddModalOpen(false);
      setExpenseDescription('');
      await fetchBudgetDetails();
    } catch (err: any) {
      setModalError(err.message || 'Failed to log expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this logged expense?')) {
      try {
        await api.expenses.delete(expenseId);
        await fetchBudgetDetails();
      } catch (err) {
        console.error('Failed to delete expense:', err);
      }
    }
  };

  if (loading || !trip || !budgetData) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading budget engine...</div>;
  }

  const { summary, categoryTotals, dailyBreakdown, cityBreakdown, expenses } = budgetData;

  // Prepare chart data objects dynamically from DB
  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  })).filter((item) => item.value > 0);

  const dailyChartData = dailyBreakdown.map((d) => ({
    date: new Date(d.dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    ActualCost: d.cost,
    TargetBudget: Math.round(d.targetBudget),
  }));

  const cityChartData = cityBreakdown.map((c) => ({
    city: c.cityName,
    Activities: c.activitiesCost,
    Expenses: c.loggedExpensesCost,
    Total: c.totalCost,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold">
            <Link to="/my-trips" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> My Trips
            </Link>
            <span>/</span>
            <span className="text-slate-400">{trip.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{trip.name} — Real Budget Calculation Engine</h1>
          <p className="text-xs text-slate-400">
            Automated cost tracking in INR (₹) derived from scheduled activity costs & logged expense records.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Expense</span>
        </button>
      </div>

      {/* OVER-BUDGET ALERT WARNING BANNER (Phase 8 Mandatory Rule) */}
      {summary.isOverBudget && (
        <div className="glass-panel p-6 rounded-3xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-amber-950/30 text-white space-y-3 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-300">
                  ⚠️ ₹{summary.overBudgetAmount.toLocaleString()} over budget
                </h3>
                <p className="text-xs text-slate-300">
                  Trip Budget: <span className="font-bold text-white">₹{summary.totalBudget.toLocaleString()}</span> • Total Estimated/Actual Cost: <span className="font-bold text-rose-400">₹{summary.totalTripCost.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              🔍 Excess Budget Origin: Primary overrun source is <span className="font-bold text-amber-400">{summary.topExcessCategory}</span> (₹{categoryTotals[summary.topExcessCategory]?.toLocaleString()}).
            </span>
            <span className="text-rose-400 font-bold">
              {summary.overBudgetDaysCount} / {summary.totalDays} Days Exceeded Daily Target
            </span>
          </div>
        </div>
      )}

      {/* Budget Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Trip Budget</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">₹{summary.totalBudget.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">Allocated limit in INR (₹)</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Trip Cost</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className={`text-2xl font-black ${summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
            ₹{summary.totalTripCost.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Activities + Logged Expenses</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{summary.isOverBudget ? 'Over Budget' : 'Remaining Budget'}</span>
            <CheckCircle className={`w-4 h-4 ${summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <p className={`text-2xl font-black ${summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
            {summary.isOverBudget ? `+₹${summary.overBudgetAmount.toLocaleString()}` : `₹${summary.remainingBudget.toLocaleString()}`}
          </p>
          <p className="text-[11px] text-slate-500">{summary.isOverBudget ? 'Exceeds budget cap' : 'Available balance'}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Average Daily Cost</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">₹{Math.round(summary.averageDailyCost).toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">Target: ₹{Math.round(summary.targetDailyBudget).toLocaleString()} / day</p>
        </div>
      </div>

      {/* Dynamic Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown (Pie / Donut Chart) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-sky-400" /> Expense Category Distribution (INR ₹)
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Cost']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Spending Trend vs Target Daily Budget (Line Chart) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> Daily Cost Trend vs Target Budget
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Cost']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="ActualCost" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="TargetBudget" stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* City Stop Cost Comparison Bar Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" /> City Stop Cost Breakdown (INR ₹)
        </h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="city" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Cost']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="Activities" fill="#34d399" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expenses" fill="#fbbf24" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Logged Expenses Data Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Logged Trip Expenses ({expenses.length})</h3>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Log Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">No individual expenses logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Description</th>
                  <th className="pb-3 px-2">Amount (₹)</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-2">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-sky-400 border border-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium text-white">{e.description}</td>
                    <td className="py-3 px-2 font-bold text-emerald-400">₹{e.amount.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-slate-800 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" /> Log Trip Expense
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Express Train Ticket to Jaipur"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    <option value="Transport">Transport</option>
                    <option value="Stay">Stay (Hotel)</option>
                    <option value="Activities">Activities</option>
                    <option value="Meals">Meals</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">City Stop (Optional)</label>
                  <select
                    value={expenseStopId}
                    onChange={(e) => setExpenseStopId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    <option value="">General Trip Expense</option>
                    {trip.stops?.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400"
                >
                  Save & Update Charts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
