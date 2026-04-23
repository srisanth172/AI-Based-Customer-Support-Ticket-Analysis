import React from 'react';
import { useTickets } from '../hooks/useTickets';
import TicketTable from '../components/Dashboard/TicketTable';
import { Ticket, Filter, Search } from 'lucide-react';

const Tickets = () => {
  const { tickets, stats, loading, bulkUpdate, updateTicketAdmin } = useTickets();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <Ticket className="w-8 h-8 text-indigo-500" /> Tickets
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Detailed view of all support queries.</p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <TicketTable 
            tickets={tickets} 
            onBulkUpdate={bulkUpdate} 
            updateTicketAdmin={updateTicketAdmin} 
          />
        </div>
      </div>
    </div>
  );
};

export default Tickets;
