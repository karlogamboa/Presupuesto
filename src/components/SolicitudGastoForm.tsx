import React, { useEffect, useState } from 'react';
import { fetchDepartamentos, fetchCategoriasGasto, fetchProveedores, guardarPresupuesto } from '../services';
import { toast } from 'react-toastify';
import { useSolicitanteData } from '../hooks/useSolicitanteData';

interface Option {
  value: string;
  label: string;
  numeroEmpleado?: string;
  cuentaGastos?: string;
  categoriaGasto?: string;
  descripcion?: string;
}

interface DepartamentoData {
  value: string;
  label: string;
  departamento: string;
  subdepartamentos: string[];
}

interface FormData {
  solicitante: string;
  departamento: string;
  numeroEmpleado: string;
  subDepartamento: string;
  centroCostos: string;
  categoriaGasto: string;
  cuentaGastos: string;
  montoSubtotal: string;
  correo: string;
  proveedor?: string;
  periodoPresupuesto?: string;
}


const initialForm: FormData = {
  solicitante: '',
  correo: '',
  numeroEmpleado: '',
  departamento: '',
  subDepartamento: '',
  centroCostos: '',
  categoriaGasto: '',
  cuentaGastos: '',
  montoSubtotal: '',
  proveedor: '',
  periodoPresupuesto: '',
};


function usePeriodos(): string[] {
  const [periodos, setPeriodos] = useState<string[]>([]);
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    setPeriodos(months.map(month => `${month} ${currentYear}`));
  }, []);
  return periodos;
}

const SolicitudGastoForm: React.FC<{ onSubmit: (data: FormData) => void }> = ({ onSubmit }) => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [departamentos, setDepartamentos] = useState<Option[]>([]);
  const [subDepartamentos, setSubDepartamentos] = useState<Option[]>([]);
  const [departamentosData, setDepartamentosData] = useState<DepartamentoData[]>([]);
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [proveedores, setProveedores] = useState<Option[]>([]);
  const [proveedor, setProveedor] = useState<string>('');
  const [proveedorInput, setProveedorInput] = useState<string>('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState<Option[]>([]);
  const [empresa, setEmpresa] = useState<string>('');
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Option[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Option | null>(null);
  const periodos = usePeriodos();
  const [periodoPresupuesto, setPeriodoPresupuesto] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Centraliza obtención de datos de usuario autenticado vía SAML (backend)
  const { empleado } = useSolicitanteData();


  // Hook para inicializar datos de usuario SAML/Okta usando hook global
  useEffect(() => {
    if (empleado) {
      setForm(prevForm => ({
        ...prevForm,
        solicitante: empleado.nombre || '',
        correo: empleado.correo || '',
        departamento: empleado.departamento || '',
        subDepartamento: empleado.subDepartamento || '',
        centroCostos: empleado.centroCostos || '',
      }));
      setEmpresa(empleado.empresa || '');
    } else {
      setForm(f => ({
        ...f,
        solicitante: '',
        correo: '',
        departamento: '',
        subDepartamento: '',
        centroCostos: ''
      }));
      setEmpresa('');
    }
  }, [empleado]);


  // Hook para cargar catálogos y datos iniciales
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const cargarCatalogos = async () => {
      try {
        const [departamentosDataResp, categoriasDataResp, proveedoresDataResp] = await Promise.all([
          fetchDepartamentos(),
          fetchCategoriasGasto(),
          fetchProveedores()
        ]);
        if (!isMounted) return;
        setDepartamentosData(departamentosDataResp || []);
        setDepartamentos(
          (departamentosDataResp || []).map((dep: any) => ({
            value: dep.value || dep.departamento || '',
            label: dep.label || dep.departamento || ''
          }))
        );
        const categoriasData = (categoriasDataResp || []).map((d: any) => ({
          value: String(d.cuenta || d.Cuenta || ''),
          label: d.label || '',
        }));
        setCategorias(categoriasData);
        setCategoriasFiltradas(
          categoriasData.filter((categoria: Option, index: number, self: Option[]) =>
            index === self.findIndex((c: Option) => c.label === categoria.label)
          )
        );
        const lista = (proveedoresDataResp || []).map((d: any) => ({
          value: String(d.nombre || d.id || '').trim(),
          label: String(d.nombre || '').trim(),
          numeroEmpleado: d.numeroProveedor || d['Número Proveedor'] || '',
          cuentaGastos: d.cuentaGastos || '',
          categoriaGasto: d.categoria || d.Categoría || '',
        }));
        setProveedores(lista);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    cargarCatalogos();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (form.departamento) {
      const depObj = departamentosData.find(d => {
        // Buscar por el valor del departamento directamente
        return d.value === form.departamento || d.departamento === form.departamento;
      });
      if (depObj && Array.isArray(depObj.subdepartamentos)) {
        if (form.subDepartamento && !depObj.subdepartamentos.includes(form.subDepartamento)) {
          setSubDepartamentos([
            ...depObj.subdepartamentos.map((sub: string) => ({ value: sub, label: sub })),
            { value: form.subDepartamento, label: form.subDepartamento }
          ].sort((a, b) => a.label.localeCompare(b.label)));
        } else {
          setSubDepartamentos(
            depObj.subdepartamentos.map((sub: string) => ({ value: sub, label: sub }))
          );
        }
      } else if (form.subDepartamento) {
        setSubDepartamentos([
          { value: form.subDepartamento, label: form.subDepartamento }
        ]);
      } else {
        setSubDepartamentos([]);
      }
    } else {
      setSubDepartamentos([]);
    }
  }, [form.departamento, form.subDepartamento, departamentosData]);

  // Separar lógica de filtrado de proveedores
  useEffect(() => {
    setProveedoresFiltrados(filtrarProveedores(proveedores, proveedorInput));
  }, [proveedorInput, proveedores]);

  // Separar lógica de filtrado de categorías
  useEffect(() => {
    setCategoriasFiltradas(filtrarCategorias(selectedProvider, categorias, setForm));
  }, [selectedProvider, categorias]);


  // Handler simplificado para cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => {
      switch (name) {
        case 'proveedor': {
          const provObject = proveedores.find(p => p.value === value);
          setSelectedProvider(provObject || null);
          setProveedor(value);
          return {
            ...f,
            proveedor: provObject?.label || '',
            categoriaGasto: '',
            cuentaGastos: '',
          };
        }
        case 'subDepartamento': {
          const ceco = value.includes('-') ? value.split('-')[0].trim() : value;
          return {
            ...f,
            subDepartamento: value,
            centroCostos: ceco
          };
        }
        case 'categoriaGasto': {
          const categoriaSeleccionada = categoriasFiltradas.find(c => c.value === value);
          return {
            ...f,
            categoriaGasto: value,
            cuentaGastos: categoriaSeleccionada?.cuentaGastos || (selectedProvider?.cuentaGastos || '')
          };
        }
        case 'departamento': {
          return { ...f, departamento: value, subDepartamento: '', centroCostos: '' };
        }
        default:
          return { ...f, [name]: value };
      }
    });
  };


  // Handler para input de proveedor, simplificado
  const handleProveedorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProveedorInput(value);
    setProveedor('');
    setForm(f => ({ ...f, proveedor: '', categoriaGasto: '', cuentaGastos: '' }));
    const provObject = proveedores.find(
      p => p.label.trim().toLowerCase() === value.trim().toLowerCase()
    );
    setSelectedProvider(provObject || null);
    if (provObject && provObject.cuentaGastos && provObject.cuentaGastos.trim() !== '') {
      const cuentasProveedor = provObject.cuentaGastos.split(',').map(cuenta => cuenta.trim());
      setCategoriasFiltradas(
        categorias.filter(categoria =>
          cuentasProveedor.some(cuentaProveedor =>
            normalizeText(categoria.label) === normalizeText(cuentaProveedor)
          )
        )
      );
    } else {
      setCategoriasFiltradas(categorias);
    }
  };


  // Handler para submit, simplificado
  // Validación robusta y manejo de errores
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones adicionales
    if (!form.solicitante || !form.correo || !form.departamento || !form.subDepartamento || !form.centroCostos) {
      toast.error('Completa todos los campos obligatorios.');
      return;
    }
    if (!form.montoSubtotal || isNaN(Number(form.montoSubtotal)) || Number(form.montoSubtotal) <= 0) {
      toast.error('El monto solicitado debe ser mayor a 0.');
      return;
    }
    if (!form.categoriaGasto) {
      toast.error('Selecciona una cuenta de gastos.');
      return;
    }
    const categoriaSeleccionada = categoriasFiltradas.find(c => c.value === form.categoriaGasto);
    const proveedorSeleccionado = selectedProvider;
    const payload = {
      ...form,
      solicitante: form.solicitante,
      proveedor: proveedorSeleccionado?.label || proveedorInput || '',
      categoriaGasto: categoriaSeleccionada?.label || '',
      cuentaGastos: categoriaSeleccionada?.value || form.cuentaGastos,
      empresa,
      periodoPresupuesto,
      Fecha: new Date().toISOString(),
    };
    try {
      const data = await guardarPresupuesto(payload);
      if (!data || data?.error) {
        toast.error(data?.error || 'Error al guardar el presupuesto');
        return;
      }
      setForm(initialForm);
      setProveedor('');
      setProveedorInput('');
      setPeriodoPresupuesto('');
      setSelectedProvider(null);
      setCategoriasFiltradas(categorias);
    } catch (error: any) {
      toast.error('Error en la petición: ' + (error?.message || error));
      return;
    }
    onSubmit(form);
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
    <>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
          <div className="spinner" style={{ width: 48, height: 48, border: '6px solid #eee', borderTop: '6px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 24, fontSize: 18, color: '#1976d2', fontWeight: 500 }}>Cargando catálogos y datos iniciales...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
        </div>
      ) : (
        <>
          <form
            className={`solicitud-gasto-form ${theme}`}
            onSubmit={handleSubmit}
            style={{
              maxWidth: 700,
              margin: '2rem auto',
              padding: 32,
              borderRadius: 16,
              background: theme === 'dark' ? '#232323' : '#fff',
              boxShadow: '0 4px 24px #0002',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}
          >
            <h2 style={{
              textAlign: 'center',
              marginBottom: 0,
              letterSpacing: 1,
              color: theme === 'dark' ? '#90caf9' : '#1976d2'
            }}>
              Solicitud de Presupuesto
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 24,
                alignItems: 'center'
              }}
            >
              <div className="form-group" style={{ gridColumn: '1 / 3' }}>
                <label style={{
                  fontWeight: 500,
                  marginBottom: 6,
                  display: 'block',
                  textAlign: 'left',
                  color: theme === 'dark' ? '#f3f3f3' : '#111'
                }}>Nombre del Solicitante:</label>
                <input
                  name="solicitante"
                  value={form.solicitante}
                  readOnly
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    background: theme === 'dark' ? '#333' : '#f7fafd',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '3 / 4' }}>
                <label style={{
                  fontWeight: 500,
                  marginBottom: 6,
                  display: 'block',
                  textAlign: 'left',
                  color: theme === 'dark' ? '#f3f3f3' : '#111'
                }}>Correo:</label>
                <input
                  name="correo"
                  value={form.correo}
                  readOnly
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    background: theme === 'dark' ? '#333' : '#f7fafd',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / 2' }}>
                <label
                  htmlFor="departamento"
                  style={{
                    fontWeight: 500,
                    marginBottom: 6,
                    display: 'block',
                    textAlign: 'left',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}>Departamento:</label>
                <select
                  id="departamento"
                  name="departamento"
                  value={form.departamento}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    color: theme === 'dark' ? '#f3f3f3' : '#111',
                    background: theme === 'dark' ? '#333' : '#fff'
                  }}
                  className={theme === 'dark' ? 'select-dark-placeholder' : 'select-light-placeholder'}
                >
                  <option value="">Seleccione</option>
                  {departamentos.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '2 / 3' }}>
                <label
                  htmlFor="subDepartamento"
                  style={{
                    fontWeight: 500,
                    marginBottom: 6,
                    display: 'block',
                    textAlign: 'left',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}>Sub-Departamento:</label>
                <select
                  id="subDepartamento"
                  name="subDepartamento"
                  value={form.subDepartamento}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    color: theme === 'dark' ? '#f3f3f3' : '#111',
                    background: theme === 'dark' ? '#333' : '#fff'
                  }}
                  className={theme === 'dark' ? 'select-dark-placeholder' : 'select-light-placeholder'}
                >
                  <option value="">Seleccione</option>
                  {subDepartamentos.map((opt, idx) => (
                    <option key={opt.value + '-' + idx} value={opt.value}>{opt.value}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '3 / 4' }}>
                <label style={{
                  fontWeight: 500,
                  marginBottom: 6,
                  display: 'block',
                  textAlign: 'left',
                  color: theme === 'dark' ? '#f3f3f3' : '#111'
                }}>Centro de Costos:</label>
                <input
                  name="centroCostos"
                  value={form.centroCostos}
                  readOnly
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    background: theme === 'dark' ? '#333' : '#f7fafd',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / 2' }}>
                <label style={{
                  fontWeight: 500,
                  marginBottom: 6,
                  display: 'block',
                  textAlign: 'left',
                  color: theme === 'dark' ? '#f3f3f3' : '#111'
                }}>Periodo de Solicitud:</label>
                <select
                  name="periodoPresupuesto"
                  value={periodoPresupuesto}
                  onChange={e => {
                    setPeriodoPresupuesto(e.target.value);
                    setForm(f => ({ ...f, periodoPresupuesto: e.target.value }));
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    color: theme === 'dark' ? '#f3f3f3' : '#111',
                    background: theme === 'dark' ? '#333' : '#fff'
                  }}
                  className={theme === 'dark' ? 'select-dark-placeholder' : 'select-light-placeholder'}
                >
                  <option value="">Seleccione</option>
                  {periodos.map((periodo, idx) => (
                    <option key={periodo + '-' + idx} value={periodo}>{periodo}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '2 / 4', position: 'relative', zIndex: 20 }}>
                <label style={{
                  fontWeight: 500,
                  marginBottom: 6,
                  display: 'block',
                  textAlign: 'left',
                  color: theme === 'dark' ? '#f3f3f3' : '#111'
                }}>Proveedores:</label>
                <input
                  type="text"
                  name="proveedorInput"
                  value={proveedorInput}
                  onChange={handleProveedorInput}
                  placeholder="Escriba para buscar proveedor..."
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    color: theme === 'dark' ? '#f3f3f3' : '#111',
                    background: theme === 'dark' ? '#333' : '#fff'
                  }}
                  className={theme === 'dark' ? 'input-dark-placeholder' : 'input-light-placeholder'}
                />
                <div style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{
                      fontSize: '0.85em',
                      color: theme === 'dark' ? '#f3f3f3' : '#111'
                    }}>Categoría:</label>
                    <span style={{
                      fontSize: '0.85em',
                      color: theme === 'dark' ? '#f3f3f3' : '#111'
                    }}>{selectedProvider?.categoriaGasto || ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="sinProveedor"
                      checked={!selectedProvider}
                      onChange={() => {
                        setSelectedProvider(null);
                        setProveedor('');
                        setProveedorInput('');
                        setForm(f => ({ ...f, proveedor: '' }));
                        setCategoriasFiltradas(categorias); // Quitar el filtro de cuentas de gasto
                      }}
                    />
                    <label htmlFor="sinProveedor" style={{
                      fontSize: '0.85em',
                      color: theme === 'dark' ? '#f3f3f3' : '#111'
                    }}>Sin Proveedor</label>
                  </div>
                </div>
                {proveedorInput && proveedoresFiltrados.length > 0 && !proveedor && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 60,
                      left: 0,
                      right: 0,
                      zIndex: 2000, // Aumenta el z-index
                      background: theme === 'dark' ? '#232323' : '#fff', // Ajusta fondo según tema
                      border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc', // Ajusta borde según tema
                      borderRadius: 8,
                      maxHeight: 260,
                      overflowY: 'auto',
                      boxShadow: '0 4px 16px #0002',
                      color: theme === 'dark' ? '#f3f3f3' : '#111' // Ajusta color de texto según tema
                    }}
                  >
                    {proveedoresFiltrados.map((prov, idx) => {
                      // Extract ternary operations into variables
                      const isLast = idx < proveedoresFiltrados.length - 1;
                      const borderBottom = isLast
                        ? (theme === 'dark' ? '1px solid #333' : '1px solid #f0f0f0')
                        : 'none';
                      const isSelected = prov.value === proveedor;
                      let background = '';
                      if (isSelected) {
                        background = theme === 'dark' ? '#2a3b5c' : '#e3eafc';
                      } else {
                        background = theme === 'dark' ? '#232323' : '#fff';
                      }
                      return (
                        <button
                          key={prov.value + '-' + idx}
                          type="button"
                          onClick={() => {
                            setSelectedProvider(prov);
                            setProveedor(prov.value); 
                            setProveedorInput(prov.label);
                            setForm(f => ({ ...f, proveedor: prov.label }));
                            // Aplicar el mismo filtrado que el useEffect
                            if (prov.cuentaGastos && prov.cuentaGastos.trim() !== '') {
                              const cuentasProveedor = prov.cuentaGastos.split(',').map((cuenta: string) => cuenta.trim());
                              const nuevasCategoriasFiltradas = categorias.filter(categoria => {
                                return cuentasProveedor.some(cuentaProveedor => {
                                  const categoriaLabelNormalizado = normalizeText(categoria.label);
                                  const cuentaProveedorNormalizada = normalizeText(cuentaProveedor);
                                  return categoriaLabelNormalizado === cuentaProveedorNormalizada;
                                });
                              });
                              setCategoriasFiltradas(nuevasCategoriasFiltradas);
                            } else {
                              setCategoriasFiltradas(categorias);
                            }
                          }}
                          style={{
                            padding: 12,
                            cursor: 'pointer',
                            border: 'none',
                            borderBottom,
                            background,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            color: theme === 'dark' ? '#f3f3f3' : '#111',
                            textAlign: 'left',
                            width: '100%',
                            outline: isSelected ? '2px solid #1976d2' : undefined,
                          }}
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedProvider(prov);
                              setProveedor(prov.value); 
                              setProveedorInput(prov.label);
                              setForm(f => ({ ...f, proveedor: prov.label }));
                              // Aplicar el mismo filtrado que el useEffect
                              if (prov.cuentaGastos && prov.cuentaGastos.trim() !== '') {
                                const cuentasProveedor = prov.cuentaGastos.split(',').map((cuenta: string) => cuenta.trim());
                                const nuevasCategoriasFiltradas = categorias.filter(categoria => {
                                  return cuentasProveedor.some(cuentaProveedor => {
                                    const categoriaLabelNormalizado = normalizeText(categoria.label);
                                    const cuentaProveedorNormalizada = normalizeText(cuentaProveedor);
                                    return categoriaLabelNormalizado === cuentaProveedorNormalizada;
                                  });
                                });
                                setCategoriasFiltradas(nuevasCategoriasFiltradas);
                              } else {
                                setCategoriasFiltradas(categorias);
                              }
                            }
                          }}
                          aria-pressed={isSelected}
                        >
                          <span style={{ fontWeight: 600, color: theme === 'dark' ? '#90caf9' : '#1976d2', fontSize: 16 }}>{prov.label}</span>
                          {prov.numeroEmpleado && (
                            <span style={{ color: theme === 'dark' ? '#bbb' : '#888', fontSize: 13 }}>Núm. Proveedor: {prov.numeroEmpleado}</span>
                          )}
                          {prov.categoriaGasto && (
                            <span style={{ color: theme === 'dark' ? '#bbb' : '#888', fontSize: 13 }}>Categoría: {prov.categoriaGasto}</span>
                          )}
                          {prov.cuentaGastos && (
                            <span style={{ color: theme === 'dark' ? '#bbb' : '#888', fontSize: 13 }}>Cuenta Gastos: {prov.cuentaGastos}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / 3', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label
                    htmlFor="categoriaGasto"
                    style={{
                      fontWeight: 500,
                      marginBottom: 6,
                      display: 'block',
                      textAlign: 'left',
                      color: theme === 'dark' ? '#f3f3f3' : '#111'
                    }}>Cuenta de Gastos:</label>
                  <select
                    id="categoriaGasto"
                    name="categoriaGasto"
                    value={form.categoriaGasto}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 6,
                      border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                      color: theme === 'dark' ? '#f3f3f3' : '#111',
                      background: theme === 'dark' ? '#333' : '#fff'
                    }}
                    className={theme === 'dark' ? 'select-dark-placeholder' : 'select-light-placeholder'}
                  >
                    <option value="">Seleccione</option>
                    {categoriasFiltradas.map((opt, idx) => (
                      <option key={opt.value + '-' + idx} value={opt.value}>
                        {opt.label} {/* Display only the label */}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    fontWeight: 500,
                    marginBottom: 6,
                    display: 'block',
                    textAlign: 'left',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}>Cuenta Seleccionada:</label>
                  <input
                    type="text"
                    value={form.categoriaGasto}
                    readOnly
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 6,
                      border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                      background: theme === 'dark' ? '#333' : '#f7fafd',
                      color: theme === 'dark' ? '#f3f3f3' : '#111'
                    }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: '3 / 4' }}>
                <label
                  htmlFor="montoSubtotal"
                  style={{
                    fontWeight: 500,
                    marginBottom: 6,
                    display: 'block',
                    textAlign: 'left',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}>
                  Monto Solicitado ( s/IVA)
                </label>
                <input
                  id="montoSubtotal"
                  name="montoSubtotal"
                  type="number"
                  value={form.montoSubtotal}
                  onChange={handleChange}
                  required
                  min={0}
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: theme === 'dark' ? '1px solid #444' : '1px solid #cfd8dc',
                    background: theme === 'dark' ? '#333' : '#fff',
                    color: theme === 'dark' ? '#f3f3f3' : '#111'
                  }}
                  className={theme === 'dark' ? 'input-dark-placeholder' : 'input-light-placeholder'}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: 220,
                alignSelf: 'center',
                padding: 14,
                borderRadius: 8,
                background: theme === 'dark' ? '#1976d2' : '#1976d2',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                letterSpacing: 1,
                marginTop: 8
              }}
            >
              Solicitar
            </button>
          </form>
        </>
      )}
    </>
  );
};

export default SolicitudGastoForm;

// Función para normalizar texto para comparaciones
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n');
}

// Separar lógica de filtrado de proveedores
function filtrarProveedores(proveedores: Option[], input: string): Option[] {
  if (!input.trim()) return proveedores;
  return proveedores.filter(p => p.label.toLowerCase().includes(input.toLowerCase()));
}

// Separar lógica de filtrado de categorías
function filtrarCategorias(selectedProvider: Option | null, categorias: Option[], setForm: React.Dispatch<React.SetStateAction<FormData>>): Option[] {
  if (!selectedProvider) {
    setForm(prevForm => ({ ...prevForm, categoriaGasto: '', cuentaGastos: '' }));
    return categorias;
  }
  if (selectedProvider.cuentaGastos && selectedProvider.cuentaGastos.trim() !== '') {
    const cuentasProveedor = selectedProvider.cuentaGastos.split(',').map(cuenta => cuenta.trim());
    const nuevasCategoriasFiltradas = categorias.filter(categoria => {
      const match = cuentasProveedor.some(cuentaProveedor => {
        const categoriaLabelNormalizado = normalizeText(categoria.label);
        const cuentaProveedorNormalizada = normalizeText(cuentaProveedor);
        return categoriaLabelNormalizado === cuentaProveedorNormalizada;
      });
      return match;
    });
    const categoriasSinDuplicados = nuevasCategoriasFiltradas.filter((categoria, index, self) =>
      index === self.findIndex(c => c.label === categoria.label)
    );
    if (categoriasSinDuplicados.length === 0) {
      setForm(prevForm => ({ ...prevForm, categoriaGasto: '', cuentaGastos: '' }));
      return categorias;
    } else {
      if (categoriasSinDuplicados.length === 1) {
        const catUnica = categoriasSinDuplicados[0];
        setForm(prevForm => ({ ...prevForm, categoriaGasto: catUnica.value, cuentaGastos: catUnica.value }));
      } else {
        setForm(prevForm => ({ ...prevForm, categoriaGasto: '', cuentaGastos: '' }));
      }
      return categoriasSinDuplicados.map(categoria => ({ ...categoria, label: categoria.label }));
    }
  }
  setForm(prevForm => ({ ...prevForm, categoriaGasto: '', cuentaGastos: '' }));
  return categorias;
}