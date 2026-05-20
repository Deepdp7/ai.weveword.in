import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Coins, Zap, Crown, Star, Check, TrendingUp, History, PlayCircle, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { isNative, showRewardedVideoAd } from '../../utils/capacitorHelper';

const API = API_BASE;
axios.defaults.withCredentials = true;

const PACK_ICONS = { starter: Zap, popular: Star, pro: Crown, elite: Crown };
const PLAN_COLORS = {
  basic: { bg: 'from-blue-500 to-blue-700', badge: 'bg-blue-100 text-blue-700' },
  pro: { bg: 'from-indigo-500 to-purple-700', badge: 'bg-indigo-100 text-indigo-700' },
  elite: { bg: 'from-amber-400 to-orange-600', badge: 'bg-amber-100 text-amber-700' },
};

const formatAmount = (paise) => `₹${(paise / 100).toFixed(0)}`;

export default function CreditShop() {
  const [balance, setBalance] = useState({ credits: 0, plan: 'free' });
  const [packs, setPacks] = useState({ creditPacks: [], planPacks: [] });
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('credits'); // 'credits' | 'plans' | 'history'
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [balRes, packsRes, txRes] = await Promise.all([
          axios.get(`${API}/payments/credits/balance`),
          axios.get(`${API}/payments/packs`),
          axios.get(`${API}/payments/transactions`),
        ]);
        setBalance({ credits: balRes.data.credits, plan: balRes.data.plan });
        setPacks({ creditPacks: packsRes.data.creditPacks, planPacks: packsRes.data.planPacks });
        setTransactions(txRes.data.transactions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load credit shop.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleBuy = async (packId, type) => {
    setError('');
    setBuying(packId);
    try {
      const { data } = await axios.post(`${API}/payments/create-order`, { packId, type });
      const { order } = data;

      if (!window.Razorpay) {
        // Razorpay SDK not loaded — load it dynamically
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'KolomFlow',
        description: order.pack.label,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API}/payments/verify`, response);
            setBalance(b => ({ ...b, credits: verifyRes.data.newBalance }));
            alert(`✅ ${verifyRes.data.message}`);
            // Refresh transactions
            const txRes = await axios.get(`${API}/payments/transactions`);
            setTransactions(txRes.data.transactions || []);
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: { name: '', email: '' },
        theme: { color: '#4f46e5' },
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate payment.');
    } finally {
      setBuying(null);
    }
  };

  const handleAdReward = async () => {
    setError('');
    await showRewardedVideoAd(
      async (reward) => {
        try {
          const { data } = await axios.post(`${API}/payments/credits/ad-reward`, { adType: '30sec' });
          setBalance(b => ({ ...b, credits: data.newBalance }));
          alert(`🎉 +${data.creditsEarned} credits earned for watching an ad!`);
          const txRes = await axios.get(`${API}/payments/transactions`);
          setTransactions(txRes.data.transactions || []);
        } catch (err) {
          setError(err.response?.data?.message || 'Could not award ad credits.');
        }
      },
      (err) => {
        setError('Failed to show rewarded ad. Please try again.');
      }
    );
  };

  const txIcon = (type) => {
    if (type === 'purchase' || type === 'subscription') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (type === 'ad_reward') return <PlayCircle className="w-4 h-4 text-blue-500" />;
    return <Coins className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Shop</h1>
          <p className="text-gray-500 mt-1">Power your creativity with KolomFlow credits.</p>
        </div>
        {/* Live Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center gap-4 min-w-[200px]">
          <div className="p-2 bg-white/20 rounded-xl">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm opacity-80">Your Balance</p>
            <p className="text-3xl font-extrabold">{loading ? '—' : balance.credits.toLocaleString()}</p>
            <p className="text-xs opacity-70 capitalize mt-0.5">{balance.plan} plan</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        {[['credits', 'Credit Packs'], ['plans', 'Subscriptions'], ['history', 'History']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Credit Packs ── */}
      {tab === 'credits' && (
        <div>
          {/* Earn Free Credits Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <PlayCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Earn Free Credits by Watching Ads</h3>
                <p className="text-gray-600 text-sm mt-0.5">Watch a 30-second ad and earn <strong>10 credits</strong> instantly.</p>
              </div>
            </div>
            <button
              onClick={handleAdReward}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shrink-0"
            >
              Watch Ad (+10)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {packs.creditPacks.map((pack) => {
              const Icon = PACK_ICONS[pack.id] || Coins;
              const isPopular = pack.id === 'popular';
              return (
                <div key={pack.id} className={`relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-6 flex flex-col ${isPopular ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200'}`}>
                  {isPopular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{pack.label}</h3>
                  <p className="text-3xl font-extrabold text-gray-900 mb-1">{pack.credits.toLocaleString()} <span className="text-base font-semibold text-gray-400">cr</span></p>
                  <p className="text-indigo-600 font-bold text-lg mb-6">{formatAmount(pack.amount)}</p>
                  <button
                    onClick={() => handleBuy(pack.id, 'credits')}
                    disabled={buying === pack.id}
                    className="mt-auto w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                  >
                    {buying === pack.id ? 'Loading…' : 'Buy Now'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subscription Plans ── */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packs.planPacks.map((plan) => {
            const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.basic;
            const isActive = balance.plan === plan.plan;
            const features = {
              basic: ['2,000 credits/month', '5 GB storage', 'Ad-free experience', 'Priority support'],
              pro: ['6,000 credits/month', '10 GB storage', 'Ad-free experience', 'API access', 'All tools unlocked'],
              elite: ['15,000 credits/month', '50 GB storage', 'Ad-free experience', 'API access', 'White-label exports', 'Dedicated support'],
            };
            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${plan.id === 'pro' ? 'ring-2 ring-indigo-400 border-indigo-300' : 'border-gray-200'}`}>
                {plan.id === 'pro' && <div className="text-center text-xs font-bold bg-indigo-600 text-white py-1.5">RECOMMENDED</div>}
                <div className={`bg-gradient-to-br ${colors.bg} p-6 text-white`}>
                  <Crown className="w-8 h-8 mb-3 opacity-80" />
                  <h3 className="text-xl font-bold">{plan.label}</h3>
                  <p className="text-4xl font-extrabold mt-2">{formatAmount(plan.amount)}<span className="text-base font-medium opacity-80">/mo</span></p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {(features[plan.id] || []).map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleBuy(plan.id, 'plan')}
                    disabled={isActive || buying === plan.id}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${isActive ? 'bg-green-100 text-green-700 cursor-not-allowed' : `bg-gradient-to-r ${colors.bg} text-white hover:opacity-90`}`}
                  >
                    {isActive ? '✓ Current Plan' : buying === plan.id ? 'Loading…' : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Transaction History ── */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Transaction History</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No transactions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map(tx => (
                <div key={tx._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      {txIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.credits > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.credits > 0 ? '+' : ''}{tx.credits} cr
                    </p>
                    <p className="text-xs text-gray-400">Balance: {tx.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
