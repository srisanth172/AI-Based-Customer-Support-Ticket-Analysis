// src/hooks/useTickets.js
import { useState, useEffect } from 'react';
import ticketService from '../services/ticketService';
import socketService from '../services/socketService';

const mapTicket = (ticket) => ({
  ...ticket,
  id: ticket.ticketId || ticket.id || ticket._id,
  aiAnalysis: {
    ...ticket.aiAnalysis,
    sentiment: ticket.sentiment,
    priority: ticket.priority,
    category: ticket.category,
  },
});

const deriveStats = (tickets) => ({
  totalTickets: tickets.length,
  openTickets: tickets.filter((t) => t.status !== 'resolved').length,
  resolvedTickets: tickets.filter((t) => t.status === 'resolved').length,
  negativeTickets: tickets.filter((t) => t.sentiment === 'negative').length,
  highPriorityTickets: tickets.filter((t) => t.priority === 'high' && t.status !== 'resolved').length,
});

export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    negativeTickets: 0,
    highPriorityTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const [ticketResponse, statsResponse] = await Promise.all([
        ticketService.getTickets(),
        ticketService.getDashboardStats().catch(() => null),
      ]);

      const apiTickets = (ticketResponse?.tickets || []).map(mapTicket);
      setTickets(apiTickets);

      if (statsResponse) {
        setStats({
          ...statsResponse,
          totalTickets: statsResponse.totalTickets || 0,
          openTickets: statsResponse.openTickets || 0,
          resolvedTickets: statsResponse.resolvedTickets || 0,
          negativeTickets: statsResponse.negativeTickets || 0,
          highPriorityTickets: statsResponse.highPriorityTickets || (statsResponse.operationalInsights?.slaBreachRisk || 0),
        });
      } else {
        setStats(deriveStats(apiTickets));
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

    socketService.connect();
    const refreshTickets = () => {
      loadTickets();
    };

    socketService.on('ticket-created', refreshTickets);
    socketService.on('ticket-updated', refreshTickets);

    return () => {
      socketService.off('ticket-created');
      socketService.off('ticket-updated');
    };
  }, []);

  const getTicketById = async (id) => {
    const response = await ticketService.getTicketById(id);
    return mapTicket(response);
  };

  const updateTicketAdmin = async (id, updates) => {
    const hasOnlyStatus = Object.keys(updates).length === 1 && updates.status;
    const updated = hasOnlyStatus
      ? mapTicket(await ticketService.updateTicketStatus(id, updates.status))
      : mapTicket(await ticketService.updateTicketAdmin(id, updates));
    setTickets((prev) => {
      const nextTickets = prev.map((ticket) => (ticket.id === id ? updated : ticket));
      setStats((prevStats) => ({ ...prevStats, ...deriveStats(nextTickets) }));
      return nextTickets;
    });
    return updated;
  };

  const bulkUpdate = async (updates) => {
    await ticketService.bulkUpdateTickets(updates);
    // Reload tickets after bulk update
    await loadTickets();
  };

  const addMessage = async (id, message, sender, photo = null) => {
    const updated = mapTicket(await ticketService.addMessage(id, message, sender, photo));
    setTickets((prev) => prev.map((ticket) => (ticket.id === id ? updated : ticket)));
    return updated;
  };

  const escalateTicket = async (id, team, reason) => {
    const updated = mapTicket(await ticketService.escalateTicket(id, team, reason));
    setTickets((prev) => prev.map((ticket) => (ticket.id === id ? updated : ticket)));
    return updated;
  };

  return { tickets, stats, loading, getTicketById, updateTicketAdmin, bulkUpdate, addMessage, escalateTicket };
};