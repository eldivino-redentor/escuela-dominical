import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ReporteDominical() {
  const [semanas, setSemanas]   = useState([])
  const [semanaId, setSemanaId] = useState(null)
  const [clases, setClases]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadSemanas() }, [])
  useEffect(() => { if (semanaId) loadReporte() }, [semanaId])

  async function loadSemanas() {
    const { data: periodo } = await supabase.from('periodos').select('id,nombre').eq('activo', true).single()
    if (!periodo) { setLoading(false); return }
    const { data } = await supabase.from('semanas').select('*')
      .eq('periodo_id', periodo.id).order('numero_semana', { ascending: false })
    setSemanas(data || [])
    if (data?.length) setSemanaId(data[0].id)
    else setLoading(false)
  }

  async function loadReporte() {
    setLoading(true)
    const { data } = await supabase.from('resumen_clase_semana')
      .select('*').eq('semana_id', semanaId).order('clase_id')
    setClases(data || [])
    setLoading(false)
  }

  const totalAsistencia   = clases.reduce((s, c) => s + Number(c.total_asistencia), 0)
  const totalCapitulos    = clases.reduce((s, c) => s + Number(c.total_capitulos), 0)
  const totalCooperacion  = clases.reduce((s, c) => s + Number(c.total_cooperacion), 0)

  const semanaSeleccionada = semanas.find(s => s.id === semanaId)

  function exportCSV() {
    const rows = [
      ['Clase', 'Asistencia', 'Capítulos leídos', 'Peso Misionero'],
      ...clases.map(c => [c.clase, c.total_asistencia, c.total_capitulos, c.total_cooperacion]),
      ['TOTAL', totalAsistencia, totalCapitulos, totalCooperacion.toFixed(2)]
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `reporte-clase-${semanaSeleccionada?.numero_semana || ''}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Reporte Dominical</h1>
        <button onClick={exportCSV} className="btn-secondary text-sm px-3 py-1.5">
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Selector de semana */}
      <div className="card mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Clase / Semana</label>
        <select className="input" value={semanaId || ''} onChange={e => setSemanaId(Number(e.target.value))}>
          {semanas.map(s => (
            <option key={s.id} value={s.id}>
              Clase {s.numero_semana} · {new Date(s.fecha_domingo + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              {!s.cerrada ? ' (abierta)' : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" /></div>
      ) : (
        <>
          {/* Totales generales */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-700">{totalAsistencia}</div>
              <div className="text-xs text-gray-500 mt-1">Total Asistencia</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-700">{totalCapitulos}</div>
              <div className="text-xs text-gray-500 mt-1">Total Capítulos</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-yellow-600">${totalCooperacion.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Peso Misionero</div>
            </div>
          </div>

          {/* Tabla por clase */}
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Clase</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-semibold">👥 Asist.</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-semibold">📖 Cap.</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-semibold">💰 Peso Mis.</th>
                </tr>
              </thead>
              <tbody>
                {clases.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin registros para esta semana</td></tr>
                )}
                {clases.map((c, i) => (
                  <tr key={c.clase_id} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.clase}</td>
                    <td className="px-4 py-3 text-center text-blue-700 font-semibold">{c.total_asistencia}</td>
                    <td className="px-4 py-3 text-center text-green-700">{c.total_capitulos}</td>
                    <td className="px-4 py-3 text-right text-yellow-600 font-medium">${Number(c.total_cooperacion).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              {clases.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-blue-50">
                    <td className="px-4 py-3 font-bold text-blue-900">TOTAL</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-900">{totalAsistencia}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-800">{totalCapitulos}</td>
                    <td className="px-4 py-3 text-right font-bold text-yellow-700">${totalCooperacion.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  )
}
