import React from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  LightBulbIcon, 
  ChatBubbleBottomCenterTextIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const AIPanel = ({ ticket, onUseSuggestion }) => {
  const analysis = ticket?.aiAnalysis;

  if (!analysis) return (
    <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 p-6 shadow-2xl">
      <div className="flex items-center gap-3 text-slate-500 italic text-sm">
        <SparklesIcon className="h-5 w-5 animate-pulse" />
        AI is processing this ticket...
      </div>
    </div>
  );

  const {
    sentiment = 'neutral',
    priority = 'medium',
    category = 'general',
    reasoning,
    keywords = [],
    suggestedSolutions = []
  } = analysis;

  const getSentimentEmoji = (val) => {
    switch (val?.toLowerCase()) {
      case 'positive': return '🙂';
      case 'negative': return '😡';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary AI Insights */}
      <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl group-hover:bg-emerald-600/20 transition-all duration-700" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600/20 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="font-black text-white text-sm uppercase tracking-widest">Insights</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sentiment:</span>
            <span className="text-xs">{getSentimentEmoji(sentiment)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</p>
            <p className="text-sm font-bold text-emerald-500 capitalize">{category}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">AI Priority</p>
            <p className={`text-sm font-bold capitalize ${
              priority === 'high' ? 'text-rose-500' : priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
            }`}>{priority}</p>
          </div>
        </div>

        {reasoning && (
          <div className="mb-6 p-4 bg-emerald-600/5 rounded-2xl border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-2">
              <LightBulbIcon className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">AI Reasoning</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{reasoning}"
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {keywords.slice(0, 5).map((kw, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-white/5 text-[10px] font-bold text-slate-400 rounded-lg border border-white/5 uppercase tracking-tighter">
              #{kw}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AIPanel;