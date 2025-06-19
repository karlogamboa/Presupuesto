import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../auth/oktaAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setAuth(authenticated);
    };
    checkAuth();
  }, []);

  if (auth === null) {
    return <div>Loading...</div>; // Muestra un indicador de carga mientras se verifica la autenticación
  }

  return auth ? <>{children}</> : <Navigate to="/login" />;
};

export default ProtectedRoute;
