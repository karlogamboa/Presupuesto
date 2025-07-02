import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserInfo, logout } from '../services';

// Variable global para compartir info de usuario
export let globalUserInfo: { email?: string; name?: string; role?: string | string[]; numeroEmpleado?: string } | null = null;
export function setGlobalUserInfo(user: typeof globalUserInfo) {
  globalUserInfo = user;
  // Notifica a listeners si es necesario (ejemplo: window event)
  window.dispatchEvent(new CustomEvent('globalUserInfoUpdated'));
}

const MenuUsuario: React.FC = () => {
  const [user, setUser] = useState<{ email?: string; name?: string; role?: string | string[]; numeroEmpleado?: string } | null>(null);
  const navigate = useNavigate();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Si ya existe la variable global y tiene numeroEmpleado, úsala y no vuelvas a hacer fetch ni cambiar el dato global
    if (globalUserInfo && globalUserInfo.numeroEmpleado) {
      setUser(globalUserInfo);
      return;
    }

    if (fetchedRef.current) return; // Evita llamadas múltiples
    fetchedRef.current = true;

    // Primero intenta obtener el email y el rol del id_token
    const idToken = localStorage.getItem('id_token');
    let email: string | undefined = undefined;
    let role: string | string[] | undefined = undefined;
    let numeroEmpleado: string | undefined = undefined;
    if (idToken) {
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        email = payload.email;
        role = payload.role || payload.roles;
        numeroEmpleado = payload.numeroEmpleado || payload.numero_empleado;
      } catch {
        // No email ni role
      }
    }
    // Si ya hay rol y numeroEmpleado, setea ambos y la variable global, pero no vuelvas a hacer fetch
    if (role && numeroEmpleado) {
      const userObj = {
        email,
        name: email,
        role,
        numeroEmpleado,
      };
      setUser(userObj);
      setGlobalUserInfo(userObj);
      return;
    }
    // Si no hay rol o numeroEmpleado, solicita el perfil del usuario al backend (userinfo) enviando el email
    fetchUserInfo(email)
      .then(data => {
        const userObj = {
          email: data.email,
          name: data.name || data.preferred_username || data.email,
          role: data.role || data.roles,
          numeroEmpleado: data.numeroEmpleado || data.numero_empleado,
        };
        setUser(userObj);
        setGlobalUserInfo(userObj);
      })
      .catch(() => {
        setUser(null);
        setGlobalUserInfo(null);
      });
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await logout(token);
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('okta_code_verifier');
      sessionStorage.removeItem('okta_code_verifier');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!user) return null;

  // Determina si el usuario es admin
  const isAdmin =
    user.role === 'Admin' ||
    (Array.isArray(user.role) && user.role.includes('Admin'));

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
          Usuario: {user.name || user.email}
        </span>
        {user.numeroEmpleado && (
          <span style={{ fontWeight: 500, color: '#1976d2' }}>
            Número Empleado: {user.numeroEmpleado}
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
