import { useEffect, useState } from 'react';
import { fetchUserInfo } from '../services';

export interface EmpleadoParsed {
  nombre: string;
  correo: string;
  departamento: string;
  subDepartamento: string;
  centroCostos: string;
  empresa: string;
  roles?: string[] | string;
  numeroEmpleado?: string;
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

  // Extraer nombre del solicitante (soporta variantes y objeto userName)
  let nombre = data?.nombre ?? data?.Nombre ?? data?.NOMBRE ?? '';
  if (!nombre && typeof data?.userName === 'object' && data.userName?.givenName && data.userName?.familyName) {
    nombre = `${data.userName.givenName} ${data.userName.familyName}`;
  }

  // Extraer correo electrónico (soporta varias variantes)
  const correo =
    data?.['Correo electrónico'] ??
    data?.correo ??
    data?.correoElectronico ??
    data?.email ??
    data?.email_from_token ??
    data?.principal ??
    '';

  // Extraer roles desde authorities si existen
  let roles: string[] | string = data?.roles ?? data?.role ?? data?.rol ?? '';
  if (Array.isArray(data?.authorities)) {
    roles = data.authorities.map((a: any) => a.authority);
  }

  // Extraer número de empleado
  const numeroEmpleado =
    data?.numeroEmpleado ??
    data?.NumeroEmpleado ??
    data?.numero ??
    data?.employeeNumber ??
    '';

  // Procesar departamento y subdepartamento
  let departamento = '';
  let subDepartamento = '';
  let centroCostosCalculado = '';
  const deptStr = data?.departamento ?? data?.department ?? '';
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
    empresa: data?.subsidiaria ?? data?.empresa ?? '',
    roles,
    numeroEmpleado
  };
}

export function useSolicitanteData() {
  // Obtiene los datos del usuario autenticado vía SAML (backend)
  const [empleado, setEmpleado] = useState<EmpleadoParsed | null>(null);
  useEffect(() => {
    let mounted = true;
    fetchUserInfo()
      .then(data => {
        if (mounted) setEmpleado(parseEmpleadoData(data));
      })
      .catch(() => {
        if (mounted) setEmpleado(null);
      });
    return () => { mounted = false; };
  }, []);
  return { empleado };
}
