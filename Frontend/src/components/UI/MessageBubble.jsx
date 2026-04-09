import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user' || message.sender === 'admin';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center mr-2.5 shrink-0 mt-1">
          <SparklesIcon className="h-3.5 w-3.5 text-indigo-500" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 text-[13px] leading-relaxed font-medium ${
          isUser 
            ? 'chat-bubble-user' 
            : 'chat-bubble-bot'
        }`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
