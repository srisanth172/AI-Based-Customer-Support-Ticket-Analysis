import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../components/UI/Button';
import Loader from '../components/UI/Loader';

const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = 'Full Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email Address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email Address is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, 'customer');
      // Navigation handled inside AuthContext
    } catch (error) {
      // Error already handled by AuthContext
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
              <span className="text-white text-2xl font-black">C</span>
            </div>
          </div>
          <h2 className="mt-2 text-[28px] font-black tracking-tight text-slate-900">Create Account</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Join ClarityHelp to experience smarter support
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-5 py-3.5 border-0 ring-1 ring-inset rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-[15px] bg-slate-50/50 placeholder:text-slate-400 ${
                  errors.name ? 'ring-rose-500' : 'ring-slate-200/80'
                }`}
                placeholder="Sarah Jenkins"
              />
              {errors.name && (
                <p className="mt-2 text-xs font-bold text-rose-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-5 py-3.5 border-0 ring-1 ring-inset rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-[15px] bg-slate-50/50 placeholder:text-slate-400 ${
                  errors.email ? 'ring-rose-500' : 'ring-slate-200/80'
                }`}
                placeholder="sarah@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-xs font-bold text-rose-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-5 py-3.5 border-0 ring-1 ring-inset rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-[15px] bg-slate-50/50 placeholder:text-slate-400 ${
                    errors.password ? 'ring-rose-500' : 'ring-slate-200/80'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-indigo-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-slate-400 hover:text-indigo-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs font-bold text-rose-500">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
            >
              {loading ? <Loader size="sm" text="" /> : 'Create Account'}
            </button>
          </div>

          {/* Social Register */}
          <div className="relative mt-6 pt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative flex justify-center text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span className="px-4 bg-white">Or sign up with</span>
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <GoogleLogin
              onSuccess={credentialResponse => {
                googleLogin(credentialResponse.credential, 'register');
              }}
              onError={() => {
                console.error('Google Sign Up failed');
              }}
              shape="pill"
            />
          </div>

          <p className="text-center text-sm font-medium text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
