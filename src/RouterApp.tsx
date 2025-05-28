import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Admin from './components/Admin'; // Ensure this path is correct

const RouterApp: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/Admin" element={<Admin />} />
    </Routes>
  </BrowserRouter>
);

export default RouterApp;
