const baseURL = 'http://localhost:8080';

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

export async function fetchAreas() {
  const res = await fetch(`${baseURL}/api/areas`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

export async function fetchSubDepartamentos(areaId: string) {
  const res = await fetch(`${baseURL}/api/subdepartamentos?areaId=${areaId}`, {
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
      .then(res => res.json())
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
          cuentaGastos: typeof prov.cuentasGasto === 'string'
            ? prov.cuentasGasto
            : Array.isArray(prov.cuentasGasto)
              ? prov.cuentasGasto.join(', ')
              : '',
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
          value: cat.cuenta || '', // value para selects
          label:cat.cuentaDeGastos ||  '', // label para selects
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
  // Renombra 'nombre' a 'Nombre' para compatibilidad con el frontend
  if (data?.nombre && !data?.Nombre) {
    data.Nombre = data.nombre;
  }
  // Renombra 'subsidiaria' a 'Subsidiaria' si es necesario
  if (data?.subsidiaria && !data.Subsidiaria) {
    data.Subsidiaria = data.subsidiaria;
  }
  // Renombra 'departamento' a 'Departamento' si es necesario
  if (data?.departamento && !data.Departamento) {
    data.Departamento = data.departamento;
  }
  // Renombra 'correo' a 'Correo electrónico' si es necesario
  if (data?.correo && !data['Correo electrónico']) {
    data['Correo electrónico'] = data.correo;
  }
  return data;
}

export async function guardarPresupuesto(payload: any) {
  const res = await fetch(`${baseURL}/api/resultados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchResultados(numEmpleado?: string) {
  const url = numEmpleado
    ? `${baseURL}/api/resultados?numEmpleado=${encodeURIComponent(numEmpleado)}`
    : `${baseURL}/api/resultados`;
  const res = await fetch(url, { headers: { ...getAuthHeaders() } });
  return res.json();
}

export async function editarEstatusSolicitud(estatusConfirmacion: string, solicitud: any) {
  const res = await fetch(`${baseURL}/api/resultados/editar-estatus`, {
    method: 'POST',
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
export async function exchangeOktaCodeForToken(code: string, code_verifier?: string) {
  // Envía code, redirect_uri y code_verifier al backend
  const payload: Record<string, string> = {
    code,
    redirect_uri: window.location.origin + '/callback',
  };
  // Solo agrega code_verifier si tiene valor (no es undefined ni cadena vacía)
  if (code_verifier && code_verifier.trim() !== '') {
    payload.code_verifier = code_verifier;
  }
  try {
    const res = await fetch(`${baseURL}/api/exchange-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (error) {
    // Error de conexión: backend no está corriendo o puerto incorrecto
    throw new Error('No se pudo conectar con el backend en ' + baseURL);
  }
}

export async function fetchUserInfo(email?: string) {
  const payload = email ? { email } : {};
  const res = await fetch(`${baseURL}/api/userinfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data || {};
}
