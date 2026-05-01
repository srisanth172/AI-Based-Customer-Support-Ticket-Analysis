import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Search, Clock } from 'lucide-react';
import api from '../services/api';
import ChatBox from '../components/UI/ChatBox';
import { toast } from 'react-hot-toast';

const AdminLiveChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchChats = async () => {
    try {
      const response = await api.get('/live-chat/admin');
      setChats(response.data);
    } catch (error) {
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.get(`/live-chat/admin/${chatId}`);
      setMessages(response.data.messages);
      setSelectedChat(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000); // Refresh list every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (selectedChat) {
      interval = setInterval(() => fetchMessages(selectedChat._id), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedChat?._id]);

  const handleSendMessage = async (text) => {
    if (!selectedChat) return;
    try {
      const response = await api.post(`/live-chat/message/${selectedChat._id}`, {
        message: text,
        sender: 'admin'
      });
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 overflow-hidden">
      {/* Sidebar: Chat List */}
      <div className="w-80 flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" /> Active Chats
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customers..."
              className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.map(chat => (
            <button
              key={chat._id}
              onClick={() => {
                setSelectedChat(chat);
                setMessages(chat.messages);
              }}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                selectedChat?._id === chat._id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner ${
                selectedChat?._id === chat._id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {chat.userId?.name?.[0].toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${selectedChat?._id === chat._id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                  {chat.userId?.name || 'Customer'}
                </p>
                <p className={`text-xs truncate ${selectedChat?._id === chat._id ? 'text-white/70' : 'text-slate-400'}`}>
                  {chat.messages[chat.messages.length - 1]?.text || 'No messages'}
                </p>
              </div>
            </button>
          ))}
          {filteredChats.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400 text-sm">No active chats found</div>
          )}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="flex-1 flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  {selectedChat.userId?.name?.[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white leading-none">
                    {selectedChat.userId?.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedChat.userId?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatBox 
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
             <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-900 shadow-inner">
                <MessageSquare className="w-12 h-12 opacity-20" />
             </div>
             <p className="text-sm font-medium">Select a chat to start responding</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLiveChat;
