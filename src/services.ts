const baseURL = 'http://localhost:3000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Todas las peticiones ya usan getAuthHeaders para incluir el JWT en el header Authorization.

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

export async function fetchCategoriasGasto() {
  const res = await fetch(`${baseURL}/api/categorias-gasto`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

export async function fetchCorreos() {
  const res = await fetch(`${baseURL}/api/correos`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

// --- Endpoints usados en componentes ---
export async function fetchDepartamentos() {
  const res = await fetch(`${baseURL}/api/departamentos`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

export async function fetchProveedores() {
  const res = await fetch(`${baseURL}/api/proveedores`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

export async function fetchSolicitanteByNumeroEmpleado(numEmpleado: string) {
  const res = await fetch(`${baseURL}/api/solicitante?numEmpleado=${encodeURIComponent(numEmpleado)}`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

export async function guardarPresupuesto(payload: any) {
  const res = await fetch(`${baseURL}/api/guardar-presupuesto`, {
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
  const res = await fetch(`${baseURL}/api/editar-estatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ estatusConfirmacion, solicitud }),
  });
  return res.json();
}

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const res = await fetch(`${baseURL}/api/SendEmail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ to, subject, body }),
  });
  return res.json();
}
