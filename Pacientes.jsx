import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Search, Plus, User, Eye, EyeOff } from 'lucide-react'

export default function Pacientes() {
  const { profile } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('ativos') // 'todos' | 'ativos' | 'inativos'
  const [modoPrivado, setModoPrivado] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (profile?.id) carregarPacientes()
  }, [profile?.id, filtro])

  async function carregarPacientes() {
    setCarregando(true)
    let query = supabase
      .from('pacientes')
      .select('*')
      .eq('profissional_id', profile.id)
      .order('nome_completo')

    if (filtro === 'ativos') query = query.eq('status', 'ativo')
    if (filtro === 'inativos') query = query.eq('status', 'inativo')

    const { data, error } = await query
    if (!error) setPacientes(data ?? [])
    setCarregando(false)
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome_completo.toLowerCase().includes(busca.toLowerCase())
  )

  function exibirNome(nome) {
    if (!modoPrivado) return nome
    const partes = nome.split(' ')
    return partes[0] + (partes.length > 1 ? ' ' + partes[1][0] + '.' : '')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-graphite-900">Pacientes</h1>
          <p className="text-graphite-500 mt-1">Gerencie seus pacientes e prontuários</p>
        </div>
        <Link to="/pacientes/novo" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Adicionar paciente
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-300" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar paciente..."
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2 bg-cream-100 rounded-xl p-1">
          {[
            { id: 'ativos', label: 'Ativos' },
            { id: 'inativos', label: 'Inativos' },
            { id: 'todos', label: 'Todos' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === id ? 'bg-white text-rose-500 shadow-sm' : 'text-graphite-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModoPrivado(!modoPrivado)}
          title="Modo privado (oculta dados sigilosos)"
          className={`p-2.5 rounded-xl transition-colors ${
            modoPrivado ? 'bg-rose-100 text-rose-700' : 'bg-cream-100 text-graphite-500'
          }`}
        >
          {modoPrivado ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {carregando ? (
        <p className="text-graphite-300 text-center py-12">Carregando pacientes...</p>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="card text-center py-12">
          <User size={32} className="text-graphite-300 mx-auto mb-3" />
          <p className="text-graphite-500">Nenhum paciente encontrado.</p>
        </div>
      ) : (
        <div className="card divide-y divide-cream-100">
          {pacientesFiltrados.map((p) => (
            <Link
              key={p.id}
              to={`/pacientes/${p.id}`}
              className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-cream-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-display font-semibold shrink-0">
                {p.nome_completo[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-graphite-900 truncate">{exibirNome(p.nome_completo)}</p>
                {p.apelido && !modoPrivado && (
                  <p className="text-sm text-graphite-300">{p.apelido}</p>
                )}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                p.status === 'ativo' ? 'bg-sage-100 text-sage-500' : 'bg-cream-100 text-graphite-300'
              }`}>
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
