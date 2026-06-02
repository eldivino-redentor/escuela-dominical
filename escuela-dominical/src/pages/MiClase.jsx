import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function MiClase() {
  const { perfil, isAdmin } = useAuth()
  const [semana, setSemana]       = useState(null)
  const [miembros, setMiembros]   = useState([])
  const [registros, setRegistros] = useState({})
  const [loading, setLoading]     = useState(true)
  const [saveStatus, setSaveStatus] = useState('')
  const [error, setError]         = useState('')
  const [claseActual, setClaseActual] = useState(null)
  const [clases, setClases]       = useState([])
  const [busqueda, setBusqueda]   = useState('')
  const [filtro, setFiltro]       = useState('todos')
  const autoSaveTimer = useRef(null)
  const registrosRef  = useRef({})
  const semanaRef     = useRef(null)
  const miembrosRef   = useRef([])
  const claseIdRef    = useRef(null)

  const claseId = isAdmin ? claseActual : perfil?.clase_id

  useEffect(() => { registrosRef.current = registros }, [registros])
  useEffect(() => { semanaRef.current = semana }, [semana])
  useEffect(() => { miembrosRef.current = miembros }, [miembros])
  useEffect(() => { claseIdRef.current = claseId }, [claseId])

  useEffect(() => {
    if (!perfil) return
    if (isAdmin) loadClases()
    else loadData(perfil.clase_id)
  }, [perfil])

  useEffect(() => { if (claseActual) loadData(claseActual) }, [claseActual])

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      guardarAhora()
    }
  }, [])

  async function loadClases() {
    const { data } = await supabase.from('clases').select('*').order('orden')
    setClases(data || [])
    if (data?.length) setClaseActual(data[0].id)
    else setLoading(false)
  }

  async function loadData(cId) {
    setLoading(true); setError('')
    const { data: periodo } = await supabase.from('periodos').select('id').eq('activo', true).single()
    if (!periodo) { setError('No hay periodo activo.'); setLoading(false); return }
    const { data: sem } = await supabase.from('semanas').select('*')
      .eq('periodo_id', periodo.id).eq('cerrada', false)
      .order('numero_semana', { ascending: false }).limit(1).maybeSingle()
    if (!sem) { setError('No hay clase abierta esta semana.'); setSemana(null); setLoading(false); return }
    setSemana(sem)
    const { data: mbs } = await supabase.from('miembros').select('*')
      .eq('clase_id', cId).eq('activo', true).order('nombre_completo')
    setMiembros(mbs || [])
    const { data: regs } = await supabase.from('registros').select('*')
      .eq('semana_id', sem.id).eq('clase_id', cId)
    const map = {}
    regs?.forEach(r => { map[r.miembro_id] = r })
    setRegistros(map)
    setLoading(false)
  }

  function updateField(miembroId, field, value) {
    setRegistros(prev => ({
      ...prev,
      [miembroId]: { ...(prev[miembroId] || { miembro_id: miembroId }), [field]: value }
    }))
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => guardarAhora(), 2000)
    setSaveStatus('')
  }

  async function guardarAhora() {
    const sem  = semanaRef.current
    const mbs  = miembrosRef.current
    const regs = registrosRef.current
    const cId  = claseIdRef.current
    if (!sem || !cId || mbs.length === 0) return
    setSaveStatus('saving')
    const { data: { user } } = await supabase.auth.getUser()
    const rows = mbs.map(m => ({
      semana_id: sem.id, miembro_id: m.id, clase_id: cId,
      presente: regs[m.id]?.presente ?? false,
      capitulos_leidos: parseInt(regs[m.id]?.capitulos_leidos ?? 0) || 0,
      cooperacion: parseFloat(regs[m.id]?.cooperacion ?? 0) || 0,
      peso_misionero: parseFloat(regs[m.id]?.peso_misionero ?? 0) || 0,
      registrado_por: user?.id,
      updated_at: new Date().toISOString()
    }))
    const { error: err } = await supabase.from('registros').upsert(rows, { onConflict: 'semana_id,miembro_id' })
    setSaveStatus(err ? 'error' : 'saved')
  }

  const miembrosFiltrados = miembros.filter(m => {
    const coincide = m.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())
    const presente = registros[m.id]?.presente ?? false
    if (filtro === 'presentes') return coincide && presente
    if (filtro === 'ausentes')  return coincide && !presente
    return coincide
  })

  const grupos = miembrosFiltrados.reduce((acc, m) => {
    const letra = m.nombre_completo.charAt(0).toUpperCase()
    if (!acc[letra]) acc[letra] = []
    acc[letra].push(m)
    return acc
  }, {})
  const letras = Object.keys(grupos).sort()

  const presentes      = miembros.filter(m => registros[m.id]?.presente).length
  const totalCapitulos = miembros.reduce((s, m) => s + (parseInt(registros[m.id]?.capitulos_leidos) || 0), 0)
  const totalCoop      = miembros.reduce((s, m) => s + (parseFloat(registros[m.id]?.cooperacion) || 0), 0)
  const totalMisionero = miembros.reduce((s, m) => s + (parseFloat(registros[m.id]?.peso_misionero) || 0), 0)

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registro de Clase</h1>
          {semana && <p className="text-sm text-gray-500">Clase {semana.numero_semana} · {new Date(semana.fecha_domingo + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>}
        </div>
        <div className="text-xs font-medium">
          {saveStatus === 'saving' && <span className="text-gray-400">💾 Guardando...</span>}
          {saveStatus === 'saved'  && <span className="text-green-600">✅ Guardado</span>}
          {saveStatus === 'error'  && <span className="text-red-600">❌ Error</span>}
        </div>
      </div>

      {isAdmin && clases.length > 0 && (
        <div className="card mb-3">
          <select className="input" value={claseActual || ''} onChange={e => setClaseActual(Number(e.target.value))}>
            {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      )}

      {error && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">{error}</div>}

      {semana && miembros.length > 0 && (
        <>
          <div className="card mb-3 bg-blue-700 text-white border-0">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><div className="text-xl font-bold">{presentes}</div><div className="text-xs text-blue-200">Presentes</div></div>
              <div><div className="text-xl font-bold">{totalCapitulos}</div><div className="text-xs text-blue-200">Capítulos</div></div>
              <div><div className="text-xl font-bold">${totalCoop.toFixed(0)}</div><div className="text-xs text-blue-200">Coop.</div></div>
              <div><div className="text-xl font-bold">${totalMisionero.toFixed(0)}</div><div className="text-xs text-blue-200">Peso Mis.</div></div>
            </div>
          </div>

          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="input pl-9 py-3 text-base"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">×</button>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            {[
              { key: 'todos',     label: `Todos (${miembros.length})` },
              { key: 'presentes', label: `✅ (${presentes})` },
              { key: 'ausentes',  label: `⬜ (${miembros.length - presentes})` }
            ].map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  filtro === f.key ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {busqueda && (
            <p className="text-xs text-gray-500 mb-2 px-1">{miembrosFiltrados.length} resultado(s)</p>
          )}

          <div className="space-y-1 mb-28">
            {letras.length === 0 && (
              <div className="card text-center py-8 text-gray-400">No se encontraron miembros</div>
            )}
            {letras.map(letra => (
              <div key={letra}>
                <div className="sticky top-0 z-10 bg-blue-700 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg my-2">
                  — {letra} —
                </div>
                {grupos[letra].map(m => {
                  const reg = registros[m.id] || {}
                  return (
                    <div key={m.id} className={`card mb-2 transition-all ${reg.presente ? 'border-blue-300 bg-blue-50' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <button
                          onClick={() => updateField(m.id, 'presente', !reg.presente)}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            reg.presente ? 'bg-blue-700 border-blue-700 text-white' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {reg.presente && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`text-sm font-medium flex-1 ${reg.presente ? 'text-blue-900 font-semibold' : 'text-gray-600'}`}>
                          {m.nombre_completo}
                        </span>
                      </div>
                      {reg.presente && (
                        <div className="grid grid-cols-3 gap-2 ml-12 mt-2">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">📖 Capítulos</label>
                            <input type="number" min="0" max="200"
                              value={reg.capitulos_leidos ?? ''}
                              onChange={e => updateField(m.id, 'capitulos_leidos', e.target.value)}
                              placeholder="0" className="input text-sm py-2" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">🤝 Cooperación</label>
                            <input type="number" min="0" step="1"
                              value={reg.cooperacion ?? ''}
                              onChange={e => updateField(m.id, 'cooperacion', e.target.value)}
                              placeholder="0" className="input text-sm py-2" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">💰 Peso Mis.</label>
                            <input type="number" min="0" step="1"
                              value={reg.peso_misionero ?? ''}
                              onChange={e => updateField(m.id, 'peso_misionero', e.target.value)}
                              placeholder="0" className="input text-sm py-2" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="fixed bottom-16 md:bottom-4 left-0 right-0 px-4 z-20">
            <div className="max-w-2xl mx-auto">
              <button onClick={guardarAhora} className={`w-full py-4 rounded-xl font-bold text-base shadow-xl transition-all ${
                saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-700 text-white'
              }`}>
                {saveStatus === 'saving' ? '💾 Guardando...' : saveStatus === 'saved' ? '✅ ¡Guardado!' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </>
      )}

      {semana && miembros.length === 0 && !error && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-700">No hay miembros en esta clase</h3>
          <p className="text-sm text-gray-500 mt-1">Ve a "Miembros" para agregarlos.</p>
        </div>
      )}
    </div>
  )
}
