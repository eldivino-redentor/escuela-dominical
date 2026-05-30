import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const iconClass = "w-5 h-5"

function HomeIcon() { return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> }
function ClassIcon() { return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function ReportIcon() { return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
function ChartIcon() { return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> }
function UsersIcon() { return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> }
function CogIcon() { return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function LogoutIcon() { return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> }

export default function Layout() {
  const { perfil, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const navBase = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
  const navActive = `${navBase} bg-blue-700 text-white`
  const navInactive = `${navBase} text-gray-600 hover:bg-gray-100`

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-gray-200 p-4">
        <div className="mb-6 px-3">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Escuela Dominical</div>
          <div className="text-sm font-bold text-gray-900 mt-0.5">El Divino Redentor</div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/" end className={({ isActive }) => isActive ? navActive : navInactive}>
            <HomeIcon /> Inicio
          </NavLink>
          <NavLink to="/mi-clase" className={({ isActive }) => isActive ? navActive : navInactive}>
            <ClassIcon /> Mi Clase
          </NavLink>
          <NavLink to="/miembros" className={({ isActive }) => isActive ? navActive : navInactive}>
            <UsersIcon /> Miembros
          </NavLink>
          <NavLink to="/estadisticas" className={({ isActive }) => isActive ? navActive : navInactive}>
            <ChartIcon /> Estadísticas
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/reporte" className={({ isActive }) => isActive ? navActive : navInactive}>
                <ReportIcon /> Reporte Dominical
              </NavLink>
              <NavLink to="/configuracion" className={({ isActive }) => isActive ? navActive : navInactive}>
                <CogIcon /> Configuración
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="px-3 mb-2">
            <div className="text-xs text-gray-500">Sesión iniciada como</div>
            <div className="text-sm font-medium text-gray-900 truncate">{perfil?.nombre}</div>
            <div className="text-xs text-blue-600">{perfil?.clases?.nombre} · {perfil?.rol}</div>
          </div>
          <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-700">Escuela Dominical</div>
            <div className="text-sm font-bold text-gray-900">El Divino Redentor</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{perfil?.nombre}</div>
              <div className="text-xs text-blue-600">{perfil?.clases?.nombre}</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogoutIcon />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Bottom nav mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
          <NavLink to="/" end className={({ isActive }) => `flex-1 flex flex-col items-center py-2 text-xs gap-1 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
            <HomeIcon /><span>Inicio</span>
          </NavLink>
          <NavLink to="/mi-clase" className={({ isActive }) => `flex-1 flex flex-col items-center py-2 text-xs gap-1 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
            <ClassIcon /><span>Mi Clase</span>
          </NavLink>
          <NavLink to="/miembros" className={({ isActive }) => `flex-1 flex flex-col items-center py-2 text-xs gap-1 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
            <UsersIcon /><span>Miembros</span>
          </NavLink>
          <NavLink to="/estadisticas" className={({ isActive }) => `flex-1 flex flex-col items-center py-2 text-xs gap-1 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
            <ChartIcon /><span>Stats</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/configuracion" className={({ isActive }) => `flex-1 flex flex-col items-center py-2 text-xs gap-1 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
              <CogIcon /><span>Config</span>
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  )
}
