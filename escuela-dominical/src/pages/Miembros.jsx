import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function Miembros() {
  const { perfil, isAdmin } = useAuth()
  const [clases, setClases]         = useState([])
  const [claseId, setClaseId]       = useState(null)
  const [miembros, setMiembros]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [nombre, setNombre]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [editando, setEditando]     = useState(null)

  useEffect(() => { if (perfil) loadClases() }, [perfil])
  useEffect(() => { if (claseId) loadMiembros() }, [claseId])

  async function loadClases() {
    if (isAdmin) {
      const { data } = await supabase.from('clases').select('*').order('orden')
      setClases(data || [])
      if (data?.length) setClaseId(data[0].id)
      else setLoading(false)
    } else {
      setClaseId(perfil?.clase_id)
    }
  }

  async function loadMiembros() {
    setLoading(true)
    const { data } = await supabase.from('miembros').select('*')
      .eq('clase_id', claseId).order('nombre_completo')
    setMiembros(data || [])
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    if (editando) {
      await supabase.from('miembros').update({ nombre_completo: nombre.trim() }).eq('id', editando)
    } else {
      await supabase.from('miembros').insert({ nombre_completo: nombre.trim(), clase_id: claseId, activo: true })
    }
    setNombre(''); setShowForm(false); setEditando(null)
    await loadMiembros()
    setSaving(false)
  }

  async function toggleActivo(m) {
    await supabase.from('miembros').update({ activo: !m.activo }).eq('id', m.id)
    await loadMiembros()
  }

  function startEdit(m) {
    setEditando(m.id); setNombre(m.nombre_completo); setShowForm(true)
  }

  const activos   = miembros.filter(m => m.activo)
  const inactivos = miembros.filter(m => !m.activo)
  const claseNombre = clases.find(c => c.id === claseId)?.nombre || perfil?.clases?.nombre || ''

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Miembros</h1>
          {!isAdmin && <p className="text-sm text-gray-500">{claseNombre}</p>}
        </div>
        <button onClick={() => { setShowForm(!showForm); setNombre(''); setEditando(null) }} className="btn-primary text-sm">
          {showForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {/* Selector de clase — solo admin */}
      {isAdmin && (
        <div className="card mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Clase</label>
          <select className="input" value={claseId || ''} onChange={e => { setClaseId(Number(e.target.value)); setShowForm(false) }}>
            {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {claseId && <p className="text-xs text-gray-500 mt-1">{activos.length} miembro(s) activo(s)</p>}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSave} className="card mb-4 border-blue-300">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{editando ? 'Editar miembro' : 'Nuevo miembro'}</h3>
          <input
            type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Nombre completo" className="input mb-3" autoFocus
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando...' : editando ? 'Actualizar' : 'Agregar miembro'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setNombre(''); setEditando(null) }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700" /></div>
      ) : (
        <>
          {/* Contador */}
          {!isAdmin && (
            <p className="text-sm text-gray-500 mb-3">{activos.length} miembro(s) activo(s)</p>
          )}

          {/* Miembros activos */}
          <div className="space-y-2 mb-4">
            {activos.map(m => (
              <div key={m.id} className="card flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {m.nombre_completo.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{m.nombre_completo}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(m)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">
                    Editar
                  </button>
                  <button onClick={() => toggleActivo(m)} className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                    Inactivar
                  </button>
                </div>
              </div>
            ))}
            {activos.length === 0 && (
              <div className="card text-center py-8 text-gray-400">
                No hay miembros activos en esta clase.<br />
                <span className="text-sm">Usa el botón "+ Agregar" para comenzar.</span>
              </div>
            )}
          </div>

          {/* Miembros inactivos */}
          {inactivos.length > 0 && (
            <details className="card">
              <summary className="text-sm text-gray-500 cursor-pointer">Inactivos ({inactivos.length})</summary>
              <div className="mt-3 space-y-2">
                {inactivos.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-gray-400 line-through">{m.nombre_completo}</span>
                    <button onClick={() => toggleActivo(m)} className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50">
                      Reactivar
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  )
}
