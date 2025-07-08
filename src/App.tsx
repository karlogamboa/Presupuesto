import { useState, useEffect, useMemo } from 'react';
import SolicitudGastoForm from './components/SolicitudGastoForm';
import ResultadosTabla from './components/ResultadosTabla';
import { fetchResultados } from './services';
import './App.css';
import MenuUsuario from './components/MenuUsuario';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

function App() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [solicitanteSeleccionado, setSolicitanteSeleccionado] = useState<string>('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [numeroEmpleadoFiltro, setNumeroEmpleadoFiltro] = useState<string>('');

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
          toast.error('Error al obtener resultados');
        });
    } else {
      setResultados([]);
    }
  }, [numeroEmpleadoFiltro]);

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
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
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