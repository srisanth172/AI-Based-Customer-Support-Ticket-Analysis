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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mb-4">
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Reset password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className={`w-full pl-11 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                  />
                  <EnvelopeIcon className="absolute left-3.5 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? <Loader size="sm" text="" /> : 'Send reset link'}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-1" />
                  Back to sign in
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
              <div className="flex justify-center mb-4">
                <CheckCircleIcon className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h3>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                The link will expire in 15 minutes.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                    setError('');
                  }}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  try again
                </button>
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Return to sign in
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;