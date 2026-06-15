import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView } from 'framer-motion';
import {
  Bot,
  Zap,
  Copy,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  Users,
  Star
} from 'lucide-react';

// --- HELPER COMPONENTS FOR ANIMATIONS ---

// 1. CountUp Number Component
const CountUpNumber = ({ end, suffix = "", prefix = "", duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let startTime;
      let animationFrame;
      const animate = (time) => {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

// 2. Typing Effect Component
const TypingEffect = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(intervalId);
      }, 20); // Typing speed
      return () => clearInterval(intervalId);
    }
  }, [isInView, text]);

  return (
    <span ref={ref}>
      {displayedText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-1.5 h-3.5 ml-1 bg-[#22C55E] align-middle"
      />
    </span>
  );
};

// --- MAIN LANDING PAGE COMPONENT ---

const LandingPage = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
  };

  return (
    // Premium dark SaaS background with vertical gradient
    <div className="min-h-screen bg-gradient-to-b from-[#020B06] to-[#041209] text-slate-300 font-sans selection:bg-emerald-500 selection:text-black overflow-x-hidden relative z-0">

      {/* ── AMBIENT ANIMATED BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top radial glow - slow pulse */}
        <motion.div
          animate={{ opacity: [0.2, 0.38, 0.2], scale: [1, 1.06, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[110vw] h-[800px] bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.13)_0%,_transparent_65%)]"
        />
        {/* Left side glow - drifts slowly */}
        <motion.div
          animate={{ opacity: [0.03, 0.07, 0.03], x: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[-8%] w-[450px] h-[450px] bg-emerald-500 blur-[300px] rounded-full"
        />
        {/* Right side glow */}
        <motion.div
          animate={{ opacity: [0.03, 0.06, 0.03], x: [0, -15, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-8%] right-[-4%] w-[550px] h-[550px] bg-emerald-500 blur-[300px] rounded-full"
        />
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/[0.06] bg-[#020B06]/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Swift Support Logo" className="w-9 h-9 object-contain" />
          <span className="text-lg font-bold tracking-tight text-white">Swift Support</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-white/5">
            Log in
          </Link>
          <Link to="/register" className="px-5 py-2 text-sm font-bold bg-white text-black hover:bg-slate-100 rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_28px_rgba(255,255,255,0.3)] hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center max-w-4xl">

          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(34,197,94,0.25)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/[0.07] border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-10 shadow-[0_0_20px_rgba(16,185,129,0.1)] cursor-default"
          >
            <Sparkles size={12} className="animate-pulse" /> Smart AI Support
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-[4.5rem] lg:text-[5.25rem] font-extrabold tracking-tight mb-7 leading-[1.1] relative"
          >
            {/* Soft green glow behind text */}
            <span className="absolute inset-0 -z-10 blur-[90px] opacity-[0.18] bg-[radial-gradient(ellipse_at_center,_#10b981,_transparent_70%)]" aria-hidden="true" />
            {/* Line 1 */}
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-300">
              Resolve Support Tickets
            </span>
            {/* Line 2 — highlighted phrase inline with rest */}
            <span className="block mt-1">
              <motion.span
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="text-transparent bg-clip-text bg-[length:200%_auto] bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 drop-shadow-[0_0_32px_rgba(16,185,129,0.4)] inline"
              >
                10x Faster
              </motion.span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-300"> with AI.</span>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-[1.1rem] text-slate-400 mb-11 max-w-xl leading-[1.75] tracking-[0.01em]"
          >
            Scale your customer service without scaling your headcount.
            Automatically classify, prioritize, and draft resolutions for every incoming ticket — in seconds.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeInUp} className="mb-12 flex flex-col items-center gap-4">
            {/* Primary CTA */}
            <motion.div
              whileHover={{ scale: 1.03, boxShadow: '0 0 60px rgba(16,185,129,0.4)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="inline-block rounded-2xl shadow-[0_8px_32px_rgba(16,185,129,0.25),_0_2px_8px_rgba(0,0,0,0.4)]"
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center bg-white text-black hover:bg-slate-50 px-11 py-4 rounded-2xl text-[1rem] font-black transition-colors duration-200 gap-3 group"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </motion.div>
            {/* Secondary ghost link */}
            <Link
              to="/login"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 flex items-center gap-1.5"
            >
              Already have an account? <span className="text-emerald-400 font-semibold">Sign in →</span>
            </Link>
          </motion.div>

          {/* Trust Section */}
          <motion.div variants={fadeInUp} className="flex flex-col items-center gap-5 mb-20">

            {/* Avatar row + text */}
            <div className="flex items-center gap-3">
              {/* Avatar stack with initials */}
              <div className="flex -space-x-2.5">
                {[
                  { initials: 'AR', bg: 'from-emerald-500 to-teal-600' },
                  { initials: 'SL', bg: 'from-violet-500 to-indigo-600' },
                  { initials: 'JK', bg: 'from-amber-400 to-orange-500' },
                  { initials: 'MR', bg: 'from-pink-500 to-rose-600' },
                ].map((av, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${av.bg} border-2 border-[#0B0F1A] flex items-center justify-center text-[9px] font-bold text-white shadow-md`}
                  >
                    {av.initials}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border-2 border-[#020B06] flex items-center justify-center text-[9px] font-bold text-emerald-400">
                  +1k
                </div>
              </div>
              {/* Verified check + text */}
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span className="text-xs text-slate-400 font-medium">Trusted by <span className="text-slate-200 font-semibold">1,000+</span> support teams</span>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 w-full max-w-sm">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Trusted by teams at</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Company name badges */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {['TechNova', 'CloudSync', 'Nexaflow', 'DataPeak', 'StackWave'].map((name) => (
                <span
                  key={name}
                  className="text-[11px] font-semibold text-slate-500 px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] tracking-wide"
                >
                  {name}
                </span>
              ))}
            </div>

          </motion.div>
        </motion.div>

        {/* ── CENTRAL PRODUCT MOCKUP (Upgraded) ── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl rounded-2xl border border-white/[0.07] bg-[#041209]/90 backdrop-blur-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7),_0_0_50px_rgba(16,185,129,0.04)] overflow-hidden relative group"
        >
          {/* Edge Lighting */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Browser Chrome */}
          <div className="flex items-center px-4 py-3 border-b border-white/[0.06] bg-[#020B06]/80">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-white/10"></div>
            </div>
            <div className="mx-auto text-xs text-slate-500 font-mono flex items-center gap-2 bg-[#020B06] px-4 py-1.5 rounded-md border border-white/[0.06]">
              <Lock size={10} className="text-emerald-500" /> app.swiftsupport.ai
            </div>
          </div>

          <div className="flex h-[550px] text-sm text-left relative overflow-hidden">
            {/* Sidebar */}
            <div className="w-52 border-r border-white/[0.05] p-4 flex flex-col gap-1 hidden md:flex bg-[#020B06]/60">
              <div className="text-[10px] font-bold text-slate-600 tracking-wider mb-2 px-2 mt-2">WORKSPACE</div>
              <div className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] flex items-center gap-3 font-medium transition-colors cursor-default">
                <BarChart3 size={16} /> Dashboard
              </div>
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center gap-3 font-medium cursor-default border border-emerald-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                <MessageSquare size={16} /> Active Tickets
                <span className="ml-auto bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">3</span>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 pt-6 px-6 pb-2 flex flex-col gap-4 relative">
              <div className="flex justify-between items-start mb-2 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">#1042 - Billing cycle error</h3>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="text-slate-500">From: <span className="text-slate-300">Sarah Jenkins</span></span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 shadow-sm">Urgent</span>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs text-emerald-400 font-medium backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <Sparkles size={14} className="text-emerald-500" /> AI Context Analyzed
                </div>
              </div>

              {/* Customer Chat */}
              <div className="rounded-xl bg-[#020B06]/70 border border-white/[0.05] p-5">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Hello, I just received an invoice for my enterprise plan, but it looks like I was charged twice for the month of April. Can someone look into this immediately? Our accounting team is holding the expense report.
                </p>
              </div>

              {/* AI Suggestion Panel */}
              <div className="mt-auto rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-transparent overflow-hidden backdrop-blur-md relative shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60"></div>
                <div className="bg-black/20 px-4 py-2.5 border-b border-emerald-500/20 flex items-center justify-between">
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-2 tracking-wide uppercase">
                    <Bot size={14} className="text-emerald-500" /> Generated Draft
                  </div>
                  <div className="text-[10px] text-emerald-500/90 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">98% Match</div>
                </div>
                <div className="p-4">
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 font-medium min-h-[60px]">
                    {/* Implemented Typing Effect */}
                    <TypingEffect text="Hi Sarah, I sincerely apologize for the confusion. I reviewed your account and can confirm a duplicate charge was processed due to a system retry error. I have just issued a full refund for the duplicate amount ($499.00)." />
                  </p>
                  <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                      Approve & Send
                    </button>
                    <button className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg text-white text-sm font-medium transition-colors hover:border-white/20">
                      Edit Text
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/[0.06] mt-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">How Swift Support Works</h2>
          <p className="text-slate-400 text-base">Three simple steps to automate your support pipeline.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Hidden on mobile) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

          {[
            { icon: <MessageSquare />, title: "1. Ingest", desc: "Tickets flow in from email, chat, and portals. We sync in real-time." },
            { icon: <Cpu />, title: "2. Analyze", desc: "Our AI understands intent, sentiment, and past ticket history instantly." },
            { icon: <Zap />, title: "3. Resolve", desc: "Automate responses, route to the right agent, or trigger internal workflows." }
          ].map((step, idx) => (
            <motion.div
              key={idx}
              className="relative z-10 flex flex-col items-center text-center group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
            <motion.div
              whileHover={{ scale: 1.08, boxShadow: '0 0 32px rgba(16,185,129,0.2)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-24 h-24 rounded-full bg-[#020B06] border border-white/[0.07] flex items-center justify-center mb-6 shadow-xl cursor-default">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent flex items-center justify-center text-emerald-400">
                  {step.icon}
                </div>
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="border-y border-white/[0.06] bg-[#020B06] py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          {[
            { icon: <Zap size={24} />, value: 10, suffix: '×', label: 'Faster Resolution' },
            { icon: <ShieldCheck size={24} />, value: 98, suffix: '%', label: 'Accuracy Rate' },
            { icon: <Bot size={24} />, value: 60, suffix: '%', label: 'Auto-Handled' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center py-4"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                {stat.icon}
              </div>
              <h3 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
                <CountUpNumber end={stat.value} suffix={stat.suffix} />
              </h3>
              <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">A complete toolkit for modern support.</h2>
          <p className="text-slate-400 text-lg leading-relaxed">We've automated the repetitive tasks so your human agents can focus on building relationships and solving complex problems.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Bot />, title: "AI Classification", desc: "Instantly routes and tags tickets based on sentiment and urgency." },
            { icon: <Copy />, title: "Duplicate Detection", desc: "Merges similar issues seamlessly to prevent agent overlap." },
            { icon: <MessageSquare />, title: "Smart Chatbot", desc: "Deflects routine queries before a ticket is even created." },
            { icon: <Zap />, title: "Auto Resolution", desc: "Drafts hyper-accurate replies based on your knowledge base." }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(16,185,129,0.08)' }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 280, damping: 22 }}
              className="group relative p-8 rounded-2xl bg-[#041209] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-default overflow-hidden"
            >
              {/* Subtle hover background glow inside card */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

              <div className="w-14 h-14 rounded-xl bg-[#020B06] border border-white/[0.08] flex items-center justify-center mb-6 text-slate-400 group-hover:text-[#020B06] group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-colors shadow-lg">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/[0.06]">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">Loved by Support Teams</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              quote: '"Swift Support has completely transformed how we handle our ticket backlog. The AI drafts are so accurate we rarely have to edit them."',
              name: 'Alex Rivera', role: 'Head of CX, TechNova', delay: 0
            },
            {
              quote: '"We\'ve reduced our resolution time by over 8x since implementing the smart triage system. Absolute game changer."',
              name: 'Samantha Lee', role: 'Support Lead, CloudSync', delay: 0.12
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              className="p-8 rounded-2xl bg-[#041209] border border-white/[0.07] relative transition-colors duration-200"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: t.delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ borderColor: 'rgba(16,185,129,0.2)', boxShadow: '0 8px 32px rgba(16,185,129,0.06)' }}
            >
              <div className="flex gap-1 text-emerald-500 mb-4">
                {[...Array(5)].map((_, s) => <Star key={s} size={15} fill="currentColor" />)}
              </div>
              <p className="text-slate-400 italic mb-6 leading-relaxed">{t.quote}</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-white">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{t.name}</h4>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] bg-[#020B06] py-10 text-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-white tracking-tight text-base">Swift Support</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="#" className="hover:text-emerald-400 hover:underline transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-emerald-400 hover:underline transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-emerald-400 hover:underline transition-colors">Contact</Link>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs">
            <span>© {new Date().getFullYear()} Swift Support Inc.</span>
          </div>
        </div>
      </footer>

      {/* CSS Keyframes injected for shimmering effect in the mockup */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default LandingPage;