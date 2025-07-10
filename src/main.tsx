import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import RouterApp from '../routes/RouterApp';
import { loadDynamicConfig } from './config';

// Cargar configuración dinámica antes de renderizar la app
loadDynamicConfig().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterApp />
    </StrictMode>,
  );
});
