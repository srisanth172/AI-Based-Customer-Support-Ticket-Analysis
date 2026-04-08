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
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/solid';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      {showBanner && (
        <div className="relative bg-indigo-50 py-3 px-4 text-center text-sm border-b border-indigo-100">
          <div className="flex flex-wrap items-center justify-center gap-1.5 lg:gap-2 text-indigo-900">
            <SparklesIcon className="h-4 w-4 text-indigo-600" />
            <span className="font-bold tracking-tight">ClarityHelp <span className="font-normal opacity-80">Connect</span></span>
            <span className="hidden sm:inline text-indigo-300">&middot;</span>
            <span>Join our upcoming webinar on scaling customer service with autonomous AI workflows.</span>
            <Link to="/register" className="font-semibold text-indigo-700 underline hover:text-indigo-900 underline-offset-2 ml-1">Save your seat</Link>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-700 hidden sm:block transition-colors"
            aria-label="Close banner"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Top Mini Nav */}
      <div className="mx-auto max-w-[1400px] px-6 py-2.5 flex justify-end gap-6 text-[13px] text-slate-500 font-medium">
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
          Sign in
        </button>
        <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
          <PhoneIcon className="h-3 w-3 text-slate-400" />
          Contact Sales
        </button>
        <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
          <GlobeAltIcon className="h-3.5 w-3.5 text-slate-400" />
          Region: US
        </button>
      </div>

      {/* Main Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-[1400px] px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <path d="M12 7v6"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">ClarityHelp</span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-8 text-[15px] font-semibold text-slate-600">
              <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                Features <ChevronDownIcon className="h-3.5 w-3.5 stroke-[3]" />
              </button>
              <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                Use Cases <ChevronDownIcon className="h-3.5 w-3.5 stroke-[3]" />
              </button>
              <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                Company <ChevronDownIcon className="h-3.5 w-3.5 stroke-[3]" />
              </button>
              <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-4">
             <button onClick={() => navigate('/admin')} className="text-[15px] font-semibold text-slate-600 hover:text-indigo-600 px-4 py-2.5 transition-colors">
              Book Demo
            </button>
            <button onClick={() => navigate('/customer')} className="rounded-full bg-indigo-600 px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all">
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 text-center lg:pt-32 lg:pb-24">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-400/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-[900px] px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm mb-6 border border-indigo-100"
          >
            <SparklesIcon className="h-4 w-4" />
            V2.0 AI Routing is now live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[3rem] leading-[1.1] font-bold tracking-tight text-slate-900 sm:text-[4rem] lg:text-[4.5rem]"
          >
            Resolve tickets faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Autonomous AI.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-xl font-medium text-slate-500 sm:text-2xl max-w-3xl mx-auto leading-relaxed"
          >
            Empower your team with deep analysis, sentiment tracking, and automated responses that feel entirely human.
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-10 flex max-w-[480px] flex-col sm:flex-row items-center gap-3 p-1.5 rounded-2xl sm:rounded-full bg-white shadow-xl shadow-slate-200/50 border border-slate-200"
          >
            <input 
              type="email" 
              placeholder="Enter your work email" 
              className="w-full bg-transparent px-5 py-3 text-[15px] outline-none placeholder:text-slate-400 text-slate-800 font-medium"
            />
            <button 
              type="button"
              onClick={() => navigate('/customer')}
              className="w-full sm:w-auto shrink-0 rounded-xl sm:rounded-full bg-indigo-600 px-8 py-3 text-[15px] font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Get Started
            </button>
          </motion.form>
        </div>
      </section>

      {/* Hero Mockup */}
      <section className="mx-auto max-w-5xl px-4 mt-6 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden h-[380px] ring-1 ring-slate-100"
        >
          <div className="flex h-full w-full">
            {/* Sidebar mock */}
            <div className="w-[72px] bg-slate-900 h-full flex flex-col items-center py-6 space-y-8 border-r border-slate-800">
               <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
               </div>
              <div className="flex flex-col space-y-6 text-slate-400">
                 <div className="rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 p-2.5 text-white"><ChatBubbleLeftRightIcon className="h-5 w-5" /></div>
                 <CheckCircleIcon className="h-6 w-6 hover:text-white cursor-pointer transition-colors" />
                 <ChartBarIcon className="h-6 w-6 hover:text-white cursor-pointer transition-colors" />
                 <UserIcon className="h-6 w-6 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Main mock area */}
            <div className="flex-1 bg-slate-50/50 flex flex-col">
              <div className="px-8 py-5 flex items-center justify-between border-b border-slate-200 bg-white">
                 <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-800 tracking-tight">Active Workflows</span>
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide">3 Requires Attention</span>
                 </div>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700">Assign Tickets</button>
                 </div>
              </div>

               <div className="p-8 flex gap-6 h-full overflow-hidden">
                  {/* Mock card */}
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 w-80 flex flex-col gap-5">
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm">
                             <span className="text-2xl">👩🏼‍💻</span>
                          </div>
                          <div>
                             <div className="font-bold text-[15px] text-slate-900 flex items-center gap-2">
                                Sarah Jenkins
                             </div>
                             <div className="text-[13px] font-medium text-slate-500 mt-0.5">Enterprise Client</div>
                          </div>
                       </div>
                       <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Urgent</span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 border border-slate-100">
                       "My dashboard is failing to load the Q3 reports. We have a board meeting in 2 hours."
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                       <SparklesIcon className="h-4 w-4" />
                       AI Suggestion: Escalate & Reboot Node
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 w-80 flex flex-col gap-5 opacity-50 blur-[1px]">
                     <div className="flex items-start justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm">
                             <span className="text-2xl">👨🏽‍💼</span>
                          </div>
                          <div>
                             <div className="font-bold text-[15px] text-slate-900 flex items-center gap-2">
                                Michael Chang
                             </div>
                             <div className="text-[13px] font-medium text-slate-500 mt-0.5">Starter Plan</div>
                          </div>
                       </div>
                       <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Low</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 rounded-full bg-slate-900 px-6 py-4 shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300 font-semibold text-white tracking-wide"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" />
        Chat with Expert
      </button>

    </div>
  );
};

export default LandingPage;