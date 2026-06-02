import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function ReporteClase() {
  const { perfil, isAdmin } = useAuth()
  const [semanas, setSemanas]     = useState([])
  const [semanaId, setSemanaId]   = useState(null)
  const [semana, setSemana]       = useState(null)
  const [miembros, setMiembros]   = useState([])
  const [registros, setRegistros] = useState({})
  const [loading, setLoading]     = useState(true)
  const [clases, setClases]       = useState([])
  const [claseId, setClaseId]     = useState(null)

  const cId = isAdmin ? claseId : perfil?.clase_id

  useEffect(() => {
    if (!perfil) return
    if (isAdmin) loadClases()
    else { setClaseId(perfil.clase_id); loadSemanas(perfil.clase_id) }
  }, [perfil])

  useEffect(() => {
    if (isAdmin && claseId) loadSemanas(claseId)
  }, [claseId])

  useEffect(() => {
    if (semanaId && cId) loadDetalle()
  }, [semanaId, cId])

  async function loadClases() {
    const { data } = await supabase.from('clases').select('*').order('orden')
    setClases(data || [])
    if (data?.length) setClaseId(data[0].id)
  }

  async function loadSemanas(cId) {
    const { data: periodo } = await supabase.from('periodos').select('id').eq('activo', true).single()
    if (!periodo) { setLoading(false); return }
    const { data } = await supabase.from('semanas').select('*')
      .eq('periodo_id', periodo.id).order('numero_semana', { ascending: false })
    setSemanas(data || [])
    if (data?.length) setSemanaId(data[0].id)
    else setLoading(false)
  }

  async function loadDetalle() {
    setLoading(true)
    const sem = semanas.find(s => s.id === semanaId)
    setSemana(sem)

    const { data: mbs } = await supabase.from('miembros').select('*')
      .eq('clase_id', cId).eq('activo', true).order('nombre_completo')
    setMiembros(mbs || [])

    const { data: regs } = await supabase.from('registros').select('*')
      .eq('semana_id', semanaId).eq('clase_id', cId)
    const map = {}
    regs?.forEach(r => { map[r.miembro_id] = r })
    setRegistros(map)
    setLoading(false)
  }

  const presentes      = miembros.filter(m => registros[m.id]?.presente)
  const ausentes       = miembros.filter(m => !registros[m.id]?.presente)
  const totalCoop      = miembros.reduce((s, m) => s + (parseFloat(registros[m.id]?.cooperacion) || 0), 0)
  const totalMisionero = miembros.reduce((s, m) => s + (parseFloat(registros[m.id]?.peso_misionero) || 0), 0)
  const totalCapitulos = miembros.reduce((s, m) => s + (parseInt(registros[m.id]?.capitulos_leidos) || 0), 0)
  const totalEfectivo  = totalCoop + totalMisionero
  const claseNombre    = clases.find(c => c.id === cId)?.nombre || perfil?.clases?.nombre || ''

  function imprimir() { window.print() }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Controles — se ocultan al imprimir */}
      <div className="no-print">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Reporte de Clase</h1>
          <button onClick={imprimir} className="btn-primary text-sm flex items-center gap-2">
            🖨️ Imprimir
          </button>
        </div>

        {/* Selector clase (solo admin) */}
        {isAdmin && clases.length > 0 && (
          <div className="card mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Clase</label>
            <select className="input" value={claseId || ''} onChange={e => setClaseId(Number(e.target.value))}>
              {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        )}

        {/* Selector semana */}
        <div className="card mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Semana</label>
          <select className="input" value={semanaId || ''} onChange={e => setSemanaId(Number(e.target.value))}>
            {semanas.map(s => (
              <option key={s.id} value={s.id}>
                Clase {s.numero_semana} · {new Date(s.fecha_domingo + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" /></div>
      ) : (
        <div className="print-area">
          {/* Encabezado del reporte */}
          <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #1d4ed8' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>Escuela Dominical · El Divino Redentor</div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '4px' }}>Reporte de Clase: {claseNombre}</div>
            {semana && (
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                Clase {semana.numero_semana} de 26 · {new Date(semana.fecha_domingo + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Resumen de totales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1d4ed8' }}>{presentes.length}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>👥 Presentes</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#16a34a' }}>{totalCapitulos}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>📖 Capítulos</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>${totalCoop.toFixed(2)}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>🤝 Cooperación</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706' }}>${totalMisionero.toFixed(2)}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>💰 Peso Mis.</div>
            </div>
          </div>

          {/* Total efectivo a entregar */}
          <div style={{ background: '#1d4ed8', color: 'white', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>TOTAL EFECTIVO A ENTREGAR</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Cooperación + Peso Misionero</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${totalEfectivo.toFixed(2)}</div>
          </div>

          {/* Lista de presentes */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Presentes ({presentes.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: '#6b7280' }}>Nombre</th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', color: '#6b7280' }}>Cap.</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px', color: '#6b7280' }}>Coop.</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px', color: '#6b7280' }}>Peso Mis.</th>
                </tr>
              </thead>
              <tbody>
                {presentes.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '12px', color: '#9ca3af' }}>Sin presentes registrados</td></tr>
                )}
                {presentes.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '6px 10px', fontWeight: '500' }}>{m.nombre_completo}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', color: '#16a34a' }}>{registros[m.id]?.capitulos_leidos || 0}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#2563eb' }}>${(parseFloat(registros[m.id]?.cooperacion) || 0).toFixed(2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#d97706' }}>${(parseFloat(registros[m.id]?.peso_misionero) || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {presentes.length > 0 && (
                  <tr style={{ borderTop: '2px solid #d1d5db', fontWeight: 'bold' }}>
                    <td style={{ padding: '6px 10px' }}>Subtotal</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', color: '#16a34a' }}>{totalCapitulos}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#2563eb' }}>${totalCoop.toFixed(2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#d97706' }}>${totalMisionero.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ausentes */}
          {ausentes.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ausentes ({ausentes.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ausentes.map(m => (
                  <span key={m.id} style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '999px', padding: '2px 10px', fontSize: '12px' }}>
                    {m.nombre_completo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Firma */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '8px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
              Firma del Maestro
            </div>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '8px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
              Firma del Secretario
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-area { padding: 0; }
        }
      `}</style>
    </div>
  )
}
