import React, { useEffect, useState } from 'react';
import { fetchUserInfo } from '../src/services';
import { config, dynamicConfig } from '../src/config';

// Usar siempre config/dynamicConfig para URLs. No hardcodear.
const baseURL = dynamicConfig.LAMBDA_URL || config.API_BASE_URL;

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

type AuthStatus = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [userRole, setUserRole] = useState<string>('Sin rol');

  useEffect(() => {
    async function checkAuth() {
      try {
        const userInfo = await fetchUserInfo();
        // Si no hay usuario, no está autenticado
        if (!userInfo || Object.keys(userInfo).length === 0) {
          setAuthStatus('unauthenticated');
          return;
        }
        // Extraer roles
        let roles: string[] = [];
        let isAdmin = false;
        if (Array.isArray(userInfo?.authorities)) {
          roles = userInfo.authorities.map((a: any) => String(a.authority).trim());
          isAdmin = roles.some(r => r.toLowerCase().includes('admin'));
        }
        // Si no es admin por authorities, revisa otros campos si lo necesitas
        // Si no tiene Admin, es User
        setUserRole(isAdmin ? 'ADMIN' : 'USER');
        // Si se requiere rol y el usuario no lo tiene, no autorizado
        if (requiredRole && ((requiredRole === 'ADMIN' && !isAdmin) || (requiredRole === 'USER' && isAdmin))) {
          setAuthStatus('unauthorized');
          return;
        }
        // Autorizado
        setAuthStatus('authorized');
      } catch (error) {
        setAuthStatus('unauthenticated');
      }
    }
    checkAuth();
  }, [requiredRole]);

  if (authStatus === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <img src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg" alt="Logotipo CDC" style={{ width: 120, marginBottom: 16 }} />
        <div>Cargando autenticación...</div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <img src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg" alt="Logotipo CDC" style={{ width: 120, marginBottom: 16 }} />
        <div>Tu sesión ha expirado o no estás autenticado.</div>
        <button
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => window.location.href = `${baseURL}/login`}
        >
          Ir a Login
        </button>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <img src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg" alt="Logotipo CDC" style={{ width: 120, marginBottom: 16 }} />
        <div>No tienes permisos para acceder a esta sección</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Rol requerido: {requiredRole} | Tu rol: {userRole?.toUpperCase() || 'Sin rol'}
        </div>
        <button
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => window.location.href = '/Solicitud'}
        >
          Ir a Solicitud
        </button>
      </div>
    );
  }

  // Autorizado
  return <>{children}</>;
};

export { ProtectedRoute };