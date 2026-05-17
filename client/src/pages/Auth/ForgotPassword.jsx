import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // ── Step 1: Request OTP ───────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email });
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Check your email address.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Input: auto-focus next box ────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const updated = [...otp];
    updated[idx] = val;
    setOtp(updated);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  // ── Step 2: Verify OTP + Reset Password ───────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, {
        email,
        otp: otpCode,
        newPassword,
      });
      setMessage(data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
            <KeyRound className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Check Your Email'}
            {step === 3 && 'Password Reset!'}
          </h2>
          <p className="mt-3 text-gray-500 text-sm max-w-sm mx-auto">
            {step === 1 && "Enter your account email and we'll send a 6-digit OTP."}
            {step === 2 && `We sent a code to ${email}. Enter it below to set a new password.`}
            {step === 3 && 'Your password has been successfully updated. You can now sign in.'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-10">

          {/* Error / Success Messages */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}
          {message && step === 2 && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm text-center font-medium">
              {message}
            </div>
          )}

          {/* ── Step 1 Form ── */}
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSendOTP}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* ── Step 2 Form ── */}
          {step === 2 && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">6-Digit OTP Code</label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all sm:text-sm"
                  placeholder="Min. 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Verifying…' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-indigo-600 text-center"
              >
                Didn't receive it? Resend OTP
              </button>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Back to Login →
              </button>
            </div>
          )}
        </div>

        {/* Footer back link */}
        {step !== 3 && (
          <div className="mt-8 text-center">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
