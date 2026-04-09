import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, TicketIcon } from '@heroicons/react/24/outline';
import MessageBubble from './MessageBubble';

const ChatBox = ({ messages = [], onSendMessage, showRaiseButton = false, onRaiseTicket, disabled = false }) => {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSendMessage(value);
    setText('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50" ref={scrollRef}>
        {messages.map((message, index) => (
          <MessageBubble key={`${message.timestamp || index}-${index}`} message={message} />
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-100 p-4 bg-white">
        {showRaiseButton && (
          <div className="mb-3">
            <button
              onClick={onRaiseTicket}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-[13px] font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors ring-1 ring-inset ring-indigo-200"
            >
              <TicketIcon className="h-4 w-4" />
              Raise Support Ticket
            </button>
          </div>
        )}
        <form className="flex gap-2.5" onSubmit={submit}>
          <input
            className="flex-1 border-0 ring-1 ring-inset ring-slate-200/80 rounded-xl px-4 py-2.5 text-[13px] font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/60 placeholder:text-slate-400 transition-all"
            placeholder={disabled ? 'Ticket is resolved' : 'Type your message...'}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-sm shadow-indigo-600/20 hover:shadow-md hover:shadow-indigo-600/25"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
