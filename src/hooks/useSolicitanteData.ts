import { useEffect, useState } from 'react';
import { fetchSolicitanteByNumeroEmpleado } from '../services';

export interface EmpleadoParsed {
  nombre: string;
  correo: string;
  departamento: string;
  subDepartamento: string;
  centroCostos: string;
  empresa: string;
}

function getCentroCostosFromSubDepartamento(subDepartamento: string) {
  let centroCostos = '';
  if (subDepartamento?.trim()) {
    const regex = /^([A-Z0-9]+)[\s\-_]+/;
    const match = regex.exec(subDepartamento);
    if (match && match[1] && match[1].trim()) {
      centroCostos = match[1].trim();
    } else {
      const partes = subDepartamento.split(/[\s\-_]+/);
      if (partes.length > 0 && partes[0] && partes[0].trim()) {
        centroCostos = partes[0].trim();
      }
    }
  }
  return centroCostos;
}

export function parseEmpleadoData(data: any): EmpleadoParsed {
  // DEBUG: Log para ver el objeto recibido
  console.log('parseEmpleadoData data:', data);
  // Extraer nombre del solicitante (soporta variantes)
  const nombre = data?.nombre ?? data?.Nombre ?? data?.NOMBRE ?? '';
  // Extraer correo electrónico (soporta varias variantes)
  const correo = data?.['Correo electrónico'] ?? data?.correo ?? data?.correoElectronico ?? '';
  // Procesar departamento y subdepartamento
  let departamento = '';
  let subDepartamento = '';
  let centroCostosCalculado = '';
  const deptStr = data?.departamento ?? '';
  if (deptStr) {
    const deptParts = deptStr.split(' : ');
    if (deptParts.length > 1) {
      departamento = deptParts[0].trim();
      const subPartsInput = deptParts[1].trim();
      const match = subPartsInput.match(/^(\d+)-(.+)$/);
      if (match) {
        centroCostosCalculado = match[1].trim();
        subDepartamento = match[2].trim();
      } else {
        const subParts = subPartsInput.split('-');
        if (subParts.length > 1) {
          centroCostosCalculado = subParts[0].trim();
          subDepartamento = subParts.slice(1).join('-').trim();
        } else {
          subDepartamento = subPartsInput;
        }
      }
    } else {
      departamento = deptStr;
    }
  }
  if (!centroCostosCalculado && subDepartamento) {
    centroCostosCalculado = getCentroCostosFromSubDepartamento(subDepartamento);
  }
  if (!centroCostosCalculado) {
    centroCostosCalculado = data?.centroCostos || data?.['Centro de costos'] || '';
  }
  return {
    nombre,
    correo,
    departamento,
    subDepartamento,
    centroCostos: centroCostosCalculado,
    empresa: data?.subsidiaria ?? data?.empresa ?? ''
  };
}

export function useSolicitanteData(numeroEmpleado: string | undefined) {
  const [empleado, setEmpleado] = useState<EmpleadoParsed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!numeroEmpleado) {
      setEmpleado(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchSolicitanteByNumeroEmpleado(numeroEmpleado)
      .then((data: any) => {
        if (!data || !data.nombre) {
          setEmpleado(null);
          setError('No se encontró el solicitante');
          return;
        }
        setEmpleado(parseEmpleadoData(data));
      })
      .catch(() => {
        setEmpleado(null);
        setError('Error al obtener solicitante');
      })
      .finally(() => setLoading(false));
  }, [numeroEmpleado]);

  return { empleado, loading, error };
}
