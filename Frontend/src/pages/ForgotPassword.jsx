// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const s = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      background: '#040d08',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
    },
    bg: {
      position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden'
    },
    bgImg: {
      position: 'absolute', inset: 0, opacity: 0.18,
      backgroundImage: 'url(/hero_bg.png)',
      backgroundSize: 'cover', backgroundPosition: 'center',
    },
    bgOverlay: {
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at center, rgba(4,13,8,0.5) 0%, rgba(4,13,8,0.95) 90%)',
    },
    card: {
      width: '100%', maxWidth: '440px', padding: '48px', borderRadius: '32px',
      background: 'rgba(4, 18, 9, 0.82)', backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      position: 'relative', zIndex: 10, textAlign: 'center'
    },
    iconWrap: {
      width: '64px', height: '64px', margin: '0 auto 24px',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)',
    },
    title: { fontSize: '32px', fontWeight: '900', marginBottom: '12px', letterSpacing: '-1px' },
    desc: { color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' },
    inputGroup: { marginBottom: '24px', textAlign: 'left' },
    label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '1px' },
    inputWrap: { position: 'relative' },
    input: {
      width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px',
      background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff', transition: 'all 0.3s', fontSize: '15px', boxSizing: 'border-box'
    },
    fieldIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#4b5563' },
    button: {
      width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
      background: '#22C55E', color: '#020B06', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
      marginTop: '8px', transition: 'all 0.3s', boxShadow: '0 10px 28px -8px rgba(34,197,94,0.3)'
    },
    backLink: {
      display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#94a3b8',
      fontSize: '14px', fontWeight: '600', marginTop: '32px', textDecoration: 'none',
      transition: 'color 0.2s',
    },
    error: { color: '#fb7185', fontSize: '13px', marginTop: '8px', fontWeight: '600' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.bg}>
        <div style={s.bgImg} />
        <div style={s.bgOverlay} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={s.card}
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={s.iconWrap}>
                <EnvelopeIcon className="w-8 h-8 text-white" />
              </div>
              <h2 style={s.title}>Reset Password</h2>
              <p style={s.desc}>Enter your email address and we'll send you a secure link to reset your account credentials.</p>

              <form onSubmit={handleSubmit}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Email Address</label>
                  <div style={s.inputWrap}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      style={s.input}
                      placeholder="name@company.com"
                    />
                    <EnvelopeIcon style={s.fieldIcon} />
                  </div>
                  {error && <p style={s.error}>{error}</p>}
                </div>

                <button type="submit" style={s.button} disabled={loading}>
                  {loading ? 'SENDING LINK...' : 'SEND RESET LINK'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={s.iconWrap} className="!bg-emerald-500 !shadow-emerald-500/30">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              <h2 style={s.title}>Check Email</h2>
              <p style={s.desc}>
                Success! We've sent a password reset link to <span className="text-white font-bold">{email}</span>. 
                Please check your inbox (and spam folder).
              </p>
              
              <button 
                onClick={() => setSubmitted(false)}
                style={{ ...s.button, background: 'rgba(255,255,255,0.05)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                RESEND EMAIL
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Link to="/login" style={s.backLink} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
          <ArrowLeftIcon className="w-4 h-4" />
          Return to Sign In
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;