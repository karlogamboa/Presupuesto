import React from 'react';
import { Navigate } from 'react-router-dom';
import { config } from '../src/config';

interface NoAuthRouteProps {
  children: React.ReactNode;
}

// Componente que bypassa autenticación en modo desarrollo
const NoAuthRoute: React.FC<NoAuthRouteProps> = ({ children }) => {
  // En modo desarrollo sin auth, permitir acceso directo
  if (config.DEVELOPMENT_MODE && !config.AUTH_ENABLED) {
    return <>{children}</>;
  }

  // En producción, redirigir a login
  return <Navigate to="/login" replace />;
};

export default NoAuthRoute;
