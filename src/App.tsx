import { useState, useEffect, useMemo, useRef } from 'react';
import SolicitudGastoForm from './components/SolicitudGastoForm';
import ResultadosTabla from './components/ResultadosTabla';
import { fetchResultados } from './services';
import './App.css';
import MenuUsuario from './components/MenuUsuario';

interface Resultado {
  id?: number;
  solicitante?: string;
  numeroEmpleado?: string;
  estatusConfirmacion?: string;
  cecos?: string;
  periodoPresupuesto?: string;
  proveedor?: string;
  categoriaGasto?: string;
  cuentaGastos?: string;
  montoSubtotal?: number;
  correo?: string;
  [key: string]: any;
}

interface ErrorMessage {
  id: number;
  text: string;
}

function App() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [solicitanteSeleccionado, setSolicitanteSeleccionado] = useState<string>('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [numeroEmpleadoFiltro, setNumeroEmpleadoFiltro] = useState<string>('');
  const [errorMessages, setErrorMessages] = useState<ErrorMessage[]>([]);
  // Referencia para almacenar los timers de los mensajes de error
  const errorTimersRef = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    // Limpiar todos los temporizadores cuando el componente se desmonte
    return () => {
      Object.values(errorTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (numeroEmpleadoFiltro) {
      fetchResultados(numeroEmpleadoFiltro)
        .then((data) => {
          const resultadosConCampos = (data ?? []).map((item: any) => ({
            ...item,
            cecos: item.cecos ?? item.centroCostos ?? '',
            periodoPresupuesto: item.periodoPresupuesto ?? 'N/A',
            proveedor: item.proveedor ?? 'N/A',
          }));
          setResultados(resultadosConCampos);
        })
        .catch(() => {
          setResultados([]);
          addErrorMessage('Error al obtener resultados');
        });
    } else {
      setResultados([]);
    }
  }, [numeroEmpleadoFiltro]);

  const addErrorMessage = (text: string) => {
    const id = Date.now();
    setErrorMessages(prev => [...prev, { id, text }]);
    
    // Limpiar temporizador existente si hay alguno con el mismo ID (aunque no debería ocurrir)
    if (errorTimersRef.current[id]) {
      clearTimeout(errorTimersRef.current[id]);
    }
    
    // Configurar un temporizador para eliminar automáticamente el mensaje después de 15 segundos
    const timer = setTimeout(() => {
      removeErrorMessage(id);
      // Eliminar la referencia al temporizador cuando se ejecuta
      delete errorTimersRef.current[id];
    }, 15000);
    
    // Guardar referencia al temporizador
    errorTimersRef.current[id] = timer;
  };

  const removeErrorMessage = (id: number) => {
    // Limpiar el temporizador si existe
    if (errorTimersRef.current[id]) {
      clearTimeout(errorTimersRef.current[id]);
      delete errorTimersRef.current[id];
    }
    
    setErrorMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handleFormSubmit = (data: any) => {
    setResultados(prev => [
      {
        ...data,
        cecos: data.centroCostos,
        estatusConfirmacion: 'Pendiente',
        montoSubtotal: parseFloat(data.montoSubtotal), // Convertir montoSubtotal a número
      },
      ...prev,
    ]);
    setSolicitanteSeleccionado(data.solicitante ?? '');
  };

  const handleEstatusChange = (idx: number, nuevoEstatus: string) => {
    setResultados(prev =>
      prev.map((row, i) => (i === idx ? { ...row, estatusConfirmacion: nuevoEstatus } : row))
    );
  };

  const resultadosFiltrados = useMemo(() => {
    return resultados
      .filter(r => !solicitanteSeleccionado || r.solicitante === solicitanteSeleccionado)
      .filter(r => filtroEstatus === 'Todos' || r.estatusConfirmacion === filtroEstatus)
      .filter(r => !numeroEmpleadoFiltro || String(r.numeroEmpleado).trim() === String(numeroEmpleadoFiltro).trim());
  }, [resultados, solicitanteSeleccionado, filtroEstatus, numeroEmpleadoFiltro]);

  const estatusUnicos = useMemo(() => {
    return Array.from(new Set(resultados.map(r => r.estatusConfirmacion).filter((e): e is string => Boolean(e)))); // Filtrar valores undefined
  }, [resultados]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <MenuUsuario />
      <ErrorPopup messages={errorMessages} onRemove={removeErrorMessage} />
      <h1>Solicitud de Presupuesto</h1>
      <SolicitudGastoForm
        onSubmit={handleFormSubmit}
        onNumeroEmpleadoChange={setNumeroEmpleadoFiltro}
      />
      {numeroEmpleadoFiltro && (
        <>
          <h2 style={{ marginTop: 40 }}>Listado de Resultados</h2>
          <EstatusFilter
            estatusUnicos={estatusUnicos}
            filtroEstatus={filtroEstatus}
            setFiltroEstatus={setFiltroEstatus}
          />
          {resultadosFiltrados.length > 0 ? (
            <ResultadosTabla
              data={resultadosFiltrados}
              onEstatusChange={handleEstatusChange}
            />
          ) : (
            <NoResultsMessage />
          )}
        </>
      )}
    </div>
  );
}

const ErrorPopup: React.FC<{ messages: ErrorMessage[]; onRemove: (id: number) => void }> = ({ messages, onRemove }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {messages.map(msg => (
      <div
        key={msg.id}
        style={{
          minWidth: 280,
          maxWidth: 400,
          background: '#e57373',
          color: '#fff',
          borderRadius: 8,
          padding: '16px 40px 16px 18px',
          fontSize: 16,
          fontWeight: 500,
          position: 'relative',
        }}
      >
        <span>{msg.text}</span>
        <button
          onClick={() => onRemove(msg.id)}
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
          }}
        >
          ×
        </button>
      </div>
    ))}
  </div>
);

const EstatusFilter: React.FC<{ estatusUnicos: string[]; filtroEstatus: string; setFiltroEstatus: (estatus: string) => void }> = ({ estatusUnicos, filtroEstatus, setFiltroEstatus }) => (
  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
    <button
      onClick={() => setFiltroEstatus('Todos')}
      style={{
        padding: '8px 18px',
        borderRadius: 16,
        background: filtroEstatus === 'Todos' ? '#1976d2' : '#e3eafc',
        color: filtroEstatus === 'Todos' ? '#fff' : '#1976d2',
        fontWeight: 700,
      }}
    >
      Todos
    </button>
    {estatusUnicos.map(e => (
      <button
        key={e}
        onClick={() => setFiltroEstatus(e)}
        style={{
          padding: '8px 18px',
          borderRadius: 16,
          background: filtroEstatus === e ? '#43a047' : '#e3eafc',
          color: filtroEstatus === e ? '#fff' : '#1976d2',
          fontWeight: 700,
        }}
      >
        {e}
      </button>
    ))}
  </div>
);

const NoResultsMessage: React.FC = () => (
  <div style={{ textAlign: 'center', color: '#888', fontSize: 18, margin: '32px 0', padding: 24, background: '#fffbe7', borderRadius: 12, border: '1px solid #ffe082' }}>
    No hay resultados para el filtro seleccionado.
  </div>
);

export default App;