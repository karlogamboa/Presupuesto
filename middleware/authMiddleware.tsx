import React, { useEffect, useState } from 'react';
import { fetchUserInfo } from '../src/services';
import { config, dynamicConfig } from '../src/config';

// Usar siempre config/dynamicConfig para URLs. No hardcodear.
const baseURL = dynamicConfig.LAMBDA_URL || config.API_BASE_URL;

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      console.log('[ProtectedRoute] Iniciando checkAuth');
      try {
        const userInfo = await fetchUserInfo();
        console.log('[ProtectedRoute] userInfo:', userInfo);
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
        console.log('[ProtectedRoute] userRoles:', userRoles);
        setRole(userRoles.join(', '));
      } catch (error: any) {
        if (error instanceof Response) {
          error.text().then((text: string) => {
            console.error('[ProtectedRoute] Error en fetchUserInfo:', error.status, text);
          });
        } else {
          console.error('[ProtectedRoute] Error en fetchUserInfo:', error);
        }
        // Manejo de error simplificado, sin la variable forbidden
      } finally {
        setLoadingRole(false);
        console.log('[ProtectedRoute] setLoadingRole(false)');
      }
    }
    checkAuth();
  }, [requiredRole]);

  if (loadingRole) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <img src="/logo-cdc.png" alt="Logotipo CDC" style={{ width: 120, marginBottom: 16 }} />
        <div>No tienes permisos para acceder a esta sección</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Rol requerido: {requiredRole} | Tu rol: {role?.toUpperCase() || 'Sin rol'}
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
          onClick={() => window.location.href = `${baseURL}/login`}
        >
          Ir a Login
        </button>
      </div>
    );
  }

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
        <img src="/logo-cdc.png" alt="Logotipo CDC" style={{ width: 120, marginBottom: 16 }} />
        <div>No tienes permisos para acceder a esta sección</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Rol requerido: {requiredRole} | Tu rol: {role?.toUpperCase() || 'Sin rol'}
          <br />
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
      </div>
    );
  }

  // if (location.pathname === '/login') {
  //   return <Navigate to="/Solicitud" replace />;
  // }

  return <>{children}</>;
};

export { ProtectedRoute };