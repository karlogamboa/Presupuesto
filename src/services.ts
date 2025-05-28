import apiConfig from './config/apiConfig.json'; // Importa el archivo JSON de configuración de la API localmente

// Este archivo contendrá servicios para consumir el backend y obtener las listas necesarias para el formulario de solicitud de Presuupuesto.

export async function fetchSolicitantes() {
  const res = await fetch(`${apiConfig.baseURL}/api/solicitantes`); // Usa la baseURL directamente del JSON importado
  return res.json();
}

export async function fetchAreas() {
  const res = await fetch(`${apiConfig.baseURL}/api/areas`); // Usa la baseURL directamente del JSON importado
  return res.json();
}

export async function fetchSubDepartamentos(areaId: string) {
  const res = await fetch(`${apiConfig.baseURL}/api/subdepartamentos?areaId=${areaId}`); // Usa la baseURL directamente del JSON importado
  return res.json();
}

export async function fetchCategoriasGasto() {
  const res = await fetch(`${apiConfig.baseURL}/api/categorias-gasto`); // Usa la baseURL directamente del JSON importado
  return res.json();
}

export async function fetchCorreos() {
  const res = await fetch(`${apiConfig.baseURL}/api/correos`); // Usa la baseURL directamente del JSON importado
  return res.json();
}

// Puedes agregar más funciones según los endpoints de tu backend.
