import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, IndianRupee, Coins, FileText, TrendingUp, ArrowUpRight, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API}/admin/stats`);
      setStats(data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load stats. Ensure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const kpis = stats ? [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), sub: `+${stats.newUsersThisWeek} this week`, icon: Users, color: 'blue' },
    { label: 'Total Revenue', value: formatINR(stats.totalRevenue), sub: `${formatINR(stats.monthRevenue)} this month`, icon: IndianRupee, color: 'green' },
    { label: 'Credits Sold', value: stats.creditsSold.toLocaleString(), sub: `${stats.totalTransactions} transactions`, icon: Coins, color: 'yellow' },
    { label: 'Files Stored', value: stats.totalFiles.toLocaleString(), sub: 'Active files', icon: FileText, color: 'purple' },
  ] : [];

  const bgColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time KolomFlow platform overview.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link to="/admin/users" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Users className="w-4 h-4" /> Manage Users
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-100 rounded w-3/4"></div>
            </div>
          ))
        ) : (
          kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${bgColors[kpi.color]}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <ArrowUpRight size={14} /> Live
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-extrabold text-gray-900">{kpi.value}</h3>
                <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Plan Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Users by Plan</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse"></div>)}</div>
          ) : (
            <div className="space-y-4">
              {(stats?.planBreakdown || []).map(({ _id: plan, count }) => {
                const planColors = { free: 'bg-gray-400', basic: 'bg-blue-500', pro: 'bg-indigo-500', elite: 'bg-amber-500' };
                const total = stats?.totalUsers || 1;
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{plan}</span>
                      <span className="text-gray-500">{count} users</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-full rounded-full ${planColors[plan] || 'bg-gray-400'}`}
                        style={{ width: `${Math.round((count / total) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">Recent Signups</h3>
            <Link to="/admin/users" className="text-xs text-indigo-600 font-medium hover:text-indigo-800">View all →</Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>)
            ) : (
              (stats?.recentUsers || []).map(user => (
                <div key={user._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs capitalize bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">{user.plan}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>)
            ) : (stats?.recentPayments || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No payments yet.</p>
            ) : (
              (stats?.recentPayments || []).map(p => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">{p.userId?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{p.credits} credits</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">+{formatINR(p.amount / 100)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
