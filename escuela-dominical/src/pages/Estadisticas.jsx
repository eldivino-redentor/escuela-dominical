import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function Estadisticas() {
  const { perfil, isAdmin } = useAuth()
  const [periodos, setPeriodos]   = useState([])
  const [periodoId, setPeriodoId] = useState(null)
  const [datos, setDatos]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [vista, setVista]         = useState('asistencia') // asistencia | cooperacion | capitulos

  useEffect(() => { loadPeriodos() }, [])
  useEffect(() => { if (periodoId) loadDatos() }, [periodoId])

  async function loadPeriodos() {
    const { data } = await supabase.from('periodos').select('*').order('id', { ascending: false })
    setPeriodos(data || [])
    const activo = data?.find(p => p.activo)
    if (activo) setPeriodoId(activo.id)
    else if (data?.length) setPeriodoId(data[0].id)
    else setLoading(false)
  }

  async function loadDatos() {
    setLoading(true)
    let query = supabase.from('resumen_clase_semana')
      .select('*')
      .order('numero_semana')

    // Filtrar por periodo via semanas
    const { data: semanas } = await supabase.from('semanas').select('id').eq('periodo_id', periodoId)
    const semanaIds = semanas?.map(s => s.id) || []
    if (!semanaIds.length) { setDatos([]); setLoading(false); return }

    // Si maestro, filtrar por clase
    if (!isAdmin && perfil?.clase_id) {
      query = query.eq('clase_id', perfil.clase_id)
    }

    const { data } = await query.in('semana_id', semanaIds)

    // Agrupar por semana
    const byWeek = {}
    data?.forEach(r => {
      const k = r.numero_semana
      if (!byWeek[k]) byWeek[k] = { semana: `Clase ${k}`, total_asistencia: 0, total_capitulos: 0, total_cooperacion: 0 }
      byWeek[k].total_asistencia  += Number(r.total_asistencia)
      byWeek[k].total_capitulos   += Number(r.total_capitulos)
      byWeek[k].total_cooperacion += Number(r.total_cooperacion)
    })
    setDatos(Object.values(byWeek).sort((a, b) => parseInt(a.semana.split(' ')[1]) - parseInt(b.semana.split(' ')[1])))
    setLoading(false)
  }

  const colores = { asistencia: '#1d4ed8', cooperacion: '#d97706', capitulos: '#16a34a' }
  const labels  = { asistencia: 'Asistencia', cooperacion: 'Peso Misionero ($)', capitulos: 'Capítulos' }

  // Promedios
  const promAsistencia   = datos.length ? (datos.reduce((s, d) => s + d.total_asistencia, 0) / datos.length).toFixed(1) : 0
  const totalCooperacion = datos.reduce((s, d) => s + d.total_cooperacion, 0)
  const totalCapitulos   = datos.reduce((s, d) => s + d.total_capitulos, 0)
  const maxAsistencia    = datos.length ? Math.max(...datos.map(d => d.total_asistencia)) : 0

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Estadísticas del Periodo</h1>

      <div className="card mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
        <select className="input" value={periodoId || ''} onChange={e => setPeriodoId(Number(e.target.value))}>
          {periodos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}{p.activo ? ' (activo)' : ''}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" /></div>
      ) : datos.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">No hay datos para este periodo.</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
            <div className="card text-center"><div className="text-xl font-bold text-blue-700">{promAsistencia}</div><div className="text-xs text-gray-500">Prom. asistencia</div></div>
            <div className="card text-center"><div className="text-xl font-bold text-blue-700">{maxAsistencia}</div><div className="text-xs text-gray-500">Máx. asistencia</div></div>
            <div className="card text-center"><div className="text-xl font-bold text-green-700">{totalCapitulos}</div><div className="text-xs text-gray-500">Cap. del periodo</div></div>
            <div className="card text-center"><div className="text-xl font-bold text-yellow-600">${totalCooperacion.toFixed(0)}</div><div className="text-xs text-gray-500">Total cooperación</div></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {['asistencia', 'capitulos', 'cooperacion'].map(v => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${vista === v ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {labels[v]}
              </button>
            ))}
          </div>

          {/* Gráfica */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">{labels[vista]} por semana</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={datos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey={`total_${vista}`} stroke={colores[vista]} strokeWidth={2} dot={{ r: 3 }} name={labels[vista]} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla resumen */}
          <div className="card mt-4 overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-600">Semana</th>
                  <th className="text-center px-4 py-3 text-gray-600">Asist.</th>
                  <th className="text-center px-4 py-3 text-gray-600">Cap.</th>
                  <th className="text-right px-4 py-3 text-gray-600">Cooperación</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2 font-medium">{d.semana}</td>
                    <td className="px-4 py-2 text-center text-blue-700">{d.total_asistencia}</td>
                    <td className="px-4 py-2 text-center text-green-700">{d.total_capitulos}</td>
                    <td className="px-4 py-2 text-right text-yellow-600">${d.total_cooperacion.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
