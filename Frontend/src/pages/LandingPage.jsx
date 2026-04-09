import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  GlobeAltIcon,
  XMarkIcon,
  ChevronDownIcon,
  PhoneIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  SparklesIcon,
  ChartBarIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  BoltIcon,
  CpuChipIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/solid';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  transition: { duration: 0.5, delay },
  viewport: { once: true, amount: 0.3 },
});

const LandingPage = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);

  const features = [
    {
      icon: BoltIcon,
      title: 'Instant Triage',
      desc: 'AI sorts tickets by urgency, tone, and category in milliseconds — before your team even sees them.',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Human-Like Chat',
      desc: 'Customers interact through a guided chat flow that feels natural while keeping support organized.',
      gradient: 'from-indigo-500 to-violet-600',
    },
    {
      icon: ChartBarIcon,
      title: 'Sentiment Radar',
      desc: 'Real-time sentiment analysis highlights frustrated customers so your team can prioritize empathy.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: CpuChipIcon,
      title: 'Smart Routing',
      desc: 'Tickets are automatically assigned to the right agent based on skill, load, and context.',
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  const stats = [
    { value: '3x', label: 'Faster Response' },
    { value: '92%', label: 'AI Accuracy' },
    { value: '10K+', label: 'Teams Trust Us' },
    { value: '24/7', label: 'Always On' },
  ];

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500 selection:text-white">

      {/* ═══════════════ DARK HERO ZONE ═══════════════ */}
      <div className="relative bg-[#0a0a1a] text-white overflow-hidden">
        {/* Aurora gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent blur-[120px] rounded-full" />
          <div className="absolute top-[100px] right-[-100px] w-[600px] h-[600px] bg-gradient-to-bl from-purple-600/15 via-fuchsia-500/10 to-transparent blur-[100px] rounded-full" />
          <div className="absolute top-[200px] left-[-80px] w-[500px] h-[500px] bg-gradient-to-tr from-indigo-700/15 via-blue-500/10 to-transparent blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        </div>
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />




        {/* Main Nav */}
        <header className="sticky top-0 z-50 bg-[#0a0a1a]/70 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="mx-auto max-w-[1300px] px-6 h-[68px] flex items-center justify-between">
            <div className="flex items-center gap-14">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <span className="text-xl font-black tracking-tight text-white">ClarityHelp</span>
              </Link>

              {/* Nav Links */}
              <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-white/50">
                <button className="flex items-center gap-1 hover:text-white transition-colors duration-200">
                  Features <ChevronDownIcon className="h-3 w-3 stroke-[3]" />
                </button>
                <button className="flex items-center gap-1 hover:text-white transition-colors duration-200">
                  Use Cases <ChevronDownIcon className="h-3 w-3 stroke-[3]" />
                </button>
                <button className="flex items-center gap-1 hover:text-white transition-colors duration-200">
                  Company <ChevronDownIcon className="h-3 w-3 stroke-[3]" />
                </button>
                <Link to="/pricing" className="hover:text-white transition-colors duration-200">Pricing</Link>
              </nav>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="text-[14px] font-medium text-white/50 hover:text-white px-4 py-2 transition-colors duration-200">
                Sign in
              </button>
              <button onClick={() => navigate('/admin')} className="text-[14px] font-medium text-white/60 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200">
                Book Demo
              </button>
              <button onClick={() => navigate('/customer')} className="rounded-lg bg-indigo-600 px-5 py-2 text-[14px] font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 transition-all duration-200">
                Start Free Trial
              </button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <section className="relative z-10 pt-20 pb-8 text-center lg:pt-28 lg:pb-12">
          <div className="mx-auto max-w-[820px] px-4">



            {/* Headline */}
            <motion.h1 
              {...fadeUp(0.08)}
              className="text-[2.75rem] leading-[1.06] font-extrabold tracking-[-0.03em] text-white sm:text-[3.75rem] lg:text-[4.5rem]"
            >
              Resolve tickets faster{' '}
              <br className="hidden sm:block" />
              with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">Autonomous AI.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              {...fadeUp(0.16)}
              className="mt-6 text-lg font-medium text-white/50 sm:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              Empower your team with deep analysis, sentiment tracking, and automated responses that feel entirely human.
            </motion.p>

            {/* CTA Row */}
            <motion.div {...fadeUp(0.24)} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/customer')}
                className="group relative px-8 py-3.5 rounded-xl bg-indigo-600 text-[15px] font-bold text-white hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Get Started Free
                <ArrowRightIcon className="inline-block h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
              >
                <PlayCircleIcon className="h-5 w-5 text-indigo-400" />
                Watch Demo
              </button>
            </motion.div>

            {/* Microcopy */}
            <motion.p {...fadeUp(0.3)} className="mt-4 text-sm text-white/30 flex items-center justify-center gap-1.5">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500/70" />
              No credit card required · Free 14-day trial
            </motion.p>
          </div>
        </section>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-10 mx-auto max-w-3xl px-4 pb-16"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{stat.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/30">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Hero Mockup */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-black/30 overflow-hidden h-[380px] backdrop-blur-sm"
          >
            {/* Glow behind mockup */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-purple-600/20 blur-xl rounded-2xl pointer-events-none opacity-60" />
            
            <div className="relative flex h-full w-full">
              {/* Sidebar mock */}
              <div className="w-[68px] bg-[#111127] h-full flex flex-col items-center py-6 space-y-7 border-r border-white/[0.06]">
                 <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">C</span>
                 </div>
                <div className="flex flex-col space-y-5 text-white/20">
                   <div className="rounded-lg bg-indigo-600/80 p-2 text-white shadow-md shadow-indigo-600/30"><ChatBubbleLeftRightIcon className="h-4 w-4" /></div>
                   <CheckCircleIcon className="h-5 w-5 hover:text-white/60 cursor-pointer transition-colors" />
                   <ChartBarIcon className="h-5 w-5 hover:text-white/60 cursor-pointer transition-colors" />
                   <UserIcon className="h-5 w-5 hover:text-white/60 cursor-pointer transition-colors" />
                </div>
              </div>

              {/* Main mock area */}
              <div className="flex-1 bg-[#0d0d20] flex flex-col">
                <div className="px-7 py-4 flex items-center justify-between border-b border-white/[0.06]">
                   <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-white/90 tracking-tight">Active Workflows</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">3 Open</span>
                   </div>
                   <button className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-sm">Assign</button>
                </div>

                 <div className="p-6 flex gap-5 h-full overflow-hidden">
                    {/* Primary card */}
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-5 w-[300px] flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 ring-2 ring-amber-500/20">
                               <span className="text-lg">👩🏼‍💻</span>
                            </div>
                            <div>
                               <div className="font-bold text-sm text-white/90">Sarah Jenkins</div>
                               <div className="text-[11px] font-medium text-white/30 mt-0.5">Enterprise</div>
                            </div>
                         </div>
                         <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-rose-500/20">Urgent</span>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] p-3 text-[13px] text-white/50 border border-white/[0.06] leading-relaxed italic">
                         "Dashboard failing to load Q3 reports. Board meeting in 2 hours."
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-400">
                         <SparklesIcon className="h-3.5 w-3.5 animate-pulse" />
                         AI: Escalate → Reboot Node
                      </div>
                    </div>

                    {/* Secondary card (faded) */}
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5 w-[300px] flex flex-col gap-4 opacity-30">
                       <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 ring-2 ring-blue-500/20">
                               <span className="text-lg">👨🏽‍💼</span>
                            </div>
                            <div>
                               <div className="font-bold text-sm text-white/90">Michael Chang</div>
                               <div className="text-[11px] font-medium text-white/30 mt-0.5">Starter</div>
                            </div>
                         </div>
                         <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-emerald-500/20">Low</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════ LIGHT SECTIONS ═══════════════ */}

      {/* Trust Bar */}
      <section className="bg-white border-b border-slate-100 py-10">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Trusted by 10,000+ support teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4">
            {['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella', 'Hooli'].map((name) => (
              <span key={name} className="text-[16px] font-bold text-slate-200 tracking-wide select-none">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div {...fadeIn(0)} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs uppercase tracking-[0.15em] mb-4 border border-indigo-100">
              Why ClarityHelp
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
              Built for teams that want clarity,<br className="hidden sm:block" /> not noise.
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Four powerful capabilities that transform how your support team works.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -6 }}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div className={`inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 text-white shadow-lg shadow-indigo-500/10`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#0a0a1a] py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4">
          <motion.div {...fadeIn(0)} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] text-indigo-400 font-semibold text-xs uppercase tracking-[0.15em] mb-4 border border-white/[0.08]">
              How it works
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              From customer message to resolved ticket.
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Customer describes the issue', desc: 'The user opens the chat and explains their problem in natural language.', icon: UserIcon },
              { step: '02', title: 'AI reads the context', desc: 'The system classifies sentiment, priority, and support category instantly.', icon: CpuChipIcon },
              { step: '03', title: 'Team resolves quickly', desc: 'Support replies, resolves, and tracks the ticket from one unified screen.', icon: CheckCircleIcon },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.5 }}
                viewport={{ once: true, amount: 0.2 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-sm hover:border-indigo-500/30 transition-colors duration-300"
              >
                <div className="text-4xl font-black text-indigo-500/20 mb-4">{item.step}</div>
                <div className="inline-flex rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 mb-4 border border-indigo-500/10">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white/90">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/40">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div {...fadeIn(0)}>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Ready to transform your support?
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Join thousands of teams that use ClarityHelp to deliver faster, smarter customer service.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/customer')}
                className="group px-8 py-4 rounded-xl bg-indigo-600 text-[15px] font-bold text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Start your free trial
                <ArrowRightIcon className="inline-block h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-6 py-4 rounded-xl text-[15px] font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                <PlayCircleIcon className="h-5 w-5 text-indigo-500" />
                Watch Demo
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-400">No credit card required · Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white/40 py-12 border-t border-white/[0.05]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span className="font-bold text-white/60 text-sm">ClarityHelp</span>
          </div>
          <p className="text-sm">© 2026 ClarityHelp. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms</Link>
            <Link to="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-8 right-8 z-[60] flex items-center gap-2.5 rounded-full bg-indigo-600 px-6 py-3.5 shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:-translate-y-1 hover:shadow-indigo-500/40 active:scale-95 transition-all duration-300 font-semibold text-white tracking-wide group"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5 group-hover:rotate-6 transition-transform duration-300" />
        Chat with Expert
      </button>

    </div>
  );
};

export default LandingPage;
