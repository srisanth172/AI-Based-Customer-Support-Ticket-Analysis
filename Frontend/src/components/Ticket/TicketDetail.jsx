import React from 'react';

const TicketDetail = ({ ticket }) => {
  if (!ticket) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Ticket Overview</h2>
      <p className="text-sm text-gray-600">Ticket ID: {ticket.id || ticket.ticketId}</p>
      <p className="text-sm text-gray-600 mt-1">Status: {ticket.status}</p>
      <p className="text-sm text-gray-600 mt-1">Priority: {ticket.priority}</p>
    </div>
  );
};

export default TicketDetail;
// Inside TicketDetail.jsx (partial)
import TicketHeader from '../components/Ticket/TicketHeader';
import AIPanel from '../components/Ticket/AIPanel';
import ChatBox from '../components/UI/ChatBox';

// Inside component:
return (
  <div className="space-y-6">
    <TicketHeader
      ticket={ticket}
      onBack={() => navigate('/admin')}
      onStatusChange={handleStatusChange}
      onEdit={() => {/* open edit modal */}}
    />

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 320px)' }}>
        <ChatBox messages={ticket.messages} onSendMessage={handleSendMessage} />
      </div>
      
      <div>
        <AIPanel
          ticket={ticket}
          onUseSuggestion={(suggestion) => {
            // Fill the chat input with the suggestion
            setNewMessage(suggestion);
          }}
        />
      </div>
    </div>
  </div>
);