import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, UserX, UserCheck, Crown, Trash2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../utils/api';

const API = API_BASE;
axios.defaults.withCredentials = true;

const PLAN_BADGE = {
  free: 'bg-gray-100 text-gray-600',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-indigo-100 text-indigo-700',
  elite: 'bg-amber-100 text-amber-700',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterBanned, setFilterBanned] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [planModal, setPlanModal] = useState(null); // { userId, currentPlan }
  const [newPlan, setNewPlan] = useState('free');
  const [creditsBonus, setCreditsBonus] = useState(0);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterPlan) params.plan = filterPlan;
      if (filterBanned !== '') params.isBanned = filterBanned;

      const { data } = await axios.get(`${API}/admin/users`, { params });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch users.');
    } finally {
      setLoading(false);
    }
  }, [search, filterPlan, filterBanned]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleBan = async (userId) => {
    setActionLoading(userId + '_ban');
    try {
      const { data } = await axios.patch(`${API}/admin/users/${userId}/ban`);
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: data.isBanned } : u));
    } catch (err) { alert(err.response?.data?.message || 'Action failed.'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Permanently delete this user and their files? This cannot be undone.')) return;
    setActionLoading(userId + '_del');
    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
    finally { setActionLoading(null); }
  };

  const handleUpdatePlan = async () => {
    if (!planModal) return;
    setActionLoading(planModal.userId + '_plan');
    try {
      const { data } = await axios.patch(`${API}/admin/users/${planModal.userId}/plan`, {
        plan: newPlan,
        creditsBonus: Number(creditsBonus),
      });
      setUsers(users.map(u => u._id === planModal.userId ? { ...u, plan: data.user.plan, credits: data.user.credits } : u));
      setPlanModal(null);
    } catch (err) { alert(err.response?.data?.message || 'Plan update failed.'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{pagination.total.toLocaleString()} total users registered.</p>
        </div>
        <button onClick={() => fetchUsers(pagination.page)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <select value={filterBanned} onChange={e => setFilterBanned(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-3/4"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-12"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-14"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name} {user.role === 'admin' && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded ml-1">Admin</span>}</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_BADGE[user.plan] || PLAN_BADGE.free}`}>{user.plan}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-medium">{user.credits.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    {user.isBanned
                      ? <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Banned</span>
                      : <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active</span>
                    }
                  </td>
                  <td className="py-4 px-4 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setPlanModal({ userId: user._id, currentPlan: user.plan }); setNewPlan(user.plan); setCreditsBonus(0); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Plan"
                      >
                        <Crown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleBan(user._id)}
                        disabled={actionLoading === user._id + '_ban' || user.role === 'admin'}
                        className={`p-2 rounded-lg transition-colors ${user.isBanned ? 'text-green-500 hover:bg-green-50' : 'text-orange-400 hover:bg-orange-50'} disabled:opacity-40`}
                        title={user.isBanned ? 'Unban User' : 'Ban User'}
                      >
                        {user.isBanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        disabled={actionLoading === user._id + '_del' || user.role === 'admin'}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Edit Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Update User Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Plan</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Credits (optional)</label>
                <input type="number" min="0" value={creditsBonus} onChange={e => setCreditsBonus(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPlanModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdatePlan} disabled={actionLoading?.endsWith('_plan')} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {actionLoading?.endsWith('_plan') ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
