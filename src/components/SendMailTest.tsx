import React, { useState } from 'react';
import { sendEmail } from '../services';

const SendMailTest: React.FC = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');

  const handleSendMail = async () => {
    if (!to || !subject || !body) {
      setMessage('Todos los campos son obligatorios.');
      return;
    }

    try {
      const response = await sendEmail({ to, subject, body });

      if (!response || response?.error) {
        const errorMessage = response?.message || response?.error || 'Error desconocido';
        setMessage(`Error al enviar correo: ${errorMessage}`);
      } else {
        setMessage('Correo enviado exitosamente.');
      }
    } catch (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? error.message : error;
      setMessage(`Error en la petición: ${errorMessage}`);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Prueba de Envío de Correo</h2>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="to-email" style={{ display: 'block', marginBottom: 8 }}>Para:</label>
        <input
          id="to-email"
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Asunto:</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Cuerpo:</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 120 }}
        />
      </div>
      <button
        onClick={handleSendMail}
        style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        Enviar Correo
      </button>
      {message && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f4f6fb', borderRadius: 4, color: '#333' }}>
          {message}
        </div>
      )}
    </div>
  );
};
export default SendMailTest;

// No requiere cambios, el componente SendMailTest ya es de acceso público.
// Solo asegúrate de que en tu router NO esté envuelto en ProtectedRoute.