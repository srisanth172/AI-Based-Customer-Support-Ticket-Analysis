// src/components/Ticket/AIPanel.jsx

import React from 'react';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import SuggestedReply from './SuggestedReply';

const AIPanel = ({ ticket, onUseSuggestion }) => {
  const analysis = ticket?.aiAnalysis;

  // Early return for safety
  if (!analysis) return null;

  // Destructure with fallbacks
  const {
    sentiment = 'neutral',
    priority = 'medium',
    category = 'general',
    reasoning,
    keywords = [],
    suggestedReply
  } = analysis;

  const getSentimentColor = (value) => {
    switch (value?.toLowerCase()) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (value) => {
    switch (value?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, x: 20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { staggerChildren: 0.08 }
        }
      }}
      className="space-y-6"
    >
      {/* Analysis Card */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
      >
        <div className="flex items-center space-x-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />
          <h3 className="font-semibold text-gray-900">AI Analysis</h3>
        </div>

        {/* Sentiment & Priority */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className={`p-3 rounded-lg border ${getSentimentColor(sentiment)}`}
          >
            <p className="text-xs font-medium">Sentiment</p>
            <p className="text-lg font-bold capitalize">{sentiment}</p>
          </div>

          <div
            className={`p-3 rounded-lg border ${getPriorityColor(priority)}`}
          >
            <p className="text-xs font-medium">Priority</p>
            <p className="text-lg font-bold capitalize">{priority}</p>
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <div className="flex items-center space-x-1 mb-2">
            <ChartBarIcon className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <p className="text-xs font-medium text-gray-500">Category</p>
          </div>

          <p className="text-sm font-medium capitalize bg-gray-100 inline-block px-3 py-1 rounded-full">
            {category}
          </p>
        </div>

        {/* Reasoning */}
        {reasoning && (
          <div className="mb-4">
            <div className="flex items-center space-x-1 mb-2">
              <LightBulbIcon className="w-4 h-4 text-yellow-600" aria-hidden="true" />
              <p className="text-xs font-medium text-gray-500">Reasoning</p>
            </div>

            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {reasoning}
            </p>
          </div>
        )}

        {/* Keywords */}
        <div>
          <div className="flex items-center space-x-1 mb-2">
            <DocumentTextIcon className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <p className="text-xs font-medium text-gray-500">Keywords</p>
          </div>

          {keywords.length === 0 ? (
            <p className="text-xs text-gray-400">No keywords detected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Suggested Reply */}
      {suggestedReply && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        >
          <SuggestedReply
            suggestion={suggestedReply}
            onUseSuggestion={onUseSuggestion}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIPanel;