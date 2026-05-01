// src/components/Ticket/SuggestedReply.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, LightBulbIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import Button from '../UI/Button';

const SuggestedReply = ({ suggestion, onUseSuggestion, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    if (onCopy) onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 shadow-sm"
    >
      <div className="flex items-center space-x-2 mb-3">
        <SparklesIcon className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900">AI Suggested Reply</h3>
        <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Powered by AI</span>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100 shadow-inner">
        <p className="text-gray-700 text-sm leading-relaxed">{suggestion}</p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={onUseSuggestion}
          className="flex-1"
        >
          <LightBulbIcon className="w-4 h-4 mr-1" />
          Use Suggestion
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex-1"
        >
          <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-green-600 text-center mt-2"
          >
            Copied to clipboard
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuggestedReply;