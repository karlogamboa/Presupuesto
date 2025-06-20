import { OktaAuth } from '@okta/okta-auth-js';
import { exchangeOktaCodeForToken } from '../src/services';

// Configuración solo para PKCE, sin clientSecret, para frontend SPA
const oktaAuth = new OktaAuth({
  issuer: 'https://trial-6802190.okta.com/oauth2/default',
  clientId: '0oasgvzk0yf1Zg3CN697',
  redirectUri: window.location.origin + '/callback',
  responseType: ['code'],
  scopes: ['openid', 'profile', 'email'],
  pkce: true,
});

// El frontend solo obtiene el code, el backend hace el intercambio por el token
// Puedes agregar helpers para redirigir a Okta y leer el code del querystring

export const getAuthorizationUrl = () => {
  const params = [
    `client_id=${encodeURIComponent(oktaAuth.options.clientId!)}`,
    `redirect_uri=${encodeURIComponent(oktaAuth.options.redirectUri!)}`,
    `response_type=code`,
    `scope=${encodeURIComponent(oktaAuth.options.scopes!.join(' '))}`,
    `state=${encodeURIComponent(Math.random().toString(36).substring(2))}`,
    `code_challenge_method=S256`,
  ].join('&');
  return `${oktaAuth.options.issuer}/v1/authorize?${params}`;
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
  const idToken = await oktaAuth.tokenManager.get('idToken');
  return idToken ? (idToken as any).idToken : null; // Asegúrate de que sea un IDToken
};

export const getAccessToken = async (): Promise<string | null> => {
  const accessToken = await oktaAuth.tokenManager.get('accessToken');
  return accessToken && (accessToken as any).accessToken ? (accessToken as any).accessToken : null;
};

export const refreshTokens = async (): Promise<void> => {
  try {
    await oktaAuth.tokenManager.renew('idToken'); // Renueva el IDToken
    await oktaAuth.tokenManager.renew('accessToken'); // Renueva el AccessToken
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

  // Guarda el code_verifier en sessionStorage y localStorage como respaldo
  sessionStorage.setItem('okta_code_verifier', codeVerifier);
  localStorage.setItem('okta_code_verifier', codeVerifier);

  // Construye la URL de autorización con code_challenge
  const params = [
    `client_id=${encodeURIComponent(oktaAuth.options.clientId!)}`,
    `redirect_uri=${encodeURIComponent(oktaAuth.options.redirectUri!)}`,
    `response_type=code`,
    `scope=${encodeURIComponent(oktaAuth.options.scopes!.join(' '))}`,
    `state=${encodeURIComponent(Math.random().toString(36).substring(2))}`,
    `code_challenge_method=S256`,
    `code_challenge=${encodeURIComponent(codeChallenge)}`,
  ].join('&');
  window.location.href = `${oktaAuth.options.issuer}/v1/authorize?${params}`;
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

export default oktaAuth;