import React, { useState } from 'react';
import MessageBubble from './MessageBubble';
import Button from './Button';

const ChatBox = ({ messages = [], onSendMessage, showRaiseButton = false, onRaiseTicket, disabled = false }) => {
  const [text, setText] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSendMessage(value);
    setText('');
  };

  return (
    <div className="h-full flex flex-col bg-[#0d111c]/40 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.timestamp || index}-${index}`} message={message} />
        ))}
      </div>

      <div className="p-4 bg-[#161b26]/80 border-t border-white/5 backdrop-blur-md">
        {showRaiseButton && (
          <div className="mb-4">
            <button 
              onClick={onRaiseTicket}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              Raise a Support Ticket
            </button>
          </div>
        )}
        <form className="flex gap-2.5" onSubmit={submit}>
          <input
            className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500"
            placeholder={disabled ? 'Chat is inactive' : 'Send a message...'}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
          />
          <button 
            type="submit" 
            disabled={disabled || !text.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.95]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
