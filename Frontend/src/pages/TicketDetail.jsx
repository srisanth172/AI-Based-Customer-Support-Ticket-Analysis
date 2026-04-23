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
  const { getTicketById, updateTicketAdmin, addMessage } = useTickets();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin action states
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState('');
  const [eta, setEta] = useState('');
  const [noteText, setNoteText] = useState('');
  
  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const fetched = await getTicketById(id);
        setTicket(fetched);
        setTeam(fetched.assignedTeam || 'unassigned');
        setStatus(fetched.status);
        setEta(fetched.eta ? fetched.eta.substring(0, 10) : '');
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
  
  const handleAdminUpdate = async (field, value) => {
    try {
      const updated = await updateTicketAdmin(id, { [field]: value });
      setTicket(updated);
      toast.success('Ticket updated');
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const updated = await updateTicketAdmin(id, { internalNote: noteText });
      setTicket(updated);
      setNoteText('');
      toast.success('Internal note added');
    } catch {
      toast.error('Failed to add note');
    }
  };
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;
  
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket {ticket.id}</h1>
          <p className="text-gray-600 mt-1">Created {new Date(ticket.createdAt).toLocaleString()} &bull; Category: {ticket.category}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[50vh] min-h-[420px]">
            <ChatBox
              messages={ticket.messages || []}
              onSendMessage={handleSendMessage}
              disabled={ticket.status === 'resolved'}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Internal Notes</h3>
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {(ticket.internalNotes || []).map((note, i) => (
                <div key={i} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                  <div className="font-semibold text-xs mb-1 opacity-70 border-b border-yellow-200/50 pb-1">{new Date(note.timestamp).toLocaleString()}</div>
                  {note.text}
                </div>
              ))}
              {(!ticket.internalNotes || ticket.internalNotes.length === 0) && <p className="text-sm text-gray-400">No internal notes yet.</p>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a private note..." className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              <Button onClick={handleAddNote}>Add Note</Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Activity Timeline</h3>
            <div className="relative border-l ml-4 border-gray-200 space-y-6">
              {(ticket.activityLog || []).map((log, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[1.5px] top-1.5 ring-4 ring-white" />
                  <p className="text-sm font-medium text-gray-900">{log.message}</p>
                  <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
              {(!ticket.activityLog || ticket.activityLog.length === 0) && <p className="ml-6 text-sm text-gray-400">No activity recorded.</p>}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <AIPanel ticket={ticket} />
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-3">Admin Actions</h3>
            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={(e) => { setStatus(e.target.value); handleAdminUpdate('status', e.target.value); }} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 capitalize">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Team</label>
                <select value={team} onChange={(e) => { setTeam(e.target.value); handleAdminUpdate('assignedTeam', e.target.value); }} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 capitalize">
                  <option value="unassigned">Unassigned</option>
                  <option value="billing_team">Billing Team</option>
                  <option value="tech_support">Tech Support</option>
                  <option value="customer_success">Customer Success</option>
                  <option value="shipping_dept">Shipping Dept</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Resolution ETA</label>
                <input type="date" value={eta} onChange={(e) => { setEta(e.target.value); handleAdminUpdate('eta', e.target.value); }} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;