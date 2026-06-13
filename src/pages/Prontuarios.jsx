import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FileText, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function Prontuarios() {
  const { profile } = useAuth()
  const [evolucoes, setEvolucoes] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (profile?.id) carregar()
  }, [profile?.id])

  async function carregar() {
    const { data } = await supabase
      .from('evolucoes')
      .select('*, pacientes(id, nome_completo)')
      .eq('profissional_id', profile.id)
      .order('data_sessao', { ascending: false })
      .limit(50)
    setEvolucoes(data ?? [])
    setCarregando(false)
  }

  const filtradas = evolucoes.filter(ev =>
    ev.pacientes?.nome_completo?.toLowerCase().includes(busca.toLowerCase()) ||
    ev.conteudo_texto_plano?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-graphite-900">Prontuários</h1>
        <p className="text-graphite-500 mt-1">Histórico de evoluções de todos os pacientes</p>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-300" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por paciente ou conteúdo..."
          className="input-field pl-10"
        />
      </div>

      {carregando ? (
        <p className="text-graphite-300 text-center py-12">Carregando...</p>
      ) : filtradas.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={32} className="text-graphite-300 mx-auto mb-3" />
          <p className="text-graphite-500">Nenhuma evolução registrada ainda.</p>
          <p className="text-sm text-graphite-300 mt-1">
            Acesse o perfil de um paciente e registre uma evolução na aba "Prontuário".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(ev => (
            <Link key={ev.id} to={`/pacientes/${ev.pacientes?.id}`} className="card block hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-graphite-900">{ev.pacientes?.nome_completo}</p>
                <p className="text-sm text-graphite-300">{format(new Date(ev.data_sessao), 'dd/MM/yyyy')}</p>
              </div>
              <p className="text-sm text-graphite-500 line-clamp-2">{ev.conteudo_texto_plano}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
