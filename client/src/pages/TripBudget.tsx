import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Trip, Expense, ExpenseSummary } from '../types';
import {
  PieChart as PieIcon,
  BarChart as BarIcon,
  DollarSign,
  Plus,
  Trash2,
  ArrowLeft,
  TrendingDown,
  AlertCircle,
  Receipt,
  Layers,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  Accommodation: '#38bdf8', // sky-400
  Transport: '#818cf8',     // indigo-400
  Food: '#f59e0b',          // amber-500
  Activities: '#10b981',    // emerald-500
  Shopping: '#ec4899',      // pink-500
  Miscellaneous: '#94a3b8', // slate-400
};

export const TripBudget: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Expense Form State
  const [category, setCategory] = useState<'Accommodation' | 'Transport' | 'Food' | 'Activities' | 'Shopping' | 'Miscellaneous'>('Food');
  const [amount, setAmount] = useState<number>(50);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStopId, setSelectedStopId] = useState<string>('');

  const fetchBudgetData = async () => {
    if (!id) return;
    try {
      const [tripRes, expenseRes] = await Promise.all([
        api.trips.getById(id),
        api.expenses.getByTrip(id),
      ]);
      setTrip(tripRes.trip);
      setExpenses(expenseRes.expenses);
      setSummary(expenseRes.summary);
    } catch (err) {
      console.error('Error fetching budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !description.trim() || amount <= 0) return;

    try {
      await api.expenses.create({
        tripId: id,
        tripStopId: selectedStopId || undefined,
        category,
        amount,
        description,
        date,
      });
      setDescription('');
      setAmount(50);
      fetchBudgetData();
    } catch (err: any) {
      alert(err.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await api.expenses.delete(expenseId);
      fetchBudgetData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  if (loading || !trip || !summary) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading budget breakdown...</div>;
  }

  // Format Recharts Pie Data
  const pieData = Object.keys(summary.categoryBreakdown).map((cat) => ({
    name: cat,
    value: summary.categoryBreakdown[cat],
  }));

  // Format Recharts Bar Data
  const barData = [
    {
      name: 'Budget vs Actual',
      AllocatedBudget: summary.totalBudget,
      TotalExpenses: summary.totalExpense,
    },
  ];

  const budgetUsedPercentage = Math.min(100, Math.round((summary.totalExpense / (summary.totalBudget || 1)) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold mb-1">
            <Link to={`/trip/${trip.id}/builder`} className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Itinerary Builder
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{trip.name} — Financial Budget</h1>
          <p className="text-xs text-slate-400">Real-time expense tracking & visual financial analytics</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Budget</span>
            <span className="text-xl font-black text-white">${summary.totalBudget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Allocated Budget</span>
            <DollarSign className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-white">${summary.totalBudget.toLocaleString()}</p>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-sky-500 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Logged Expenses</span>
            <Receipt className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">${summary.totalExpense.toLocaleString()}</p>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full ${budgetUsedPercentage > 90 ? 'bg-rose-500' : 'bg-amber-400'}`}
              style={{ width: `${budgetUsedPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Remaining Balance</span>
            <TrendingDown className="w-5 h-5 text-emerald-400" />
          </div>
          <p className={`text-3xl font-black ${summary.remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${summary.remainingBudget.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {summary.remainingBudget >= 0 ? `${100 - budgetUsedPercentage}% remaining` : 'Over budget limits'}
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Pie Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-sky-400" /> Expenses by Category
          </h3>

          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No expenses recorded yet to render chart.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#38bdf8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                    formatter={(value: any) => [`$${value}`, 'Amount']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Budget vs Actual Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarIcon className="w-5 h-5 text-indigo-400" /> Budget vs Actual Spend
          </h3>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  formatter={(value: any) => [`$${value}`, '']}
                />
                <Legend />
                <Bar dataKey="AllocatedBudget" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="TotalExpenses" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Log Expense Form & Transactions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Add New Expense */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" /> Log Expense
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Shinjuku Prince Hotel"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
                >
                  <option value="Accommodation">Accommodation</option>
                  <option value="Transport">Transport</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Activities">Activities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>

            {trip.stops && trip.stops.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Associated City Stop (Optional)
                </label>
                <select
                  value={selectedStopId}
                  onChange={(e) => setSelectedStopId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
                >
                  <option value="">General Trip Expense</option>
                  {trip.stops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.city.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all"
            >
              Add Expense Item
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Logged Expenses Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-400" /> Expense History ({expenses.length})
          </h3>

          {expenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No logged expenses recorded for this trip.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase">
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                    <th className="py-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/50 text-slate-200">
                      <td className="py-3 px-2 font-bold text-white">{exp.description}</td>
                      <td className="py-3 px-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[exp.category]}20`,
                            color: CATEGORY_COLORS[exp.category],
                            border: `1px solid ${CATEGORY_COLORS[exp.category]}40`,
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-400">
                        ${exp.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
