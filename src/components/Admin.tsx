import React, { useEffect, useState } from 'react';
import apiConfig from '../config/apiConfig'; // Importa la configuración de la API

interface Solicitud {
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
  { label: 'Estatus', value: 'estatusConfirmacion' },
  { label: 'Fecha', value: 'Fecha' },
];

const estatusOpciones = ['Pendiente', 'Confirmado', 'Rechazado'];

const Admin: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [campoFiltro, setCampoFiltro] = useState<string>('solicitante');
  const [valorFiltro, setValorFiltro] = useState<string>('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>(''); // Filtro separado para estatus
  const [filtrosCampos, setFiltrosCampos] = useState<{[campo: string]: string[]}>({}); // Múltiples filtros por campo
  const [confirmacion, setConfirmacion] = useState<{
    open: boolean;
    idx: number | null;
    nuevoEstatus: string;
    solicitud: Solicitud | null;
  }>({ open: false, idx: null, nuevoEstatus: '', solicitud: null });

  useEffect(() => {
    fetch(`${apiConfig.baseURL}/api/resultados`) // Usa la URL base desde la configuración
      .then(res => res.json())
      .then(data => setSolicitudes(data || []));
  }, []);
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'campoFiltro') setCampoFiltro(e.target.value);
    else setValorFiltro(e.target.value);
  };

  const agregarFiltro = () => {
    if (valorFiltro && campoFiltro) {
      setFiltrosCampos(prev => {
        const arr = prev[campoFiltro] || [];
        if (!arr.includes(valorFiltro)) {
          return {
            ...prev,
            [campoFiltro]: [...arr, valorFiltro]
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

  const solicitudesFiltradas = solicitudes.filter(s => {
    // Filtro por estatus (botones)
    let pasaEstatus = true;
    if (filtroEstatus) {
      pasaEstatus = (s.estatusConfirmacion || '').toLowerCase() === filtroEstatus.toLowerCase();
    }
    
    // Filtros múltiples por campos
    let pasaFiltrosCampos = true;
    Object.entries(filtrosCampos).forEach(([campo, valores]) => {
      if (valores && valores.length > 0) {
        const val = (s[campo] || '').toString().toLowerCase();
        if (!valores.some(v => val.includes(v.toLowerCase()))) {
          pasaFiltrosCampos = false;
        }
      }
    });
    
    // Filtro de texto temporal (para agregar nuevos filtros)
    let pasaFiltroTexto = true;
    if (valorFiltro && campoFiltro) {
      const val = (s[campoFiltro] || '').toString().toLowerCase();
      pasaFiltroTexto = val.includes(valorFiltro.toLowerCase());
    }
    
    return pasaEstatus && pasaFiltrosCampos && pasaFiltroTexto;
  });

  // Ordenar por fecha descendente (más reciente primero)
  const solicitudesFiltradasOrdenadas = [...solicitudesFiltradas].sort((a, b) => {
    if (a.Fecha && b.Fecha) {
      return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
    }
    return 0;
  });

  // Paginación
  const porPagina = 10;
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.ceil(solicitudesFiltradasOrdenadas.length / porPagina);
  const datosPagina = solicitudesFiltradasOrdenadas.slice((pagina - 1) * porPagina, pagina * porPagina);
  useEffect(() => {
    setPagina(1); // Reinicia a la primera página si cambia el filtro
  }, [campoFiltro, valorFiltro, filtroEstatus, filtrosCampos, solicitudes]);

  const handleEstatusChange = (idx: number, nuevoEstatus: string) => {
    const solicitud = datosPagina[idx];
    if (!solicitud) return;
    setConfirmacion({
      open: true,
      idx,
      nuevoEstatus,
      solicitud,
    });
  };
  const confirmarCambioEstatus = () => {
    if (!confirmacion.solicitud || confirmacion.idx === null) {
      setConfirmacion({ open: false, idx: null, nuevoEstatus: '', solicitud: null });
      return;
    }
    const solicitud = confirmacion.solicitud;
    const nuevoEstatus = confirmacion.nuevoEstatus;
    
    // Primero actualizamos localmente
    const actualizadas = solicitudes.map(s =>
      s === solicitud ? { ...s, estatusConfirmacion: nuevoEstatus } : s
    );
    setSolicitudes(actualizadas);

    // Actualizar en backend - Asegurarnos que se envíe el nuevo estatus correctamente
    const solicitudActualizada = { ...solicitud, estatusConfirmacion: nuevoEstatus };
    
    fetch(`${apiConfig.baseURL}/api/editar-estatus`, { // Usa la URL base desde la configuración
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: solicitud.id || solicitud.numeroEmpleado,
        estatusConfirmacion: nuevoEstatus,
        solicitud: solicitudActualizada
      }),
    })
    .then(response => {
      if (!response.ok) {
        console.error('Error al actualizar el estatus', response.statusText);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error en la petición:', error);
    });

    setConfirmacion({ open: false, idx: null, nuevoEstatus: '', solicitud: null });
  };

  const cancelarCambioEstatus = () => {
    setConfirmacion({ open: false, idx: null, nuevoEstatus: '', solicitud: null });
  };

  // Detectar tema (light/dark) desde el body
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

  return (
    <div style={{
      maxWidth: 1100,
      margin: '2rem auto',
      padding: 24,
      position: 'relative',
      background: theme === 'dark' ? '#232323' : '#fff',
      color: theme === 'dark' ? '#f3f3f3' : '#111',
      borderRadius: 18
    }}>
      {/* Confirmación modal */}
      {confirmacion.open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 32,
            minWidth: 340,
            maxWidth: 480,
            boxShadow: '0 8px 32px #0004',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
              Confirmar cambio de estatus
            </div>
            <div style={{ marginBottom: 18, color: '#333', fontSize: 16 }}>
              ¿Está seguro de cambiar el estatus a <b style={{ color: '#1976d2' }}>{confirmacion.nuevoEstatus}</b> para la siguiente solicitud?
            </div>
            <div style={{
              textAlign: 'left',
              background: '#f7fafd',
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              marginBottom: 18,
              maxHeight: 180,
              overflowY: 'auto'
            }}>
              {confirmacion.solicitud &&
                Object.entries(confirmacion.solicitud)
                  .map(([k, v]) => (
                    <div key={k}><b>{k}:</b> {String(v)}</div>
                  ))
              }
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={confirmarCambioEstatus}
                style={{
                  padding: '10px 28px',
                  borderRadius: 8,
                  background: '#1976d2',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  letterSpacing: 1
                }}
              >
                Confirmar
              </button>
              <button
                onClick={cancelarCambioEstatus}
                style={{
                  padding: '10px 28px',
                  borderRadius: 8,
                  background: '#eee',
                  color: '#1976d2',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  letterSpacing: 1
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>      )}
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
              else if (e === 'Pendiente') { bg = '#ffe082'; color = '#a15c00'; shadow = '0 1px 4px #ffe082'; }
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
              border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
              minWidth: 150,
              color: theme === 'dark' ? '#f3f3f3' : '#111',
              background: theme === 'dark' ? '#333' : '#fff'
            }}
            className={theme === 'dark' ? 'select-dark-placeholder' : 'select-light-placeholder'}
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
              border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
              color: theme === 'dark' ? '#f3f3f3' : '#111',
              background: theme === 'dark' ? '#333' : '#fff'
            }}
            className={theme === 'dark' ? 'input-dark-placeholder' : 'input-light-placeholder'}
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
                border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                background: theme === 'dark' ? '#333' : '#f5f5f5',
                color: theme === 'dark' ? '#f3f3f3' : '#666',
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
              // Homologar colores y resaltado de estatus como en ResultadosTabla
              const clean = (row.estatusConfirmacion || '').trim().toLowerCase();
              let rowBg = idx % 2 === 0 ? '#f7fafd' : '#fff';
              if (clean === 'confirmado') rowBg = '#e8f5e9';
              else if (clean === 'rechazado') rowBg = '#ffebee';
              else if (clean === 'pendiente') rowBg = '#fffde7';
              return (
                <tr key={idx + (pagina-1)*porPagina} style={{ background: rowBg, transition: 'background 0.2s' }}>
                  {camposFiltro.filter(c => c.value !== 'estatusConfirmacion').map(c => (
                    <td key={c.value} style={{ padding: 8 }}>{row[c.value]}</td>
                  ))}
                  <td style={{ textAlign: 'right', padding: 8, fontWeight: 500 }}>
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
                      boxShadow: '0 1px 4px #0002',
                      position: 'relative'
                    }}>
                      {/* Mostrar select para cambiar estatus */}
                      <select
                        value={row.estatusConfirmacion || ''}
                        onChange={e => handleEstatusChange(idx + (pagina-1)*porPagina, e.target.value)}
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
              );
            })}
            {datosPagina.length === 0 && (
              <tr>
                <td colSpan={camposFiltro.length + 1} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
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
              border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
              background: pagina === 1 ? (theme === 'dark' ? '#444' : '#eee') : (theme === 'dark' ? '#333' : '#fff'),
              cursor: pagina === 1 ? 'not-allowed' : 'pointer',
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}
          >
            Anterior
          </button>
          <span style={{ alignSelf: 'center', fontWeight: 500, color: theme === 'dark' ? '#f3f3f3' : '#111' }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
              background: pagina === totalPaginas ? (theme === 'dark' ? '#444' : '#eee') : (theme === 'dark' ? '#333' : '#fff'),
              cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default Admin;
