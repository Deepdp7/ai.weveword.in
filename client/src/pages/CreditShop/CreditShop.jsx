import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Coins, Zap, Crown, Star, Check, TrendingUp, History, PlayCircle, AlertCircle, Calculator } from 'lucide-react';

const API = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

const PACK_ICONS = { mini: Coins, starter: Zap, popular: Star, pro: Crown, elite: Crown };
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

  // Ad Player States
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(15);
  const [adRewardReady, setAdRewardReady] = useState(false);

  // Calculator State
  const [calcInputs, setCalcInputs] = useState({ advanced: 0, images: 0, standard: 0, video: 0 });
  const totalEstimatedCredits = (calcInputs.advanced * 10) + (calcInputs.images * 15) + (calcInputs.standard * 1) + (calcInputs.video * 20);

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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Waveword AI',
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
          } finally {
            setBuying(null);
          }
        },
        prefill: { name: '', email: '' },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            setBuying(null);
            setError('Payment cancelled by user.');
          }
        }
      });

      rzp.on('payment.failed', function (response){
        setBuying(null);
        setError(response.error.description || 'Payment failed.');
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate payment.');
      setBuying(null);
    }
  };

  const startAd = () => {
    setIsAdPlaying(true);
    setAdTimeLeft(15);
    setAdRewardReady(false);
    
    // We use a simple interval for the countdown
    const timer = setInterval(() => {
      setAdTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdRewardReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAdReward = async () => {
    try {
      const { data } = await axios.post(`${API}/payments/credits/ad-reward`, { adType: '30sec' });
      setBalance(b => ({ ...b, credits: data.newBalance }));
      alert(`🎉 +${data.creditsEarned} credits earned for watching an ad!`);
      
      // Refresh transactions
      const txRes = await axios.get(`${API}/payments/transactions`);
      setTransactions(txRes.data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not award ad credits.');
    } finally {
      setIsAdPlaying(false);
    }
  };

  const txIcon = (type) => {
    if (type === 'purchase' || type === 'subscription') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (type === 'ad_reward') return <PlayCircle className="w-4 h-4 text-blue-500" />;
    return <Coins className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Credit Shop</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Power your creativity with Waveword AI credits.</p>
        </div>
        {/* Live Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-5 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <Coins className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <p className="text-xs sm:text-sm opacity-80">Your Balance</p>
              <p className="text-2xl sm:text-3xl font-extrabold leading-none mt-1">{loading ? '—' : balance.credits.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right sm:text-left">
             <p className="text-[10px] sm:text-xs opacity-70 uppercase tracking-wider font-bold bg-white/10 px-2 py-1 rounded-md">{balance.plan} plan</p>
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
      <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-6 sm:mb-8 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
        {[['credits', 'Credit Packs'], ['plans', 'Subscriptions'], ['calculator', 'Calculator'], ['history', 'History']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Credit Packs ── */}
      {tab === 'credits' && (
        <div>
          {/* Earn Free Credits Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Earn Free Credits by Watching Ads</h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-0.5">Watch a 30-second ad and earn <strong>5 credits</strong> instantly.</p>
              </div>
            </div>
            <button
              onClick={startAd}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shrink-0"
            >
              Watch Ad (+5)
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
        <div className="flex flex-wrap gap-6">
          {packs.planPacks.map((plan) => {
            const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.basic;
            const isActive = balance.plan === plan.plan;
            const features = {
              basic: ['2,000 credits/month', '5 GB storage', 'Ad-free experience', 'Priority support'],
              pro: ['2,000 credits/month', 'Cloud library access', 'Ad-free experience', 'Priority support', 'All tools unlocked'],
            };
            return (
              <div key={plan.id} className={`relative bg-white w-full sm:w-[320px] lg:w-[340px] rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden shrink-0 ${plan.id === 'pro' ? 'ring-2 ring-indigo-400 border-indigo-300' : 'border-gray-200'}`}>
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 min-w-[300px]">
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
                <div key={tx._id} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors min-w-[300px]">
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

      {/* ── Credit Calculator ── */}
      {tab === 'calculator' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Calculator className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
            Credit Usage Estimator
          </h2>
          <p className="text-gray-500 text-sm mb-6 sm:mb-8">Estimate your monthly credit needs based on your planned usage.</p>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Advanced AI (GPT-4 / Claude Opus)</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">10 credits per request</p>
              </div>
              <input 
                type="number" min="0" 
                value={calcInputs.advanced || ''}
                onChange={e => setCalcInputs({...calcInputs, advanced: parseInt(e.target.value) || 0})}
                className="w-20 sm:w-24 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg p-2 text-center text-sm font-medium outline-none transition-all" 
                placeholder="0" 
              />
            </div>
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">AI Image Generation (DALL-E 3)</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">15 credits per image</p>
              </div>
              <input 
                type="number" min="0" 
                value={calcInputs.images || ''}
                onChange={e => setCalcInputs({...calcInputs, images: parseInt(e.target.value) || 0})}
                className="w-20 sm:w-24 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg p-2 text-center text-sm font-medium outline-none transition-all" 
                placeholder="0" 
              />
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Standard AI requests</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">1 credit per request</p>
              </div>
              <input 
                type="number" min="0" 
                value={calcInputs.standard || ''}
                onChange={e => setCalcInputs({...calcInputs, standard: parseInt(e.target.value) || 0})}
                className="w-20 sm:w-24 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg p-2 text-center text-sm font-medium outline-none transition-all" 
                placeholder="0" 
              />
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">AI Video Generation</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">20 credits per minute</p>
              </div>
              <input 
                type="number" min="0" 
                value={calcInputs.video || ''}
                onChange={e => setCalcInputs({...calcInputs, video: parseInt(e.target.value) || 0})}
                className="w-20 sm:w-24 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg p-2 text-center text-sm font-medium outline-none transition-all" 
                placeholder="0" 
              />
            </div>
          </div>
          
          <div className="mt-8 bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">Estimated Monthly Needs</p>
              <p className="text-4xl font-extrabold text-indigo-900 mt-1 flex items-baseline justify-center sm:justify-start gap-1">
                {totalEstimatedCredits.toLocaleString()} <span className="text-lg font-medium text-indigo-700">credits</span>
              </p>
            </div>
            <button 
              onClick={() => setTab('credits')}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-200"
            >
              View Recommended Packs
            </button>
          </div>
        </div>
      )}

      {/* ── Ad Player Modal ── */}
      {isAdPlaying && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
          {/* Ad Header Overlay */}
          <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="bg-yellow-500 text-black font-bold text-xs px-2 py-1 rounded">SPONSORED</div>
            
            {adRewardReady ? (
              <button 
                onClick={handleAdReward}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 animate-bounce"
              >
                Claim Reward & Close
              </button>
            ) : (
              <div className="text-white font-mono font-semibold bg-black/50 px-3 py-1.5 rounded-full border border-white/20">
                Reward in {adTimeLeft}s
              </div>
            )}
          </div>
          
          {/* Close early button */}
          {!adRewardReady && (
            <button 
              onClick={() => setIsAdPlaying(false)}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white/50 hover:text-white z-10 p-2"
              title="Close without reward"
            >
              ✕
            </button>
          )}

          {/* Ad Video */}
          <div className="flex-1 flex items-center justify-center relative">
            <video 
              src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" 
              className="w-full h-full object-contain"
              autoPlay
              muted={false}
              playsInline
            />
            {/* Click interceptor to open sponsor link instead of pausing */}
            <a 
              href="https://google.com" 
              target="_blank" 
              rel="noreferrer"
              className="absolute inset-0 z-0 cursor-pointer"
              title="Visit Sponsor"
            >
              <span className="sr-only">Visit Sponsor</span>
            </a>
          </div>
          
          {/* Ad Footer Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex items-center justify-between z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
            <div>
              <h2 className="text-white font-bold text-xl sm:text-2xl mb-1">Epic Action Game</h2>
              <p className="text-white/80 text-sm">Download now and get 500 free gems!</p>
            </div>
            <button className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full pointer-events-auto hover:bg-blue-500 transition-colors">
              Install
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
