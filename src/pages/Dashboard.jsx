import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Users, Calendar, Wallet, TrendingUp, Cake } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    pacientesAtivos: 0,
    sessoesHoje: 0,
    aReceberMes: 0,
    proximaSessao: null,
    aniversariantes: []
  })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (profile?.id) carregarDados()
  }, [profile?.id])

  async function carregarDados() {
    const hoje = new Date()

    const [
      { count: pacientesAtivos },
      { data: sessoesHojeData },
      { data: pagamentosMes },
      { data: pacientesData }
    ] = await Promise.all([
      supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('profissional_id', profile.id)
        .eq('status', 'ativo'),
      supabase
        .from('sessoes')
        .select('*, pacientes(nome_completo)')
        .eq('profissional_id', profile.id)
        .gte('data_inicio', startOfDay(hoje).toISOString())
        .lte('data_inicio', endOfDay(hoje).toISOString())
        .order('data_inicio'),
      supabase
        .from('pagamentos')
        .select('valor, status')
        .eq('profissional_id', profile.id)
        .gte('data_vencimento', startOfMonth(hoje).toISOString())
        .lte('data_vencimento', endOfMonth(hoje).toISOString()),
      supabase
        .from('pacientes')
        .select('nome_completo, data_nascimento')
        .eq('profissional_id', profile.id)
        .not('data_nascimento', 'is', null)
    ])

    const aReceberMes = (pagamentosMes ?? []).reduce((acc, p) => acc + Number(p.valor), 0)
const recebidoMes = (pagamentosMes ?? [])
  .filter(p => p.status === 'pago')
  .reduce((acc, p) => acc + Number(p.valor), 0)
    const mesAtual = hoje.getMonth()
    const diaAtual = hoje.getDate()
    const aniversariantes = (pacientesData ?? [])
      .filter(p => {
        const data = new Date(p.data_nascimento)
        return data.getMonth() === mesAtual && data.getDate() >= diaAtual
      })
      .sort((a, b) => new Date(a.data_nascimento).getDate() - new Date(b.data_nascimento).getDate())
      .slice(0, 3)

    const proximaSessao = (sessoesHojeData ?? []).find(
      s => new Date(s.data_inicio) > hoje && s.status === 'agendada'
    )

    setStats({
  pacientesAtivos: pacientesAtivos ?? 0,
  sessoesHoje: (sessoesHojeData ?? []).filter(s => s.status !== 'bloqueio').length,
  recebidoMes,
  aReceberMes,
  proximaSessao,
  aniversariantes
})
    setCarregando(false)
  }

  const cards = [
    {
      label: 'Pacientes ativos',
      valor: stats.pacientesAtivos,
      icon: Users,
      cor: 'bg-rose-100 text-rose-700'
    },
    {
      label: 'Sessões hoje',
      valor: stats.sessoesHoje,
      icon: Calendar,
      cor: 'bg-sage-100 text-sage-500'
    },{
  label: 'Recebido este mês',
  valor: `R$ ${(stats.recebidoMes || 0).toFixed(2).replace('.', ',')}`,
  icon: Wallet,
  cor: 'bg-sage-100 text-sage-500'
},
    {
      label: 'A receber este mês',
     valor: `R$ ${(stats.aReceberMes || 0).toFixed(2).replace('.', ',')}`,
      icon: Wallet,
      cor: 'bg-cream-200 text-graphite-700'
    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-graphite-900">
          Olá, {profile?.nome_completo?.split(' ')[0] ?? ''} 🌿
        </h1>
        <p className="text-graphite-500 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, valor, icon: Icon, cor }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cor}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-semibold text-graphite-900">
              {carregando ? '...' : valor}
            </p>
            <p className="text-sm text-graphite-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próxima sessão */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-rose-500" />
            <h2 className="font-display text-xl">Ritmo da clínica</h2>
          </div>
          {carregando ? (
            <p className="text-graphite-300 text-sm">Carregando...</p>
          ) : stats.proximaSessao ? (
            <div className="bg-rose-50 rounded-xl p-4">
              <p className="text-sm text-graphite-500 mb-1">Próxima sessão</p>
              <p className="font-medium text-graphite-900">
                {stats.proximaSessao.pacientes?.nome_completo ?? 'Sem paciente'}
              </p>
              <p className="text-sm text-graphite-500">
                {format(new Date(stats.proximaSessao.data_inicio), "HH:mm'h'")}
              </p>
            </div>
          ) : (
            <p className="text-graphite-300 text-sm">Nenhuma sessão restante para hoje.</p>
          )}
        </div>

        {/* Aniversariantes */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Cake size={18} className="text-rose-500" />
            <h2 className="font-display text-xl">Aniversariantes do mês</h2>
          </div>
          {carregando ? (
            <p className="text-graphite-300 text-sm">Carregando...</p>
          ) : stats.aniversariantes.length === 0 ? (
            <p className="text-graphite-300 text-sm">Nenhum aniversariante próximo.</p>
          ) : (
            <ul className="space-y-2">
              {stats.aniversariantes.map((p) => (
                <li key={p.nome_completo} className="flex items-center justify-between text-sm">
                  <span className="text-graphite-900">{p.nome_completo}</span>
                  <span className="text-graphite-300">
                    {format(new Date(p.data_nascimento), "dd/MM")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
