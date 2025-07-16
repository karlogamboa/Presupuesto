/**
 * Copyright (c) 2024 Círculo de Crédito
 * Versión de compilación: 1.0.8
 */

import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div >
      <div style={{
        background: '#fff',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <img
          src="https://www.circulodecredito.com.mx/documents/10588964/0/cdc-logo-negro.svg"
          alt="Círculo de Crédito"
          style={{ width: 180, marginBottom: 32, display: 'block', margin: '0 auto 32px' }}
        />

        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1976d2' }}>
          Iniciar Sesión
        </h2>

        <button
          onClick={() => window.location.href = '/api/protected'}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Iniciar sesión con SAML
        </button>
        {/* El backend gestionará la redirección SAML y la sesión tras autenticación */}

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#666', fontSize: '14px' }}>
          * Copyright (c) 2025 Círculo de Crédito Versión: 1.0.9
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
