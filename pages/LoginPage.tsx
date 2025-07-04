/**
 * Copyright (c) 2024 Círculo de Crédito
 * Versión de compilación: 1.0.0
 */

import React  from 'react';
import { startOktaLogin } from '../auth/oktaAuth';

const LoginPage: React.FC = () => {
  const handleLogin = async () => {
    await startOktaLogin();
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <img
        src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg"
        alt="Círculo de Crédito"
        style={{ width: 180, marginBottom: 24 }}
      />      
      <button onClick={handleLogin}>Iniciar sesión con Okta</button>
      <p>
 * Copyright (c) 2024 Círculo de Crédito
 * Versión de compilación: 1.0.5</p>
    </div>
  );
};

export default LoginPage;

