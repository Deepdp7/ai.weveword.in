import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ClipboardList, ArrowLeft, RefreshCw, AlertCircle, ShieldAlert, Crown, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = `http://${window.location.hostname}/api`;
axios.defaults.withCredentials = true;

const ACTION_CONFIG = {
  'UPDATE_PLAN': { icon: Crown, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  'PROMOTED_ADMIN': { icon: ShieldAlert, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  'DEMOTED_ADMIN': { icon: Edit, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'DEFAULT': { icon: ClipboardList, color: 'text-gray-600 bg-gray-50 border-gray-200' }
};

export default function TaskHistory() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API}/admin/tasks`, { params: { page, limit: 15 } });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch task history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(1); }, [fetchTasks]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/admin" className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Task History</h1>
          </div>
          <p className="text-gray-500 ml-11">Audit log of all administrative actions performed.</p>
        </div>
        <button onClick={() => fetchTasks(pagination.page)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Target User</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    <td className="py-4 px-6 flex justify-end"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                  </tr>
                ))
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">No admin tasks have been logged yet.</td>
                </tr>
              ) : tasks.map(task => {
                const config = ACTION_CONFIG[task.action] || ACTION_CONFIG['DEFAULT'];
                const Icon = config.icon;
                return (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-gray-900 text-xs">{task.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {task.adminId ? (
                        <div>
                          <p className="font-medium text-gray-900 truncate">{task.adminId.name}</p>
                          <p className="text-xs text-gray-400 truncate">{task.adminId.email}</p>
                        </div>
                      ) : <span className="text-gray-400">System</span>}
                    </td>
                    <td className="py-4 px-4">
                      {task.targetUserId ? (
                        <div>
                          <p className="font-medium text-gray-900 truncate">{task.targetUserId.name}</p>
                          <p className="text-xs text-gray-400 truncate">{task.targetUserId.email}</p>
                        </div>
                      ) : <span className="text-gray-400">Deleted User</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600">{task.details}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className="font-medium text-gray-900">{new Date(task.createdAt).toLocaleDateString('en-IN')}</p>
                      <p className="text-xs text-gray-400">{new Date(task.createdAt).toLocaleTimeString('en-IN')}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchTasks(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => fetchTasks(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
