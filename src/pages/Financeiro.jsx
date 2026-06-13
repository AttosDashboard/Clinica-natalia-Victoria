import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, TrendingUp, TrendingDown, Wallet, AlertCircle, X } from 'lucide-react'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const abas = ['Análise', 'Lançamentos', 'Despesas']

export default function Financeiro() {
  const { profile } = useAuth()
  const [abaAtiva, setAbaAtiva] = useState('Análise')
  const [periodo, setPeriodo] = useState(() => {
    const hoje = new Date()
    return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) }
  })
  const [pagamentos, setPagamentos] = useState([])
  const [despesas, setDespesas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalDespesa, setModalDespesa] = useState(false)
  const [novaDespesa, setNovaDespesa] = useState({ descricao: '', valor: '', categoria: '', data_vencimento: '' })

  useEffect(() => {
    if (profile?.id) carregarDados()
  }, [profile?.id, periodo])

  async function carregarDados() {
    setCarregando(true)
    const [{ data: pagData }, { data: despData }] = await Promise.all([
      supabase
        .from('pagamentos')
        .select('*, pacientes(nome_completo)')
        .eq('profissional_id', profile.id)
        .gte('data_vencimento', format(periodo.inicio, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(periodo.fim, 'yyyy-MM-dd'))
        .order('data_vencimento'),
      supabase
        .from('despesas')
        .select('*')
        .eq('profissional_id', profile.id)
        .gte('data_vencimento', format(periodo.inicio, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(periodo.fim, 'yyyy-MM-dd'))
        .order('data_vencimento')
    ])
    setPagamentos(pagData ?? [])
    setDespesas(despData ?? [])
    setCarregando(false)
  }

  async function adicionarDespesa(e) {
    e.preventDefault()
    if (!novaDespesa.descricao || !novaDespesa.valor || !novaDespesa.data_vencimento) return
    await supabase.from('despesas').insert({
      ...novaDespesa,
      valor: Number(novaDespesa.valor),
      profissional_id: profile.id
    })
    setNovaDespesa({ descricao: '', valor: '', categoria: '', data_vencimento: '' })
    setModalDespesa(false)
    carregarDados()
  }

  async function marcarDespesaPaga(despId) {
    await supabase.from('despesas').update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10) }).eq('id', despId)
    carregarDados()
  }

  // Cálculos
  const receitaTotal = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0)
  const receitaRecebida = pagamentos.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor), 0)
  const aReceber = pagamentos.filter(p => p.status !== 'pago').reduce((acc, p) => acc + Number(p.valor), 0)
  const despesaTotal = despesas.reduce((acc, d) => acc + Number(d.valor), 0)
  const despesaPaga = despesas.filter(d => d.status === 'pago').reduce((acc, d) => acc + Number(d.valor), 0)
  const resultadoPrevisto = receitaTotal - despesaTotal
  const atrasados = pagamentos.filter(p => p.status === 'atrasado').reduce((acc, p) => acc + Number(p.valor), 0)
    + despesas.filter(d => d.status === 'atrasado').reduce((acc, d) => acc + Number(d.valor), 0)

  function fmt(valor) {
    return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-graphite-900">Central Financeira</h1>
          <p className="text-graphite-500 mt-1">
            Período: {format(periodo.inicio, 'dd/MM')} – {format(periodo.fim, 'dd/MM/yyyy')}
          </p>
        </div>
        <button onClick={() => setModalDespesa(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nova despesa
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CardResumo
          label="Resultado previsto"
          valor={fmt(resultadoPrevisto)}
          sub="Receitas menos despesas do período"
          icon={Wallet}
          cor="bg-rose-100 text-rose-700"
        />
        <CardResumo
          label="Receitas no período"
          valor={fmt(receitaTotal)}
          sub={`${fmt(aReceber)} a receber`}
          icon={TrendingUp}
          cor="bg-sage-100 text-sage-500"
        />
        <CardResumo
          label="Despesas previstas"
          valor={fmt(despesaTotal)}
          sub={`${fmt(despesaTotal - despesaPaga)} ainda em aberto`}
          icon={TrendingDown}
          cor="bg-cream-200 text-graphite-700"
        />
        <CardResumo
          label="Em atraso"
          valor={fmt(atrasados)}
          sub={atrasados > 0 ? 'Atenção necessária' : 'Sem atraso no período'}
          icon={AlertCircle}
          cor={atrasados > 0 ? 'bg-rose-100 text-rose-700' : 'bg-cream-100 text-graphite-300'}
        />
      </div>

      <div className="flex gap-1 bg-cream-100 rounded-xl p-1 mb-6 w-fit">
        {abas.map(aba => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              abaAtiva === aba ? 'bg-white text-rose-500 shadow-sm' : 'text-graphite-500'
            }`}
          >
            {aba}
          </button>
        ))}
      </div>

      {abaAtiva === 'Análise' && (
        <div className="card">
          <h2 className="font-display text-xl mb-4">Receitas x Despesas</h2>
          {carregando ? (
            <p className="text-graphite-300 text-sm">Carregando...</p>
          ) : (
            <div className="space-y-3">
              <BarraComparativa label="Receitas" valor={receitaTotal} max={Math.max(receitaTotal, despesaTotal, 1)} cor="bg-sage-300" />
              <BarraComparativa label="Despesas" valor={despesaTotal} max={Math.max(receitaTotal, despesaTotal, 1)} cor="bg-rose-300" />
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'Lançamentos' && (
        <div className="card">
          <h2 className="font-display text-xl mb-4">Lançamentos de pacientes</h2>
          {carregando ? (
            <p className="text-graphite-300 text-sm">Carregando...</p>
          ) : pagamentos.length === 0 ? (
            <p className="text-graphite-300 text-sm">Nenhum lançamento no período.</p>
          ) : (
            <div className="divide-y divide-cream-100">
              {pagamentos.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-graphite-900">{p.pacientes?.nome_completo ?? 'Paciente'}</p>
                    <p className="text-sm text-graphite-300">
                      Venc. {format(new Date(p.data_vencimento), 'dd/MM/yyyy')} · {p.metodo_pagamento}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-graphite-900">{fmt(p.valor)}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                      p.status === 'pago' ? 'bg-sage-100 text-sage-500' :
                      p.status === 'atrasado' ? 'bg-rose-100 text-rose-700' : 'bg-cream-200 text-graphite-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'Despesas' && (
        <div className="card">
          <h2 className="font-display text-xl mb-4">Despesas do consultório</h2>
          {carregando ? (
            <p className="text-graphite-300 text-sm">Carregando...</p>
          ) : despesas.length === 0 ? (
            <p className="text-graphite-300 text-sm">Nenhuma despesa no período.</p>
          ) : (
            <div className="divide-y divide-cream-100">
              {despesas.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-graphite-900">{d.descricao}</p>
                    <p className="text-sm text-graphite-300">
                      Venc. {format(new Date(d.data_vencimento), 'dd/MM/yyyy')} {d.categoria && `· ${d.categoria}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-graphite-900">{fmt(d.valor)}</p>
                    {d.status === 'pendente' ? (
                      <button onClick={() => marcarDespesaPaga(d.id)} className="text-xs text-rose-700 hover:underline">
                        Marcar pago
                      </button>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-sage-100 text-sage-500">paga</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalDespesa && (
        <div className="fixed inset-0 bg-graphite-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <h2 className="font-display text-xl">Nova despesa</h2>
              <button onClick={() => setModalDespesa(false)} className="text-graphite-300 hover:text-graphite-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={adicionarDespesa} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-1.5">Descrição</label>
                <input type="text" required value={novaDespesa.descricao} onChange={e => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-graphite-700 mb-1.5">Valor (R$)</label>
                  <input type="number" step="0.01" required value={novaDespesa.valor} onChange={e => setNovaDespesa({ ...novaDespesa, valor: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite-700 mb-1.5">Vencimento</label>
                  <input type="date" required value={novaDespesa.data_vencimento} onChange={e => setNovaDespesa({ ...novaDespesa, data_vencimento: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-1.5">Categoria</label>
                <input type="text" placeholder="Ex: aluguel, materiais, marketing..." value={novaDespesa.categoria} onChange={e => setNovaDespesa({ ...novaDespesa, categoria: e.target.value })} className="input-field" />
              </div>
              <button type="submit" className="btn-primary w-full">Adicionar despesa</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function CardResumo({ label, valor, sub, icon: Icon, cor }) {
  return (
    <div className="card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cor}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-semibold text-graphite-900">{valor}</p>
      <p className="text-sm text-graphite-300">{label}</p>
      <p className="text-xs text-graphite-300 mt-1">{sub}</p>
    </div>
  )
}

function BarraComparativa({ label, valor, max, cor }) {
  const largura = (valor / max) * 100
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-graphite-700 font-medium">{label}</span>
        <span className="text-graphite-900">R$ {Number(valor).toFixed(2).replace('.', ',')}</span>
      </div>
      <div className="h-3 bg-cream-100 rounded-full overflow-hidden">
        <div className={`h-full ${cor} rounded-full transition-all`} style={{ width: `${largura}%` }} />
      </div>
    </div>
  )
}
