import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const MessageBubble = ({ message, ticketId, onUpdateTicket }) => {
  const isOwnMessage = message.sender === 'admin';
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const [analyzingMap, setAnalyzingMap] = useState({});
  const [analysisResultMap, setAnalysisResultMap] = useState({});

  const handleAnalyzeImage = async (url, idx) => {
    setAnalyzingMap(prev => ({ ...prev, [idx]: true }));
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token'); 
      const res = await axios.post(
        `${BASE_URL}/ai/analyze-image`,
        { imageUrl: url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = res.data.analysis;
      setAnalysisResultMap(prev => ({ ...prev, [idx]: result || 'Checked' }));
      
      if (result === 'AI Generated' && onUpdateTicket && ticketId) {
        toast.error('AI Generated Image Detected!', { icon: '⚠️', duration: 4000 });
        
        // 1. Mark as spam
        await onUpdateTicket('category', 'spam');
        
        // 2. Ask admin whether to close
        setTimeout(async () => {
          const shouldClose = window.confirm('AI generated image detected. This ticket has been automatically marked as spam. Would you like to CLOSE this ticket?');
          
          if (shouldClose) {
            await onUpdateTicket('status', 'closed');
            toast.success('Ticket closed as spam');
          } else {
            toast.success('Ticket kept open for manual resolution');
          }
        }, 500);
      } else {
        toast.success('Image Verified as Genuine');
      }
    } catch (error) {
      toast.error('Failed to analyze image');
      setAnalysisResultMap(prev => ({ ...prev, [idx]: 'Analysis failed' }));
    } finally {
      setAnalyzingMap(prev => ({ ...prev, [idx]: false }));
    }
  };

  const rawFiles = message.files || [];
  if (message.attachmentUrl) {
    rawFiles.push({ url: message.attachmentUrl, name: 'Attachment', fileType: 'image' });
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[20px] px-5 py-4 text-[14px] leading-relaxed shadow-xl ${
          isOwnMessage 
            ? 'bg-emerald-600 text-white rounded-tr-none' 
            : isUser
              ? 'bg-slate-100 text-slate-900 rounded-tl-none font-medium border border-slate-200'
              : 'bg-[#0A1612] text-slate-200 rounded-tl-none border border-emerald-500/20 backdrop-blur-md' // bot
        }`}
      >
        {isUser && (
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">
            Customer {ticketId ? `(${ticketId})` : ''}
          </div>
        )}
        {isBot && (
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 border-b border-emerald-500/20 pb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Swift AI
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.text}</p>
        <div className={`mt-2 text-[9px] font-black uppercase tracking-widest opacity-60 ${isOwnMessage ? 'text-emerald-100 text-right' : 'text-slate-500 text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {rawFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {rawFiles.map((file, idx) => {
              const isImage = file.fileType?.includes('image') || file.url?.match(/\.(jpeg|jpg|gif|png)$/i);
              return (
                <div key={idx} className="relative group">
                  {isImage ? (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 p-1.5 shadow-2xl">
                      <img src={`${import.meta.env.VITE_API_URL}${file.url}`} alt={file.name || 'attachment'} className="max-w-full h-auto max-h-64 rounded-lg object-cover" />
                      <div className="mt-2 flex items-center justify-between px-1">
                        <span className="text-[11px] text-slate-500 truncate font-bold uppercase tracking-wider">{file.name}</span>
                        {!analysisResultMap[idx] ? (
                          <button
                            onClick={() => handleAnalyzeImage(file.url, idx)}
                            disabled={analyzingMap[idx]}
                            className="text-[10px] font-black bg-white/10 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-500 transition-all uppercase tracking-widest whitespace-nowrap active:scale-95"
                          >
                            {analyzingMap[idx] ? 'Analyzing...' : 'Verify Authenticity'}
                          </button>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            analysisResultMap[idx].includes('AI Generated') 
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                              : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          }`}>
                            {analysisResultMap[idx]}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <a href={`http://localhost:5000${file.url}`} target="_blank" rel="noreferrer" className="text-xs underline text-blue-200">
                      📎 {file.name || 'Download Attachment'}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
