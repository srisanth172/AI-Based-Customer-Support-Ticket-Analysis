import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { PhotoIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const ChatBox = forwardRef(({ messages = [], ticketId, onSendMessage, showRaiseButton = false, onRaiseTicket, disabled = false, onUpdateTicket }, ref) => {
  const [text, setText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const internalChatEndRef = useRef(null);

  useEffect(() => {
    internalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useImperativeHandle(ref, () => ({
    appendText: (newText) => {
      setText(prev => {
        const separator = prev.trim() ? '\n\n' : '';
        return prev + separator + newText;
      });
    },
    setText: (newText) => {
      setText(newText);
    }
  }));

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = (event) => {
    if (event) event.preventDefault();
    const value = text.trim();
    if ((!value && !selectedPhoto) || disabled) return;
    
    // Check if onSendMessage handles 2 or 4 args
    onSendMessage(value, selectedPhoto);
    
    setText('');
    removePhoto();
  };

  return (
    <div className="h-full flex flex-col bg-[#020B06]/40 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.timestamp || index}-${index}`} message={message} ticketId={ticketId} onUpdateTicket={onUpdateTicket} />
        ))}
        <div ref={internalChatEndRef} />
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5 backdrop-blur-md">
        {showRaiseButton && (
          <div className="mb-4">
            <button 
              onClick={onRaiseTicket}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
            >
              Raise a Support Ticket
            </button>
          </div>
        )}

        {photoPreview && (
          <div className="mb-3 flex items-start">
            <div className="relative group p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
              <img src={photoPreview} alt="Preview" className="h-24 w-auto rounded-xl object-cover" />
              <button 
                onClick={removePhoto}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-xl p-1.5 hover:bg-red-600 shadow-2xl transition-all"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form className="flex gap-2.5 items-end" onSubmit={submit}>
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoSelect} 
              className="hidden" 
              accept="image/*" 
            />
            <button 
              type="button" 
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="h-12 w-12 flex items-center justify-center bg-white/5 text-slate-400 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all border border-white/5 shrink-0"
            >
              <PhotoIcon className="h-5 w-5" />
            </button>
          </div>

          <textarea
            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500 resize-none h-12"
            placeholder={disabled ? 'Chat is inactive' : 'Send a reply...'}
            value={text}
            rows="1"
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
          />
          
          <button 
            type="submit" 
            disabled={disabled || (!text.trim() && !selectedPhoto)}
            className="h-12 w-12 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.95] shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
});

export default ChatBox;
