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
    email: 'dev@circulodecredito.com',
    name: 'Usuario Desarrollo',
    roles: ['ADMIN'], // Cambiado a arreglo para compatibilidad con split/join
    numeroEmpleado: '7854'
  }
};
