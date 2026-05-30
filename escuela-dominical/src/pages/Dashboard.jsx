import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { perfil, isAdmin } = useAuth()
  const [semanaActual, setSemanaActual] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [miResumen, setMiResumen] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [perfil])

async function loadData() {
    if (!perfil) { setLoading(false); return }

    // Obtener semana activa del periodo activo
    const { data: periodo } = await supabase.from('periodos').select('id,nombre').eq('activo', true).single()
    if (!periodo) { setLoading(false); return }

    const { data: semana } = await supabase
      .from('semanas').select('*')
      .eq('periodo_id', periodo.id)
      .eq('cerrada', false)
      .order('numero_semana', { ascending: false })
      .limit(1)
      .maybeSingle()

    setSemanaActual(semana ? { ...semana, periodo_nombre: periodo.nombre } : null)

    if (semana) {
      // Resumen general
      if (isAdmin) {
        const { data } = await supabase.from('resumen_general_semana').select('*').eq('semana_id', semana.id).single()
        setResumen(data)
      }
      // Mi clase
      if (perfil.clase_id) {
        const { data } = await supabase.from('resumen_clase_semana')
          .select('*').eq('semana_id', semana.id).eq('clase_id', perfil.clase_id).single()
        setMiResumen(data)
      }
    }
    setLoading(false)
  }

  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">¡Buenos días, {perfil?.nombre?.split(' ')[0]}!</h1>
        <p className="text-sm text-gray-500 capitalize mt-1">{hoy}</p>
      </div>

      {!semanaActual ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-semibold text-gray-700">No hay clase abierta esta semana</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? 'Ve a Configuración para abrir la clase del domingo.'
              : 'El administrador aún no ha abierto la clase de esta semana.'}
          </p>
          {isAdmin && <Link to="/configuracion" className="btn-primary inline-block mt-4">Abrir clase</Link>}
        </div>
      ) : (
        <>
          <div className="card mb-4 bg-blue-700 text-white border-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">Clase abierta</div>
                <div className="text-lg font-bold mt-1">
                  Clase {semanaActual.numero_semana} de 26
                </div>
                <div className="text-sm text-blue-200 mt-0.5">{semanaActual.periodo_nombre}</div>
              </div>
              <div className="bg-blue-600 rounded-lg px-3 py-1 text-sm">
                {new Date(semanaActual.fecha_domingo + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>

          {/* Mi clase */}
          <div className="card mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {isAdmin ? 'Resumen General' : `Mi Clase · ${perfil?.clases?.nombre}`}
            </h2>
            {(isAdmin ? resumen : miResumen) ? (
              <div className="grid grid-cols-3 gap-3">
                <StatBox
                  label="Asistencia"
                  value={(isAdmin ? resumen : miResumen)?.total_asistencia ?? 0}
                  icon="👥"
                  color="blue"
                />
                <StatBox
                  label="Capítulos"
                  value={(isAdmin ? resumen : miResumen)?.total_capitulos ?? 0}
                  icon="📖"
                  color="green"
                />
                <StatBox
                  label="Peso Misionero"
                  value={`$${Number((isAdmin ? resumen : miResumen)?.total_cooperacion ?? 0).toFixed(0)}`}
                  icon="💰"
                  color="yellow"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Aún no hay registros para esta clase.</p>
            )}
          </div>

          <div className="flex gap-3">
            <Link to="/mi-clase" className="btn-primary flex-1 text-center py-3 text-base">
              ✏️ Registrar mi clase
            </Link>
            {isAdmin && (
              <Link to="/reporte" className="btn-secondary flex-1 text-center py-3 text-base">
                📊 Ver reporte
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatBox({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700'
  }
  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-0.5 opacity-75">{label}</div>
    </div>
  )
}
