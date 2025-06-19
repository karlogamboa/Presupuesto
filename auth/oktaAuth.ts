import { OktaAuth } from '@okta/okta-auth-js';

const oktaAuth = new OktaAuth({
  issuer: 'https://trial-6802190.okta.com/oauth2/default',
  clientId: '0oap8mw2ivbCJpMKX5d7',
  redirectUri: window.location.origin + '/login/callback',
});

export const isAuthenticated = async (): Promise<boolean> => {
  const idToken = await oktaAuth.tokenManager.get('idToken');
  return !!idToken;
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
    await oktaAuth.tokenManager.renew('accessToken'); // Renueva el AccessToken
    await oktaAuth.tokenManager.renew('idToken'); // Renueva el IDToken
  } catch (error) {
    console.error('Error al renovar los tokens:', error);
  }
};

export default oktaAuth;
