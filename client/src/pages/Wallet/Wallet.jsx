import { useState } from 'react';
import { useCredits } from '../../context/CreditContext';
import { Wallet as WalletIcon, PlaySquare, TrendingUp, TrendingDown, Clock, ShieldCheck, PlusCircle } from 'lucide-react';

export default function Wallet() {
  const { credits, transactions, addCredits } = useCredits();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adMessage, setAdMessage] = useState('');
  const [isBuying, setIsBuying] = useState(false);

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setAdMessage('Playing Ad... Please wait.');
    
    // Simulate 3-second ad
    setTimeout(() => {
      addCredits(5, 'Watched Advertisement');
      setIsWatchingAd(false);
      setAdMessage('');
    }, 3000);
  };

  const handleBuyCredits = (amount, price) => {
    setIsBuying(true);
    // Simulate Razorpay popup delay
    setTimeout(() => {
      if (window.confirm(`Simulating Razorpay... Confirm payment of ₹${price} for ${amount} credits?`)) {
        addCredits(amount, `Purchased Package (₹${price})`);
      }
      setIsBuying(false);
    }, 500);
  };

  const packages = [
    { amount: 100, price: 49, popular: false },
    { amount: 500, price: 199, popular: true },
    { amount: 2000, price: 499, popular: false },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
          <WalletIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Wallet</h1>
          <p className="text-gray-500">Manage your KolomFlow credits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          <div>
            <p className="text-gray-400 font-medium mb-1">Current Balance</p>
            <h2 className="text-5xl font-extrabold tracking-tight flex items-baseline gap-2">
              {credits} <span className="text-lg font-medium text-amber-400">Credits</span>
            </h2>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-gray-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure Wallet
          </div>
        </div>

        {/* Earn Free Credits */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <PlaySquare className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Earn Free Credits</h3>
          <p className="text-sm text-gray-500 mb-6">Watch a short advertisement to earn 5 free credits instantly.</p>
          
          <button 
            onClick={handleWatchAd}
            disabled={isWatchingAd}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            {isWatchingAd ? adMessage : 'Watch Ad (+5 Credits)'}
          </button>
        </div>

        {/* Buy Packages */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 col-span-1 md:col-span-1">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-500" /> Buy Credits
          </h3>
          <div className="space-y-3">
            {packages.map((pkg, idx) => (
              <button 
                key={idx}
                onClick={() => handleBuyCredits(pkg.amount, pkg.price)}
                disabled={isBuying}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  pkg.popular 
                    ? 'border-amber-400 bg-amber-50 hover:bg-amber-100' 
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-bold text-gray-900">{pkg.amount} Credits</div>
                  {pkg.popular && <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-0.5">Most Popular</div>}
                </div>
                <div className="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                  ₹{pkg.price}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {transactions.map((tx) => (
              <li key={tx.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'earn' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.type === 'earn' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className={`font-bold ${tx.type === 'earn' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
