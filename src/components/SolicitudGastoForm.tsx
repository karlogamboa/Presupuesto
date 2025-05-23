import React, { useEffect, useState } from 'react';

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
  const [departamentosData, setDepartamentosData] = useState<any[]>([]); // Para guardar la estructura completa
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [proveedor, setProveedor] = useState<string>('');
  const [proveedores, setProveedores] = useState<Option[]>([]);
  const [numEmpleadoTimeout, setNumEmpleadoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [proveedorInput, setProveedorInput] = useState<string>('');  
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState<Option[]>([]);
  const [empresa, setEmpresa] = useState<string>('');
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Option[]>([]);
  // Cargar listas generales (departamentos, categorías, proveedores)
  useEffect(() => {
    fetch('http://localhost:3000/api/departamentos')
      .then(res => res.json())
      .then((data: any[]) => {
        setDepartamentosData(data || []);
        setDepartamentos(
          (data || []).map(dep => ({
            value: dep.departamento || dep.Departamento || dep.Area || dep.area,
            label: dep.departamento || dep.Departamento || dep.Area || dep.area
          }))
        );
      });
    fetch('http://localhost:3000/api/categorias-gasto')
      .then(res => res.json())
      .then(data => {
        const categoriasData = (data || []).map((d: any) => ({
          value: d.categoriaGasto || d.Nombre || d.nombre,
          label: d.categoriaGasto || d.Nombre || d.nombre,
          cuentaGastos: d.cuentaGastos || d.Cuenta || d.cuenta || ''
        }));
        setCategorias(categoriasData);
        setCategoriasFiltradas(categoriasData); // Inicializar con todas las categorías
      });
    fetch('http://localhost:3000/api/proveedores')
      .then(res => res.json())
      .then((data: any[]) => {
        const lista = (data || []).map((d: any) => ({
          value: (d.nombre || d.Nombre || d.proveedor || '').trim(),
          label: (d.nombre || d.Nombre || d.proveedor || '').trim(),
          numeroEmpleado: d.numeroEmpleado || d.NumeroEmpleado || '',
          cuentaGastos: d.cuentaGastos || d.CuentaGastos || d.cuenta || '',
          categoriaGasto: d.categoriaGasto || d.CategoriaGasto || d.categoria || ''
        }));
        setProveedores(lista);
      });
  }, []);

  useEffect(() => {
    if (form.departamento) {
      // Buscar el objeto de departamento seleccionado
      const depObj = departamentosData.find(
        d => (d.departamento || d.Departamento || d.Area || d.area) === form.departamento
      );
      if (depObj && Array.isArray(depObj.subdepartamentos)) {
        setSubDepartamentos(
          depObj.subdepartamentos.map((sub: string) => ({ value: sub, label: sub }))
        );
      } else {
        setSubDepartamentos([]);
      }
    } else {
      setSubDepartamentos([]);
    }
  }, [form.departamento, departamentosData]);

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
  // Buscar solicitante por número de empleado (debounce)
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
        fetch(`http://localhost:3000/api/solicitante?numEmpleado=${encodeURIComponent(value.trim())}`)
          .then(res => res.json())
          .then((data: any) => {            
            let centroCostosCalculado = '';
            const subDepartamento = data?.subDepartamento || '';
              if (subDepartamento && subDepartamento.trim()) {
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
            
            if (!centroCostosCalculado) {
              centroCostosCalculado = data?.centroCostos || '';
            }
            
            setForm(f => ({
              ...f,
              solicitante: data?.nombre || '',
              correo: data?.correo || '',
              departamento: data?.departamento || '',
              subDepartamento: subDepartamento,
              centroCostos: centroCostosCalculado
            }));
            
            setEmpresa(data?.empresa || '');
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
    }, 600); // Espera 600ms después de dejar de escribir
    setNumEmpleadoTimeout(timeout);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'proveedor') {
      setProveedor(value);
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
        cuentaGastos: categoriaSeleccionada?.cuentaGastos || ''
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
    setCategoriasFiltradas(categorias); // Reiniciar a todas las categorías
    setForm(f => ({ ...f, proveedor: '', categoriaGasto: '', cuentaGastos: '' }));
  };
  const handleProveedorSelect = (prov: Option) => {
    setProveedor(prov.value);
    setProveedorInput(prov.label);
    
    let categoriasFiltradas = categorias;
    
    if (prov.categoriaGasto) {
      const categoriasExactas = categorias.filter(c => 
        c.value.toLowerCase() === prov.categoriaGasto?.toLowerCase() ||
        c.label.toLowerCase() === prov.categoriaGasto?.toLowerCase()
      );
      
      if (categoriasExactas.length > 0) {
        categoriasFiltradas = categoriasExactas;
      } else {
        const palabrasClave = prov.categoriaGasto.toLowerCase().split(/\s+/);
        const categoriasCoincidentes = categorias.filter(c => {
          const labelCategoria = c.label.toLowerCase();
          return palabrasClave.some(palabra => 
            palabra.length > 2 && labelCategoria.includes(palabra)
          );
        });
        
        if (categoriasCoincidentes.length > 0) {
          categoriasFiltradas = categoriasCoincidentes;
        }
      }
    }
    
    if (categoriasFiltradas === categorias && prov.cuentaGastos) {
      const categoriasPorCuenta = categorias.filter(c => 
        c.cuentaGastos === prov.cuentaGastos
      );
      if (categoriasPorCuenta.length > 0) {
        categoriasFiltradas = categoriasPorCuenta;
      }
    }
    setCategoriasFiltradas(categoriasFiltradas);
    
    if (categoriasFiltradas.length === 1) {
      const categoriaUnica = categoriasFiltradas[0];
      setForm(f => ({
        ...f,
        proveedor: prov.value,
        categoriaGasto: categoriaUnica.value,
        cuentaGastos: categoriaUnica.cuentaGastos || ''
      }));
    } else {
      setForm(f => ({
        ...f,
        proveedor: prov.value,
        categoriaGasto: '',
        cuentaGastos: ''
      }));
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
      await fetch('http://localhost:3000/api/guardar-presupuesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error al guardar el resultado en el Excel:', error);
    }
    onSubmit(form);
  };

  return (
    <form
      className="solicitud-gasto-form"
      onSubmit={handleSubmit}
      style={{
        maxWidth: 700,
        margin: '2rem auto',
        padding: 32,
        borderRadius: 16,
        background: '#fff',
        boxShadow: '0 4px 24px #0002',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 0, letterSpacing: 1, color: '#1976d2' }}>
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
        {/* Número de Empleado, Nombre del Solicitante y Correo */}
        <div className="form-group" style={{ gridColumn: '1 / 2' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Número de Empleado:</label>
          <input
            name="numeroEmpleado"
            value={form.numeroEmpleado}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}
          />
        </div>
        <div className="form-group" style={{ gridColumn: '2 / 3' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Nombre del Solicitante:</label>
          <input
            name="solicitante"
            value={form.solicitante}
            readOnly
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', background: '#f7fafd' }}
          />
        </div>
        <div className="form-group" style={{ gridColumn: '3 / 4' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Correo:</label>
          <input
            name="correo"
            value={form.correo}
            readOnly
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', background: '#f7fafd' }}
          />
        </div>
        {/* Departamento, Sub-Departamento y Centro de Costos */}
        <div className="form-group" style={{ gridColumn: '1 / 2' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Departamento:</label>
          <select name="departamento" value={form.departamento} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}>
            <option value="">Seleccione</option>
            {departamentos.map((opt, idx) => (
              <option key={opt.value + '-' + idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: '2 / 3' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Sub-Departamento:</label>
          <select
            name="subDepartamento"
            value={form.subDepartamento}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}
          >
            <option value="">Seleccione</option>
            {subDepartamentos.map((opt, idx) => (
              <option key={opt.value + '-' + idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>        
        <div className="form-group" style={{ gridColumn: '3 / 4' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Centro de Costos:</label>
          <input name="centroCostos" value={form.centroCostos} readOnly style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', background: '#f7fafd' }} />
        </div>
        {/* Nueva fila: Proveedores con búsqueda y tarjetas */}
        <div className="form-group" style={{ gridColumn: '1 / 4', position: 'relative', zIndex: 20 }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Proveedores:</label>
          <input
            type="text"
            name="proveedorInput"
            value={proveedorInput}
            onChange={handleProveedorInput}
            placeholder="Escriba para buscar proveedor..."
            autoComplete="off"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}
          />
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
                  onClick={() => handleProveedorSelect(prov)}
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
        {/* Categoría de Gasto, Cuenta de Gastos y (Saldo eliminado) */}        
        <div className="form-group" style={{ gridColumn: '1 / 2' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Categoría de Gasto:</label>
          <select
            name="categoriaGasto"
            value={form.categoriaGasto}
            onChange={handleChange}
            required={!!proveedor}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }}
          >
            <option value="">Seleccione</option>
            {categoriasFiltradas.map((opt, idx) => (
              <option key={opt.value + '-' + idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: '2 / 3' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>Cuenta de Gastos:</label>
          <input name="cuentaGastos" value={form.cuentaGastos} readOnly style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', background: '#f7fafd' }} />
        </div>
        <div className="form-group" style={{ gridColumn: '3 / 4' }}>
          <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', textAlign: 'left' }}>
            Monto Solicitado ( s/IVA)
          </label>
          <input name="montoSubtotal" type="number" value={form.montoSubtotal} onChange={handleChange} required min={0} step="0.01" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc' }} />
        </div>
      </div>
      <button
        type="submit"
        style={{
          width: 220,
          alignSelf: 'center',
          padding: 14,
          borderRadius: 8,
          background: '#1976d2',
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
  );
};

export default SolicitudGastoForm;
