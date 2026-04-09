// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../components/UI/Button';
import Loader from '../components/UI/Loader';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      // Error already handled in AuthContext, but we can set local if needed
      setError('Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-[32px] shadow-2xl border border-indigo-50/50"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/30">
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-2 text-[28px] font-black tracking-tight text-slate-900">Reset Password</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Enter your email and we'll send a reset link
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
              onSubmit={handleSubmit}
            >
              <div>
                <label htmlFor="email" className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className={`w-full pl-11 pr-5 py-3.5 border-0 ring-1 ring-inset rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-[15px] bg-slate-50/50 placeholder:text-slate-400 ${
                      error ? 'ring-rose-500' : 'ring-slate-200/80'
                    }`}
                    placeholder="you@example.com"
                  />
                  <EnvelopeIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
                {error && (
                  <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                >
                  {loading ? <Loader size="sm" text="" /> : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-[13px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 text-center"
            >
              <div className="flex justify-center mb-6">
                <CheckCircleIcon className="w-20 h-20 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h3>
              <p className="text-slate-500 mb-6 font-medium text-[15px] leading-relaxed">
                We've sent a password reset link to <strong className="text-slate-800">{email}</strong>.
                The link will expire in 15 minutes.
              </p>
              <p className="text-sm text-slate-400 mb-8 font-medium">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                    setError('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                >
                  try again
                </button>
              </p>
              <Link
                to="/login"
                className="inline-flex h-12 bg-slate-50 text-slate-600 items-center justify-center w-full rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all border border-slate-200/50"
              >
                Return to Sign In
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;