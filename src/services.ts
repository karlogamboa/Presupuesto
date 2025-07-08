import { config } from './config';

// Usa variable de entorno para el backend con API Gateway
const baseURL = config.API_BASE_URL;

// Valida que baseURL esté definida
if (!baseURL) {
  throw new Error('API_BASE_URL (VITE_LAMBDA_URL) no está definida. Revisa tu archivo .env y reinicia el servidor.');
}

function getAuthHeaders(): HeadersInit {
  // En modo desarrollo sin auth, enviar headers de usuario mock
  if (config.DEVELOPMENT_MODE && !config.AUTH_ENABLED) {
    return {
      'x-user-email': String(config.DEFAULT_DEV_USER.email).trim().toLowerCase(),
      'x-user-roles': Array.isArray(config.DEFAULT_DEV_USER.roles)
        ? config.DEFAULT_DEV_USER.roles.map(r => String(r).trim().toLowerCase()).join(',')
        : String(config.DEFAULT_DEV_USER.roles).trim().toLowerCase(),
      'x-user-numeroEmpleado': String(config.DEFAULT_DEV_USER.numeroEmpleado).trim(),
      'x-user-id': String(config.DEFAULT_DEV_USER.numeroEmpleado).trim()
    };
  }
  
  const token = localStorage.getItem('access_token') || localStorage.getItem('api_gateway_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Función para login con API Gateway Authorizer
export async function loginWithApiGateway(credentials: { username: string; password: string }) {
  // En modo desarrollo, simular login exitoso
  if (config.DEVELOPMENT_MODE && !config.AUTH_ENABLED) {
    // Simular token falso con formato JWT para desarrollo
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        ...config.DEFAULT_DEV_USER,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // Expira en 24 horas
      })
    );
    const fakeToken = `${header}.${payload}.devsignature`;

    localStorage.setItem('access_token', fakeToken);
    localStorage.setItem('api_gateway_token', fakeToken);

    return {
      token: fakeToken,
      user: config.DEFAULT_DEV_USER,
      message: 'Login en modo desarrollo'
    };
  }
  
  try {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!res.ok) {
      throw new Error('Credenciales inválidas');
    }
    
    const data = await res.json();
    
    if (data.token) {
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('api_gateway_token', data.token);
      return data;
    }
    
    throw new Error('No se recibió token de autenticación');
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

// Función para validar token con API Gateway
export async function validateToken(): Promise<boolean> {
  // En modo desarrollo sin auth, siempre válido si hay token
  if (config.DEVELOPMENT_MODE && !config.AUTH_ENABLED) {
    const token = localStorage.getItem('access_token');
    return !!token;
  }
  
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    const res = await fetch(`${baseURL}/api/auth/validate`, {
      headers: { ...getAuthHeaders() }
    });
    
    if (!res.ok) {
      console.warn(`Token validation failed: ${res.status} ${res.statusText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

// Función para obtener información del usuario
export async function fetchUserInfo(email?: string) {
  // En modo desarrollo, retornar usuario por defecto
  if (config.DEVELOPMENT_MODE && !config.AUTH_ENABLED) {
    return config.DEFAULT_DEV_USER;
  }
  
  const payload = email ? { email } : {};
  const res = await fetch(`${baseURL}/api/userInfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data || {};
}

// Función de logout actualizada
export async function logout() {
  // En modo desarrollo, solo limpiar localStorage
  if (config.DEVELOPMENT_MODE && !config.AUTH_ENABLED) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('api_gateway_token');
    localStorage.removeItem('id_token');
    return;
  }
  
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      await fetch(`${baseURL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ token }),
      });
    }
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    // Limpiar tokens independientemente del resultado
    localStorage.removeItem('access_token');
    localStorage.removeItem('api_gateway_token');
    localStorage.removeItem('id_token');
  }
}


// --- Solicitudes relacionadas ---
export async function fetchSolicitantes() {
  const res = await fetch(`${baseURL}/api/solicitantes`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}


let departamentosPromise: Promise<any> | null = null;
export async function fetchDepartamentos() {
  if (!departamentosPromise) {
    departamentosPromise = fetch(`${baseURL}/api/departamentos`, {
      headers: { ...getAuthHeaders() }
    })
      .then(res => {
        if (!res.ok) {
          console.error('Error al obtener departamentos:', res.status);
          throw new Error(`Error al obtener departamentos: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        /*
        {
            "id": "335957",
            "nombreDepartamento": "COMERCIAL C.L.",
            "subDepartamento": "335957-G. COMERCIAL LABORAL G",
            "ceco": "335957"
        }
        */
        // Normaliza los datos según la estructura observada
        if (Array.isArray(data)) {
          // Agrupa los datos por departamento para estructurar correctamente los subdepartamentos
          const departamentosMap = new Map();
          
          data.forEach(item => {
            const nombreDept = item.nombreDepartamento || '';
            const subDept = item.subDepartamento || '';
            
            if (!departamentosMap.has(nombreDept)) {
              departamentosMap.set(nombreDept, {
                id: item.id || '',
                nombreDepartamento: nombreDept,
                departamento: nombreDept,
                value: nombreDept,
                label: nombreDept,
                nombre: nombreDept,
                subdepartamentos: []
              });
            }
            
            // Añade el subdepartamento si existe y no está ya en la lista
            if (subDept && !departamentosMap.get(nombreDept).subdepartamentos.includes(subDept)) {
              departamentosMap.get(nombreDept).subdepartamentos.push(subDept);
            }
          });
          
          // Convierte el Map a array y ordena los subdepartamentos
          return Array.from(departamentosMap.values()).map(dept => ({
            ...dept,
            subdepartamentos: dept.subdepartamentos.sort()
          }));
        }
        return data; // Si no es un array, devuelve los datos sin procesar
      })
      .catch(err => {
        console.error('Error procesando departamentos:', err);
        return []; // Devuelve un array vacío en caso de error
      })
      .finally(() => {
        departamentosPromise = null;
      });
  }
  return departamentosPromise;
}

let proveedoresPromise: Promise<any> | null = null;
export async function fetchProveedores() {
  if (!proveedoresPromise) {
    proveedoresPromise = fetch(`${baseURL}/api/proveedores`, {
      headers: { ...getAuthHeaders() }
    })
      .then(res => res.json())
      .then((data: any[]) => {
        // Normaliza para que cada proveedor tenga value, label, cuentasGasto, categoria, etc.
        return (data || []).map((prov: any) => ({
          ...prov,
          value: prov.nombre || prov.id || '', // value para selects
          label: prov.nombre || '', // label para selects
          numeroEmpleado: prov.numeroProveedor || '', // para compatibilidad con UI
          cuentaGastos: prov.cuentasGasto || 
            (typeof prov.cuentasGastos === 'string' ? prov.cuentasGastos : '') ||
            (Array.isArray(prov.cuentasGastos) ? prov.cuentasGastos.join(', ') : '') ||
            '',
          categoriaGasto: prov.categoria || '',
          subsidiariaPrincipal: prov.subsidiariaPrincipal || '',
        }));
      })
      .finally(() => {
        proveedoresPromise = null;
      });
  }
  return proveedoresPromise;
}

let categoriasGastoPromise: Promise<any> | null = null;
export async function fetchCategoriasGasto() {
  if (!categoriasGastoPromise) {
    categoriasGastoPromise = fetch(`${baseURL}/api/categorias-gasto`, {
      headers: { ...getAuthHeaders() }
    })
      .then(res => res.json())
      .then((data: any[]) => {
        // Normaliza para que cada categoría tenga value, label, cuenta, descripcion, etc.
        return (data || []).map((cat: any) => ({
          ...cat,
          value: cat.cuenta || cat.id || '', // value para selects
          label: cat.cuentaDeGastos || cat.nombre || '', // label para selects (priorizar cuentaDeGastos)
          nombre: cat.nombre || '',
          descripcion: cat.descripcion || '',
          saldo: cat.saldo,
        }));
      })
      .finally(() => {
        categoriasGastoPromise = null;
      });
  }
  return categoriasGastoPromise;
}

export async function fetchCorreos() {
  const res = await fetch(`${baseURL}/api/correos`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

// --- Endpoints usados en componentes ---
export async function fetchSolicitanteByNumeroEmpleado(numEmpleado: string) {
  const res = await fetch(`${baseURL}/api/solicitantes/${encodeURIComponent(numEmpleado)}`, {
    headers: { ...getAuthHeaders() }
  });
  // El backend regresa un objeto como:
  // {
  //   "id": "...",
  //   "nombre": "...",
  //   "subsidiaria": "...",
  //   "departamento": "...",
  //   "puestoTrabajo": "...",
  //   "aprobadorGastos": false,
  //   "idInterno": ...
  // }
  // Normaliza el resultado para que siempre tenga las propiedades esperadas
  const data = await res.json();
  // Renombra 'correo' a 'Correo electrónico' si es necesario
  if (data?.correo && !data['Correo electrónico']) {
    data['Correo electrónico'] = data.correo;
  }
  return data;
}

export async function guardarPresupuesto(payload: any) {
  const res = await fetch(`${baseURL}/api/solicitudes-presupuesto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchResultados(numEmpleado?: string) {
  const url = numEmpleado
    ? `${baseURL}/api/solicitudes-presupuesto?numeroEmpleado=${encodeURIComponent(numEmpleado)}`
    : `${baseURL}/api/solicitudes-presupuesto`;
  const res = await fetch(url, { headers: { ...getAuthHeaders() } });
  return res.json();
}

export async function editarEstatusSolicitud(estatusConfirmacion: string, solicitud: any) {
  let headers: HeadersInit = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const res = await fetch(`${baseURL}/api/solicitudes-presupuesto/cambiar-estatus`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ estatusConfirmacion, solicitud }),
  });
  return res.json();
}

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const res = await fetch(`${baseURL}/api/emails/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ to, subject, body }),
  });
  return res.json();
}

// Importar catálogos desde archivos CSV
export async function importCatalogCSV(catalog: string, file: File, replaceAll: boolean) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('replaceAll', String(replaceAll));
    
    const response = await fetch(`${baseURL}/api/${catalog}/import-csv`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
        // No incluimos Content-Type porque FormData lo establece automáticamente con el boundary
      },
      body: formData,
    });
    
    const data = await response.json();
    
    // Si el servidor devuelve un error específico, incluirlo en la respuesta
    if (!response.ok) {
      console.error(`Error al importar catálogo ${catalog}:`, data);
      return {
        success: false,
        message: data.message || `Error ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        ...data
      };
    }
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('Error en importación de catálogo:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido en la importación',
      error: String(error)
    };
  }
}

