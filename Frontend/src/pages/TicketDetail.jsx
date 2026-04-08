// src/pages/TicketDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTickets } from '../hooks/useTickets';
import ChatBox from '../components/UI/ChatBox';
import AIPanel from '../components/Ticket/AIPanel';
import Button from '../components/UI/Button';
import { toast } from 'react-hot-toast';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTicketById, updateTicketStatus, addMessage } = useTickets();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const fetched = await getTicketById(id);
        setTicket(fetched);
      } catch (error) {
        toast.error('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);
  
  const handleSendMessage = async (text) => {
    try {
      const updated = await addMessage(id, text, 'admin');
      setTicket(updated);
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };
  
  const handleResolve = async () => {
    try {
      const updated = await updateTicketStatus(id, 'resolved');
      setTicket(updated);
      toast.success('Ticket resolved');
    } catch (error) {
      toast.error('Failed to resolve ticket');
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket {ticket.id}</h1>
          <p className="text-gray-600 mt-1">Created {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden h-[60vh] min-h-[420px]">
          <ChatBox
            messages={ticket.messages}
            onSendMessage={handleSendMessage}
            disabled={ticket.status === 'resolved'}
          />
        </div>
        
        <div className="space-y-6">
          <AIPanel ticket={ticket} />
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              {ticket.status !== 'resolved' && (
                <Button variant="danger" onClick={handleResolve} className="w-full">
                  Resolve Ticket
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/admin')} className="w-full">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;