import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, UserX, UserCheck, Crown, Trash2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Shield, Coins, History, MessageSquare, Activity } from 'lucide-react';

const API = `http://${window.location.hostname}:5000/api`;
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

  const [creditModal, setCreditModal] = useState(null); // { userId, currentCredits }
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [creditAction, setCreditAction] = useState('add_remove');

  const [historyModal, setHistoryModal] = useState(null); // { userId, userName }
  const [historyTab, setHistoryTab] = useState('tasks'); // 'tasks' or 'chats'
  const [userHistory, setUserHistory] = useState({ transactions: [], chats: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const handleUpdateCredits = async () => {
    if (!creditModal || !creditAmount) return;
    setActionLoading(creditModal.userId + '_cred');
    try {
      const { data } = await axios.patch(`${API}/admin/users/${creditModal.userId}/credits`, {
        action: creditAction,
        amount: Number(creditAmount),
        reason: creditReason,
      });
      setUsers(users.map(u => u._id === creditModal.userId ? { ...u, credits: data.credits } : u));
      setCreditModal(null);
    } catch (err) { alert(err.response?.data?.message || 'Credit update failed.'); }
    finally { setActionLoading(null); }
  };

  const handleToggleRole = async (userId) => {
    if (!confirm('Are you sure you want to toggle this user\'s admin status?')) return;
    setActionLoading(userId + '_role');
    try {
      const { data } = await axios.patch(`${API}/admin/users/${userId}/role`);
      setUsers(users.map(u => u._id === userId ? { ...u, role: data.role } : u));
    } catch (err) { alert(err.response?.data?.message || 'Role update failed.'); }
    finally { setActionLoading(null); }
  };

  const handleOpenHistory = async (user) => {
    setHistoryModal({ userId: user._id, userName: user.name });
    setHistoryTab('tasks');
    setHistoryLoading(true);
    try {
      const [txRes, chatRes] = await Promise.all([
        axios.get(`${API}/admin/users/${user._id}/transactions`),
        axios.get(`${API}/admin/users/${user._id}/chats`)
      ]);
      setUserHistory({ transactions: txRes.data.transactions, chats: chatRes.data.chats });
    } catch (err) {
      alert('Could not fetch user history');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          <option value="pro">Pro</option>
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
                        onClick={() => { setCreditModal({ userId: user._id, currentCredits: user.credits }); setCreditAmount(''); setCreditReason(''); setCreditAction('add_remove'); }}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Add/Remove/Set Credits"
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenHistory(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View History & Chats"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleRole(user._id)}
                        disabled={actionLoading === user._id + '_role'}
                        className={`p-2 rounded-lg transition-colors ${user.role === 'admin' ? 'text-purple-600 hover:bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'} disabled:opacity-40`}
                        title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      >
                        <Shield className="w-4 h-4" />
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
                  <option value="pro">Pro</option>
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

      {/* Credit Edit Modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Credits</h3>
            <p className="text-sm text-gray-500 mb-6">Current Balance: {creditModal.currentCredits} cr</p>
            <div className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setCreditAction('add_remove')} 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${creditAction === 'add_remove' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >Add / Deduct</button>
                <button 
                  onClick={() => setCreditAction('set')} 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${creditAction === 'set' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >Set Exact Balance</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {creditAction === 'set' ? 'New Balance Amount' : 'Amount to Add/Remove'}
                </label>
                <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={creditAction === 'set' ? 'e.g., 500' : 'Use negative for deductions (e.g., -50)'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                <input type="text" value={creditReason} onChange={e => setCreditReason(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Refund, Bonus, Manual adjustment" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreditModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateCredits} disabled={actionLoading?.endsWith('_cred') || !creditAmount} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {actionLoading?.endsWith('_cred') ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History & Chats Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">User History: {historyModal.userName}</h3>
                <p className="text-sm text-gray-500 mt-1">View task transactions and AI mentor chat logs.</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <Trash2 className="w-5 h-5 opacity-0 pointer-events-none" /> {/* Placeholder spacing */}
                <span className="absolute right-6 top-6 cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded-full" onClick={() => setHistoryModal(null)}>X</span>
              </button>
            </div>
            
            <div className="flex border-b border-gray-200 bg-gray-50 px-6">
              <button onClick={() => setHistoryTab('tasks')} className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${historyTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Activity className="w-4 h-4" /> Task & Credit History
              </button>
              <button onClick={() => setHistoryTab('chats')} className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${historyTab === 'chats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <MessageSquare className="w-4 h-4" /> AI Mentor Chats
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                  <p>Loading history...</p>
                </div>
              ) : historyTab === 'tasks' ? (
                <div className="space-y-3">
                  {userHistory.transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No transactions found.</div>
                  ) : (
                    userHistory.transactions.map(tx => (
                      <div key={tx._id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{tx.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${tx.credits > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                            {tx.credits > 0 ? '+' : ''}{tx.credits} cr
                          </span>
                          <p className="text-xs text-gray-400 mt-1">Bal: {tx.balanceAfter}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {userHistory.chats.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No chat history found.</div>
                  ) : (
                    userHistory.chats.map(chat => (
                      <div key={chat._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-100 p-3 px-4 border-b border-gray-200 font-bold text-gray-700 capitalize flex justify-between">
                          <span>Mentor: {chat.mentor}</span>
                          <span className="text-xs font-normal text-gray-500 mt-1">Last active: {new Date(chat.updatedAt).toLocaleString()}</span>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto space-y-4 bg-gray-50">
                          {chat.messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl p-3 px-4 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
