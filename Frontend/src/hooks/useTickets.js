// src/hooks/useTickets.js
import { useState, useEffect } from 'react';
import ticketService from '../services/ticketService';

const mapTicket = (ticket) => ({
  ...ticket,
  id: ticket.ticketId,
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

  useEffect(() => {
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
            totalTickets: statsResponse.totalTickets || 0,
            openTickets: statsResponse.openTickets || 0,
            resolvedTickets: statsResponse.resolvedTickets || 0,
            negativeTickets: statsResponse.negativeTickets || 0,
            highPriorityTickets: statsResponse.highPriorityTickets || 0,
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

    loadTickets();
  }, []);

  const getTicketById = async (id) => {
    const response = await ticketService.getTicketById(id);
    return mapTicket(response);
  };

  const updateTicketStatus = async (id, status) => {
    const updated = mapTicket(await ticketService.updateTicketStatus(id, status));
    setTickets((prev) => {
      const nextTickets = prev.map((ticket) => (ticket.id === id ? updated : ticket));
      setStats((prevStats) => ({ ...prevStats, ...deriveStats(nextTickets) }));
      return nextTickets;
    });
    return updated;
  };

  const addMessage = async (id, message, sender) => {
    const updated = mapTicket(await ticketService.addMessage(id, message, sender));
    setTickets((prev) => prev.map((ticket) => (ticket.id === id ? updated : ticket)));
    return updated;
  };

  return { tickets, stats, loading, getTicketById, updateTicketStatus, addMessage };
};