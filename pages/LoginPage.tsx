import React from 'react';
import oktaAuth from '../auth/oktaAuth';

const LoginPage: React.FC = () => {
  const handleLogin = async () => {
    await oktaAuth.signInWithRedirect();
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <button onClick={handleLogin}>Iniciar sesión con Okta</button>
    </div>
  );
};

export default LoginPage;
