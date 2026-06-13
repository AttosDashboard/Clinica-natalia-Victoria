import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  FileText,
  ClipboardList,
  Sparkles,
  LogOut,
  Heart
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/prontuarios', label: 'Prontuários', icon: FileText },
  { to: '/formularios', label: 'Forms e Anamnese', icon: ClipboardList },
  { to: '/assistente', label: 'Assistente IA', icon: Sparkles },
]

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-cream-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-cream-200 flex flex-col">
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
              <Heart className="text-white" size={20} fill="white" />
            </div>
            <div>
              <h1 className="font-display text-lg leading-tight text-graphite-900">Natalia Victoria</h1>
              <p className="text-xs text-graphite-300">Gestão Clínica</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-100 text-rose-700'
                    : 'text-graphite-500 hover:bg-cream-100 hover:text-graphite-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-cream-200">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center font-display text-sage-500 font-semibold">
              {profile?.nome_completo?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-graphite-900 truncate">
                {profile?.nome_completo ?? 'Carregando...'}
              </p>
              <p className="text-xs text-graphite-300 truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-graphite-500 hover:bg-cream-100 hover:text-rose-700 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
