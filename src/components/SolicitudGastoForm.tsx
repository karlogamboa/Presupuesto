import React, { useEffect, useState, useRef } from 'react';
import apiConfig from '../config/apiConfig.json'; // Import the local JSON file directly

interface Option {
  value: string;
  label: string;
  numeroEmpleado?: string;
  cuentaGastos?: string;
  categoriaGasto?: string;
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

const SolicitudGastoForm: React.FC<{ onSubmit: (data: FormData) => void, onNumeroEmpleadoChange?: (numeroEmpleado: string) => void }> = ({ onSubmit, onNumeroEmpleadoChange }) => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [departamentos, setDepartamentos] = useState<Option[]>([]);
  const [subDepartamentos, setSubDepartamentos] = useState<Option[]>([]);
  const [departamentosData, setDepartamentosData] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [proveedor, setProveedor] = useState<string>('');
  const [proveedores, setProveedores] = useState<Option[]>([]);
  const [numEmpleadoTimeout, setNumEmpleadoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [proveedorInput, setProveedorInput] = useState<string>('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState<Option[]>([]);
  const [empresa, setEmpresa] = useState<string>('');
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Option[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Option | null>(null);
  const [filtrarPorCategoria, setFiltrarPorCategoria] = useState<boolean>(true);
  const [errorPopups, setErrorPopups] = useState<{ id: number; message: string }[]>([]);
  const errorTimeoutsRef = useRef<{ [id: number]: ReturnType<typeof setTimeout> }>({});
  const nextErrorId = useRef(1);

  const baseURL = apiConfig.baseURL; // Use the baseURL directly from the imported JSON

  useEffect(() => {
    if (baseURL) {
      fetch(`${baseURL}/api/departamentos`)
        .then(res => res.json())
        .then((data: any[]) => {
          setDepartamentosData(data || []);
          setDepartamentos(
            (data || []).map(dep => {
              let nombreDep = dep.departamento || dep.Departamento || dep.Area || dep.area || '';
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
        .catch(error => {
          console.error("Error al cargar departamentos:", error);
        });
      fetch(`${baseURL}/api/categorias-gasto`)
        .then(res => res.json())
        .then(data => {
          const categoriasData = (data || []).map((d: any) => ({
            value: String(d.categoriaGasto || d.Nombre || d.nombre),
            label: d.categoriaGasto || d.Nombre || d.nombre,
            cuentaGastos: d.cuentaGastos || d.Cuenta || d.cuenta || ''
          }));
          setCategorias(categoriasData);
        });
      fetch(`${baseURL}/api/proveedores`)
        .then(res => res.json())
        .then((data: any[]) => {
          const lista = (data || []).map((d: any) => ({
            value: String((d.nombre || d.Nombre || d.proveedor || '').trim()),
            label: (d.nombre || d.Nombre || d.proveedor || '').trim(),
            numeroEmpleado: d.numeroEmpleado || d.NumeroEmpleado || '',
            cuentaGastos: d.cuentaGastos || d.CuentaGastos || d.cuenta || '',
            categoriaGasto: d.categoriaGasto || d.CategoriaGasto || d.categoria || d['Categoría'] || ''
          }));
          setProveedores(lista);
        });
    }
  }, [baseURL]);
  useEffect(() => {
    if (form.departamento) {
      console.log("Buscando subdepartamentos para:", form.departamento);
      
      // Buscar en departamentosData el departamento que coincida
      const depObj = departamentosData.find(d => {
        const depName = d.departamento || d.Departamento || d.Area || d.area;
        
        // Verificar si el departamento está en formato "NOMBRE : CÓDIGO-SUBDEPARTAMENTO"
        if (depName && depName.includes(' : ')) {
          const mainDep = depName.split(' : ')[0].trim();
          return mainDep === form.departamento;
        }
        
        return depName === form.departamento;
      });
      
      console.log("Subdepartamentos encontrados:", depObj);
      
      if (depObj && Array.isArray(depObj.subdepartamentos)) {
        console.log("Subdepartamentos disponibles:", depObj.subdepartamentos);
        
        // Verificar si el subdepartamento ya está en la lista
        if (form.subDepartamento && !depObj.subdepartamentos.includes(form.subDepartamento)) {
          console.log("Agregando subdepartamento a la lista:", form.subDepartamento);
          setSubDepartamentos([
            ...depObj.subdepartamentos.map((sub: string) => ({ value: sub, label: sub })),
            { value: form.subDepartamento, label: form.subDepartamento }
          ].sort((a, b) => a.label.localeCompare(b.label)));
        } else {
          setSubDepartamentos(
            depObj.subdepartamentos.map((sub: string) => ({ value: sub, label: sub }))
          );
        }
      } else {
        // Si no hay subdepartamentos pero sí hay uno seleccionado, crear una lista con solo ese
        if (form.subDepartamento) {
          console.log("Creando lista con solo el subdepartamento seleccionado:", form.subDepartamento);
          setSubDepartamentos([
            { value: form.subDepartamento, label: form.subDepartamento }
          ]);
        } else {
          setSubDepartamentos([]);
        }
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

    // Si el filtrado está desactivado o el proveedor no tiene categoría, mostrar todas
    if (!filtrarPorCategoria || !selectedProvider.categoriaGasto || categorias.length === 0) {
      setCategoriasFiltradas(categorias);
      setForm(prevForm => ({
        ...prevForm,
        categoriaGasto: '',
        cuentaGastos: selectedProvider ? selectedProvider.cuentaGastos || '' : '',
      }));
      return;
    }

    const categoriaProveedor = selectedProvider.categoriaGasto.toLowerCase();
    const palabrasClave = categoriaProveedor.split(/\s+|\s*y\s*|\s*&\s*/)
                                      .map(p => p.trim().toLowerCase())
                                      .filter(p => p && p.length > 1);

    let nuevasCategoriasFiltradas = categorias;

    if (palabrasClave.length > 0) {
      const coincidentes = categorias.filter(c => {
        const labelCategoria = c.label.toLowerCase();
        return palabrasClave.some(palabra => labelCategoria.includes(palabra));
      });
      nuevasCategoriasFiltradas = coincidentes;
    }

    setCategoriasFiltradas(nuevasCategoriasFiltradas);

    if (nuevasCategoriasFiltradas.length === 1) {
      const catUnica = nuevasCategoriasFiltradas[0];
      setForm(prevForm => ({
        ...prevForm,
        categoriaGasto: catUnica.value,
        cuentaGastos: catUnica.cuentaGastos || selectedProvider.cuentaGastos || '',
      }));
    } else {      setForm(prevForm => ({
        ...prevForm,
        categoriaGasto: '',
        cuentaGastos: selectedProvider.cuentaGastos || '',
      }));
    }
  }, [selectedProvider, categorias, filtrarPorCategoria]);

  // Function for debugging API responses
  const logApiResponse = (endpoint: string, data: any) => {
    console.log(`API Response from ${endpoint}:`, data);
  };

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
        fetch(`${baseURL}/api/solicitante?numEmpleado=${encodeURIComponent(value.trim())}`)
          .then(res => res.json())
          .then((data: any) => {
            logApiResponse('solicitante', data); // Use the logApiResponse function
            // Extraer nombre del solicitante
            const nombre = data?.Nombre || data?.nombre || '';
            
            // Extraer correo electrónico
            const correo = data?.['Correo electrónico'] || data?.correo || '';
              // Procesar departamento y subdepartamento
            let departamento = '';
            let subDepartamento = '';
            let centroCostosCalculado = '';
            
            // El departamento puede venir en formato "DEPTO : CÓDIGO-SUBDEPTO"
            const deptStr = data?.Departamento || data?.departamento || '';
            console.log("Procesando string de departamento:", deptStr);
            
            if (deptStr) {
              const deptParts = deptStr.split(' : ');
              if (deptParts.length > 1) {
                departamento = deptParts[0].trim();
                console.log("Departamento extraído:", departamento);
                
                // El subdepartamento puede estar después del código
                const subPartsInput = deptParts[1].trim();
                console.log("Analizando resto:", subPartsInput);
                
                // Intentar buscar un patrón de código-subdepartamento
                const match = subPartsInput.match(/^(\d+)-(.+)$/);
                if (match) {
                  centroCostosCalculado = match[1].trim();
                  subDepartamento = match[2].trim();
                  console.log("Coincidencia por regex:", { centroCostosCalculado, subDepartamento });
                } else {
                  // Intentar dividir por el primer guión
                  const subParts = subPartsInput.split('-');
                  if (subParts.length > 1) {
                    centroCostosCalculado = subParts[0].trim();
                    // Juntar el resto como subdepartamento (por si hay más guiones)
                    subDepartamento = subParts.slice(1).join('-').trim();
                    console.log("División por guión:", { centroCostosCalculado, subDepartamento });
                  } else {
                    subDepartamento = subPartsInput;
                    console.log("Sin guión - subdepartamento completo:", subDepartamento);
                  }
                }
              } else {
                departamento = deptStr;
                console.log("Sin formato especial, departamento completo:", departamento);
              }
            }
            
            // Si no se encontró un centro de costos, intentar extraerlo del subdepartamento
            if (!centroCostosCalculado && subDepartamento) {
              const match = subDepartamento.match(/^([A-Z0-9]+)[\s\-_]+/);
              if (match && match[1] && match[1].trim()) {
                centroCostosCalculado = match[1].trim();
              } else {
                const partes = subDepartamento.split(/[\s\-_]+/);
                if (partes.length > 0 && partes[0] && partes[0].trim()) {
                  centroCostosCalculado = partes[0].trim();
                }
              }
            }
            
            // Si aún no hay centro de costos, intentar usar el campo específico
            if (!centroCostosCalculado) {
              centroCostosCalculado = data?.centroCostos || data?.['Centro de costos'] || '';
            }            // Imprimir todos los datos procesados para depuración
            console.log("Datos finales procesados:", {
              nombre,
              correo,
              departamento,
              subDepartamento,
              centroCostos: centroCostosCalculado
            });

            // Antes de actualizar el formulario, verificar si el subdepartamento existe
            let actualSubDepartamento = subDepartamento;
            
            // Usar setForm con una función para garantizar el estado más actualizado
            setForm(prevForm => {
              const updatedForm = {
                ...prevForm,
                solicitante: nombre,
                correo: correo,
                departamento: departamento,
                subDepartamento: actualSubDepartamento,
                centroCostos: centroCostosCalculado
              };
              
              console.log("Actualizando formulario con:", updatedForm);
              return updatedForm;
            });

            // Extraer empresa
            const empresa = data?.Subsidiaria || data?.subsidiaria || data?.empresa || '';
            setEmpresa(empresa);
            
            if (onNumeroEmpleadoChange) {
              onNumeroEmpleadoChange(value);
            }
          })
          .catch((error) => {
            console.error("Error al obtener datos del solicitante:", error);
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
    }, 600);
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
      let centroCostos = '';
      if (value && value.trim()) {
        const match = value.match(/^([A-Z0-9]+)[\s\-_]+/);
        if (match && match[1] && match[1].trim()) {
          centroCostos = match[1].trim();
        } else {
          const partes = value.split(/[\s\-_]+/);
          if (partes.length > 0 && partes[0] && partes[0].trim()) {
            centroCostos = partes[0].trim();
          }
        }
      }

      setForm(f => ({
        ...f,
        subDepartamento: value,
        centroCostos
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
    const payload = {
      solicitante: form.solicitante,
      numeroEmpleado: form.numeroEmpleado,
      correo: form.correo,
      empresa: empresa,
      proveedor: proveedor,
      cecos: form.centroCostos,
      departamento: form.departamento,
      subDepartamento: form.subDepartamento,
      centroCostos: form.centroCostos,
      categoriaGasto: form.categoriaGasto,
      cuentaGastos: form.cuentaGastos,
      nombre: form.solicitante,
      montoSubtotal: form.montoSubtotal,
      Fecha: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${baseURL}/api/guardar-presupuesto`, { // Usa la URL base desde la configuración
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data: any = {};
      try {
        data = await response.clone().json();
      } catch {
        try {
          data = { error: await response.text() };
        } catch {
          data = {};
        }
      }
      if (!response.ok || (data && data.error)) {
        showErrorPopup(
          data && data.error
            ? `Error del servidor: ${data.error}`
            : 'Error al guardar el presupuesto: ' + response.statusText
        );
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
              background: '#e57373',
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
            <label style={{
              fontWeight: 500,
              marginBottom: 6,
              display: 'block',
              textAlign: 'left',
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}>Número de Empleado:</label>
            <input
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
              {departamentos.map((opt, idx) => (
                <option key={opt.value + '-' + idx} value={opt.value}>{opt.label}</option>
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
          <div className="form-group" style={{ gridColumn: '1 / 4', position: 'relative', zIndex: 20 }}>
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
            {selectedProvider && selectedProvider.categoriaGasto && (
              <div style={{ fontSize: '0.85em', color: '#555', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div>
                  Categoría del proveedor: <span style={{ fontWeight: 'bold' }}>{selectedProvider.categoriaGasto}</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: 'auto' }}>
                  <input 
                    type="checkbox" 
                    checked={filtrarPorCategoria} 
                    onChange={(e) => setFiltrarPorCategoria(e.target.checked)}
                    style={{ marginRight: '4px' }}
                  />
                  <span>Filtrar categorías</span>
                </label>
              </div>
            )}
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
                      <span style={{ color: '#888', fontSize: 13 }}>Núm. Empleado: {prov.numeroEmpleado}</span>
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
          <div className="form-group" style={{ gridColumn: '1 / 2' }}>
            <label style={{
              fontWeight: 500,
              marginBottom: 6,
              display: 'block',
              textAlign: 'left',
              color: theme === 'dark' ? '#f3f3f3' : '#111'
            }}>Categoría de Gasto:</label>
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
                <option key={opt.value + '-' + idx} value={opt.value}>{opt.label}</option>
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
            }}>Cuenta de Gastos:</label>
            <input
              name="cuentaGastos"
              value={form.cuentaGastos}
              readOnly
              required
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
