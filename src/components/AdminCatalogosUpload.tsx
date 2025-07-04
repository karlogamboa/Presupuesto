import React, { useState } from 'react';
import { importCatalogCSV } from '../services';

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
    <div style={{
      maxWidth: 600,
      margin: '2rem auto',
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0 2px 10px #0001',
      padding: 32
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Importar Catálogo (CSV)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600 }}>Catálogo:</label>
          <select
            value={catalog}
            onChange={e => setCatalog(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, marginTop: 4 }}
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
            style={{ width: '100%', padding: 8, borderRadius: 6, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
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
            background: loading ? '#ccc' : '#1976d2',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </form>
      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 6,
            background: result.type === 'success' ? '#d4edda'
              : result.type === 'error' ? '#f8d7da' : '#d1ecf1',
            color: result.type === 'success' ? '#155724'
              : result.type === 'error' ? '#721c24' : '#0c5460',
            border: result.type === 'success' ? '1px solid #c3e6cb'
              : result.type === 'error' ? '1px solid #f5c6cb' : '1px solid #bee5eb'
          }}
        >
          <strong>{result.message}</strong>
          {result.data && (
            <div style={{ marginTop: 10, fontSize: 15 }}>
              <div>• Total de registros: {result.data.totalRecords || 0}</div>
              <div>• Exitosos: {result.data.successCount || 0}</div>
              <div>• Errores: {result.data.errorCount || 0}</div>
              {result.data.errors && result.data.errors.length > 0 && (
                <div style={{
                  marginTop: 10,
                  maxHeight: 120,
                  overflowY: 'auto',
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: 4,
                  padding: 8
                }}>
                  <strong>Errores:</strong>
                  <ul>
                    {result.data.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCatalogosUpload;
