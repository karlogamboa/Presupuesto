import { useState, useEffect } from 'react';
import SolicitudGastoForm from './components/SolicitudGastoForm';
import ResultadosTabla from './components/ResultadosTabla';
import './App.css';

function limpiarEspacios(obj: any) {
  const nuevo: any = {};
  Object.keys(obj).forEach(k => {
    const key = k.trim();
    let val = obj[k];
    if (typeof val === 'string') val = val.trim();
    nuevo[key] = val;
  });
  return nuevo;
}

function App() {
  const [resultados, setResultados] = useState<any[]>([]);
  const [solicitanteSeleccionado, setSolicitanteSeleccionado] = useState<string>('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [numeroEmpleadoFiltro, setNumeroEmpleadoFiltro] = useState<string>('');
  const [datosSolicitante, setDatosSolicitante] = useState<any>(null);
  const [errorMessages, setErrorMessages] = useState<{ id: number; text: string }[]>([]);
  const [errorId, setErrorId] = useState(0);

  // Utilidad para mostrar un mensaje de error
  const showError = (text: string) => {
    setErrorMessages(prev => {
      const id = errorId + 1;
      setErrorId(id);
      return [...prev, { id, text }];
    });
  };

  // Eliminar mensaje por id
  const removeError = (id: number) => {
    setErrorMessages(prev => prev.filter(msg => msg.id !== id));
  };

  useEffect(() => {
    if (errorMessages.length > 0) {
      const timers = errorMessages.map(msg =>
        setTimeout(() => removeError(msg.id), 8000)
      );
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [errorMessages]);

  useEffect(() => {
    if (numeroEmpleadoFiltro) {
      // Obtener datos del solicitante
      fetch(`http://localhost:3000/api/solicitante?numEmpleado=${encodeURIComponent(numeroEmpleadoFiltro)}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener solicitante');
          return res.json();
        })
        .then(data => {
          if (data && data.nombre) {
            setDatosSolicitante({
              solicitante: data.nombre,
              correo: data.correo,
              departamento: data.departamento,
              empresa: data.empresa,
              numeroEmpleado: data.idInterno,
              subDepartamento: data.subDepartamento,
              centroCostos: '', // Limpia centro de costos, lo llenará el form si aplica
            });
          } else {
            setDatosSolicitante({
              solicitante: '',
              correo: '',
              departamento: '',
              empresa: '',
              numeroEmpleado: '',
              subDepartamento: '',
              centroCostos: '',
            });
          }
        })
        .catch(() => showError('Error al obtener datos del solicitante'));

      // Obtener resultados
      fetch(`http://localhost:3000/api/resultados?numeroEmpleado=${encodeURIComponent(numeroEmpleadoFiltro)}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener resultados');
          return res.json();
        })
        .then(data => {
          setResultados((data || []).map(limpiarEspacios));
        })
        .catch(() => showError('Error al obtener resultados'));
    } else {
      setResultados([]);
      setDatosSolicitante({
        solicitante: '',
        correo: '',
        departamento: '',
        empresa: '',
        numeroEmpleado: '',
        subDepartamento: '',
        centroCostos: '',
      });
    }
  }, [numeroEmpleadoFiltro]);

  const handleFormSubmit = (data: any) => {
    setResultados(prev => [
      {
        ...data,
        cecos: data.centroCostos,
        departamento: data.departamento,
        nombre: data.solicitante,
        estatusConfirmacion: 'Pendiente',
      },
      ...prev
    ]);
    setSolicitanteSeleccionado(data.solicitante);
  };

  const handleEstatusChange = (idx: number, nuevoEstatus: string) => {
    setResultados(prev =>
      prev.map((row, i) =>
        i === idx ? { ...row, estatusConfirmacion: nuevoEstatus } : row
      )
    );
  };

  // Filtrar por solicitante seleccionado y estatus
  const resultadosFiltrados = resultados
    .filter(r => !solicitanteSeleccionado || r.solicitante === solicitanteSeleccionado)
    .filter(r => filtroEstatus === 'Todos' || r.estatusConfirmacion === filtroEstatus)
    .filter(r => !numeroEmpleadoFiltro || String(r.numeroEmpleado).trim() === String(numeroEmpleadoFiltro).trim());

  // Obtener estatus únicos para el filtro
  const estatusUnicos = Array.from(new Set(resultados
    .filter(r => !solicitanteSeleccionado || r.solicitante === solicitanteSeleccionado)
    .map(r => r.estatusConfirmacion)));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Mensajes de error tipo popup */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        pointerEvents: 'none'
      }}>
        {errorMessages.map((msg, idx) => (
          <div
            key={msg.id}
            style={{
              minWidth: 280,
              maxWidth: 400,
              background: '#e57373',
              color: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 12px #0003',
              padding: '16px 40px 16px 18px',
              fontSize: 16,
              fontWeight: 500,
              marginTop: idx === 0 ? 0 : 4,
              position: 'relative',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ flex: 1 }}>{msg.text}</span>
            <button
              onClick={() => removeError(msg.id)}
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1
              }}
              aria-label="Cerrar"
              tabIndex={0}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <h1>Solicitud de Presupuesto</h1>
      <SolicitudGastoForm
        onSubmit={handleFormSubmit}
        onNumeroEmpleadoChange={setNumeroEmpleadoFiltro}
      />
      {numeroEmpleadoFiltro && (
        <>
          <h2 style={{ marginTop: 40 }}>Listado de Resultados</h2>
          <div style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            marginBottom: 16,
            justifyContent: 'center', // Centra los filtros
            width: '100%'
          }}>
            {/* Filtro de estatus como botones vistosos */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setFiltroEstatus('Todos')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 16,
                  border: 'none',
                  background: filtroEstatus === 'Todos' ? '#1976d2' : '#e3eafc',
                  color: filtroEstatus === 'Todos' ? '#fff' : '#1976d2',
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  boxShadow: filtroEstatus === 'Todos' ? '0 1px 4px #1976d2' : 'none'
                }}
              >
                Todos
              </button>
              {estatusUnicos.map(e => {
                let bg = '#ffe082', color = '#a15c00', shadow = 'none';
                if (e === 'Confirmado') { bg = '#43a047'; color = '#fff'; shadow = '0 1px 4px #43a047'; }
                else if (e === 'Rechazado') { bg = '#e57373'; color = '#fff'; shadow = '0 1px 4px #e57373'; }
                else if (e === 'Pendiente') { bg = '#ffe082'; color = '#a15c00'; shadow = '0 1px 4px #ffe082'; }
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
          {resultadosFiltrados.length > 0 ? (
            <ResultadosTabla
              data={resultadosFiltrados}
              onEstatusChange={handleEstatusChange}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#888',
              fontSize: 18,
              margin: '32px 0',
              padding: 24,
              background: '#fffbe7',
              borderRadius: 12,
              border: '1px solid #ffe082'
            }}>
              No hay resultados para el filtro seleccionado.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
