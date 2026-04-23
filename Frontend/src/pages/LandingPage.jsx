// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 12c-2.5 0-4.7-1.3-6-3.2.03-2 4-3.1 6-3.1s5.97 1.1 6 3.1c-1.3 1.9-3.5 3.2-6 3.2z" fill="currentColor" />
      </svg>
    ),
    title: 'AI Sentiment Analysis',
    desc: 'Real-time emotion detection on every customer message for smarter triage.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2zm0 18a8 8 0 010-16 8 8 0 010 16z" fill="currentColor" />
      </svg>
    ),
    title: 'Priority Scoring',
    desc: 'ML-powered algorithms rank tickets by urgency so critical issues are never missed.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor" />
      </svg>
    ),
    title: 'Spam Detection',
    desc: 'Vision AI cross-validates uploaded images against descriptions to filter bad-faith reports.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3.5 18.5l6-6 4 4L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 6h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Live Dashboard',
    desc: 'WebSocket-driven admin panel refreshes in real time as tickets are created.'
  },
];

const STATS = [
  { value: '10×', label: 'Faster Resolution' },
  { value: '98%', label: 'Accuracy Rate' },
  { value: '60%', label: 'Less Manual Triage' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={s.page}>
      {/* ── HERO BG ── */}
      <div style={s.heroBg} />
      <div style={s.heroOverlay} />

      {/* Ambient orbs */}
      <div style={{ ...s.orb, top: '10%', left: '8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
      <div style={{ ...s.orb, bottom: '15%', right: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)' }} />

      {/* ── NAVBAR ── */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.brand}>
          <div style={s.logoBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fff" />
            </svg>
          </div>
          <span style={s.brandName}>SupportIQ</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}
          whileTap={{ scale: 0.97 }}
          style={s.navCta}
          onClick={() => navigate('/login')}
        >
          Get Started
        </motion.button>
      </nav>

      {/* ── HERO ── */}
      <header style={s.hero}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={s.heroInner}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={s.badge}
          >
            <span style={s.badgeDot} />
            AI-POWERED TICKET INTELLIGENCE
          </motion.div>

          <h1 style={s.headline}>
            Resolve Support Tickets{' '}
            <span style={s.accent}>10× Faster</span>
            {' '}with AI
          </h1>

          <p style={s.subhead}>
            Sentiment analysis, priority scoring, and real-time admin insights —
            all in one beautifully crafted platform.
          </p>

          {/* Stats row */}
          <div style={s.statsRow}>
            {STATS.map((st, i) => (
              <motion.div
                key={st.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={s.statItem}
              >
                <div style={s.statVal}>{st.value}</div>
                <div style={s.statLabel}>{st.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(99,102,241,0.55)' }}
            whileTap={{ scale: 0.97 }}
            style={s.heroCta}
            onClick={() => navigate('/login')}
          >
            Get Started
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </motion.div>
      </header>

      {/* ── FEATURES ── */}
      <section style={s.features}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={s.sectionLabel}
        >
          WHAT WE OFFER
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          style={s.sectionTitle}
        >
          Built for high-velocity support teams
        </motion.h2>
        <div style={s.grid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 24px 60px rgba(99,102,241,0.15)' }}
              style={s.card}
            >
              <div style={s.cardIcon}>{f.icon}</div>
              <h3 style={s.cardTitle}>{f.title}</h3>
              <p style={s.cardDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={s.ctaBanner}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={s.ctaInner}
        >
          <h2 style={s.ctaTitle}>The future of support is <span style={s.accent}>autonomous.</span></h2>
          <p style={s.ctaDesc}>
            Join support teams who let AI handle triage while they focus on what matters — customers.
          </p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(99,102,241,0.5)' }}
            whileTap={{ scale: 0.97 }}
            style={s.heroCta}
            onClick={() => navigate('/login')}
          >
            Get Started Free
          </motion.button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerBrand}>
          <div style={s.logoBox}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fff" /></svg></div>
          <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>SupportIQ © 2025</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={s.footerLink}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
};

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#060912',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#f1f5f9',
    position: 'relative',
    overflowX: 'hidden',
  },
  heroBg: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'url(/hero_bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    opacity: 0.28,
    zIndex: 0,
  },
  heroOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1,
    background: 'linear-gradient(180deg, rgba(6,9,18,0.5) 0%, rgba(6,9,18,0.75) 60%, rgba(6,9,18,0.98) 100%)',
  },
  orb: { position: 'absolute', borderRadius: '50%', pointerEvents: 'none', zIndex: 1 },
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 8%',
    transition: 'all 0.3s',
  },
  navScrolled: {
    background: 'rgba(6,9,18,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 },
  logoBox: {
    width: 34, height: 34,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
  },
  brandName: { fontSize: 19, fontWeight: 800, letterSpacing: '-0.4px' },
  navCta: {
    position: 'relative', zIndex: 2,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    border: 'none', color: '#fff',
    padding: '10px 26px', borderRadius: 12,
    fontWeight: 800, fontSize: 14, cursor: 'pointer',
    letterSpacing: '0.2px',
    boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
    transition: 'all 0.2s',
  },
  hero: {
    position: 'relative', zIndex: 10,
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '120px 8% 80px',
    textAlign: 'center',
  },
  heroInner: { maxWidth: 820 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '7px 18px',
    background: 'rgba(79,70,229,0.12)',
    border: '1px solid rgba(79,70,229,0.28)',
    borderRadius: 100,
    fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#a5b4fc',
    marginBottom: 36,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#6366f1',
    boxShadow: '0 0 8px #6366f1',
    display: 'inline-block',
  },
  headline: {
    fontSize: 'clamp(42px, 6vw, 78px)',
    fontWeight: 900,
    lineHeight: 1.06,
    letterSpacing: '-3px',
    marginBottom: 24,
  },
  accent: {
    background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subhead: {
    fontSize: 19, color: '#94a3b8', lineHeight: 1.7,
    marginBottom: 52, maxWidth: 640, margin: '0 auto 52px',
    fontWeight: 500,
  },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 52, flexWrap: 'wrap' },
  statItem: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20, padding: '20px 32px', textAlign: 'center', minWidth: 120,
  },
  statVal: { fontSize: 32, fontWeight: 900, color: '#f1f5f9' },
  statLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 },
  heroCta: {
    display: 'inline-flex', alignItems: 'center',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    border: 'none', color: '#fff',
    padding: '18px 48px', borderRadius: 16,
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 14px 40px rgba(79,70,229,0.4)',
    letterSpacing: '0.3px', transition: 'all 0.25s',
  },
  features: {
    position: 'relative', zIndex: 10,
    padding: '100px 8%',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 800, letterSpacing: '3px',
    color: '#6366f1', marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900,
    letterSpacing: '-1.5px', marginBottom: 60,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 28, maxWidth: 1200, margin: '0 auto',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 28, padding: '40px 32px',
    backdropFilter: 'blur(12px)',
    textAlign: 'left',
    transition: 'all 0.3s',
    cursor: 'default',
  },
  cardIcon: {
    width: 48, height: 48,
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#818cf8', marginBottom: 24,
    fontSize: 22,
  },
  cardTitle: { fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#f1f5f9', letterSpacing: '-0.3px' },
  cardDesc: { fontSize: 14, color: '#64748b', lineHeight: 1.7 },
  ctaBanner: {
    position: 'relative', zIndex: 10,
    padding: '80px 8%',
  },
  ctaInner: {
    maxWidth: 760, margin: '0 auto', textAlign: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.15) 0%, transparent 70%)',
    border: '1px solid rgba(79,70,229,0.15)',
    borderRadius: 40, padding: '72px 56px',
  },
  ctaTitle: { fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 20 },
  ctaDesc: { fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 44, maxWidth: 540, margin: '0 auto 44px' },
  footer: {
    position: 'relative', zIndex: 10,
    padding: '40px 8%',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 16,
  },
  footerBrand: { display: 'flex', alignItems: 'center', gap: 10 },
  footerLink: { color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

export default LandingPage;