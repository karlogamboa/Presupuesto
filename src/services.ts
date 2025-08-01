import { config, dynamicConfig } from './config';

// Usar siempre config/dynamicConfig para URLs. No hardcodear.
// Usar la URL dinámica si está disponible, si no la de build
const baseURL = dynamicConfig.LAMBDA_URL || config.API_BASE_URL;

// Valida que baseURL esté definida
if (!baseURL) {
  throw new Error('API_BASE_URL no está definida. Revisa config.json o .env');
}

// Elimina el guardado y uso de JWT
// Guarda el token si viene en la URL (ejemplo: ?token=eyJ...)
(function saveTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem('jwt', token);
    // Opcional: limpiar el token de la URL para evitar que se comparta
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();

function getJWT() {
  const jwt = localStorage.getItem('jwt');
  console.debug('[services] getJWT:', jwt);
  return jwt;
}

function getAuthHeaders(): Record<string, string> {
  const jwt = getJWT();
  const headers: Record<string, string> = jwt ? { Authorization: `Bearer ${jwt}` } : {};
  console.debug('[services] getAuthHeaders:', headers);
  return headers;
}

// Función para obtener información del usuario autenticado desde el backend (SAML/cookie)
// Siempre envía JWT en Authorization header
export async function fetchUserInfo() {
  console.log('[services] fetchUserInfo: llamando a', `${baseURL}/api/user`);
  console.log('[services] document.cookie:', document.cookie);
  const headers = getAuthHeaders();
  console.log('[services] fetchUserInfo: headers', headers);
  // Solo usa la cookie SAML, no envíes Authorization
  try {
    const response = await fetch(`${baseURL}/api/user`, {
      credentials: 'include',
      headers
    });
    console.log('[services] fetchUserInfo: response', response);
    if (!response.ok) {
      const text = await response.text();
      console.error('[services] fetchUserInfo: response no ok', response.status, response.statusText, text);
      // Lanzar el objeto Response para que el consumidor pueda manejarlo
      throw response;
    }
    // Verifica si hay contenido antes de parsear JSON
    const text = await response.text();
    if (!text) {
      console.warn('[services] fetchUserInfo: respuesta vacía');
      return null;
    }
    const json = JSON.parse(text);
    console.log('[services] fetchUserInfo: json', json);
    return json;
  } catch (err) {
    console.error('[services] fetchUserInfo: catch', err);
    throw err;
  }
}

// --- Todas las llamadas a /api/* deben enviar el JWT ---
let departamentosPromise: Promise<any> | null = null;
export async function fetchDepartamentos() {
  if (!departamentosPromise) {
    departamentosPromise = fetch(`${baseURL}/api/departamentos`, {
      credentials: 'include',
      headers: getAuthHeaders()
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('Error al obtener departamentos:', res.status, text);
          throw new Error(`Error al obtener departamentos: ${res.status} ${text}`);
        }
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
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
        return [];
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
      credentials: 'include',
      headers: getAuthHeaders()
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('Error al obtener proveedores:', res.status, text);
          throw new Error(`Error al obtener proveedores: ${res.status} ${text}`);
        }
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      })
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
      credentials: 'include',
      headers: getAuthHeaders()
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('Error al obtener categorias gasto:', res.status, text);
          throw new Error(`Error al obtener categorias gasto: ${res.status} ${text}`);
        }
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      })
      .then((data: any[]) => {
        // Normaliza para que cada categoría tenga value, label, cuenta, descripcion, etc.
        return (data || []).map((cat: any) => ({
          ...cat,
          value: cat.cuenta || cat.id || '',
          label: cat.cuentaDeGastos || cat.nombre || '',
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
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Error al obtener correos:', res.status, text);
    throw new Error(`Error al obtener correos: ${res.status} ${text}`);
  }
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text);
}

// --- Endpoints usados en componentes ---

export async function guardarPresupuesto(payload: any) {
  const res = await fetch(`${baseURL}/api/solicitudes-presupuesto`, {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Error al guardar presupuesto:', res.status, text);
    throw new Error(`Error al guardar presupuesto: ${res.status} ${text}`);
  }
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
}

export async function fetchResultados(numEmpleado?: string) {
  const url = numEmpleado
    ? `${baseURL}/api/solicitudes-presupuesto?numeroEmpleado=${encodeURIComponent(numEmpleado)}`
    : `${baseURL}/api/solicitudes-presupuesto`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Error al obtener resultados:', res.status, text);
    throw new Error(`Error al obtener resultados: ${res.status} ${text}`);
  }
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text);
}

export async function editarEstatusSolicitud(estatusConfirmacion: string, solicitud: any) {
  const res = await fetch(`${baseURL}/api/solicitudes-presupuesto/cambiar-estatus`, {
    method: 'PUT',
    body: JSON.stringify({ estatusConfirmacion, solicitud }),
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Error al editar estatus solicitud:', res.status, text);
    throw new Error(`Error al editar estatus solicitud: ${res.status} ${text}`);
  }
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
}

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const res = await fetch(`${baseURL}/api/emails/send`, {
    method: 'POST',
    body: JSON.stringify({ to, subject, body }),
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Error al enviar email:', res.status, text);
    throw new Error(`Error al enviar email: ${res.status} ${text}`);
  }
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
}

// Importar catálogos desde archivos CSV
export async function importCatalogCSV(catalog: string, file: File, replaceAll: boolean) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('replaceAll', String(replaceAll));
    const response = await fetch(`${baseURL}/api/${catalog}/import-csv`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }
    }
    if (!response.ok) {
      console.error(`Error al importar catálogo ${catalog}:`, data);
      return {
        success: false,
        message: (data as any).message || `Error ${response.status}: ${response.statusText}`,
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

export async function fetchPresupuesto({ centroCostos, cuentaGastos, periodo }: { centroCostos: string; cuentaGastos: string; periodo: string }) {
  const url = `${baseURL}/api/presupuesto?centroCostos=${encodeURIComponent(centroCostos)}&cuentaGastos=${encodeURIComponent(cuentaGastos)}&periodo=${encodeURIComponent(periodo)}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Error al obtener presupuesto:', res.status, text);
    throw new Error(`Error al obtener presupuesto: ${res.status} ${text}`);
  }
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
}

// --- CORS: Asegúrate que el backend/API Gateway reenvía los headers CORS en todas las respuestas /api/* ---
// Verifica en DevTools que los headers Access-Control-Allow-Origin, etc. están presentes.

// El frontend está correcto. El backend responde 403 porque no tienes sesión/JWT.