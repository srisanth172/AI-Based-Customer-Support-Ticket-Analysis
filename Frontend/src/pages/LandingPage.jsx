import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
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
  Star
} from 'lucide-react';

// --- FIXED HELPER COMPONENTS ---

const CountUpNumber = ({ end, suffix = "", duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const TypingEffect = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(intervalId);
      }, 30);
      return () => clearInterval(intervalId);
    }
  }, [isInView, text]);

  return (
    <span ref={ref}>
      {displayedText}
      <motion.span 
        animate={{ opacity: [0, 1, 0] }} 
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-1.5 h-3.5 ml-1 bg-[#8B5CF6] align-middle"
      />
    </span>
  );
};

// --- MAIN LANDING PAGE ---

const LandingPage = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    // Deep dark violet-tinted background
    <div className="min-h-screen bg-[#06040A] text-zinc-300 font-sans selection:bg-[#8B5CF6] selection:text-white overflow-x-hidden relative z-0">
      
      {/* ── AMBIENT ANIMATED BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120vw] h-[900px] bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.15)_0%,_transparent_60%)]"
        />
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-[#8B5CF6] blur-[250px] opacity-[0.07] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#6D28D9] blur-[250px] opacity-[0.05] rounded-full mix-blend-screen" />
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A78BFA] to-[#6D28D9] flex items-center justify-center font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.3)]">
            AI
          </div>
          <span className="text-xl font-bold tracking-tight text-white">SupportFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-violet-200/60 hover:text-white transition-colors">
            Log in
          </Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-semibold bg-white text-[#06040A] hover:bg-zinc-200 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center max-w-4xl">
          
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#A78BFA] text-xs font-semibold uppercase tracking-widest mb-8 shadow-[0_0_20px_rgba(139,92,246,0.1)] backdrop-blur-md">
            <Sparkles size={14} className="animate-pulse" /> AI-Powered Support System
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
              Resolve Support Tickets
            </span>
            <br />
            {/* Animated Glowing Text */}
            <motion.span 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="text-transparent bg-clip-text bg-[length:200%_auto] bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#8B5CF6] drop-shadow-[0_0_25px_rgba(139,92,246,0.4)] inline-block"
            >
              10× Faster
            </motion.span> 
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
              {" "}with AI.
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg text-violet-200/60 mb-10 max-w-2xl leading-relaxed font-medium">
            Scale your customer service without scaling your headcount. Automatically tag, prioritize, and draft pixel-perfect resolutions for every incoming ticket.
          </motion.p>

          {/* Interactive CTA */}
          <motion.div variants={fadeInUp} className="w-full max-w-md mx-auto mb-14 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#8B5CF6]/30 to-[#6D28D9]/30 rounded-full blur-md opacity-40 group-hover:opacity-80 transition duration-500"></div>
            <form className="relative flex items-center p-1.5 bg-[#0A0710] border border-white/10 rounded-full focus-within:border-[#8B5CF6]/60 focus-within:ring-1 focus-within:ring-[#8B5CF6]/60 transition-all shadow-2xl">
              <input 
                type="email" 
                placeholder="Enter your work email" 
                required
                className="w-full bg-transparent text-white px-5 py-2.5 outline-none text-sm placeholder:text-zinc-500"
              />
              <button 
                type="submit" 
                className="bg-[#8B5CF6] text-white hover:bg-[#9366F9] hover:scale-[1.02] active:scale-[0.98] px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                Start Free <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex items-center gap-4 text-xs text-violet-300/40 font-medium tracking-wide mb-20 uppercase">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-[#06040A]"></div>
              <div className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-[#06040A]"></div>
              <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 border-2 border-[#06040A] flex items-center justify-center text-[8px] text-[#A78BFA]">+1k</div>
            </div>
            <span>Trusted by forward-thinking teams</span>
          </motion.div>
        </motion.div>

        {/* ── CENTRAL PRODUCT MOCKUP ── */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-[#0A0710]/80 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,1),_0_0_40px_rgba(139,92,246,0.05)] overflow-hidden relative group"
        >
          {/* Edge Lighting */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6]/60 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* Browser Chrome */}
          <div className="flex items-center px-4 py-3 border-b border-white/[0.05] bg-black/40">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-white/10"></div>
            </div>
            <div className="mx-auto text-xs text-violet-200/40 font-mono flex items-center gap-2 bg-black/50 px-4 py-1.5 rounded-md border border-white/[0.04]">
               <Lock size={10} className="text-[#8B5CF6]" /> app.supportflow.ai
            </div>
          </div>
          
          <div className="flex h-[500px] text-sm text-left relative overflow-hidden">
            {/* Sidebar */}
            <div className="w-56 border-r border-white/5 p-4 flex flex-col gap-1 hidden md:flex bg-black/20">
              <div className="text-[10px] font-bold text-violet-300/30 tracking-wider mb-2 px-2 mt-2">WORKSPACE</div>
              <div className="px-3 py-2 rounded-lg text-violet-200/50 hover:text-white hover:bg-white/5 flex items-center gap-3 font-medium transition-colors cursor-default">
                <BarChart3 size={16} /> Dashboard
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#8B5CF6]/10 text-[#A78BFA] flex items-center gap-3 font-medium cursor-default border border-[#8B5CF6]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                <MessageSquare size={16} /> Active Tickets
                <span className="ml-auto bg-[#8B5CF6] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">3</span>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 p-6 flex flex-col gap-4 relative">
              <div className="flex justify-between items-start mb-2 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">#1042 - Billing cycle error</h3>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="text-violet-200/50">From: <span className="text-violet-100/90">Sarah Jenkins</span></span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 shadow-sm">Urgent</span>
                  </div>
                </div>
                <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs text-[#A78BFA] font-medium backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                  <Sparkles size={14} className="text-[#8B5CF6]" /> AI Context Analyzed
                </div>
              </div>

              {/* Customer Chat */}
              <div className="rounded-xl bg-black/30 border border-white/[0.06] p-5 shadow-inner">
                 <p className="text-violet-100/80 text-sm leading-relaxed">
                   Hello, I just received an invoice for my enterprise plan, but it looks like I was charged twice for the month of April. Can someone look into this immediately? Our accounting team is holding the expense report.
                 </p>
              </div>

              {/* AI Suggestion Panel */}
              <div className="mt-auto rounded-xl border border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/[0.08] to-transparent overflow-hidden backdrop-blur-md relative shadow-[0_0_30px_rgba(139,92,246,0.05)]">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent opacity-60"></div>
                 <div className="bg-black/20 px-4 py-2.5 border-b border-[#8B5CF6]/20 flex items-center justify-between">
                    <div className="text-xs text-[#A78BFA] font-bold flex items-center gap-2 tracking-wide uppercase">
                      <Bot size={14} className="text-[#8B5CF6]" /> Generated Draft
                    </div>
                    <div className="text-[10px] text-[#A78BFA]/90 font-mono bg-[#8B5CF6]/10 px-2 py-0.5 rounded border border-[#8B5CF6]/30">98% Match</div>
                 </div>
                 <div className="p-5">
                   <p className="text-white text-sm leading-relaxed mb-6 font-medium min-h-[80px]">
                     {/* Implemented Typing Effect */}
                     <TypingEffect text="Hi Sarah, I sincerely apologize for the confusion. I reviewed your account and can confirm a duplicate charge was processed due to a system retry error. I have just issued a full refund for the duplicate amount ($499.00)." />
                   </p>
                   <div className="flex gap-3">
                      <button className="px-5 py-2.5 bg-[#8B5CF6] text-white hover:bg-[#9366F9] hover:scale-105 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]">
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

      {/* ── NEW: HOW IT WORKS SECTION ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5 mt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">How SupportFlow Works</h2>
          <p className="text-violet-200/60">Three simple steps to automate your support pipeline.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Hidden on mobile) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent"></div>
          
          {[
            { icon: <MessageSquare />, title: "1. Ingest", desc: "Tickets flow in from email, chat, and portals. We sync in real-time." },
            { icon: <Cpu />, title: "2. Analyze", desc: "Our AI understands intent, sentiment, and past ticket history instantly." },
            { icon: <Zap />, title: "3. Resolve", desc: "Automate responses, route to the right agent, or trigger internal workflows." }
          ].map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-[#0A0710] border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:border-[#8B5CF6]/50 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-transparent flex items-center justify-center text-[#A78BFA]">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-violet-200/50 text-sm max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="border-y border-white/[0.05] bg-black/30 backdrop-blur-xl py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-transparent flex items-center justify-center text-[#A78BFA] mb-6 border border-[#8B5CF6]/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <Zap size={24} />
            </div>
            <h3 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
              <CountUpNumber end={10} suffix="×" />
            </h3>
            <p className="text-violet-200/50 font-medium text-sm uppercase tracking-wider">Faster Resolution</p>
          </div>
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-transparent flex items-center justify-center text-[#A78BFA] mb-6 border border-[#8B5CF6]/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
              <CountUpNumber end={98} suffix="%" />
            </h3>
            <p className="text-violet-200/50 font-medium text-sm uppercase tracking-wider">Accuracy Rate</p>
          </div>
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-transparent flex items-center justify-center text-[#A78BFA] mb-6 border border-[#8B5CF6]/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <Bot size={24} />
            </div>
            <h3 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
              <CountUpNumber end={60} suffix="%" />
            </h3>
            <p className="text-violet-200/50 font-medium text-sm uppercase tracking-wider">Auto-Handled</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">A complete toolkit for modern support.</h2>
          <p className="text-violet-200/60 text-lg leading-relaxed">We've automated the repetitive tasks so your human agents can focus on building relationships and solving complex problems.</p>
        </div>

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
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/[0.03] hover:shadow-[0_20px_40px_rgba(139,92,246,0.1)] backdrop-blur-md transition-all duration-300 cursor-default overflow-hidden"
            >
              {/* Subtle hover background glow inside card */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6] blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              
              <div className="w-14 h-14 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:text-white group-hover:bg-[#8B5CF6] group-hover:border-[#A78BFA] transition-colors shadow-lg">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[#A78BFA] transition-colors">{feature.title}</h3>
              <p className="text-violet-200/50 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Loved by Support Teams</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-[#0A0710] border border-white/10 relative">
            <div className="flex gap-1 text-[#8B5CF6] mb-4"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
            <p className="text-violet-100/80 italic mb-6">"SupportFlow has completely transformed how we handle our ticket backlog. The AI drafts are so accurate we rarely have to edit them."</p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] p-[2px]">
                <div className="w-full h-full bg-black rounded-full border-2 border-transparent"></div>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Alex Rivera</h4>
                <p className="text-violet-200/40 text-xs">Head of CX, TechNova</p>
              </div>
            </div>
          </div>
          <div className="p-8 rounded-2xl bg-[#0A0710] border border-white/10 relative">
            <div className="flex gap-1 text-[#8B5CF6] mb-4"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
            <p className="text-violet-100/80 italic mb-6">"We've reduced our resolution time by over 8x since implementing the smart triage system. Absolute game changer."</p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] p-[2px]">
                <div className="w-full h-full bg-black rounded-full border-2 border-transparent"></div>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Samantha Lee</h4>
                <p className="text-violet-200/40 text-xs">Support Lead, CloudSync</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-[#040207] py-10 text-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-violet-200/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#8B5CF6] flex items-center justify-center font-bold text-white text-[10px]">AI</div>
            <span className="font-bold text-white tracking-tight text-base">SupportFlow</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="#" className="hover:text-[#A78BFA] transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-[#A78BFA] transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-[#A78BFA] transition-colors">Contact</Link>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5 text-violet-200/60 font-medium">
              <ShieldCheck size={14} className="text-[#8B5CF6]"/> All systems operational
            </span>
            <span>© {new Date().getFullYear()} SupportFlow Inc.</span>
          </div>
        </div>
      </footer>

      {/* CSS Keyframes injected for shimmering effect in the mockup */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default LandingPage;