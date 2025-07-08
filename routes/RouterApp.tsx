import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../middleware/authMiddleware';
import App from '../src/App';
import Admin from '../src/components/Admin';
import LoginPage from '../pages/LoginPage';
import SendMailTest from '../src/components/SendMailTest';
import AdminCatalogosUpload from '../src/components/AdminCatalogosUpload';


const RouterApp: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/SendMailTest" element={
        <ProtectedRoute requiredRole="ADMIN">
          <SendMailTest />
        </ProtectedRoute>
      } />

      <Route
        path="/Admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
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
      <Route
        path="/AdminCatalogos"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminCatalogosUpload />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/Solicitud" replace />} />
    </Routes>
  </Router>
);

export default RouterApp;
