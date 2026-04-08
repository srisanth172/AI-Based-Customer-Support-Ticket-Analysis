import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import CustomerChat from './pages/CustomerChat';
import AdminDashboard from './pages/AdminDashboard';
import TicketDetail from './pages/TicketDetail';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/customer" element={<Layout><CustomerChat /></Layout>} />
            <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            <Route path="/admin/tickets/:id" element={<Layout><TicketDetail /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </Router>
  );
};

export default App;
