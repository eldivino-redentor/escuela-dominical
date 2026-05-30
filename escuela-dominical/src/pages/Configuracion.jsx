import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Configuracion() {
  const [periodos, setPeriodos]   = useState([])
  const [semanas, setSemanas]     = useState([])
  const [periodoId, setPeriodoId] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [tab, setTab]             = useState('semanas') // semanas | periodos | usuarios
  const [usuarios, setUsuarios]   = useState([])
  // Form nuevo usuario
  const [nuEmail, setNuEmail]   = useState('')
  const [nuNombre, setNuNombre] = useState('')
  const [nuPassword, setNuPassword] = useState('')
  const [nuClaseId, setNuClaseId] = useState('')
  const [nuRol, setNuRol]       = useState('maestro')
  const [clases, setClases]     = useState([])
  const [msg, setMsg]           = useState('')
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split('T')[0])
  // Nuevo periodo
  const [npNombre, setNpNombre]   = useState('')
  const [npFecha, setNpFecha]     = useState('')

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (periodoId) loadSemanas() }, [periodoId])

  async function loadAll() {
    setLoading(true)
    const [{ data: ps }, { data: cs }, { data: us }] = await Promise.all([
      supabase.from('periodos').select('*').order('id', { ascending: false }),
      supabase.from('clases').select('*').order('orden'),
      supabase.from('perfiles').select('*, clases(nombre)').order('nombre')
    ])
    setPeriodos(ps || [])
    setClases(cs || [])
    setUsuarios(us || [])
    const activo = ps?.find(p => p.activo)
    if (activo) setPeriodoId(activo.id)
    else if (ps?.length) setPeriodoId(ps[0].id)
    else setLoading(false)
    if (cs?.length) setNuClaseId(cs[0].id)
  }

  async function loadSemanas() {
    const { data } = await supabase.from('semanas').select('*')
      .eq('periodo_id', periodoId).order('numero_semana')
    setSemanas(data || [])
    setLoading(false)
  }

async function abrirClase() {
    if (!nuevaFecha) { setMsg('Selecciona la fecha del domingo.'); return }
    setSaving(true); setMsg('')
    const periodo = periodos.find(p => p.id === periodoId)
    if (!periodo) { setSaving(false); return }
    const num = semanas.length + 1
    if (num > 26) { setMsg('Este periodo ya tiene 26 clases.'); setSaving(false); return }
    const { error } = await supabase.from('semanas').insert({
      periodo_id: periodoId,
      numero_semana: num,
      fecha_domingo: nuevaFecha,
      cerrada: false
    })
    if (error) setMsg('Error: ' + error.message)
    else { setMsg(`Clase ${num} abierta para el ${nuevaFecha}.`); await loadSemanas() }
    setSaving(false)
  }

  async function cerrarSemana(semanaId, num) {
    if (!confirm(`¿Cerrar la clase ${num}? Ya no se podrán editar sus registros.`)) return
    await supabase.from('semanas').update({ cerrada: true }).eq('id', semanaId)
    await loadSemanas()
  }

  async function crearPeriodo(e) {
    e.preventDefault()
    if (!npNombre || !npFecha) return
    setSaving(true)
    // Desactivar periodos anteriores
    await supabase.from('periodos').update({ activo: false }).eq('activo', true)
    await supabase.from('periodos').insert({ nombre: npNombre, fecha_inicio: npFecha, activo: true })
    setNpNombre(''); setNpFecha('')
    await loadAll()
    setSaving(false)
  }

  async function crearUsuario(e) {
    e.preventDefault()
    setSaving(true); setMsg('')
    const { data, error } = await supabase.auth.admin.createUser({
      email: nuEmail, password: nuPassword, email_confirm: true
    })
    if (error) { setMsg('Error al crear usuario: ' + error.message); setSaving(false); return }
    await supabase.from('perfiles').insert({
      id: data.user.id, nombre: nuNombre, clase_id: Number(nuClaseId), rol: nuRol
    })
    setNuEmail(''); setNuNombre(''); setNuPassword('')
    setMsg('Usuario creado correctamente.')
    await loadAll()
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Configuración</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[['semanas','Semanas'], ['periodos','Periodos'], ['usuarios','Usuarios']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === v ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {msg && <div className={`rounded-lg p-3 mb-4 text-sm ${msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>}

      {/* ---- SEMANAS ---- */}
      {tab === 'semanas' && (
        <>
          <div className="card mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo activo</label>
            <select className="input" value={periodoId || ''} onChange={e => setPeriodoId(Number(e.target.value))}>
              {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.activo ? ' ✓' : ''}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">{semanas.length} de 26 clases registradas</p>
           <div className="flex items-center gap-2">
  <input
    type="date"
    value={nuevaFecha}
    onChange={e => setNuevaFecha(e.target.value)}
    className="input text-sm py-1.5 w-40"
  />
  <button onClick={abrirClase} disabled={saving || semanas.length >= 26}
    className="btn-primary text-sm">
    + Abrir clase {semanas.length + 1}
  </button>
</div>
          </div>

          <div className="space-y-2">
            {semanas.map(s => (
              <div key={s.id} className="card flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-sm">Clase {s.numero_semana}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(s.fecha_domingo + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {s.cerrada
                  ? <span className="badge bg-gray-100 text-gray-500">Cerrada</span>
                  : <div className="flex items-center gap-2">
                      <span className="badge bg-green-100 text-green-700">Abierta</span>
                      <button onClick={() => cerrarSemana(s.id, s.numero_semana)} className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">Cerrar</button>
                    </div>
                }
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---- PERIODOS ---- */}
      {tab === 'periodos' && (
        <>
          <form onSubmit={crearPeriodo} className="card mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Crear nuevo periodo</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                <input type="text" required value={npNombre} onChange={e => setNpNombre(e.target.value)} className="input" placeholder="Primer Periodo 2026" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fecha de inicio</label>
                <input type="date" required value={npFecha} onChange={e => setNpFecha(e.target.value)} className="input" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">Crear periodo</button>
            </div>
          </form>
          <div className="space-y-2">
            {periodos.map(p => (
              <div key={p.id} className="card flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-sm">{p.nombre}</span>
                  <span className="text-xs text-gray-500 ml-2">{new Date(p.fecha_inicio + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {p.activo && <span className="badge bg-blue-100 text-blue-700">Activo</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---- USUARIOS ---- */}
      {tab === 'usuarios' && (
        <>
          <form onSubmit={crearUsuario} className="card mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar maestro / usuario</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre completo</label>
                <input type="text" required value={nuNombre} onChange={e => setNuNombre(e.target.value)} className="input" placeholder="María García" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Correo electrónico</label>
                <input type="email" required value={nuEmail} onChange={e => setNuEmail(e.target.value)} className="input" placeholder="maestro@correo.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contraseña inicial</label>
                <input type="text" required minLength={8} value={nuPassword} onChange={e => setNuPassword(e.target.value)} className="input" placeholder="Mínimo 8 caracteres" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Clase asignada</label>
                  <select className="input" value={nuClaseId} onChange={e => setNuClaseId(e.target.value)}>
                    {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rol</label>
                  <select className="input" value={nuRol} onChange={e => setNuRol(e.target.value)}>
                    <option value="maestro">Maestro</option>
                    <option value="secretario">Secretario</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">Crear usuario</button>
            </div>
          </form>

          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="card flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{u.nombre}</div>
                  <div className="text-xs text-gray-500">{u.clases?.nombre} · {u.rol}</div>
                </div>
                <span className={`badge ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : u.rol === 'secretario' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {u.rol}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
