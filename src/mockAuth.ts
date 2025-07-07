// Mock de autenticación simple sin API Gateway Authorizer
export const mockAuth = {
  // Usuarios de prueba
  users: [
    { username: 'admin', password: 'admin123', role: 'admin', numeroEmpleado: '12345', email: 'admin@cdc.com' },
    { username: 'user', password: 'user123', role: 'user', numeroEmpleado: '67890', email: 'user@cdc.com' }
  ],

  // Simular login
  async login(username: string, password: string) {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const token = btoa(JSON.stringify({
      username: user.username,
      role: user.role,
      numeroEmpleado: user.numeroEmpleado,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }));

    return { token, user };
  },

  // Simular validación
  async validate(token: string): Promise<boolean> {
    try {
      const payload = JSON.parse(atob(token));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  },

  // Obtener usuario del token
  getUserFromToken(token: string) {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }
};
