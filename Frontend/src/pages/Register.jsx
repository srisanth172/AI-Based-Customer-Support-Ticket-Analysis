// src/pages/Register.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EyeIcon = ({ open }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
      stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#64748b" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="1.8"/>
  </svg>
);

// Password strength checker
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let strength = 'weak';
  let color = '#ef4444';
  if (passed >= 4) { strength = 'medium'; color = '#f59e0b'; }
  if (passed === 5) { strength = 'strong'; color = '#10b981'; }
  return { checks, passed, strength, color };
};

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]).{8,}$/;

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  const strength = checkPasswordStrength(formData.password);

  const validate = () => {
    const e = {};
    if (!formData.name.trim())  e.name = 'Full name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email address';

    if (!formData.password) {
      e.password = 'Password is required';
    } else if (!STRONG_PASSWORD_REGEX.test(formData.password)) {
      e.password = 'Use 8+ characters with uppercase, lowercase, number & symbol (e.g. Hello@123)';
    }

    if (!formData.confirm) {
      e.confirm = 'Please confirm your password';
    } else if (formData.password !== formData.confirm) {
      e.confirm = 'Passwords do not match';
    }
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
      await register(formData.name, formData.email, formData.password, 'customer');
    } catch (error) {
      setApiError(error?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthBarWidth = `${(strength.passed / 5) * 100}%`;

  return (
    <div style={s.page}>
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
        <Link to="/login" style={s.navLoginLink}>
          Already have an account? <span style={{ color: '#4ADE80' }}>Sign in →</span>
        </Link>
      </nav>

      <main style={s.main}>

        {/* FORM CARD */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          style={s.card}
        >
          <div style={s.cardHeader}>
            <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <h2 style={s.cardTitle}>Create account<span style={s.dot}>.</span></h2>
              <p style={s.cardSubtitle}>All fields are required</p>
            </div>
          </div>

          {/* API error */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={s.errorBanner}
            >
              <span>⚠️</span> {apiError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={s.form} noValidate>

            {/* Full Name */}
            <div style={s.field}>
              <label style={s.label}>FULL NAME</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#475569" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#475569" strokeWidth="1.8"/>
                  </svg>
                </span>
                <input
                  id="reg-name" name="name" type="text"
                  autoComplete="name" placeholder="John Doe"
                  value={formData.name} onChange={handleChange}
                  style={errors.name ? { ...s.input, ...s.inputErr } : s.input}
                />
              </div>
              {errors.name && <span style={s.errText}>{errors.name}</span>}
            </div>

            {/* Email */}
            <div style={s.field}>
              <label style={s.label}>EMAIL ADDRESS</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="#475569" strokeWidth="1.8"/>
                    <path d="M22 6l-10 7L2 6" stroke="#475569" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  id="reg-email" name="email" type="email"
                  autoComplete="email" placeholder="john@example.com"
                  value={formData.email} onChange={handleChange}
                  style={errors.email ? { ...s.input, ...s.inputErr } : s.input}
                />
              </div>
              {errors.email && <span style={s.errText}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div style={s.field}>
              <label style={s.label}>PASSWORD</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#475569" strokeWidth="1.8"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#475569" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  id="reg-password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" placeholder="Min 8 chars, e.g. Hello@123"
                  value={formData.password} onChange={handleChange}
                  style={errors.password
                    ? { ...s.input, ...s.inputErr, paddingRight: 48 }
                    : { ...s.input, paddingRight: 48 }
                  }
                />
                <button type="button" id="toggle-reg-pass" onClick={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {/* Strength bar */}
              {formData.password && (
                <div style={s.strengthWrap}>
                  <div style={s.strengthBar}>
                    <motion.div
                      animate={{ width: strengthBarWidth, background: strength.color }}
                      style={s.strengthFill}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span style={{ ...s.strengthLabel, color: strength.color }}>
                    {strength.strength.charAt(0).toUpperCase() + strength.strength.slice(1)} password
                  </span>
                </div>
              )}
              {/* Requirement hints */}
              {formData.password && (
                <div style={s.hints}>
                  {[
                    { key: 'length', text: '8+ characters' },
                    { key: 'upper', text: 'Uppercase letter' },
                    { key: 'lower', text: 'Lowercase letter' },
                    { key: 'number', text: 'Number' },
                    { key: 'symbol', text: 'Symbol (!@#...)' },
                  ].map(h => (
                    <span key={h.key} style={{ ...s.hint, color: strength.checks[h.key] ? '#10b981' : '#475569' }}>
                      {strength.checks[h.key] ? '✓' : '○'} {h.text}
                    </span>
                  ))}
                </div>
              )}
              {errors.password && <span style={s.errText}>{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div style={s.field}>
              <label style={s.label}>CONFIRM PASSWORD</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.6 9.8A9 9 0 1121 12" stroke="#475569" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  id="reg-confirm" name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password" placeholder="Repeat your password"
                  value={formData.confirm} onChange={handleChange}
                  style={errors.confirm
                    ? { ...s.input, ...s.inputErr, paddingRight: 48 }
                    : { ...s.input, paddingRight: 48 }
                  }
                />
                <button type="button" id="toggle-reg-confirm" onClick={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {errors.confirm && <span style={s.errText}>{errors.confirm}</span>}
            </div>

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
                  Creating account...
                </span>
              ) : 'Create Account'}
            </motion.button>
          </form>

          <p style={s.terms}>
            By creating an account you agree to our{' '}
            <span style={s.termLink}>Terms of Service</span> and{' '}
            <span style={s.termLink}>Privacy Policy</span>.
          </p>

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>Already registered?</span>
            <span style={s.dividerLine} />
          </div>

          <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
              whileHover={{ borderColor: 'rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.06)' }}
              style={s.loginBtn}
            >
              Sign in to your account
            </motion.div>
          </Link>
        </motion.div>
      </main>

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
    backgroundPosition: 'center', opacity: 0.15, zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'linear-gradient(135deg, rgba(2,11,6,0.95) 0%, rgba(2,11,6,0.80) 100%)',
  },
  orb1: {
    position: 'absolute', top: '-80px', right: '10%', width: 460, height: 460,
    borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%)',
  },
  orb2: {
    position: 'absolute', bottom: '-60px', left: '-30px', width: 360, height: 360,
    borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%)',
  },
  nav: {
    position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 8%', borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logoBox: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(to bottom right, #4ADE80, #16A34A)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
  },
  brandName: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: '#fff' },
  navLoginLink: { fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none' },
  main: {
    flex: 1, position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 8%',
  },
  card: {
    width: 460, background: 'rgba(4,18,9,0.82)', backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 36, padding: '40px 44px',
    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
    flexShrink: 0,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 },
  cardTitle: { fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 4 },
  dot: { color: '#22C55E' },
  cardSubtitle: { fontSize: 12, color: '#475569', fontWeight: 500 },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 12, padding: '12px 16px', marginBottom: 20,
    fontSize: 13, color: '#f87171', fontWeight: 600,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 10, fontWeight: 800, color: '#475569', letterSpacing: '1.5px', textTransform: 'uppercase' },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    display: 'flex', alignItems: 'center', pointerEvents: 'none',
  },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, padding: '13px 16px 13px 42px',
    color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputErr: { borderColor: 'rgba(239,68,68,0.5)', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
  },
  strengthWrap: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 },
  strengthBar: {
    flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 4, transition: 'all 0.3s' },
  strengthLabel: { fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  hints: { display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 6 },
  hint: { fontSize: 11, fontWeight: 600 },
  errText: { fontSize: 12, color: '#f87171', fontWeight: 600 },
  btn: {
    width: '100%', padding: '15px', borderRadius: 14, border: 'none',
    background: '#22C55E', color: '#020B06',
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 10px 28px -8px rgba(34,197,94,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    letterSpacing: '0.2px', transition: 'all 0.2s', marginTop: 6,
  },
  btnDisabled: { opacity: 0.65, cursor: 'not-allowed' },
  spinRow: { display: 'flex', alignItems: 'center', gap: 10 },
  spinner: {
    width: 17, height: 17, border: '2px solid rgba(2,11,6,0.25)',
    borderTopColor: '#020B06', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  terms: { fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 16, lineHeight: 1.6 },
  termLink: { color: '#4ADE80', fontWeight: 700, cursor: 'pointer' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
  dividerText: { fontSize: 11, color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' },
  loginBtn: {
    width: '100%', boxSizing: 'border-box', padding: '13px',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
    background: 'rgba(255,255,255,0.03)', color: '#94a3b8',
    fontSize: 14, fontWeight: 700, textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    position: 'relative', zIndex: 10, padding: '28px 8%',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    display: 'flex', justifyContent: 'space-between', color: '#334155',
    fontSize: 12, fontWeight: 500, flexWrap: 'wrap', gap: 12,
  },
};

export default Register;
