import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import CustomerDashboard from './pages/CustomerDashboard';
import MyTickets from './pages/MyTickets';
import CustomerTicketDetail from './pages/CustomerTicketDetail';
import CustomerProfile from './pages/CustomerProfile';
import CustomerChat from './pages/CustomerChat';
import AdminDashboard from './pages/AdminDashboard';
import TicketDetail from './pages/TicketDetail';
import Layout from './components/Layout/Layout';
import CustomerLayout from './components/Layout/CustomerLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Customer Routes */}
            <Route path="/customer" element={<CustomerLayout><CustomerDashboard /></CustomerLayout>} />
            <Route path="/customer/tickets" element={<CustomerLayout><MyTickets /></CustomerLayout>} />
            <Route path="/customer/tickets/new" element={<CustomerLayout><CustomerChat /></CustomerLayout>} />
            <Route path="/customer/tickets/:id" element={<CustomerLayout><CustomerTicketDetail /></CustomerLayout>} />
            <Route path="/customer/profile" element={<CustomerLayout><CustomerProfile /></CustomerLayout>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            <Route path="/admin/tickets/:id" element={<Layout><TicketDetail /></Layout>} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </Router>
  );
};

export default App;
