// Configuración de la aplicación
export const config = {
  // Modo desarrollo - deshabilita autenticación
  DEVELOPMENT_MODE: import.meta.env.VITE_DEVELOPMENT_MODE === 'true',
  
  // APIs
  API_BASE_URL: import.meta.env.VITE_LAMBDA_URL,
  
  // Autenticación
  AUTH_ENABLED: import.meta.env.VITE_AUTH_ENABLED !== 'false',
  
  // Usuario por defecto para desarrollo
  DEFAULT_DEV_USER: {
    email: 'karlo@zicral.com',
    name: 'Usuario Desarrollo',
    roles: ['ADMIN']    
  }
};

// Carga dinámica de configuración desde public/config.json
export type AppConfig = {
  LAMBDA_URL: string;
  DEVELOPMENT_MODE: boolean;
  AUTH_ENABLED: boolean;
};

export let dynamicConfig: AppConfig = {
  LAMBDA_URL: '',
  DEVELOPMENT_MODE: false,
  AUTH_ENABLED: false
};

export async function loadDynamicConfig() {
  try {
    const resp = await fetch('/config.json');
    if (!resp.ok) throw new Error('No se pudo cargar config.json');
    dynamicConfig = await resp.json();
    return dynamicConfig;
  } catch (e) {
    // Si falla, mantener valores por defecto
    return dynamicConfig;
  }
}
