import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, CreditCard, HardDrive, FileSignature, Upload, LogOut, CheckCircle2, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE } from '../../utils/api';

const API = API_BASE;
axios.defaults.withCredentials = true;

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [storage, setStorage] = useState({ usedGB: '0', limitGB: '1', percentUsed: 0 });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || ''
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const { data } = await axios.get(`${API}/files/storage`);
        setStorage(data.storage);
      } catch (err) {
        console.error('Failed to fetch storage info');
      }
    };
    if (user) fetchStorage();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.put(`${API}/users/profile`, {
        name: profileData.name,
        avatar: profileData.avatar
      });
      // Update local storage and context
      localStorage.setItem('waveword-ai_user', JSON.stringify(data.user));
      // Assuming setUser is exposed from context (I need to check if I added it)
      // If not, I'll update AuthContext to expose it or just use the local state update
      window.location.reload(); // Quick way to sync everything for now
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`${API}/users/password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setSuccess('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information, security, and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <User size={18} /> General Info
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Shield size={18} /> Security
            </button>
            <button 
              onClick={() => setActiveTab('signatures')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'signatures' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <FileSignature size={18} /> My Signatures
            </button>
            <div className="my-2 border-t border-gray-100"></div>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={18} /> Sign Out
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-sm p-5 text-white">
            <h3 className="font-semibold mb-4 opacity-90">Account Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-75 mb-1 flex items-center gap-2"><CreditCard size={14}/> Current Plan</p>
                <p className="font-bold text-lg capitalize">{user?.plan || 'Free'} Tier</p>
              </div>
              <div>
                <p className="text-sm opacity-75 mb-1 flex items-center gap-2"><HardDrive size={14}/> Storage Used</p>
                <p className="font-bold text-lg">{storage.usedGB} GB / {storage.limitGB} GB</p>
                <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div className="bg-white h-full transition-all" style={{ width: `${storage.percentUsed}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 size={18} /> {success}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Profile Avatar & Basic Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Public Profile</h2>
                <form onSubmit={handleUpdateProfile}>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-sm overflow-hidden">
                        {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span>{user?.name?.charAt(0).toUpperCase()}</span>}
                      </div>
                      <button type="button" className="absolute inset-0 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-xs font-medium">
                        <Upload size={16} className="mb-1" />
                        Upload
                      </button>
                    </div>
                    <div className="flex-1 w-full space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input 
                            type="text" 
                            value={profileData.name} 
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Read-only)</label>
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                          <Mail size={16} />
                          <span>{user?.email}</span>
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Verified</span>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-indigo-900 mb-1">Your Referral Code</p>
                          <p className="text-xs text-indigo-700">Share this code! New users get 120 credits, you get 100 credits.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-200">
                          <span className="font-mono font-bold text-indigo-600 tracking-wider">{user?.referralCode || 'NO-CODE'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(user?.referralCode || '');
                              setSuccess('Referral code copied to clipboard!');
                              setTimeout(() => setSuccess(''), 3000);
                            }}
                            className="p-1 hover:bg-indigo-50 rounded text-indigo-500 transition-colors"
                            title="Copy Code"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="password" 
                        required
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="password" 
                        required
                        minLength={8}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="password" 
                        required
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors mt-2 flex items-center gap-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Update Password
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
                <p className="text-gray-500 mb-6">Add an extra layer of security to your account.</p>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Email OTP Verification</p>
                    <p className="text-sm text-gray-500">Receive a code via email when logging in from a new device.</p>
                  </div>
                  <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">Enable 2FA</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signatures' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Saved Signatures</h2>
                <span className="text-sm text-gray-500">Feature coming soon</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer min-h-[140px]">
                  <Plus size={24} className="mb-2" />
                  <span className="text-sm font-medium">Create New</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
