import { Bell, Search, Menu, User, Wallet, LogIn, CheckCircle, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onMenuClick }) {
  const [credits, setCredits] = useState('...');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const fetchCredits = async () => {
      try {
        const { data } = await axios.get(`http://${window.location.hostname}:5000/api/payments/credits/balance`, { withCredentials: true });
        setCredits(data.credits);
      } catch (err) {
        console.error('Failed to fetch credits', err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`http://${window.location.hostname}:5000/api/notifications`, { withCredentials: true });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchCredits();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchCredits();
      fetchNotifications();
    }, 60000); // Poll every minute

    return () => clearInterval(interval);
  }, [user]);

  // Handle clicking outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      // Mark all as read when opening
      try {
        await axios.put(`http://${window.location.hostname}:5000/api/notifications/all/read`, {}, { withCredentials: true });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'ad': return <Megaphone className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:flex relative items-center">
          <Search className="w-5 h-5 text-gray-400 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search tools or files..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-64 lg:w-96 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {user ? (
          <>
            <Link to="/credits" className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors cursor-pointer border border-amber-200">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-semibold">{credits} Credits</span>
            </Link>
            
            {/* Notification Bell & Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-full">{unreadCount} New</span>}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No notifications yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                          <div key={notif._id} className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}>
                            <div className="shrink-0 mt-1">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div>
                              <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{notif.title}</h4>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
                                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-medium hover:bg-brand-200 transition-colors border border-brand-200 cursor-pointer">
              <User className="w-5 h-5" />
            </Link>
          </>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold shadow-md shadow-brand-500/20">
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
