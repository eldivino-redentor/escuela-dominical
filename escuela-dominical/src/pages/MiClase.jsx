import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function MiClase() {
  const { perfil, isAdmin } = useAuth()
  const [semana, setSemana]       = useState(null)
  const [miembros, setMiembros]   = useState([])
  const [registros, setRegistros] = useState({})
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')
  const [claseActual, setClaseActual] = useState(null)
  const [clases, setClases]       = useState([])

  const claseId = isAdmin ? claseActual : perfil?.clase_id

  useEffect(() => {
    if (!perfil) return
    if (isAdmin) loadClases()
    else loadData(perfil.clase_id)
  }, [perfil])

  useEffect(() => {
    if (claseActual) loadData(claseActual)
  }, [claseActual])

  async function loadClases() {
    const { data } = await supabase.from('clases').select('*').order('orden')
    setClases(data || [])
    if (data?.length) { setClaseActual(data[0].id); }
    else setLoading(false)
  }

  async function loadData(cId) {
    setLoading(true)
    setError('')

    // Semana activa
    const { data: periodo } = await supabase.from('periodos').select('id').eq('activo', true).single()
    if (!periodo) { setError('No hay periodo activo. Solicita al administrador que configure uno.'); setLoading(false); return }

    const { data: sem } = await supabase.from('semanas').select('*')
      .eq('periodo_id', periodo.id).eq('cerrada', false)
      .order('numero_semana', { ascending: false }).limit(1).maybeSingle()

    if (!sem) { setError('No hay clase abierta esta semana. Espera a que el administrador la abra.'); setSemana(null); setLoading(false); return }
    setSemana(sem)

    // Miembros de la clase
    const { data: mbs } = await supabase.from('miembros').select('*')
      .eq('clase_id', cId).eq('activo', true).order('nombre_completo')
    setMiembros(mbs || [])

    // Registros existentes para esta semana
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
    setSaved(false)
  }

 async function handleSave() {
    if (!semana || !claseId) return
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const rows = miembros.map(m => ({
      semana_id: semana.id,
      miembro_id: m.id,
      clase_id: claseId,
      presente: registros[m.id]?.presente ?? false,
      capitulos_leidos: parseInt(registros[m.id]?.capitulos_leidos ?? 0) || 0,
      peso_misionero: parseFloat(registros[m.id]?.peso_misionero ?? 0) || 0,
      registrado_por: user?.id,
      updated_at: new Date().toISOString()
    }))

    const { error: err } = await supabase.from('registros').upsert(rows, { onConflict: 'semana_id,miembro_id' })
    if (err) setError('Error al guardar: ' + err.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  // Totales
  const presentes = miembros.filter(m => registros[m.id]?.presente).length
  const totalCapitulos = miembros.reduce((s, m) => s + (parseInt(registros[m.id]?.capitulos_leidos) || 0), 0)
  const totalMisionero = miembros.reduce((s, m) => s + (parseFloat(registros[m.id]?.peso_misionero) || 0), 0)

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registro de Clase</h1>
          {semana && <p className="text-sm text-gray-500">Clase {semana.numero_semana} de 26 · {new Date(semana.fecha_domingo + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
        </div>
      </div>

      {/* Selector de clase para admin */}
      {isAdmin && clases.length > 0 && (
        <div className="card mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Clase</label>
          <select className="input" value={claseActual || ''} onChange={e => setClaseActual(Number(e.target.value))}>
            {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">{error}</div>
      )}

      {semana && miembros.length > 0 && (
        <>
          {/* Totales sticky */}
          <div className="card mb-4 bg-blue-700 text-white border-0">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold">{presentes}</div>
                <div className="text-xs text-blue-200">Presentes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCapitulos}</div>
                <div className="text-xs text-blue-200">Capítulos</div>
              </div>
              <div>
                <div className="text-2xl font-bold">${totalMisionero.toFixed(0)}</div>
                <div className="text-xs text-blue-200">Peso Misionero</div>
              </div>
            </div>
          </div>

          {/* Lista de miembros */}
          <div className="space-y-2 mb-4">
            {miembros.map(m => {
              const reg = registros[m.id] || {}
              return (
                <div key={m.id} className={`card transition-all ${reg.presente ? 'border-blue-300 bg-blue-50' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => updateField(m.id, 'presente', !reg.presente)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        reg.presente ? 'bg-blue-700 border-blue-700 text-white' : 'border-gray-300'
                      }`}
                    >
                      {reg.presente && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`text-sm font-medium flex-1 ${reg.presente ? 'text-blue-900' : 'text-gray-700'}`}>
                      {m.nombre_completo}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-10">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">📖 Capítulos leídos</label>
                      <input
                        type="number" min="0" max="200"
                        value={reg.capitulos_leidos ?? ''}
                        onChange={e => updateField(m.id, 'capitulos_leidos', e.target.value)}
                        placeholder="0"
                        className="input text-sm py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">💰 Peso Misionero</label>
                      <input
                        type="number" min="0" step="1"
                        value={reg.peso_misionero ?? ''}
                        onChange={e => updateField(m.id, 'peso_misionero', e.target.value)}
                        placeholder="0.00"
                        className="input text-sm py-1.5"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Guardar */}
          <div className="sticky bottom-20 md:bottom-4">
            <button onClick={handleSave} disabled={saving} className={`w-full py-3 rounded-xl font-semibold text-base shadow-lg transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-blue-700 text-white hover:bg-blue-800'
            } disabled:opacity-50`}>
              {saving ? 'Guardando...' : saved ? '✅ Guardado correctamente' : '💾 Guardar registro'}
            </button>
          </div>
        </>
      )}

      {semana && miembros.length === 0 && !error && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-700">No hay miembros en esta clase</h3>
          <p className="text-sm text-gray-500 mt-1">Agrega miembros en la sección "Miembros".</p>
        </div>
      )}
    </div>
  )
}
