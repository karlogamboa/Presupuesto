import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../middleware/authMiddleware';
import App from '../src/App';
import Admin from '../src/components/Admin';
import LoginPage from '../pages/LoginPage';
import LoginCallback from '../pages/LoginCallback';
import SendMailTest from '../src/components/SendMailTest';


const RouterApp: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<LoginCallback />} />
      <Route path="/SendMailTest" element={<SendMailTest />} />
      <Route
        path="/Admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/Solicitud"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Router>
);

export default RouterApp;
