import { Bell, Search, Menu, User, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Navbar({ onMenuClick }) {
  const [credits, setCredits] = useState('...');

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data } = await axios.get(`http://${window.location.hostname}:5000/api/payments/credits/balance`, { withCredentials: true });
        setCredits(data.credits);
      } catch (err) {
        console.error('Failed to fetch credits', err);
      }
    };
    fetchCredits();
  }, []);

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
        <Link to="/credits" className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors cursor-pointer border border-amber-200">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-semibold">{credits} Credits</span>
        </Link>
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        <Link to="/profile" className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-medium hover:bg-brand-200 transition-colors border border-brand-200 cursor-pointer">
          <User className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}
