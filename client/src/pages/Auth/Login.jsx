import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenTool, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-brand-200/30 blur-3xl mix-blend-multiply"></div>
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <PenTool className="text-white w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-500">create a new account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-white">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                name="email" type="email" required
                value={formData.email} onChange={handleChange}
                className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password" type="password" required
                value={formData.password} onChange={handleChange}
                className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="••••••••"
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-500">Forgot password?</Link>
              </div>
            </div>
            
            <button
              type="submit" disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
