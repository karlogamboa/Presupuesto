import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSolicitanteData } from '../hooks/useSolicitanteData';
import { config, dynamicConfig } from '../config';

// Usar siempre config/dynamicConfig para URLs. No hardcodear.
const baseURL = dynamicConfig.LAMBDA_URL || config.API_BASE_URL;

const MenuUsuario: React.FC = () => {
  const navigate = useNavigate();
  const { empleado } = useSolicitanteData();
  const user = empleado;

  // Extrae roles desde authorities si existen (solo si existen en el objeto)
  const roles =
    (user && 'authorities' in user && Array.isArray((user as any).authorities))
      ? (user as any).authorities.map((a: any) => a.authority)
      : user?.roles;

  const isAdmin =
    roles === 'ADMIN' ||
    (typeof roles === 'string' && roles.includes('ADMIN')) ||
    (Array.isArray(roles) && roles.includes('Admin'));

  // Extrae employeeNumber si existe (solo si existe en el objeto)
  const numeroEmpleado =
    (user && 'employeeNumber' in user)
      ? (user as any).employeeNumber
      : user?.numeroEmpleado;

  const handleLogout = async () => {
    // Redirige a Okta SLO si está configurado, si no al backend
    const oktaSloUrl = dynamicConfig.OKTA_SLO_URL || config.OKTA_SLO_URL;
    if (oktaSloUrl) {
      console.log('[MenuUsuario] Redirigiendo a OKTA SLO:', oktaSloUrl);
      window.location.href = oktaSloUrl;
    } else {
      window.location.href = `${baseURL}/logout`;
    }
  };

  if (!user) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: '#fff',
        color: '#003057',
        boxShadow: '0 2px 8px #0001',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px 0 0',
        height: 80,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <img
          src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg"
          alt="Círculo de Crédito"
          style={{
            height: 56,
            marginLeft: 32,
            marginRight: 24,
            background: 'transparent'
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontWeight: 600 }}>
          Usuario: {
            (user && 'userName' in user && typeof (user as any).userName === 'object')
              ? `${(user as any).userName.givenName} ${(user as any).userName.familyName}`
              : (user && 'userName' in user ? (user as any).userName : user.nombre || user.correo)
          }
        </span>
        {numeroEmpleado && (
          <span style={{ fontWeight: 500, color: '#1976d2' }}>
            Número Empleado: {numeroEmpleado}
          </span>
        )}
        <button
          onClick={() => navigate('/Solicitud')}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '8px 22px',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            marginLeft: 8
          }}
        >
          Solicitud Gasto
        </button>
        {isAdmin && (
          <button
            onClick={() => navigate('/Admin')}
            style={{
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '8px 22px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Admin (Estatus)
          </button>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: '#fff',
            color: '#1976d2',
            border: '2px solid #1976d2',
            borderRadius: 20,
            padding: '8px 22px',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            marginLeft: 8
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default MenuUsuario;