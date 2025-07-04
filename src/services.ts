import type { OktaConfig } from './types/okta';

// Usa variable de entorno para el backend, ideal para S3 estático
const baseURL = import.meta.env.VITE_BACKEND_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  const res = await fetch(`${baseURL}/api/solicitudes-presupuesto/cambiar-estatus`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

// Si necesitas intercambiar el code de Okta por un token, hazlo solo vía backend:
export async function exchangeOktaCodeForToken(code: string, codeVerifier?: string) {
  // Envía code, redirectUri y codeVerifier al backend
  const payload: Record<string, string> = {
    code,
    redirectUri: window.location.origin + '/callback',
  };
  // Envía siempre el codeVerifier con el mismo nombre que espera el backend
  if (codeVerifier && codeVerifier.trim() !== '') {
    payload.codeVerifier = codeVerifier;
  } else {
    throw new Error('El codeVerifier es obligatorio para el flujo PKCE');
  }
  try {
    const res = await fetch(`${baseURL}/api/exchange-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (error) {
    throw new Error('No se pudo conectar con el backend en ' + baseURL);
  }
}

export async function fetchUserInfo(email?: string) {
  const payload = email ? { email } : {};
  const res = await fetch(`${baseURL}/api/userInfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data || {};
}

export async function logout(token: string) {
  try {
    const res = await fetch(`${baseURL}/api/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      throw new Error('Error al cerrar sesión en el backend');
    }
    return await res.json();
  } catch (error) {
    console.error('Error en la solicitud de logout:', error);
    throw error;
  }

}

// Obtiene la configuración de Okta desde el backend
// export async function fetchOktaConfig(): Promise<OktaConfig> {
//   try {
//     const res = await fetch(`${baseURL}/api/okta-config`, {
//       headers: { ...getAuthHeaders() }
//     });
//     if (!res.ok) {
//       console.error('Error al obtener configuración de Okta:', res.status, res.statusText);
//       throw new Error('Error al obtener configuración de Okta');
//     }
//     const config = await res.json();
//     console.log('Configuración de Okta obtenida:', config);
    
//     // Asegurarse de que la respuesta tenga los campos necesarios
//     if (!config.issuer || !config.clientId) {
//       console.error('La configuración de Okta no contiene los campos requeridos:', config);
//       throw new Error('Configuración de Okta incompleta');
//     }
    
//     return {
//       issuer: config.issuer,
//       clientId: config.clientId,
//       // Incluir otros campos si son necesarios según la interfaz OktaConfig
//     };
//   } catch (error) {
//     console.error('Error al obtener configuración de Okta:', error);
//     throw error;
//   }
// }

// Versión hardcodeada (backup)
export async function fetchOktaConfig(): Promise<OktaConfig> {
  return {
    issuer: 'https://trial-6802190.okta.com/oauth2/default',
    clientId: '0oasv2pcg4hRbY5YV697'
    // Nota: los campos adicionales como redirectUri, scopes, pkce no forman parte
    // del tipo OktaConfig definido en types/okta.ts
  };
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

