import React, { useEffect, useState } from 'react';
import {
  fetchDepartamentos,
  fetchCategoriasGasto,
  fetchProveedores,
  fetchSolicitanteByNumeroEmpleado,
  guardarPresupuesto,
  fetchResultados // <-- Importa fetchResultados si lo usas aquí
} from '../services';
import { globalUserInfo } from './MenuUsuario';
import { toast } from 'react-toastify';

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
  proveedor?: string;
  periodoPresupuesto?: string;
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
  proveedor: '',
  periodoPresupuesto: '',
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
        // Ahora data ya contiene departamentos únicos con sus subdepartamentos agrupados
        setDepartamentos(
          (data || []).map((dep: any) => ({
            value: dep.value || dep.departamento || '',
            label: dep.label || dep.departamento || ''
          }))
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
          label: d.label || '',
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
        const lista = (data || []).map((d: any) => {
          return {
            value: String(d.nombre || d.id || '').trim(),
            label: String(d.nombre || '').trim(),
            numeroEmpleado: d.numeroProveedor || d['Número Proveedor'] || '',
            cuentaGastos: d.cuentaGastos || '', // Ya normalizado en services.ts
            categoriaGasto: d.categoria || d.Categoría || '',
          };
        });
        setProveedores(lista);
      })
      .catch((error) => console.error("Error al cargar proveedores:", error));
  }, [setProveedores]);
}

function getCentroCostosFromSubDepartamento(subDepartamento: string) {
  let centroCostos = '';
  if (subDepartamento?.trim()) {
    const regex = /^([A-Z0-9]+)[\s\-_]+/;
    const match = regex.exec(subDepartamento);
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
  const nombre = data?.nombre ?? '';
  // Extraer correo electrónico
  const correo = data?.['Correo electrónico'] ?? data?.correo ?? '';
  // Procesar departamento y subdepartamento
  let departamento = '';
  let subDepartamento = '';
  let centroCostosCalculado = '';
  const deptStr = data?.departamento ?? '';
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
    empresa: data?.subsidiaria ?? data?.empresa ?? ''
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
  const [numeroEmpleadoCargado, setNumeroEmpleadoCargado] = useState<string>('');
  const [numEmpleadoTimeout, setNumEmpleadoTimeout] = useState<NodeJS.Timeout | null>(null);
  const periodos = usePeriodos();
  const [periodoPresupuesto, setPeriodoPresupuesto] = useState<string>('');

  // useEffect principal para cargar el número de empleado al montar el componente
  useEffect(() => {
    // 1. Intenta obtener el número de empleado de la variable global
    let numeroEmpleado: string | undefined = globalUserInfo?.numeroEmpleado;
    // Nuevo: Intenta obtener el correo del usuario logueado
    let correoUsuario: string | undefined = globalUserInfo?.email;

    // 2. Si no está en la variable global, intenta obtenerlo del access_token (API Gateway token)
    if (!numeroEmpleado || !correoUsuario) {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          if (!numeroEmpleado)
            numeroEmpleado = payload.numeroEmpleado || payload.numero_empleado || payload.numEmpleado;
          if (!correoUsuario)
            correoUsuario = payload.email || payload.correo || payload['Correo electrónico'];
        } catch {
          // No-op
        }
      }
    }

    // 3. Si lo encuentra, setea el número de empleado y carga los datos relacionados
    if (numeroEmpleado && numeroEmpleado !== '') {
      setForm(f => ({
        ...f,
        numeroEmpleado,
        correo: correoUsuario || f.correo // Asigna el correo si está disponible
      }));
      setNumeroEmpleadoCargado(numeroEmpleado);

      fetchResultados(numeroEmpleado).then(() => {});
      fetchSolicitanteByNumeroEmpleado(numeroEmpleado)
        .then((data: any) => {
          if (!data || !data.nombre) {
            setForm(f => ({
              ...f,
              solicitante: '',
              correo: correoUsuario || '',
              departamento: '',
              subDepartamento: '',
              centroCostos: ''
            }));
            return;
          }
          const parsed = parseEmpleadoData(data);
          setForm(prevForm => ({
            ...prevForm,
            solicitante: parsed.nombre,
            correo: correoUsuario || parsed.correo, // Prioriza el correo del usuario logueado
            departamento: parsed.departamento,
            subDepartamento: parsed.subDepartamento,
            centroCostos: parsed.centroCostos
          }));
          setEmpresa(parsed.empresa);
          if (onNumeroEmpleadoChange) {
            onNumeroEmpleadoChange(numeroEmpleado!);
          }
        })
        .catch(() => {
          setForm(f => ({
            ...f,
            solicitante: '',
            correo: correoUsuario || '',
            departamento: '',
            subDepartamento: '',
            centroCostos: ''
          }));
        });
    }

    // Escucha cambios globales para actualizar el número de empleado si cambia en otro componente
    function handleGlobalUserInfoUpdate() {
      const nuevoNumeroEmpleado = globalUserInfo?.numeroEmpleado;
      if (nuevoNumeroEmpleado && nuevoNumeroEmpleado !== numeroEmpleadoCargado) {
        setForm(f => ({
          ...f,
          numeroEmpleado: nuevoNumeroEmpleado
        }));
        setNumeroEmpleadoCargado(nuevoNumeroEmpleado);

        fetchResultados(nuevoNumeroEmpleado).then(() => {});
        fetchSolicitanteByNumeroEmpleado(nuevoNumeroEmpleado)
          .then((data: any) => {
            if (!data || !data.nombre) {
              setForm(f => ({
                ...f,
                solicitante: '',
                correo: '',
                departamento: '',
                subDepartamento: '',
                centroCostos: ''
              }));
              return;
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
              onNumeroEmpleadoChange(nuevoNumeroEmpleado!);
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
      }
    }
    window.addEventListener('globalUserInfoUpdated', handleGlobalUserInfoUpdate);
    return () => {
      window.removeEventListener('globalUserInfoUpdated', handleGlobalUserInfoUpdate);
    };
  // Asegura que se ejecute también cuando cambia globalUserInfo
  }, [onNumeroEmpleadoChange, globalUserInfo?.numeroEmpleado]);

  useDepartamentos(setDepartamentosData, setDepartamentos);
  useCategorias(setCategorias, setCategoriasFiltradas);
  useProveedores(setProveedores);

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
      // Si no hay coincidencias, mostrar todas las categorías
      if (categoriasSinDuplicados.length === 0) {
        setCategoriasFiltradas(categorias);
      } else {
        setCategoriasFiltradas(categoriasSinDuplicados.map(categoria => ({
          ...categoria,
          label: categoria.label
        })));
      }
      if (categoriasSinDuplicados.length === 1) {
        const catUnica = categoriasSinDuplicados[0];
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
    // Solo permite cambios si el campo no es readonly (es decir, si no se cargó automáticamente)
    if (numeroEmpleadoCargado) return;
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
    if (numEmpleadoTimeout) {
      clearTimeout(numEmpleadoTimeout);
      setNumEmpleadoTimeout(null);
    }
    const timeout = setTimeout(() => {
      if (value.trim()) {
        fetchSolicitanteByNumeroEmpleado(value.trim())
          .then((data: any) => {
            if (!data || !data.nombre) {
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
        setForm(f => ({ ...f, proveedor: provObject.label }));
      } else {
        setSelectedProvider(null);
        setProveedor('');
        setForm(f => ({ ...f, proveedor: '' }));
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
    const value = e.target.value;
    setProveedorInput(value);
    setProveedor('');
    setForm(f => ({ ...f, proveedor: '', categoriaGasto: '', cuentaGastos: '' }));

    // Nuevo: Si el texto coincide exactamente con un proveedor, selecciona ese proveedor
    const provObject = proveedores.find(
      p => p.label.trim().toLowerCase() === value.trim().toLowerCase()
    );
    if (provObject) {
      setSelectedProvider(provObject);
      setForm(f => ({ ...f, proveedor: provObject.label }));
      // Filtra categorías según el proveedor usando la misma lógica
      if (provObject.cuentaGastos && provObject.cuentaGastos.trim() !== '') {
        const cuentasProveedor = provObject.cuentaGastos.split(',').map(cuenta => cuenta.trim());
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
    } else {
      setSelectedProvider(null);
      setCategoriasFiltradas(categorias);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoriaSeleccionada = categoriasFiltradas.find(c => c.value === form.categoriaGasto);
    const proveedorSeleccionado = selectedProvider;
    const payload = {
      solicitante: form.solicitante,
      departamento: form.departamento,
      numeroEmpleado: form.numeroEmpleado,
      subDepartamento: form.subDepartamento,
      centroCostos: form.centroCostos,
      montoSubtotal: form.montoSubtotal,
      correo: form.correo,
      empresa,
      proveedor: proveedorSeleccionado?.label || proveedorInput || '',
      categoriaGasto: categoriaSeleccionada?.label || '',
      cuentaGastos: categoriaSeleccionada?.value || form.cuentaGastos,
      periodoPresupuesto,
      Fecha: new Date().toISOString(),
    };
    try {
      const data = await guardarPresupuesto(payload);
      if (!data || data?.error) {
        toast.error(data?.error || 'Error al guardar el presupuesto');
        return;
      }
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
              onChange={handleNumeroEmpleadoChange}
              required
              readOnly={!!numeroEmpleadoCargado}
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
  );
};

export default SolicitudGastoForm;

// Función para normalizar texto para comparaciones
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Reemplaza múltiples espacios con uno solo
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n');
}
