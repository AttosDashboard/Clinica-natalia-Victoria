import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import PacienteDetalhe from './pages/PacienteDetalhe'
import Agenda from './pages/Agenda'
import Financeiro from './pages/Financeiro'
import Prontuarios from './pages/Prontuarios'
import Formularios from './pages/Formularios'
import Assistente from './pages/Assistente'
import CRM from './pages/CRM'

function RotaProtegida({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <p className="text-graphite-300">Carregando...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <AppLayout />
          </RotaProtegida>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pacientes" element={<Pacientes />} />
        <Route path="pacientes/:id" element={<PacienteDetalhe />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="crm" element={<CRM />} />
        <Route path="prontuarios" element={<Prontuarios />} />
        <Route path="formularios" element={<Formularios />} />
        <Route path="assistente" element={<Assistente />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
