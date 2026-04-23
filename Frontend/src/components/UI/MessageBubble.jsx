import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user' || message.sender === 'admin';
  const [analyzingMap, setAnalyzingMap] = useState({});
  const [analysisResultMap, setAnalysisResultMap] = useState({});

  const handleAnalyzeImage = async (url, idx) => {
    setAnalyzingMap(prev => ({ ...prev, [idx]: true }));
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token'); // assuming token is here
      const res = await axios.post(
        `${BASE_URL}/ai/analyze-image`,
        { imageUrl: url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalysisResultMap(prev => ({ ...prev, [idx]: res.data.analysis || 'Checked' }));
      toast.success('Image analyzed successfully!');
    } catch (error) {
      toast.error('Failed to analyze image for AI artifacts');
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[20px] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5 backdrop-blur-md'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        {rawFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {rawFiles.map((file, idx) => {
              const isImage = file.fileType?.includes('image') || file.url?.match(/\.(jpeg|jpg|gif|png)$/i);
              return (
                <div key={idx} className="relative group">
                  {isImage ? (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 p-1.5 shadow-2xl">
                      <img src={`http://localhost:5000${file.url}`} alt={file.name || 'attachment'} className="max-w-full h-auto max-h-64 rounded-lg object-cover" />
                      <div className="mt-2 flex items-center justify-between px-1">
                        <span className="text-[11px] text-slate-500 truncate font-bold uppercase tracking-wider">{file.name}</span>
                        {!analysisResultMap[idx] ? (
                          <button
                            onClick={() => handleAnalyzeImage(file.url, idx)}
                            disabled={analyzingMap[idx]}
                            className="text-[10px] font-black bg-white/10 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-500 transition-all uppercase tracking-widest whitespace-nowrap active:scale-95"
                          >
                            {analyzingMap[idx] ? 'Checking...' : 'AI Scan'}
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
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
