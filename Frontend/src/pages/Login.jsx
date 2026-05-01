import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

const GoogleBtn = ({ onSuccess, onError, setLoading }) => {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    use_fedcm_for_prompt: true,
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await onSuccess(tokenResponse.access_token);
      } catch (err) {
        onError(err.response?.data?.message || 'Google Login failed');
        setLoading(false);
      }
    },
    onError: () => {
      onError('Google Login Failed');
      setLoading(false);
    },
  });

  const btnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    width: '100%', padding: '14px 20px', borderRadius: 14, cursor: 'pointer',
    background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'}`,
    color: '#e2e8f0', fontSize: 15, fontWeight: 700, letterSpacing: '0.1px',
    fontFamily: 'inherit', transition: 'all 0.2s ease',
    transform: active ? 'scale(0.98)' : 'scale(1)',
    boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
    marginBottom: 20,
  };

  return (
    <button
      id="google-signin-btn"
      type="button"
      style={btnStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onClick={handleGoogleLogin}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Sign in with Google
    </button>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
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

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.brand} onClick={() => navigate('/')} role="button">
          <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={s.brandName}>Swift Support</span>
        </div>
        <Link to="/register" style={s.navRegLink}>
          New here? <span style={{ color: '#4ADE80' }}>Create account →</span>
        </Link>
      </nav>

      {/* Main */}
      <main style={s.main}>
        {/* RIGHT CARD (Centered now) */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          style={s.card}
        >
          {/* Card header */}
          <div style={s.cardHeader}>
            <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
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

          <form onSubmit={handleSubmit} style={s.form} noValidate autoComplete="off">
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
                  id="auth_identifier"
                  type="text"
                  name="username"
                  autoComplete="one-time-code"
                  placeholder="Enter your username or email"
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
                  id="auth_secret"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Enter your password"
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
              whileHover={!loading ? { scale: 1.02, boxShadow: '0 16px 40px rgba(34,197,94,0.3)' } : {}}
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
            <span style={s.dividerText}>Or continue with</span>
            <span style={s.dividerLine} />
          </div>

          {GOOGLE_ENABLED && <GoogleBtn onSuccess={googleLogin} onError={setApiError} setLoading={setLoading} />}

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>Don't have an account?</span>
            <span style={s.dividerLine} />
          </div>

          <Link to="/register" style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileHover={{ borderColor: 'rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.06)' }}
              style={s.registerBtn}
            >
              Create a free account
            </motion.div>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <span>© {new Date().getFullYear()} Swift Support Inc.</span>
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
    backgroundColor: '#020B06', fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#f1f5f9', display: 'flex', flexDirection: 'column',
  },
  bgImage: {
    position: 'absolute', inset: 0,
    backgroundImage: 'url(/hero_bg.png)', backgroundSize: 'cover',
    backgroundPosition: 'center', opacity: 0.1, zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'linear-gradient(135deg, rgba(2,11,6,0.95) 0%, rgba(2,11,6,0.8) 100%)',
  },
  orb1: {
    position: 'absolute', top: '-80px', right: '10%',
    width: 500, height: 500, borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
  },
  orb2: {
    position: 'absolute', bottom: '-60px', left: '-30px',
    width: 380, height: 380, borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%)',
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
    background: 'linear-gradient(to bottom right, #4ADE80, #16A34A)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
  },
  brandName: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: '#fff' },
  navRegLink: {
    fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none',
  },
  main: {
    flex: 1, position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 8%',
  },
  card: {
    width: 440, background: 'rgba(4,18,9,0.82)', backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 36, padding: '44px 44px',
    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
    flexShrink: 0,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 },
  cardTitle: { fontSize: 30, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 },
  dot: { color: '#22C55E' },
  cardSubtitle: { fontSize: 13, color: '#475569', fontWeight: 500 },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.2)',
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
    background: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.09)',
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
  forgot: { fontSize: 12, color: '#4ADE80', fontWeight: 700, textDecoration: 'none' },
  btn: {
    width: '100%', padding: '16px', borderRadius: 14, border: 'none',
    background: '#22C55E', color: '#020B06',
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 10px 30px -8px rgba(34,197,94,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    letterSpacing: '0.2px', transition: 'all 0.2s',
  },
  btnDisabled: { opacity: 0.65, cursor: 'not-allowed' },
  spinRow: { display: 'flex', alignItems: 'center', gap: 10 },
  spinner: {
    width: 18, height: 18, border: '2px solid rgba(2,11,6,0.25)',
    borderTopColor: '#020B06', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 20px',
  },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
  dividerText: { fontSize: 12, color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' },
  registerBtn: {
    width: '100%', boxSizing: 'border-box', padding: '14px',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
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