import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

const FeedbackModal = ({ isOpen, onClose, onSubmit, ticketId }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    await onSubmit({ rating, comment });
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-[#020B06] border border-emerald-500/20 shadow-2xl"
          >
            {/* Header with Pattern */}
            <div className="relative h-32 bg-emerald-600 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
               <SparklesIcon className="h-16 w-16 text-white/30 animate-pulse" />
            </div>

            <div className="p-8 pt-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight">How did we do?</h3>
                <p className="text-slate-400 text-sm mt-2 font-medium">Your feedback helps Swift Support get better every day.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 transition-all hover:scale-125 active:scale-95"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(star)}
                      >
                        {(hover || rating) >= star ? (
                          <StarIcon className={`h-12 w-12 ${rating >= star ? 'text-emerald-500' : 'text-emerald-500/50'}`} />
                        ) : (
                          <StarOutline className="h-12 w-12 text-slate-700 hover:text-emerald-500/50" />
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                    {rating === 5 ? 'Exceptional!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Could be better' : rating === 1 ? 'Poor' : 'Select a rating'}
                  </span>
                </div>

                {/* Comment Area */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Share your experience (Optional)</label>
                   <textarea
                     value={comment}
                     onChange={(e) => setComment(e.target.value)}
                     placeholder="What was the best part of our support?"
                     rows={3}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-sm font-medium resize-none"
                   />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={rating === 0 || submitting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                </button>
              </form>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
