import React, { useEffect, useState } from 'react';
import { Users, Search, Mail, Calendar, UserCheck, ShieldAlert, Loader, X, Ticket, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/auth/users');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTickets = async (customerId) => {
    setLoadingTickets(true);
    try {
      // Find tickets where userId matches the customer's _id
      // The backend getTickets allows status/priority filters, but we can also filter by user if we add that param
      // or just filter the existing list. But fetching from server is better.
      const response = await apiClient.get('/tickets');
      const allTickets = response.data.tickets;
      const filtered = allTickets.filter(t => t.userId?._id === customerId);
      setCustomerTickets(filtered);
    } catch (error) {
      toast.error('Failed to load activity history');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerTickets(customer._id);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Retrieving Customer Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
               <Users className="w-7 h-7 text-white" />
             </div>
             Customers
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and view your total user base.</p>
        </div>
        
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl pl-10 pr-4 py-2.5 text-sm focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all dark:text-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCustomers.map(customer => (
          <div 
            key={customer._id} 
            onClick={() => handleCustomerClick(customer)}
            className="group cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-110">
                 {customer.name.substring(0, 1).toUpperCase()}
               </div>
               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                 <UserCheck className="w-3 h-3" />
                 Verified
               </div>
            </div>
            
            <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight mb-1">{customer.name}</h3>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5" />
              {customer.email}
            </p>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
               <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                  <span>Relationship</span>
                  <span>Active Client</span>
               </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCustomers.length === 0 && (
        <div className="text-center py-20">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No customers found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedCustomer(null)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl z-[70] border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                      {selectedCustomer.name.substring(0,1).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">{selectedCustomer.name}</h2>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Customer Profile</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 <div className="space-y-6">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-indigo-500">Contact Details</p>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"><Mail className="w-4 h-4 text-slate-400" /></div>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedCustomer.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"><Calendar className="w-4 h-4 text-slate-400" /></div>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Member since {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>

                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Support History</p>
                       {loadingTickets ? (
                         <div className="flex items-center justify-center p-8"><Loader className="w-6 h-6 animate-spin text-slate-300" /></div>
                       ) : customerTickets.length > 0 ? (
                         <div className="space-y-3">
                            {customerTickets.map(t => (
                              <div key={t.ticketId} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-colors">
                                 <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-black text-indigo-500">{t.ticketId}</span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {t.status}
                                    </span>
                                 </div>
                                 <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{t.subject || 'Generic Issue'}</h4>
                                 <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-medium text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                                 </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                             <Ticket className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                             <p className="text-xs font-bold text-slate-400 uppercase">No prior tickets</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                 <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                    GENERATE ACCOUNT REPORT
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
