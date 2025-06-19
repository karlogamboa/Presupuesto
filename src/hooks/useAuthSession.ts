import { useEffect, useState } from 'react';

type JwtPayload = {
  exp?: number;
  [key: string]: any;
};

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function useAuthSession() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthenticated(false);
      setIsExpired(false);
      return;
    }
    const payload = parseJwt(token);
    if (payload?.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp > now) {
        setIsAuthenticated(true);
        setIsExpired(false);
      } else {
        setIsAuthenticated(false);
        setIsExpired(true);
        localStorage.removeItem('access_token');
      }
    } else {
      setIsAuthenticated(false);
      setIsExpired(false);
    }
  }, []);

  return { isAuthenticated, isExpired };
}
