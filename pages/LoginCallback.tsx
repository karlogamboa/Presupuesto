import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../auth/oktaAuth';

const LoginCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) {
          setError('No se encontró el código de autorización en la URL');
          navigate('/login');
          return;
        }
        const tokens = await exchangeCodeForToken(code);
        if (tokens?.access_token) {
          localStorage.setItem('access_token', tokens.access_token);
        }
        if (tokens?.id_token) {
          localStorage.setItem('id_token', tokens.id_token);
        }
        // Espera breve para asegurar que el token esté disponible
        await new Promise(resolve => setTimeout(resolve, 100));
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp > now) {
              setError(null);
              window.location.href = '/Solicitud';
              return;
            }
          } catch {
            // Token inválido
          }
        }
        setError('No se pudo obtener un token válido');
        window.location.href = '/login';
      } catch (err: any) {
        console.error('Error en el callback de inicio de sesión:', err);
        // Manejo específico para errores de conexión
        if (err?.message?.includes('No se pudo conectar con el backend')) {
          setError('No se puede conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.');
        } else if (err?.message?.includes('Failed to fetch')) {
          setError('Error de conexión con el servidor. El backend puede estar fuera de línea.');
        } else {
          setError('Error en el callback de inicio de sesión: ' + (err?.message || 'Error desconocido'));
        }
        // Redirige al login después de 5 segundos
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <img
          src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg"
          alt="Círculo de Crédito"
          style={{ width: 180, marginBottom: 24 }}
        />
        <div style={{ 
          color: '#d32f2f', 
          fontSize: '16px', 
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          {error}
        </div>
        <div style={{ color: '#666', fontSize: '14px' }}>
          Serás redirigido al login en unos segundos...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <img
        src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg"
        alt="Círculo de Crédito"
        style={{ width: 180, marginBottom: 24 }}
      />
      <div>Procesando inicio de sesión...</div>
    </div>
  )
};

export default LoginCallback;