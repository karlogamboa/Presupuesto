// Configuración centralizada. No usar valores hardcodeados fuera de este archivo.

// Configuración de la aplicación
export const config = {
  
  // APIs
  API_BASE_URL: import.meta.env.VITE_LAMBDA_URL,
  OKTA_SLO_URL: import.meta.env.VITE_OKTA_SLO_URL
};

// Carga dinámica de configuración desde public/config.json
export type AppConfig = {
  LAMBDA_URL: string;
  OKTA_SLO_URL?: string;
};

export let dynamicConfig: AppConfig = {
  LAMBDA_URL: '',
  OKTA_SLO_URL: ''
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
