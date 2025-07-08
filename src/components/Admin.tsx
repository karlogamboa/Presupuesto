import React, { useEffect, useState, useMemo } from 'react';
import { fetchResultados, editarEstatusSolicitud } from '../services';
import MenuUsuario from './MenuUsuario';

interface Solicitud {
  id?: string;
  numeroEmpleado?: string;
  estatusConfirmacion?: string;
  montoSubtotal?: number;
  Fecha?: string;
  [key: string]: any;
}

const camposFiltro = [
  { label: 'Solicitante', value: 'solicitante' },
  { label: 'Número de Empleado', value: 'numeroEmpleado' },
  { label: 'Proveedor', value: 'proveedor' },
  { label: 'Departamento', value: 'departamento' },
  { label: 'SubDepartamento', value: 'subDepartamento' },
  { label: 'Categoría Gasto', value: 'categoriaGasto' },
  { label: 'Cuenta Gastos', value: 'cuentaGastos' },
  { label: 'Periodo', value: 'periodoPresupuesto' },
  { label: 'Estatus', value: 'estatusConfirmacion' },
  { label: 'Fecha', value: 'Fecha' },
];

const estatusOpciones = ['Pendiente', 'Confirmado', 'Rechazado'];

const Admin: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtrosCampos, setFiltrosCampos] = useState<Record<string, string[]>>({});
  const [filtroEstatus, setFiltroEstatus] = useState<string>('');
  const [valorFiltro, setValorFiltro] = useState<string>('');
  const [campoFiltro, setCampoFiltro] = useState<string>('solicitante');
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const totalPaginas = useMemo(() => {
    return Math.ceil(solicitudes.length / porPagina);
  }, [solicitudes, porPagina]);

  useEffect(() => {
    fetchResultados()
      .then(data => setSolicitudes(data || []));
  }, []);

  const agregarFiltro = () => {
    if (valorFiltro && campoFiltro) {
      setFiltrosCampos(prev => {
        const arr = prev[campoFiltro] || [];
        if (!arr.includes(valorFiltro)) {
          return {
            ...prev,
            [campoFiltro]: [...arr, valorFiltro],
          };
        }
        return prev;
      });
      setValorFiltro('');
    }
  };

  const eliminarFiltro = (campo: string, valor: string) => {
    setFiltrosCampos(prev => {
      const arr = prev[campo] || [];
      const nuevoArr = arr.filter(v => v !== valor);
      const nuevo = { ...prev };
      if (nuevoArr.length > 0) {
        nuevo[campo] = nuevoArr;
      } else {
        delete nuevo[campo];
      }
      return nuevo;
    });
  };

  const limpiarTodosFiltros = () => {
    setFiltroEstatus('');
    setFiltrosCampos({});
    setValorFiltro('');
  };

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(s => {
      let pasaEstatus = true;
      if (filtroEstatus) {
        pasaEstatus = (s.estatusConfirmacion || '').toLowerCase() === filtroEstatus.toLowerCase();
      }

      let pasaFiltrosCampos = true;
      Object.entries(filtrosCampos).forEach(([campo, valores]) => {
        if (valores && valores.length > 0) {
          const val = (s[campo] || '').toString().toLowerCase();
          if (!valores.some(v => val.includes(v.toLowerCase()))) {
            pasaFiltrosCampos = false;
          }
        }
      });

      return pasaEstatus && pasaFiltrosCampos;
    });
  }, [solicitudes, filtroEstatus, filtrosCampos]);

  const solicitudesFiltradasOrdenadas = useMemo(() => {
    return [...solicitudesFiltradas].sort((a, b) => {
      if (a.Fecha && b.Fecha) {
        return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
      }
      return 0;
    });
  }, [solicitudesFiltradas]);

  const datosPagina = useMemo(() => {
    return solicitudesFiltradasOrdenadas.slice((pagina - 1) * porPagina, pagina * porPagina);
  }, [solicitudesFiltradasOrdenadas, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [filtrosCampos, filtroEstatus, solicitudes]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'campoFiltro') setCampoFiltro(value);
    else setValorFiltro(value);
  };

  const handleEstatusChange = (idx: number, nuevoEstatus: string) => {
    const solicitud = datosPagina[idx];
    if (!solicitud) return;

    editarEstatusSolicitud(nuevoEstatus, solicitud)
      .then(response => {
        if (!response || response.success !== true) {
          alert(`Error en la petición: ${response?.error || response?.message || 'Error desconocido'}`);
          // No actualizar el estado si no fue exitoso
        } else {
          const actualizadas = solicitudes.map(s =>
            s === solicitud ? { ...s, estatusConfirmacion: nuevoEstatus } : s
          );
          setSolicitudes(actualizadas);
        }
      })
      .catch(error => {
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? error.message : error;
        alert(`Error en la petición: ${errorMessage}`);
      });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24 }}>
      <MenuUsuario />
      
      {(
        <>
          <h2>Administrador de Solicitudes</h2>
          
          {/* Filtro por Estatus (Botones) */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 12, 
              color: '#1976d2',
              borderBottom: '2px solid #e3eafc',
              paddingBottom: 8
            }}>
              Filtrar por Estatus
            </h3>
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}>
              <button
                type="button"
                onClick={() => setFiltroEstatus('')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 16,
                  border: 'none',
                  background: filtroEstatus === '' ? '#1976d2' : '#e3eafc',
                  color: filtroEstatus === '' ? '#fff' : '#1976d2',
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  boxShadow: filtroEstatus === '' ? '0 1px 4px #1976d2' : 'none'
                }}
              >
                Todos
              </button>
              {estatusOpciones.map(e => {
                let bg = '#ffe082', color = '#a15c00', shadow = 'none';
                if (filtroEstatus === e) {
                  if (e === 'Confirmado') { bg = '#43a047'; color = '#fff'; shadow = '0 1px 4px #43a047'; }
                  else if (e === 'Rechazado') { bg = '#e57373'; color = '#fff'; shadow = '0 1px 4px #e57373'; }
                  else if (e === 'Pendiente') { shadow = '0 1px 4px #ffe082'; }
                }
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setFiltroEstatus(e)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 16,
                      border: 'none',
                      background: filtroEstatus === e ? bg : '#e3eafc',
                      color: filtroEstatus === e ? color : '#1976d2',
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: 1,
                      cursor: 'pointer',
                      boxShadow: filtroEstatus === e ? shadow : 'none'
                    }}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por Campo (Texto) */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 12, 
              color: '#1976d2',
              borderBottom: '2px solid #e3eafc',
              paddingBottom: 8
            }}>
              Buscar por Campo
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <select
                name="campoFiltro"
                value={campoFiltro}
                onChange={handleFiltroChange}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #cfd8dc',
                  minWidth: 150,
                  color: '#111',
                  background: '#fff'
                }}
              >
                {camposFiltro.filter(c => c.value !== 'estatusConfirmacion').map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                name="valorFiltro"
                value={valorFiltro}
                onChange={handleFiltroChange}
                placeholder="Buscar..."
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #cfd8dc',
                  color: '#111',
                  background: '#fff'
                }}
                onKeyDown={e => { if (e.key === 'Enter') agregarFiltro(); }}
              />
              <button
                type="button"
                onClick={agregarFiltro}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #1976d2',
                  background: '#1976d2',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
                disabled={!valorFiltro}
              >
                Agregar filtro
              </button>
              {valorFiltro && (
                <button
                  type="button"
                  onClick={() => setValorFiltro('')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cfd8dc',
                    background: '#f5f5f5',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Indicador de filtros activos */}
          {(filtroEstatus || Object.keys(filtrosCampos).length > 0) && (
            <div style={{
              marginBottom: 18,
              padding: 12,
              background: '#e3f2fd',
              borderRadius: 8,
              border: '1px solid #bbdefb'
            }}>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#1976d2', 
                marginBottom: 8 
              }}>
                Filtros activos:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {filtroEstatus && (
                  <span style={{
                    padding: '4px 12px',
                    background: '#1976d2',
                    color: '#fff',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500
                  }}>
                    Estatus: {filtroEstatus}
                    <button
                      onClick={() => setFiltroEstatus('')}
                      style={{
                        marginLeft: 8,
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {Object.entries(filtrosCampos).map(([campo, valores]) => valores.map(valor => (
                  <span key={campo + valor} style={{
                    padding: '4px 12px',
                    background: '#1976d2',
                    color: '#fff',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500
                  }}>
                    {camposFiltro.find(c => c.value === campo)?.label}: {valor}
                    <button
                      onClick={() => eliminarFiltro(campo, valor)}
                      style={{
                        marginLeft: 8,
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      ✕
                    </button>
                  </span>
                )))}
                <button
                  onClick={limpiarTodosFiltros}
                  style={{
                    padding: '4px 12px',
                    background: '#ff5722',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Limpiar todos
                </button>
              </div>
            </div>
          )}
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1976d2', color: '#fff' }}>
                  {camposFiltro.filter(c => c.value !== 'estatusConfirmacion').map(c => (
                    <th key={c.value} style={{ padding: 8 }}>{c.label}</th>
                  ))}
                  <th style={{ padding: 8 }}>Monto Solicitado</th>
                  <th style={{ padding: 8 }}>{camposFiltro.find(c => c.value === 'estatusConfirmacion')?.label}</th>
                </tr>
              </thead>
              <tbody>
                {datosPagina.map((row, idx) => {
                  const clean = (row.estatusConfirmacion || '').trim().toLowerCase();
                  let rowBg = idx % 2 === 0 ? '#f7fafd' : '#fff';
                  if (clean === 'confirmado') rowBg = '#e8f5e9';
                  else if (clean === 'rechazado') rowBg = '#ffebee';
                  else if (clean === 'pendiente') rowBg = '#fffde7';
                  return (
                    <React.Fragment key={idx + (pagina - 1) * porPagina}>
                      <tr style={{ background: rowBg, transition: 'background 0.2s' }}>
                        {camposFiltro.filter(c => c.value !== 'estatusConfirmacion').map(c => (
                          <td key={c.value} style={{ padding: 8 }}>
                            {c.value === 'Fecha' && row[c.value]
                              ? new Date(row[c.value] ?? '').toLocaleDateString('es-MX')
                              : row[c.value]}
                          </td>
                        ))}
                        <td style={{ textAlign: 'right', padding: 8, fontWeight: 500 }}>
                          {typeof row.montoSubtotal === 'number' && row.montoSubtotal !== null
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
                            boxShadow: '0 1px 4px #0002',
                            position: 'relative'
                          }}>
                            {/* Mostrar select para cambiar estatus */}
                            <select
                              value={row.estatusConfirmacion || ''}
                              onChange={e => handleEstatusChange(idx + (pagina - 1) * porPagina, e.target.value)}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer'
                              }}
                            >
                              {estatusOpciones.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <span style={{ pointerEvents: 'none' }}>
                              {row.estatusConfirmacion}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={camposFiltro.length + 2} style={{ borderBottom: '1px solid #ddd' }}></td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                {datosPagina.length === 0 && (
                  <tr>
                    <td colSpan={camposFiltro.length + 2} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                      No hay resultados.
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
                  color: '#111'
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
                  color: '#111'
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;