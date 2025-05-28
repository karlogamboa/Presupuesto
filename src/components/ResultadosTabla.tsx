import React, { useEffect, useState } from 'react';
import apiConfig from '../config/apiConfig'; // Importa la configuración de la API

interface ResultadosTablaProps {
  data?: any[];
  onEstatusChange?: (idx: number, nuevoEstatus: string) => void;
  onOrdenChange?: (campo: string) => void;
  ordenCampo?: string;
  ordenAsc?: boolean;
  numeroEmpleado?: string; // Nuevo prop para filtrar
}

const ResultadosTabla: React.FC<ResultadosTablaProps> = ({
  data: propData,
  ordenCampo,
  ordenAsc,
  numeroEmpleado,
}) => {
  const [data, setData] = useState<any[]>(propData || []);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    if (!propData) {
      fetch(`${apiConfig.baseURL}/api/resultados`) // Usa la URL base desde la configuración
        .then(res => res.json())
        .then(apiData => setData(apiData || []));
    } else {
      setData(propData);
    }
    setPagina(1);
  }, [propData]);


  // Filtrado por número de empleado si está activo (desde prop)
  const dataFiltrada = numeroEmpleado
    ? data.filter(row => (row.numeroEmpleado || '').toString().includes(numeroEmpleado))
    : data;

  // Ordena los datos por fecha descendente (más reciente primero)
  const dataOrdenada = [...dataFiltrada].sort((a, b) => {
    if (a.Fecha && b.Fecha) {
      return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
    }
    return 0;
  });

  const totalPaginas = Math.ceil(dataOrdenada.length / porPagina);
  const datosPagina = dataOrdenada.slice((pagina - 1) * porPagina, pagina * porPagina);

  // Función para obtener el color de fondo según el estatus
  const getRowBg = (estatus: string, idx: number) => {
    const clean = (estatus || '').trim().toLowerCase();
    if (clean === 'confirmado') return '#e8f5e9';
    if (clean === 'rechazado') return '#ffebee';
    if (clean === 'pendiente') return '#fffde7';
    return idx % 2 === 0 ? '#f7fafd' : '#fff';
  };

  // Renderiza un header con opción de ordenar
  const renderHeader = (label: string, campo: string) => (
    <th
      style={{ padding: 8, userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label}
      {ordenCampo === campo && (
        <span style={{ marginLeft: 4 }}>
          {ordenAsc ? '⬆️' : '⬇️'}
        </span>
      )}
    </th>
  );

  return (
    <div
      style={{
        margin: '2rem auto',
        maxWidth: '100%',
        background: '#f4f6fb',
        borderRadius: 16,
        padding: '2rem 1rem',
        boxShadow: '0 4px 24px #0002',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <table
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: 900,
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 2px 12px #0001',
            margin: '0 auto'
          }}
        >
          <thead>
            <tr style={{ background: '#1976d2', color: '#fff' }}>
              <th colSpan={5} style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>INFO PERSONAL</th>
              <th colSpan={2} style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>GASTO</th>
              {/* <th colSpan={2} style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>PRESUPUESTO</th> */}
              <th style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>MONTO</th>
              <th style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>CONFIRMACIÓN</th>
              <th style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>FECHA</th>
            </tr>
            <tr style={{ background: '#e3eafc', color: '#222' }}>
              {renderHeader('Solicitante', 'solicitante')}
              {renderHeader('Núm. Empleado', 'numeroEmpleado')}
              {renderHeader('Departamento', 'departamento')}
              {renderHeader('SubDepartamento', 'subDepartamento')}
              {renderHeader('Categoría Gasto', 'categoriaGasto')}
              {renderHeader('Cuenta Gastos', 'cuentaGastos')}
              {renderHeader('Proveedor', 'proveedor')}
              {renderHeader('Monto Solicitado', 'montoSubtotal')}
              {renderHeader('Estatus Confirmación', 'estatusConfirmacion')}
              {renderHeader('Fecha', 'Fecha')}
            </tr>
          </thead>
          <tbody>
            {datosPagina.length > 0 ? (
              datosPagina.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: getRowBg(row.estatusConfirmacion, (pagina - 1) * porPagina + idx),
                    transition: 'background 0.2s'
                  }}
                >
                  <td style={{ padding: 8, color: '#111' }}>{row.solicitante}</td>
                  <td style={{ padding: 8, color: '#111' }}>{row.numeroEmpleado}</td>
                  <td style={{ padding: 8, color: '#111' }}>{row.departamento}</td>
                  <td style={{ padding: 8, color: '#111' }}>{row.subDepartamento}</td>
                  <td style={{ padding: 8, color: '#111' }}>{row.categoriaGasto}</td>
                  <td style={{ padding: 8, color: '#111' }}>{row.cuentaGastos}</td>
                  <td style={{ padding: 8, color: '#111' }}>{row.proveedor}</td>
                  <td style={{ textAlign: 'right', padding: 8, fontWeight: 500, color: '#111' }}>
                    {row.montoSubtotal !== undefined && row.montoSubtotal !== null && row.montoSubtotal !== ''
                      ? Number(row.montoSubtotal).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                      : ''}
                  </td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      minWidth: 110,
                      textAlign: 'center',
                      padding: '8px 18px',
                      borderRadius: 16,
                      background:
                        row.estatusConfirmacion === 'Confirmado'
                          ? '#43a047'
                          : row.estatusConfirmacion === 'Rechazado'
                          ? '#e57373'
                          : '#ffe082',
                      color:
                        row.estatusConfirmacion === 'Confirmado'
                          ? '#fff'
                          : row.estatusConfirmacion === 'Rechazado'
                          ? '#fff'
                          : '#a15c00',
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: 1,
                      boxShadow: '0 1px 4px #0002'
                    }}>
                      {row.estatusConfirmacion}
                    </span>
                  </td>
                  <td style={{ padding: 8, color: '#111' }}>
                    {(() => {
                      if (!row.Fecha) {
                        row.Fecha = new Date().toISOString();
                      }
                      return new Date(row.Fecha).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={14} style={{
                  textAlign: 'center',
                  color: '#111',
                  fontSize: 18,
                  padding: 32,
                  background: '#fffbe7',
                  borderRadius: 12,
                  border: '1px solid #ffe082'
                }}>
                  No hay resultados para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, gap: 8 }}>
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #bdbdbd',
              background: pagina === 1 ? '#eee' : '#fff',
              cursor: pagina === 1 ? 'not-allowed' : 'pointer',
              color: '#111' // Letras negras
            }}
          >
            Anterior
          </button>
          <span style={{ alignSelf: 'center', fontWeight: 500, color: '#111' }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #bdbdbd',
              background: pagina === totalPaginas ? '#eee' : '#fff',
              cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
              color: '#111' // Letras negras
            }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultadosTabla;
