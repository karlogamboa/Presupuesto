import { OktaAuth } from '@okta/okta-auth-js';
import { exchangeOktaCodeForToken, fetchOktaConfig } from '../src/services';
import type { OktaConfig } from '../src/types/okta';

// Configuración dinámica de Okta obtenida desde el backend
let oktaAuth: OktaAuth | null = null;
let oktaConfig: OktaConfig | null = null;

// Cache de configuración para evitar múltiples llamadas
let configPromise: Promise<OktaConfig> | null = null;

async function getOktaConfig(): Promise<OktaConfig> {
  if (oktaConfig) {
    return oktaConfig;
  }
  
  if (!configPromise) {
    configPromise = fetchOktaConfig()
      .then((config: OktaConfig) => {
        oktaConfig = config;
        return config;
      })
      .catch(error => {
        configPromise = null; // Reset para permitir reintentos
        throw error;
      });
  }
  
  return configPromise;
}

async function getOktaAuthInstance(): Promise<OktaAuth> {
  if (oktaAuth) {
    return oktaAuth;
  }

  const config = await getOktaConfig();
  
  oktaAuth = new OktaAuth({
    issuer: config.issuer,
    clientId: config.clientId,
    redirectUri: window.location.origin + '/callback',
    responseType: ['code'],
    scopes: ['openid', 'profile', 'email'],
    pkce: true,
  });

  return oktaAuth;
}

// El frontend solo obtiene el code, el backend hace el intercambio por el token
// Puedes agregar helpers para redirigir a Okta y leer el code del querystring

export const getAuthorizationUrl = async () => {
  const config = await getOktaConfig();
  const params = [
    `client_id=${encodeURIComponent(config.clientId)}`,
    `redirect_uri=${encodeURIComponent(window.location.origin + '/callback')}`,
    `response_type=code`,
    `scope=${encodeURIComponent(['openid', 'profile', 'email'].join(' '))}`,
    `state=${encodeURIComponent(Math.random().toString(36).substring(2))}`,
    `code_challenge_method=S256`,
  ].join('&');
  return `${config.issuer}/v1/authorize?${params}`;
};

// El resto de helpers solo gestionan tokens si el backend los entrega al frontend
export const isAuthenticated = async (): Promise<boolean> => {
  // Solo valida el access_token de localStorage
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp > now) {
        return true;
      }
    } catch {
      // Token inválido
    }
  }
  return false;
};

export const getIdToken = async (): Promise<string | null> => {
  const oktaAuthInstance = await getOktaAuthInstance();
  const idToken = await oktaAuthInstance.tokenManager.get('idToken');
  return idToken ? (idToken as any).idToken : null; // Asegúrate de que sea un IDToken
};

export const getAccessToken = async (): Promise<string | null> => {
  const oktaAuthInstance = await getOktaAuthInstance();
  const accessToken = await oktaAuthInstance.tokenManager.get('accessToken');
  return accessToken && (accessToken as any).accessToken ? (accessToken as any).accessToken : null;
};

export const refreshTokens = async (): Promise<void> => {
  try {
    const oktaAuthInstance = await getOktaAuthInstance();
    await oktaAuthInstance.tokenManager.renew('idToken'); // Renueva el IDToken
    await oktaAuthInstance.tokenManager.renew('accessToken'); // Renueva el AccessToken
  } catch (error) {
    console.error('Error al renovar los tokens:', error);
  }
};

// Utilidades PKCE propias (OktaAuth no expone generateVerifier ni computeChallenge)
function base64UrlEncode(str: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier(length = 128): string {
  // El code_verifier debe tener entre 43 y 128 caracteres, usando caracteres permitidos por la spec PKCE
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

async function computeCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

// Genera y guarda el code_verifier antes de redirigir a Okta
export async function startOktaLogin() {
  // Importante: esta función debe ejecutarse en la misma pestaña/ventana donde se recibirá el callback
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await computeCodeChallenge(codeVerifier);
  const config = await getOktaConfig();

  // Guarda el code_verifier en sessionStorage y localStorage como respaldo
  sessionStorage.setItem('okta_code_verifier', codeVerifier);
  localStorage.setItem('okta_code_verifier', codeVerifier);

  // Construye la URL de autorización con code_challenge
  const params = [
    `client_id=${encodeURIComponent(config.clientId)}`,
    `redirect_uri=${encodeURIComponent(window.location.origin + '/callback')}`,
    `response_type=code`,
    `scope=${encodeURIComponent(['openid', 'profile', 'email'].join(' '))}`,
    `state=${encodeURIComponent(Math.random().toString(36).substring(2))}`,
    `code_challenge_method=S256`,
    `code_challenge=${encodeURIComponent(codeChallenge)}`,
  ].join('&');
  window.location.href = `${config.issuer}/v1/authorize?${params}`;
}

// En el callback, recupera el code_verifier y úsalo
export async function exchangeCodeForToken(
  code: string
): Promise<{ access_token: string; id_token: string }> {
  // Usa el helper de services.ts para hacer el fetch al backend
  const code_verifier = sessionStorage.getItem('okta_code_verifier');
  if (!code_verifier || code_verifier.trim() === '') {
    // Intenta recuperar el code_verifier de localStorage como fallback
    const fallbackVerifier = localStorage.getItem('okta_code_verifier');
    if (fallbackVerifier && fallbackVerifier.trim() !== '') {
      console.warn('Recuperando code_verifier desde localStorage como fallback');
      sessionStorage.setItem('okta_code_verifier', fallbackVerifier);
      return exchangeCodeForToken(code); // Intenta de nuevo
    }
    console.error('No se encontró code_verifier en sessionStorage ni en localStorage');
    throw new Error('No se encontró code_verifier para el intercambio PKCE');
  }
  try {
    const response = await exchangeOktaCodeForToken(code, code_verifier);
    if (!response || !response.access_token) {
      console.error('exchangeOktaCodeForToken: respuesta inesperada', response);
      throw new Error('No se pudo intercambiar el código por el token');
    }
    return response;
  } catch (err) {
    console.error('exchangeCodeForToken error:', err);
    throw err;
  }
}

// Exporta una función que retorna la instancia de OktaAuth cuando esté disponible
export default async function getOktaAuth(): Promise<OktaAuth> {
  return await getOktaAuthInstance();
}