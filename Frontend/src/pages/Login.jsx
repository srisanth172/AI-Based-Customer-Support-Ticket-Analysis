// src/pages/Login.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
      stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#64748b" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="1.8" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!formData.username.trim()) e.username = 'Username or email is required';
    if (!formData.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await login(formData.username, formData.password);
    } catch (error) {
      setApiError(error?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background */}
      <div style={s.bgImage} />
      <div style={s.bgOverlay} />
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.grid} />

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.brand} onClick={() => navigate('/')} role="button">
          <div style={s.logoBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fff"/>
            </svg>
          </div>
          <span style={s.brandName}>SupportIQ</span>
        </div>
        <Link to="/register" style={s.navRegLink}>
          New here? <span style={{ color: '#818cf8' }}>Create account →</span>
        </Link>
      </nav>

      {/* Main */}
      <main style={s.main}>

        {/* LEFT PANEL */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={s.left}
        >
          <div style={s.badge}>SECURE SIGN IN</div>
          <h1 style={s.heroText}>
            Welcome<br />
            <span style={s.accent}>Back.</span>
          </h1>
          <p style={s.desc}>
            Access your AI-powered support dashboard — manage tickets, view sentiment trends, and resolve issues fast.
          </p>

          <div style={s.infoCards}>
            {[
              { icon: '🤖', text: 'AI analyses every ticket automatically' },
              { icon: '🔴', text: 'High-priority tickets surface instantly' },
              { icon: '📊', text: 'Real-time analytics & sentiment tracking' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={s.infoCard}
              >
                <span style={s.infoIcon}>{item.icon}</span>
                <span style={s.infoText}>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT CARD */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          style={s.card}
        >
          {/* Card header */}
          <div style={s.cardHeader}>
            <div style={s.logoBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fff"/>
              </svg>
            </div>
            <div>
              <h2 style={s.cardTitle}>Sign in<span style={s.dot}>.</span></h2>
              <p style={s.cardSubtitle}>Enter your credentials to continue</p>
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={s.errorBanner}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              {apiError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={s.form} noValidate>
            {/* Username */}
            <div style={s.field}>
              <label style={s.label}>USERNAME OR EMAIL</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#475569" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#475569" strokeWidth="1.8"/>
                  </svg>
                </span>
                <input
                  id="login-username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="srisanth or your@email.com"
                  value={formData.username}
                  onChange={handleChange}
                  style={errors.username ? { ...s.input, ...s.inputErr } : s.input}
                />
              </div>
              {errors.username && <span style={s.errText}>{errors.username}</span>}
            </div>

            {/* Password */}
            <div style={s.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={s.label}>PASSWORD</label>
                <Link to="/forgot-password" style={s.forgot}>Forgot password?</Link>
              </div>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#475569" strokeWidth="1.8"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#475569" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  style={errors.password ? { ...s.input, ...s.inputErr, paddingRight: 48 } : { ...s.input, paddingRight: 48 }}
                />
                <button
                  type="button"
                  id="toggle-login-password"
                  onClick={() => setShowPassword(v => !v)}
                  style={s.eyeBtn}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && <span style={s.errText}>{errors.password}</span>}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, boxShadow: '0 16px 40px rgba(79,70,229,0.55)' } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={loading ? { ...s.btn, ...s.btnDisabled } : s.btn}
            >
              {loading ? (
                <span style={s.spinRow}>
                  <span style={s.spinner} />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </motion.button>
          </form>

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>Don't have an account?</span>
            <span style={s.dividerLine} />
          </div>

          <Link to="/register" style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileHover={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.06)' }}
              style={s.registerBtn}
            >
              Create a free account
            </motion.div>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <span>© 2025 SupportIQ · AI-Based Customer Support Analysis</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms'].map(l => (
            <span key={l} style={{ color: '#334155', fontSize: 12, cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
};

const s = {
  page: {
    minHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden',
    backgroundColor: '#060912', fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#f1f5f9', display: 'flex', flexDirection: 'column',
  },
  bgImage: {
    position: 'absolute', inset: 0,
    backgroundImage: 'url(/hero_bg.png)', backgroundSize: 'cover',
    backgroundPosition: 'center', opacity: 0.18, zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'linear-gradient(135deg, rgba(6,9,18,0.92) 0%, rgba(6,9,18,0.75) 100%)',
  },
  orb1: {
    position: 'absolute', top: '-80px', right: '10%',
    width: 500, height: 500, borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
  },
  orb2: {
    position: 'absolute', bottom: '-60px', left: '-30px',
    width: 380, height: 380, borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)',
  },
  grid: {
    position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
    backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
    backgroundSize: '64px 64px',
  },
  nav: {
    position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 8%',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
  },
  logoBox: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(79,70,229,0.38)',
  },
  brandName: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' },
  navRegLink: {
    fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none',
  },
  main: {
    flex: 1, position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 80, padding: '48px 8%', flexWrap: 'wrap',
  },
  left: { flex: '1 1 400px', maxWidth: 540 },
  badge: {
    display: 'inline-block', padding: '6px 16px',
    background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.22)',
    borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: '2.5px',
    color: '#a5b4fc', marginBottom: 28,
  },
  heroText: { fontSize: 'clamp(44px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', marginBottom: 20 },
  accent: {
    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  desc: { fontSize: 16, color: '#94a3b8', lineHeight: 1.75, marginBottom: 36, fontWeight: 500 },
  infoCards: { display: 'flex', flexDirection: 'column', gap: 14 },
  infoCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16, padding: '14px 20px',
  },
  infoIcon: { fontSize: 20, flexShrink: 0 },
  infoText: { fontSize: 14, color: '#94a3b8', fontWeight: 500 },
  card: {
    width: 440, background: 'rgba(10,14,28,0.82)', backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 36, padding: '44px 44px',
    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
    flexShrink: 0,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 },
  cardTitle: { fontSize: 30, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 },
  dot: { color: '#6366f1' },
  cardSubtitle: { fontSize: 13, color: '#475569', fontWeight: 500 },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 12, padding: '12px 16px', marginBottom: 20,
    fontSize: 13, color: '#f87171', fontWeight: 600,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 22 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 10, fontWeight: 800, color: '#475569', letterSpacing: '1.5px', textTransform: 'uppercase' },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    display: 'flex', alignItems: 'center', pointerEvents: 'none',
  },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 14, padding: '14px 16px 14px 42px',
    color: '#f1f5f9', fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'inherit',
  },
  inputErr: { borderColor: 'rgba(239,68,68,0.5)', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
  },
  errText: { fontSize: 12, color: '#f87171', fontWeight: 600 },
  forgot: { fontSize: 12, color: '#818cf8', fontWeight: 700, textDecoration: 'none' },
  btn: {
    width: '100%', padding: '16px', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 10px 30px -8px rgba(79,70,229,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    letterSpacing: '0.2px', transition: 'all 0.2s',
  },
  btnDisabled: { opacity: 0.65, cursor: 'not-allowed' },
  spinRow: { display: 'flex', alignItems: 'center', gap: 10 },
  spinner: {
    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.25)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 20px',
  },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
  dividerText: { fontSize: 12, color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' },
  registerBtn: {
    width: '100%', boxSizing: 'border-box', padding: '14px',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
    background: 'rgba(255,255,255,0.03)', color: '#94a3b8',
    fontSize: 14, fontWeight: 700, textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    position: 'relative', zIndex: 10, padding: '28px 8%',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: 12, fontWeight: 500,
    flexWrap: 'wrap', gap: 12,
  },
};

export default Login;