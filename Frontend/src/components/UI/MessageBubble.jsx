import React from 'react';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user' || message.sender === 'admin';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isUser ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
