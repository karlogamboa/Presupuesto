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
      } catch (err) {
        setError('Error en el callback de inicio de sesión');
        console.error('Error en el callback de inicio de sesión:', err);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return <div>{error}</div>;
  }

  return <div>Procesando inicio de sesión...</div>;
};

export default LoginCallback;