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
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.timestamp || index}-${index}`} message={message} />
        ))}
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        {showRaiseButton && (
          <div className="mb-3">
            <Button variant="secondary" onClick={onRaiseTicket}>Raise Ticket</Button>
          </div>
        )}
        <form className="flex gap-2" onSubmit={submit}>
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder={disabled ? 'Ticket is resolved' : 'Type your message...'}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
          />
          <Button type="submit" disabled={disabled}>Send</Button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
