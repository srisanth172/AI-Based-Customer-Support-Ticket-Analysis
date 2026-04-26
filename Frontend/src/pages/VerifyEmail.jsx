// src/pages/VerifyEmail.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheckIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const VerifyEmail = () => {
  const { verifyEmail, resendOTP, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const email = location.state?.email || user?.email;

  const s = {
    container: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', background: '#020B06', color: '#fff',
      fontFamily: "'Inter', sans-serif",
    },
    bg: { position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' },
    bgImg: { position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: 'url(/hero_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' },
    bgOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(2,11,6,0.5) 0%, rgba(2,11,6,0.95) 90%)' },
    card: {
      width: '100%', maxWidth: '440px', padding: '48px', borderRadius: '32px',
      background: 'rgba(4, 18, 9, 0.82)', backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', zIndex: 10, textAlign: 'center'
    },
    iconWrap: {
      width: '64px', height: '64px', margin: '0 auto 24px',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: '32px', fontWeight: '900', marginBottom: '12px', letterSpacing: '-1px' },
    desc: { color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' },
    input: {
      width: '100%', padding: '16px', borderRadius: '18px',
      background: 'rgba(0, 0, 0, 0.3)', border: '2px solid rgba(255, 255, 255, 0.1)',
      color: '#fff', fontSize: '24px', fontWeight: '800', textAlign: 'center',
      letterSpacing: '8px', transition: 'all 0.3s', outline: 'none'
    },
    button: {
      width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
      background: '#22C55E', color: '#020B06', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
      marginTop: '24px', transition: 'all 0.3s', boxShadow: '0 10px 28px -8px rgba(34,197,94,0.3)'
    },
    error: { color: '#fb7185', fontSize: '13px', marginTop: '16px', fontWeight: '600' }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 5) { setError('Please enter the full code'); return; }
    
    setLoading(true);
    setError('');
    try {
      await verifyEmail(email, code);
      setSuccess(true);
      setTimeout(() => navigate(user?.role === 'admin' ? '/admin' : '/customer'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await resendOTP(email);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.bg}><div style={s.bgImg} /><div style={s.bgOverlay} /></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={s.card}>
        {!success ? (
          <>
            <div style={s.iconWrap}><ShieldCheckIcon className="w-8 h-8 text-white" /></div>
            <h2 style={s.title}>Verify Email</h2>
            <p style={s.desc}>We've sent a 6-digit verification code to <br/><span className="text-white font-bold">{email}</span></p>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...s.input, borderColor: error ? '#fb7185' : 'rgba(255,255,255,0.1)' }}
              />
              {error && <p style={s.error}>{error}</p>}
              <button type="submit" style={s.button} disabled={loading}>
                {loading ? 'VERIFYING...' : 'VERIFY CODE'}
              </button>
            </form>
            <p className="mt-8 text-sm text-slate-500">
              Didn't get the code? <button 
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-emerald-400 font-bold hover:underline disabled:opacity-50"
              >
                Resend Code
              </button>
            </p>
          </>
        ) : (
          <div className="py-8">
            <div style={s.iconWrap} className="!bg-emerald-500"><CheckCircleIcon className="w-8 h-8 text-white" /></div>
            <h2 style={s.title}>Verified!</h2>
            <p style={s.desc}>Your email has been confirmed. Taking you to your personal dashboard now...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
