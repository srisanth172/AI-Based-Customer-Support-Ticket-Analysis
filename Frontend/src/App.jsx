import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerChat from './pages/CustomerChat';
import MyTickets from './pages/MyTickets';
import CustomerTicketDetail from './pages/CustomerTicketDetail';
import CustomerProfile from './pages/CustomerProfile';
import CreateTicket from './pages/CreateTicket';
import AdminDashboard from './pages/AdminDashboard';
import TicketDetail from './pages/TicketDetail';
import Tickets from './pages/Tickets';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import AdminLiveChat from './pages/AdminLiveChat';
import Settings from './pages/Settings';
import Layout from './components/Layout/Layout';
import CustomerLayout from './components/Layout/CustomerLayout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Register from './pages/Register';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/customer" element={<PrivateRoute role="customer"><CustomerLayout><CustomerDashboard /></CustomerLayout></PrivateRoute>} />
            <Route path="/customer/chat" element={<PrivateRoute role="customer"><CustomerLayout><CustomerChat /></CustomerLayout></PrivateRoute>} />
            <Route path="/customer/tickets" element={<PrivateRoute role="customer"><CustomerLayout><MyTickets /></CustomerLayout></PrivateRoute>} />
            <Route path="/customer/tickets/new" element={<PrivateRoute role="customer"><CustomerLayout><CreateTicket /></CustomerLayout></PrivateRoute>} />
            <Route path="/customer/tickets/:id" element={<PrivateRoute role="customer"><CustomerLayout><CustomerTicketDetail /></CustomerLayout></PrivateRoute>} />
            <Route path="/customer/profile" element={<PrivateRoute role="customer"><CustomerLayout><CustomerProfile /></CustomerLayout></PrivateRoute>} />

            <Route path="/admin" element={<PrivateRoute role="admin"><Layout><AdminDashboard /></Layout></PrivateRoute>} />
            <Route path="/admin/tickets" element={<PrivateRoute role="admin"><Layout><Tickets /></Layout></PrivateRoute>} />
            <Route path="/admin/tickets/:id" element={<PrivateRoute role="admin"><Layout><TicketDetail /></Layout></PrivateRoute>} />
            <Route path="/admin/customers" element={<PrivateRoute role="admin"><Layout><Customers /></Layout></PrivateRoute>} />
            <Route path="/admin/chat" element={<PrivateRoute role="admin"><Layout><AdminLiveChat /></Layout></PrivateRoute>} />
            <Route path="/admin/analytics" element={<PrivateRoute role="admin"><Layout><Analytics /></Layout></PrivateRoute>} />
            <Route path="/admin/settings" element={<PrivateRoute role="admin"><Layout><Settings /></Layout></PrivateRoute>} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </Router>
  );
};

export default App;
