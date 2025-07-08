import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { validateToken, fetchUserInfo } from '../src/services';

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
  const [auth, setAuth] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      // Verificar token local primero
      if (!isTokenValid()) {
        setAuth(false);
        setLoadingRole(false);
        return;
      }

      // Validar con el servidor
      try {
        const isValid = await validateToken();
        setAuth(isValid);
        
        if (isValid && requiredRole) {
          // Obtener información del usuario para verificar rol
          const userInfo = await fetchUserInfo();
          // Soporta roles como arreglo o string
          let userRoles: string[] = [];
          if (Array.isArray(userInfo?.roles)) {
            userRoles = userInfo.roles.map((r: string) => r.trim().toLowerCase());
          } else if (typeof userInfo?.roles === 'string') {
            userRoles = userInfo.roles.split(',').map((r: string) => r.trim().toLowerCase());
          } else if (userInfo?.role) {
            userRoles = [String(userInfo.role).trim().toLowerCase()];
          } else if (userInfo?.rol) {
            userRoles = [String(userInfo.rol).trim().toLowerCase()];
          }
          setRole(userRoles.join(', '));
          // Si el requiredRole no está en los roles, el acceso será denegado abajo
        }
      } catch {
        setAuth(false);
      } finally {
        setLoadingRole(false);
      }
    }

    checkAuth();
  }, [requiredRole]);

  // Mostrar loading mientras verifica autenticación
  if (auth === null || loadingRole) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Verificando autenticación...</div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!auth) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  // Verificar rol si es requerido
  if (requiredRole && !(role && role.split(',').map(r => r.trim().toLowerCase()).includes(requiredRole.trim().toLowerCase()))) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div>No tienes permisos para acceder a esta sección</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Rol requerido: {requiredRole} | Tu rol: {role || 'Sin rol'}
        </div>
      </div>
    );
  }

  // Redirigir a la aplicación si ya está autenticado y está en login
  if (auth && location.pathname === '/login') {
    return <Navigate to="/Solicitud" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
