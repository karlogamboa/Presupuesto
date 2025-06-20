import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchUserInfo } from '../src/services';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

function isTokenValid(): boolean {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return false;
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return !!payload.exp && payload.exp > now;
  } catch {
    return false;
  }
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<boolean>(!!requiredRole);
  const location = useLocation();

  const auth = isTokenValid();

  useEffect(() => {
    let isMounted = true;
    const checkRole = async () => {
      if (auth && requiredRole) {
        try {
          const data = await fetchUserInfo();
          if (isMounted) setRole(data.role || null);
        } catch {
          if (isMounted) setRole(null);
        }
        setLoadingRole(false);
      } else {
        setLoadingRole(false);
      }
    };
    checkRole();
    return () => { isMounted = false; };
  }, [auth, requiredRole]);

  // Centraliza la redirección a login aquí
  if (!auth) {
    if (location.pathname !== '/login' && location.pathname !== '/callback') {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  if (loadingRole) {
    return <div>Loading...</div>;
  }

  if (requiredRole && role !== requiredRole) {
    return <div>No autorizado</div>;
  }

  if (auth && location.pathname === '/login') {
    return <Navigate to="/Solicitud" replace />;
  }

  return <>{children}</>;
};
export default ProtectedRoute;
