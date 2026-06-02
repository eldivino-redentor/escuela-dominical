import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MiClase from './pages/MiClase'
import ReporteDominical from './pages/ReporteDominical'
import Miembros from './pages/Miembros'
import Estadisticas from './pages/Estadisticas'
import Configuracion from './pages/Configuracion'
import ReporteClase from './pages/ReporteClase'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, perfil, loading, isAdmin } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" /></div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="mi-clase" element={<MiClase />} />
        <Route path="reporte" element={<ProtectedRoute adminOnly><ReporteDominical /></ProtectedRoute>} />
        <Route path="miembros" element={<ProtectedRoute><Miembros /></ProtectedRoute>} />
        <Route path="estadisticas" element={<Estadisticas />} />
        <Route path="configuracion" element={<ProtectedRoute adminOnly><Configuracion /></ProtectedRoute>} />
        <Route path="reporte-clase" element={<ProtectedRoute><ReporteClase /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}
