import React from 'react';

const LoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = '/api/protected';
  };

  return (
    <button
      onClick={handleLogin}
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
      Iniciar sesión
    </button>
  );
};

export default LoginButton;
