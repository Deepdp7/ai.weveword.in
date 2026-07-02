import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoUrl from '../../assets/logo2.png';
import SEO from '../../components/SEO';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', referralCode: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await register(formData.name, formData.email, formData.password, formData.referralCode);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <SEO 
        title="Create an Account | WaveWord AI"
        description="Join WaveWord AI for free to unlock powerful AI tools, image generation, and productivity features."
        canonical="/signup"
      />
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex relative w-0 flex-1 bg-slate-900 items-center justify-center overflow-hidden">
        {/* Abstract Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900"></div>
        <div className="absolute w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] -top-20 -left-20 animate-pulse" style={{ animationDuration: '9s' }}></div>
        <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '11s', animationDelay: '2s' }}></div>
        
        {/* Subtle Dot Grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        {/* Content */}
        <div className="relative z-10 p-12 max-w-2xl">
          <div className="mb-8 inline-flex px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-purple-200 text-sm font-medium tracking-wide">
            Start Your Journey
          </div>
          
          <h1 className="text-5xl font-extrabold text-white mb-6 leading-[1.15]">
            Your all-in-one AI <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">productivity suite.</span>
          </h1>
          
          <p className="text-lg text-indigo-100/70 mb-12 max-w-xl leading-relaxed">
            Get 100 free credits upon signup. Invite friends to earn more and unlock access to premium generative models, PDF utilities, and AI avatars.
          </p>

          {/* Floating UI Elements / Features */}
          <div className="grid grid-cols-2 gap-5 text-left">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors transform -translate-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 border border-blue-500/30">
                <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-white font-semibold mb-1 text-lg">Cloud Library</h3>
              <p className="text-sm text-indigo-200/60 leading-relaxed">Store all your generated files safely in the cloud.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4 border border-pink-500/30">
                <svg className="w-6 h-6 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-white font-semibold mb-1 text-lg">Referral Program</h3>
              <p className="text-sm text-indigo-200/60 leading-relaxed">Earn 100 credits for every friend you invite to the app.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-[45%]">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          <div className="text-center lg:text-left mb-10">
            <div className="mb-6 lg:mb-8">
              <img src={logoUrl} alt="Waveword AI" className="h-14 w-auto object-contain mx-auto lg:mx-0 drop-shadow-xl" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="bg-white">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-medium flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                <div className="relative">
                  <input
                    name="name" type="text" required
                    value={formData.name} onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all sm:text-sm bg-gray-50 focus:bg-white text-gray-900 font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <input
                    name="email" type="email" required
                    value={formData.email} onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all sm:text-sm bg-gray-50 focus:bg-white text-gray-900 font-medium"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password" type="password" required
                    value={formData.password} onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all sm:text-sm bg-gray-50 focus:bg-white text-gray-900 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Referral Code <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input
                    name="referralCode" type="text"
                    value={formData.referralCode} onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all sm:text-sm bg-gray-50 focus:bg-white text-gray-900 font-medium"
                    placeholder="e.g. A1B2C3D4"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
