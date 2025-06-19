import React, { useEffect, useState, useRef } from 'react';
import {
  fetchDepartamentos,
  fetchCategoriasGasto,
  fetchProveedores,
  fetchSolicitanteByNumeroEmpleado,
  guardarPresupuesto
} from '../services';

interface Option {
  value: string;
  label: string;
  numeroEmpleado?: string;
  cuentaGastos?: string;
  categoriaGasto?: string;
  Descripción?: string; // Agregar la propiedad Descripción
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
}

const initialForm: FormData = {
  solicitante: '',
  departamento: '',
  numeroEmpleado: '',
  subDepartamento: '',
  centroCostos: '',
  categoriaGasto: '',
  cuentaGastos: '',
  montoSubtotal: '',
  correo: '',
};

// Helper hooks and functions extracted for clarity and reduced complexity

function usePeriodos() {
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

function useDepartamentos(setDepartamentosData: (data: any[]) => void, setDepartamentos: (opts: Option[]) => void) {
  useEffect(() => {
    fetchDepartamentos()
      .then((data: any[]) => {
        setDepartamentosData(data || []);
        setDepartamentos(
          (data || []).map((dep: any) => {
            let nombreDep = dep.departamento ?? dep.Departamento ?? dep.Area ?? dep.area ?? '';
            if (nombreDep.includes(' : ')) {
              nombreDep = nombreDep.split(' : ')[0].trim();
            }
            return {
              value: String(nombreDep),
              label: nombreDep
            };
          })
        );
      })
      .catch((error) => console.error("Error al cargar departamentos:", error));
  }, [setDepartamentosData, setDepartamentos]);
}

function useCategorias(setCategorias: (opts: Option[]) => void, setCategoriasFiltradas: (opts: Option[]) => void) {
  useEffect(() => {
    fetchCategoriasGasto()
      .then((data: any[]) => {
        const categoriasData = (data || []).map((d: any) => ({
          value: String(d.cuenta || d.Cuenta || ''),
          label: d['Cuenta de gastos'] || '',
        }));
        setCategorias(categoriasData);
        setCategoriasFiltradas(
          categoriasData.filter((categoria: Option, index: number, self: Option[]) =>
            index === self.findIndex((c: Option) => c.label === categoria.label)
          )
        );
      })
      .catch((error) => console.error("Error al cargar categorías de gasto:", error));
  }, [setCategorias, setCategoriasFiltradas]);
}

function useProveedores(setProveedores: (opts: Option[]) => void) {
  useEffect(() => {
    fetchProveedores()
      .then((data: any[]) => {
        const lista = (data || []).map((d: any) => ({
          value: String(d.Nombre || '').trim(),
          label: String(d.Nombre || '').trim(),
          numeroEmpleado: d['Número Proveedor'] || '',
          cuentaGastos: (d.CuentasGasto || []).join(', '),
          categoriaGasto: d.Categoría || '',
        }));
        setProveedores(lista);
      })
      .catch((error) => console.error("Error al cargar proveedores:", error));
  }, [setProveedores]);
}

function getCentroCostosFromSubDepartamento(subDepartamento: string) {
  let centroCostos = '';
  if (subDepartamento && subDepartamento.trim()) {
    const match = subDepartamento.match(/^([A-Z0-9]+)[\s\-_]+/);
    if (match && match[1] && match[1].trim()) {
      centroCostos = match[1].trim();
    } else {
      const partes = subDepartamento.split(/[\s\-_]+/);
      if (partes.length > 0 && partes[0] && partes[0].trim()) {
        centroCostos = partes[0].trim();
      }
    }
  }
  return centroCostos;
}

function parseEmpleadoData(data: any) {
  // Extraer nombre del solicitante
  const nombre = data?.Nombre ?? data?.nombre ?? '';
  // Extraer correo electrónico
  const correo = data?.['Correo electrónico'] ?? data?.correo ?? '';
  // Procesar departamento y subdepartamento
  let departamento = '';
  let subDepartamento = '';
  let centroCostosCalculado = '';
  const deptStr = data?.Departamento ?? data?.departamento ?? '';
  if (deptStr) {
    const deptParts = deptStr.split(' : ');
    if (deptParts.length > 1) {
      departamento = deptParts[0].trim();
      const subPartsInput = deptParts[1].trim();
      const match = subPartsInput.match(/^(\d+)-(.+)$/);
      if (match) {
        centroCostosCalculado = match[1].trim();
        subDepartamento = match[2].trim();
      } else {
        const subParts = subPartsInput.split('-');
        if (subParts.length > 1) {
          centroCostosCalculado = subParts[0].trim();
          subDepartamento = subParts.slice(1).join('-').trim();
        } else {
          subDepartamento = subPartsInput;
        }
      }
    } else {
      departamento = deptStr;
    }
  }
  if (!centroCostosCalculado && subDepartamento) {
    centroCostosCalculado = getCentroCostosFromSubDepartamento(subDepartamento);
  }
  if (!centroCostosCalculado) {
    centroCostosCalculado = data?.centroCostos || data?.['Centro de costos'] || '';
  }
  return {
    nombre,
    correo,
    departamento,
    subDepartamento,
    centroCostos: centroCostosCalculado,
    empresa: data?.Subsidiaria ?? data?.subsidiaria ?? data?.empresa ?? ''
  };
}

const SolicitudGastoForm: React.FC<{ onSubmit: (data: FormData) => void, onNumeroEmpleadoChange?: (numeroEmpleado: string) => void }> = ({ onSubmit, onNumeroEmpleadoChange }) => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [departamentos, setDepartamentos] = useState<Option[]>([]);
  const [subDepartamentos, setSubDepartamentos] = useState<Option[]>([]);
  const [departamentosData, setDepartamentosData] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [proveedores, setProveedores] = useState<Option[]>([]);
  const [proveedor, setProveedor] = useState<string>('');
  const [proveedorInput, setProveedorInput] = useState<string>('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState<Option[]>([]);
  const [empresa, setEmpresa] = useState<string>('');
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Option[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Option | null>(null);
  const [errorPopups, setErrorPopups] = useState<{ id: number; message: string }[]>([]);
  const errorTimeoutsRef = useRef<{ [id: number]: ReturnType<typeof setTimeout> }>({});
  const nextErrorId = useRef(1);
  const [numEmpleadoTimeout, setNumEmpleadoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const periodos = usePeriodos();
  const [periodoPresupuesto, setPeriodoPresupuesto] = useState<string>('');

  useDepartamentos(setDepartamentosData, setDepartamentos);
  useCategorias(setCategorias, setCategoriasFiltradas);
  useProveedores(setProveedores);

  useEffect(() => {
    if (form.departamento) {
      const depObj = departamentosData.find(d => {
        const depName = d.departamento || d.Departamento || d.Area || d.area;
        if (depName && depName.includes(' : ')) {
          const mainDep = depName.split(' : ')[0].trim();
          return mainDep === form.departamento;
        }
        return depName === form.departamento;
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

  useEffect(() => {
    if (proveedorInput.trim() === '') {
      setProveedoresFiltrados(proveedores);
    } else {
      setProveedoresFiltrados(
        proveedores.filter(p =>
          p.label.toLowerCase().includes(proveedorInput.toLowerCase())
        )
      );
    }
  }, [proveedorInput, proveedores]);

  useEffect(() => {
    if (!selectedProvider) {
      setCategoriasFiltradas(categorias);
      setForm(prevForm => ({
        ...prevForm,
        categoriaGasto: '',
        cuentaGastos: '',
      }));
      return;
    }
    if (selectedProvider.cuentaGastos && selectedProvider.cuentaGastos.trim() !== '') {
      const cuentasProveedor = selectedProvider.cuentaGastos.split(',').map(cuenta => cuenta.trim().toLowerCase());
      const nuevasCategoriasFiltradas = categorias.filter(categoria => {
        const categoriaNombre = categoria.label.toLowerCase();
        return cuentasProveedor.some(cuenta => categoriaNombre.endsWith(cuenta));
      });
      setCategoriasFiltradas(nuevasCategoriasFiltradas.map(categoria => ({
        ...categoria,
        label: categoria.label
      })));
      if (nuevasCategoriasFiltradas.length === 1) {
        const catUnica = nuevasCategoriasFiltradas[0];
        setForm(prevForm => ({
          ...prevForm,
          categoriaGasto: catUnica.value,
          cuentaGastos: catUnica.value,
        }));
      } else {
        setForm(prevForm => ({
          ...prevForm,
          categoriaGasto: '',
          cuentaGastos: '',
        }));
      }
    } else {
      setCategoriasFiltradas(categorias);
      setForm(prevForm => ({
        ...prevForm,
        categoriaGasto: '',
        cuentaGastos: '',
      }));
    }
  }, [selectedProvider, categorias]);

  const handleNumeroEmpleadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(f => ({
      ...f,
      numeroEmpleado: value,
      solicitante: '',
      correo: '',
      departamento: '',
      subDepartamento: '',
      centroCostos: ''
    }));
    if (numEmpleadoTimeout) clearTimeout(numEmpleadoTimeout);
    const timeout = setTimeout(() => {
      if (value.trim()) {
        fetchSolicitanteByNumeroEmpleado(value.trim())
          .then((data: any) => {
            if (!data || !data.Nombre) {
              setForm(f => ({
                ...f,
                solicitante: '',
                correo: '',
                departamento: '',
                subDepartamento: '',
                centroCostos: ''
              }));
            }
            const parsed = parseEmpleadoData(data);
            setForm(prevForm => ({
              ...prevForm,
              solicitante: parsed.nombre,
              correo: parsed.correo,
              departamento: parsed.departamento,
              subDepartamento: parsed.subDepartamento,
              centroCostos: parsed.centroCostos
            }));
            setEmpresa(parsed.empresa);
            if (onNumeroEmpleadoChange) {
              onNumeroEmpleadoChange(value);
            }
          })
          .catch(() => {
            setForm(f => ({
              ...f,
              solicitante: '',
              correo: '',
              departamento: '',
              subDepartamento: '',
              centroCostos: ''
            }));
          });
      } else {
        setForm(f => ({
          ...f,
          solicitante: '',
          correo: '',
          departamento: '',
          subDepartamento: '',
          centroCostos: ''
        }));
      }
    }, 1000);
    setNumEmpleadoTimeout(timeout);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'proveedor') {
      const provObject = proveedores.find(p => p.value === value);
      if (provObject) {
        setSelectedProvider(provObject);
        setProveedor(value);
      } else {
        setSelectedProvider(null);
        setProveedor('');
      }
      setForm(f => ({ ...f, categoriaGasto: '', cuentaGastos: '' }));
    } else if (name === 'numeroEmpleado') {
      handleNumeroEmpleadoChange(e as React.ChangeEvent<HTMLInputElement>);
    } else if (name === 'subDepartamento') {
      setForm(f => ({
        ...f,
        subDepartamento: value,
        centroCostos: getCentroCostosFromSubDepartamento(value)
      }));
    } else if (name === 'categoriaGasto') {
      const categoriaSeleccionada = categoriasFiltradas.find(c => c.value === value);
      setForm(f => ({
        ...f,
        categoriaGasto: value,
        cuentaGastos: categoriaSeleccionada?.cuentaGastos || (selectedProvider?.cuentaGastos || '')
      }));
    } else if (name === 'departamento') {
      setForm(f => ({ ...f, departamento: value, subDepartamento: '', centroCostos: '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleProveedorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProveedorInput(e.target.value);
    setProveedor('');
    setForm(f => ({ ...f, proveedor: '', categoriaGasto: '', cuentaGastos: '' }));
  };

  const showErrorPopup = (message: string) => {
    const id = nextErrorId.current++;
    setErrorPopups(prev => [...prev, { id, message }]);
    const timeout = setTimeout(() => {
      setErrorPopups(prev => prev.filter(p => p.id !== id));
      delete errorTimeoutsRef.current[id];
    }, 8000);
    errorTimeoutsRef.current[id] = timeout;
  };

  const closeErrorPopup = (id: number) => {
    setErrorPopups(prev => prev.filter(p => p.id !== id));
    if (errorTimeoutsRef.current[id]) {
      clearTimeout(errorTimeoutsRef.current[id]);
      delete errorTimeoutsRef.current[id];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoriaSeleccionada = categoriasFiltradas.find(c => c.value === form.categoriaGasto);
    const payload = {
      ...form,
      empresa,
      proveedor,
      categoriaGasto: categoriaSeleccionada?.label || '',
      periodoPresupuesto,
      Fecha: new Date().toISOString(),
    };
    try {
      const data = await guardarPresupuesto(payload);
      if (!data || data?.error) {
        showErrorPopup(data?.error || 'Error al guardar el presupuesto');
        return;
      }
    } catch (error: any) {
      showErrorPopup('Error en la petición: ' + (error?.message || error));
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
      {/* Popups de error apilados */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        pointerEvents: 'none'
      }}>
        {errorPopups.map((popup) => (
          <div
            key={popup.id}
            style={{
              background: theme === 'dark' ? '#e57373' : '#ff5252',
              color: '#fff',
              padding: '18px 48px 18px 24px',
              borderRadius: 10,
              boxShadow: '0 2px 12px #0003',
              minWidth: 260,
              maxWidth: 380,
              fontWeight: 600,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              pointerEvents: 'auto'
            }}
          >
            <span style={{ flex: 1 }}>{popup.message}</span>
            <button
              onClick={() => closeErrorPopup(popup.id)}
              style={{
                position: 'absolute',
                top: 8,
                right: 12,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 20,
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        ))}
      </div>
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
          <div className="form-group" style={{ gridColumn: '1 / 2' }}>
            <label
              htmlFor="numeroEmpleado"
              style={{
                fontWeight: 500,
                marginBottom: 6,
                display: 'block',
                textAlign: 'left',
                color: theme === 'dark' ? '#f3f3f3' : '#111'
              }}
            >Número de Empleado:</label>
            <input
              id="numeroEmpleado"
              name="numeroEmpleado"
              value={form.numeroEmpleado}
              onChange={handleChange}
              required
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
          <div className="form-group" style={{ gridColumn: '2 / 3' }}>
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
            <label style={{
              fontWeight: 500,
              marginBottom: 6,
              display: 'block',
              textAlign: 'left',
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}>Departamento:</label>
            <select
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
            <label style={{
              fontWeight: 500,
              marginBottom: 6,
              display: 'block',
              textAlign: 'left',
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}>Sub-Departamento:</label>
            <select
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
                <option key={opt.value + '-' + idx} value={opt.value}>{opt.label}</option>
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
              onChange={e => setPeriodoPresupuesto(e.target.value)}
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
                  zIndex: 100,
                  background: '#fff',
                  border: '1px solid #cfd8dc',
                  borderRadius: 8,
                  maxHeight: 260,
                  overflowY: 'auto',
                  boxShadow: '0 4px 16px #0002'
                }}
              >
                {proveedoresFiltrados.map((prov, idx) => (
                  <div
                    key={prov.value + '-' + idx}
                    onClick={() => {
                      setSelectedProvider(prov);
                      setProveedor(prov.value); 
                      setProveedorInput(prov.label);
                      const cuentasProveedor = prov.cuentaGastos?.split(',').map((cuenta: string) => cuenta.trim().toLowerCase()) || [];
                      const nuevasCategoriasFiltradas = categorias.filter(categoria =>
                        cuentasProveedor.includes(categoria.value.toLowerCase())
                      );
                      setCategoriasFiltradas(nuevasCategoriasFiltradas);
                    }}
                    style={{
                      padding: 12,
                      cursor: 'pointer',
                      borderBottom: idx < proveedoresFiltrados.length - 1 ? '1px solid #f0f0f0' : 'none',
                      background: prov.value === proveedor ? '#e3eafc' : '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>{prov.label}</span>
                    {prov.numeroEmpleado && (
                      <span style={{ color: '#888', fontSize: 13 }}>Núm. Proveedor: {prov.numeroEmpleado}</span>
                    )}
                    {prov.categoriaGasto && (
                      <span style={{ color: '#888', fontSize: 13 }}>Categoría: {prov.categoriaGasto}</span>
                    )}
                    {prov.cuentaGastos && (
                      <span style={{ color: '#888', fontSize: 13 }}>Cuenta Gastos: {prov.cuentaGastos}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group" style={{ gridColumn: '1 / 3', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{
                fontWeight: 500,
                marginBottom: 6,
                display: 'block',
                textAlign: 'left',
                color: theme === 'dark' ? '#f3f3f3' : '#111'
              }}>Cuenta de Gastos:</label>
              <select
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
            <label style={{
              fontWeight: 500,
              marginBottom: 6,
              display: 'block',
              textAlign: 'left',
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}>
              Monto Solicitado ( s/IVA)
            </label>
            <input
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
  );
};

export default SolicitudGastoForm;
