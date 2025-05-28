import apiConfig from './config/apiConfig'; // Importa la configuración de la API

// Este archivo contendrá servicios para consumir el backend y obtener las listas necesarias para el formulario de solicitud de Presuupuesto.

export async function fetchSolicitantes() {
  const res = await fetch(`${apiConfig.baseURL}/api/solicitantes`);
  return res.json();
}

export async function fetchAreas() {
  const res = await fetch(`${apiConfig.baseURL}/api/areas`);
  return res.json();
}

export async function fetchSubDepartamentos(areaId: string) {
  const res = await fetch(`${apiConfig.baseURL}/api/subdepartamentos?areaId=${areaId}`);
  return res.json();
}

export async function fetchCategoriasGasto() {
  const res = await fetch(`${apiConfig.baseURL}/api/categorias-gasto`);
  return res.json();
}

export async function fetchCorreos() {
  const res = await fetch(`${apiConfig.baseURL}/api/correos`);
  return res.json();
}

// Puedes agregar más funciones según los endpoints de tu backend.
