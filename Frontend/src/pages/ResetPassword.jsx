// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LockClosedIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const s = {
    container: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', background: '#05070a', color: '#fff',
      fontFamily: "'Inter', sans-serif",
    },
    bg: { position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' },
    bgImg: { position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: 'url(/hero_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' },
    bgOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(5,7,10,0.5) 0%, rgba(5,7,10,0.95) 90%)' },
    card: {
      width: '100%', maxWidth: '440px', padding: '48px', borderRadius: '32px',
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', zIndex: 10, textAlign: 'center'
    },
    iconWrap: {
      width: '64px', height: '64px', margin: '0 auto 24px',
      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: '32px', fontWeight: '900', marginBottom: '12px', letterSpacing: '-1px' },
    desc: { color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' },
    input: {
      width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px',
      background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff', fontSize: '15px', boxSizing: 'border-box', marginBottom: '16px'
    },
    button: {
      width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
      transition: 'all 0.3s', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
    },
    error: { color: '#fb7185', fontSize: '13px', marginBottom: '16px', fontWeight: '600' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) { setError('Password is required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid or missing token'); return; }

    setLoading(true);
    setError('');
    try {
      await resetPassword(token, password);
      setSubmitted(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.bg}><div style={s.bgImg} /><div style={s.bgOverlay} /></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={s.card}>
        {!submitted ? (
          <>
            <div style={s.iconWrap}><LockClosedIcon className="w-8 h-8 text-white" /></div>
            <h2 style={s.title}>New Password</h2>
            <p style={s.desc}>Please choose a strong password to secure your account.</p>
            <form onSubmit={handleSubmit}>
              <div style={{ position: 'relative' }}>
                <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} style={s.input} />
                <LockClosedIcon style={{ position: 'absolute', left: '16px', top: '16px', width: '20px', color: '#4b5563' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={s.input} />
                <LockClosedIcon style={{ position: 'absolute', left: '16px', top: '16px', width: '20px', color: '#4b5563' }} />
              </div>
              {error && <p style={s.error}>{error}</p>}
              <button type="submit" style={s.button} disabled={loading}>{loading ? 'UPDATING...' : 'RESET PASSWORD'}</button>
            </form>
          </>
        ) : (
          <div className="py-8">
            <div style={s.iconWrap} className="!bg-emerald-500"><CheckCircleIcon className="w-8 h-8 text-white" /></div>
            <h2 style={s.title}>All Set!</h2>
            <p style={s.desc}>Your password has been successfully updated. Redirecting you to login...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
