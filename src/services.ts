// Este archivo contendrá servicios para consumir el backend y obtener las listas necesarias para el formulario de solicitud de Presuupuesto.

export async function fetchSolicitantes() {
  // Reemplazar URL por la de tu backend
  const res = await fetch('http://localhost:3000/api/solicitantes');
  return res.json();
}

export async function fetchAreas() {
  const res = await fetch('http://localhost:3000/api/areas');
  return res.json();
}

export async function fetchSubDepartamentos(areaId: string) {
  const res = await fetch(`http://localhost:3000/api/subdepartamentos?areaId=${areaId}`);
  return res.json();
}

export async function fetchCategoriasGasto() {
  const res = await fetch('http://localhost:3000/api/categorias-gasto');
  return res.json();
}

export async function fetchCorreos() {
  const res = await fetch('http://localhost:3000/api/correos');
  return res.json();
}

// Puedes agregar más funciones según los endpoints de tu backend.
