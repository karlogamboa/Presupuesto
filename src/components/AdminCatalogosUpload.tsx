import React, { useState, useEffect } from 'react';
import { importCatalogCSV } from '../services';
import { toast } from 'react-toastify';

const CATALOG_OPTIONS = [
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'departamentos', label: 'Departamentos' },
  { value: 'categorias-gasto', label: 'Categorías de Gasto' },
  { value: 'solicitantes', label: 'Solicitantes' }
];

const AdminCatalogosUpload: React.FC = () => {
  const [catalog, setCatalog] = useState(CATALOG_OPTIONS[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [replaceAll, setReplaceAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: string; message: string; data?: any } | null>(null);

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

  // Mostrar resultado aunque sea error, no limpiar result automáticamente
  useEffect(() => {
    if (result) {
      if (result.type === 'success') {
        toast.success(result.message);
      } else if (result.type === 'error') {
        toast.error(result.message);
      } else {
        toast.info(result.message);
      }
      // No limpiar result aquí, para que se muestre en la UI
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setResult({ type: 'error', message: 'Selecciona un archivo CSV.' });
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      // Verificar si hay token antes de hacer la petición
      const token = localStorage.getItem('access_token');
      if (!token) {
        setResult({ 
          type: 'error', 
          message: 'No hay sesión activa. Por favor inicia sesión nuevamente.' 
        });
        return;
      }

      // Usar la función centralizada de services.ts
      const data = await importCatalogCSV(catalog, file, replaceAll);
      
      if (data.success) {
        setResult({
          type: 'success',
          message: `Importación exitosa: ${data.successCount} registros importados.`,
          data,
        });
      } else {
        setResult({
          type: 'error',
          message: data.message || 'Error durante la importación.',
          data,
        });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: 'Error de conexión: ' + (error?.message || error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '2rem auto',
        background: theme === 'dark' ? '#232323' : '#fff',
        borderRadius: 10,
        boxShadow: theme === 'dark' ? '0 2px 16px #0008' : '0 2px 10px #0001',
        padding: 32,
        color: theme === 'dark' ? '#f3f3f3' : '#111',
        transition: 'background 0.3s, color 0.3s'
      }}
    >
      <h2 style={{
        textAlign: 'center',
        marginBottom: 24,
        color: theme === 'dark' ? '#90caf9' : '#1976d2'
      }}>
        Importar Catálogo (CSV)
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600 }}>Catálogo:</label>
          <select
            value={catalog}
            onChange={e => setCatalog(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 6,
              marginTop: 4,
              background: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#f3f3f3' : '#111',
              border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc'
            }}
          >
            {CATALOG_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600 }}>Archivo CSV:</label>
          <input
            type="file"
            accept=".csv"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 6,
              marginTop: 4,
              background: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#f3f3f3' : '#111',
              border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc'
            }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: theme === 'dark' ? '#f3f3f3' : '#111' }}>
            <input
              type="checkbox"
              checked={replaceAll}
              onChange={e => setReplaceAll(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Reemplazar todos los registros existentes
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 6,
            background: loading ? (theme === 'dark' ? '#444' : '#ccc') : '#1976d2',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s'
          }}
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </form>
      {result && result.data && (
        <div style={{
          margin: '32px auto',
          maxWidth: 600,
          background: theme === 'dark' ? '#181a1b' : '#f7fafd',
          border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
          borderRadius: 8,
          padding: 24,
          color: result.type === 'success'
            ? (theme === 'dark' ? '#66bb6a' : '#388e3c')
            : (theme === 'dark' ? '#ef9a9a' : '#d32f2f'),
          fontSize: 15,
          wordBreak: 'break-word',
          boxShadow: theme === 'dark' ? '0 2px 8px #0008' : '0 2px 8px #0001'
        }}>
          <h4 style={{
            marginTop: 0,
            color: result.type === 'success'
              ? (theme === 'dark' ? '#66bb6a' : '#388e3c')
              : (theme === 'dark' ? '#ef9a9a' : '#d32f2f')
          }}>
            {result.type === 'success' ? 'Resultado de la importación' : 'Detalle del error'}
          </h4>
          <div>
            <strong>Mensaje:</strong> {result.data.message || result.message}
          </div>
          {result.data.errors && Array.isArray(result.data.errors) && result.data.errors.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <strong>Errores:</strong>
              <ul style={{ color: theme === 'dark' ? '#ef9a9a' : '#d32f2f', marginTop: 6 }}>
                {result.data.errors.map((err: string, idx: number) => (
                  <li key={idx} style={{ fontSize: 14 }}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <strong>Registros totales:</strong> {result.data.totalRecords ?? '-'}<br />
            <strong>Éxitos:</strong> {result.data.successCount ?? '-'}<br />
            <strong>Errores:</strong> {result.data.errorCount ?? '-'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCatalogosUpload;
