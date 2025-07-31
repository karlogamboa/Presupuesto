import React, { useEffect, useState } from 'react';

interface ResultadosTablaProps {
  data?: any[];
  onEstatusChange?: (idx: number, nuevoEstatus: string) => void;
  onOrdenChange?: (campo: string) => void;
  ordenCampo?: string;
  ordenAsc?: boolean;
  numeroEmpleado?: string;
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

  const getRowBg = (estatus: string, idx: number, theme: 'dark' | 'light') => {
    const clean = (estatus || '').trim().toLowerCase();
    const colors: Record<string, string> = {
      aprobado: theme === 'dark' ? '#244c2c' : '#e8f5e9',
      rechazado: theme === 'dark' ? '#4c2323' : '#ffebee',
      pendiente: theme === 'dark' ? '#4c4c23' : '#fffde7',
    };
    return colors[clean] || (idx % 2 === 0 ? (theme === 'dark' ? '#232323' : '#f7fafd') : (theme === 'dark' ? '#181a1b' : '#fff'));
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(
    typeof window !== 'undefined' && document.body.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.body.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!propData) {
    } else {
      setData(propData || []);
    }
    setPagina(1);
  }, [propData]);

  const dataFiltrada = numeroEmpleado
    ? data.filter(row => (row.numeroEmpleado || '').toString().includes(numeroEmpleado))
    : data;

  const dataOrdenada = [...dataFiltrada].sort((a, b) => {
    if (a.Fecha && b.Fecha) {
      return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
    }
    return 0;
  });

  const totalPaginas = Math.ceil(dataOrdenada.length / porPagina);
  const datosPagina = dataOrdenada.slice((pagina - 1) * porPagina, pagina * porPagina);

  const renderHeader = (label: string, campo: string) => (
    <th
      style={{
        padding: 10,
        cursor: 'pointer',
        userSelect: 'none',
        textAlign: 'left',
        color: ordenCampo === campo ? (ordenAsc ? '#1976d2' : '#d32f2f') : 'inherit',
      }}
    >
      {label}
      {ordenCampo === campo && (
        <span style={{ marginLeft: 4 }}>{ordenAsc ? '▲' : '▼'}</span>
      )}
    </th>
  );

  return (
    <div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <table
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: 900,
            background: theme === 'dark' ? '#424242' : '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 2px 12px #0001',
            margin: '0 auto',
            color: theme === 'dark' ? '#f3f3f3' : '#111',
          }}
        >
          <thead>
            <tr style={{ background: theme === 'dark' ? '#1976d2' : '#1976d2', color: '#fff' }}>
              <th colSpan={8} style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>INFO PERSONAL</th>
              <th style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>MONTO</th>
              <th style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>CONFIRMACIÓN</th>
              <th style={{ padding: 12, fontSize: 15, letterSpacing: 1 }}>FECHA</th>
            </tr>
            <tr style={{ background: theme === 'dark' ? '#424242' : '#e3eafc', color: theme === 'dark' ? '#f3f3f3' : '#222' }}>
              {renderHeader('Solicitante', 'nombre')}
              {renderHeader('Núm. Empleado', 'numeroEmpleado')}
              {renderHeader('Departamento', 'departamento')}
              {renderHeader('SubDepartamento', 'subDepartamento')}
              {renderHeader('Categoría Gasto', 'categoriaGasto')}
              {renderHeader('Cuenta Gastos', 'cuentaGastos')}
              {renderHeader('Proveedor', 'proveedor')}
              {renderHeader('Periodo Presupuesto', 'periodoPresupuesto')}
              {renderHeader('Monto Solicitado', 'montoSubtotal')}
              {renderHeader('Estatus Confirmación', 'estatusConfirmacion')}
              {renderHeader('Fecha', 'Fecha')}
            </tr>
          </thead>
          <tbody>
            {datosPagina.length > 0 ? (
              datosPagina.map((row, idx) => (
                <React.Fragment key={idx}>
                  <tr
                    style={{
                      background: getRowBg(row.estatusConfirmacion, (pagina - 1) * porPagina + idx, theme),
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: 8, color: '#111' }}>{row.nombre}</td>
                    <td style={{ padding: 8, color: '#111' }}>{row.numeroEmpleado}</td>
                    <td style={{ padding: 8, color: '#111' }}>{row.departamento}</td>
                    <td style={{ padding: 8, color: '#111' }}>{row.subDepartamento}</td>
                    <td style={{ padding: 8, color: '#111' }}>{row.categoriaGasto}</td>
                    <td style={{ padding: 8, color: '#111' }}>{row.cuentaGastos}</td>
                    <td style={{ padding: 8, color: '#111' }}>{row.proveedor}</td>
                    <td style={{ padding: 8, color: '#111' }}>{row.periodoPresupuesto}</td>
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
                          row.estatusConfirmacion === 'Aprobado'
                            ? '#43a047'
                            : row.estatusConfirmacion === 'Rechazado'
                            ? '#e57373'
                            : '#ffe082',
                        color:
                          row.estatusConfirmacion === 'Aprobado'
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
                  <tr>
                    <td colSpan={11} style={{ borderBottom: '1px solid #ddd' }}></td>
                  </tr>
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={11} style={{
                  textAlign: 'center',
                  color: theme === 'dark' ? '#f3f3f3' : '#111',
                  fontSize: 18,
                  padding: 32,
                  background: theme === 'dark' ? '#424242' : '#fffbe7',
                  borderRadius: 12,
                  border: theme === 'dark' ? '1px solid #f57c00' : '1px solid #ffe082',
                }}>
                  No hay resultados para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, gap: 8 }}>
          {/*
            Extract background color for the "Anterior" button to avoid nested ternary
          */}
          {(() => {
            let anteriorBtnBg = '';
            if (pagina === 1) {
              anteriorBtnBg = theme === 'dark' ? '#616161' : '#eee';
            } else {
              anteriorBtnBg = theme === 'dark' ? '#424242' : '#fff';
            }
            return (
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: theme === 'dark' ? '1px solid #616161' : '1px solid #bdbdbd',
                  background: anteriorBtnBg,
                  cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                  color: theme === 'dark' ? '#f3f3f3' : '#111',
                }}
              >
                Anterior
              </button>
            );
          })()}
          
              <span style={{
                alignSelf: 'center',
                fontWeight: 500,
                color: theme === 'dark' ? '#90caf9' : '#1976d2'   
              }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: theme === 'dark' ? '1px solid #616161' : '1px solid #bdbdbd',
              background: pagina === totalPaginas ? (theme === 'dark' ? '#616161' : '#eee') : (theme === 'dark' ? '#424242' : '#fff'),
              cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
              color: theme === 'dark' ? '#f3f3f3' : '#111',
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
