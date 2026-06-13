import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Trash2, Save, User, Calendar, Wallet, FileText, ClipboardList, Link2, Copy, Check
} from 'lucide-react'
import { format } from 'date-fns'

const abas = [
  { id: 'geral', label: 'Visão geral', icon: User },
  { id: 'agenda', label: 'Sessões', icon: Calendar },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet },
  { id: 'prontuario', label: 'Prontuário', icon: FileText },
  { id: 'formularios', label: 'Forms', icon: ClipboardList },
  { id: 'conexao', label: 'Conexão', icon: Link2 },
]

const novoVazio = {
  nome_completo: '', apelido: '', email: '', telefone: '', cpf: '',
  data_nascimento: '', endereco: '', contato_emergencia_nome: '',
  contato_emergencia_telefone: '', status: 'ativo', observacoes_gerais: '',
  valor_sessao_padrao: ''
}

export default function PacienteDetalhe() {
  const { id } = useParams()
  const ehNovo = id === 'novo'
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(novoVazio)
  const [abaAtiva, setAbaAtiva] = useState('geral')
  const [carregando, setCarregando] = useState(!ehNovo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!ehNovo) carregarPaciente()
  }, [id])

  async function carregarPaciente() {
    const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).single()
    if (!error && data) {
      setPaciente({ ...data, data_nascimento: data.data_nascimento ?? '' })
    }
    setCarregando(false)
  }

  async function handleSalvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    const payload = {
      ...paciente,
      profissional_id: profile.id,
      data_nascimento: paciente.data_nascimento || null,
      valor_sessao_padrao: paciente.valor_sessao_padrao || null,
    }
    delete payload.id
    delete payload.created_at
    delete payload.updated_at

    let result
    if (ehNovo) {
      result = await supabase.from('pacientes').insert(payload).select().single()
    } else {
      result = await supabase.from('pacientes').update(payload).eq('id', id).select().single()
    }

    if (result.error) {
      setErro('Erro ao salvar: ' + result.error.message)
    } else {
      if (ehNovo) {
        navigate(`/pacientes/${result.data.id}`)
      } else {
        setPaciente(result.data)
      }
    }
    setSalvando(false)
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este paciente? Essa ação não pode ser desfeita.')) return
    await supabase.from('pacientes').delete().eq('id', id)
    navigate('/pacientes')
  }

  function set(field, value) {
    setPaciente(prev => ({ ...prev, [field]: value }))
  }

  if (carregando) {
    return <div className="p-8 text-graphite-300">Carregando...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/pacientes" className="inline-flex items-center gap-2 text-graphite-500 hover:text-rose-700 mb-4 text-sm">
        <ArrowLeft size={16} />
        Voltar para pacientes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-display text-2xl font-semibold">
            {paciente.nome_completo?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="font-display text-2xl text-graphite-900">
              {ehNovo ? 'Novo paciente' : paciente.nome_completo}
            </h1>
            {!ehNovo && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block mt-1 ${
                paciente.status === 'ativo' ? 'bg-sage-100 text-sage-500' : 'bg-cream-100 text-graphite-300'
              }`}>
                {paciente.status}
              </span>
            )}
          </div>
        </div>
        {!ehNovo && (
          <button onClick={handleExcluir} className="text-graphite-300 hover:text-rose-700 p-2.5 rounded-xl hover:bg-rose-50 transition-colors">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {!ehNovo && (
        <div className="flex gap-1 bg-cream-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {abas.map(({ id: abaId, label, icon: Icon }) => (
            <button
              key={abaId}
              onClick={() => setAbaAtiva(abaId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                abaAtiva === abaId ? 'bg-white text-rose-500 shadow-sm' : 'text-graphite-500'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}

      {(ehNovo || abaAtiva === 'geral') && (
        <form onSubmit={handleSalvar} className="card space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Nome completo *</label>
              <input type="text" required value={paciente.nome_completo} onChange={e => set('nome_completo', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Apelido</label>
              <input type="text" value={paciente.apelido ?? ''} onChange={e => set('apelido', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Status</label>
              <select value={paciente.status} onChange={e => set('status', e.target.value)} className="input-field">
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">E-mail</label>
              <input type="email" value={paciente.email ?? ''} onChange={e => set('email', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Telefone</label>
              <input type="tel" value={paciente.telefone ?? ''} onChange={e => set('telefone', e.target.value)} className="input-field" placeholder="(21) 99999-9999" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">CPF</label>
              <input type="text" value={paciente.cpf ?? ''} onChange={e => set('cpf', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Data de nascimento</label>
              <input type="date" value={paciente.data_nascimento ?? ''} onChange={e => set('data_nascimento', e.target.value)} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Endereço</label>
              <input type="text" value={paciente.endereco ?? ''} onChange={e => set('endereco', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Contato de emergência - nome</label>
              <input type="text" value={paciente.contato_emergencia_nome ?? ''} onChange={e => set('contato_emergencia_nome', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Contato de emergência - telefone</label>
              <input type="tel" value={paciente.contato_emergencia_telefone ?? ''} onChange={e => set('contato_emergencia_telefone', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Valor padrão da sessão (R$)</label>
              <input type="number" step="0.01" value={paciente.valor_sessao_padrao ?? ''} onChange={e => set('valor_sessao_padrao', e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-1.5">Observações gerais</label>
            <textarea rows={4} value={paciente.observacoes_gerais ?? ''} onChange={e => set('observacoes_gerais', e.target.value)} className="input-field resize-none" />
          </div>

          {erro && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{erro}</p>}

          <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <Save size={18} />
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      {!ehNovo && abaAtiva === 'agenda' && <AbaSessoes pacienteId={id} profissionalId={profile.id} />}
      {!ehNovo && abaAtiva === 'financeiro' && <AbaFinanceiro pacienteId={id} profissionalId={profile.id} />}
      {!ehNovo && abaAtiva === 'prontuario' && <AbaProntuario pacienteId={id} profissionalId={profile.id} />}
      {!ehNovo && abaAtiva === 'formularios' && <AbaFormularios pacienteId={id} profissionalId={profile.id} />}
      {!ehNovo && abaAtiva === 'conexao' && <AbaConexao paciente={paciente} setPaciente={setPaciente} />}
    </div>
  )
}

// ====================== ABA SESSÕES ======================
function AbaSessoes({ pacienteId, profissionalId }) {
  const [sessoes, setSessoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { carregar() }, [pacienteId])

  async function carregar() {
    const { data } = await supabase
      .from('sessoes')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_inicio', { ascending: false })
      .limit(20)
    setSessoes(data ?? [])
    setCarregando(false)
  }

  const statusCor = {
    agendada: 'bg-sage-100 text-sage-500',
    realizada: 'bg-rose-100 text-rose-700',
    cancelada: 'bg-cream-100 text-graphite-300',
    faltou: 'bg-cream-200 text-graphite-700',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Histórico de sessões</h2>
        <Link to={`/agenda?paciente=${pacienteId}`} className="btn-secondary text-sm">Agendar sessão</Link>
      </div>
      {carregando ? (
        <p className="text-graphite-300 text-sm">Carregando...</p>
      ) : sessoes.length === 0 ? (
        <p className="text-graphite-300 text-sm">Nenhuma sessão registrada ainda.</p>
      ) : (
        <div className="divide-y divide-cream-100">
          {sessoes.map(s => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-graphite-900">{format(new Date(s.data_inicio), "dd/MM/yyyy 'às' HH:mm")}</p>
                <p className="text-sm text-graphite-300 capitalize">{s.tipo}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusCor[s.status] ?? 'bg-cream-100 text-graphite-300'}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ====================== ABA FINANCEIRO ======================
function AbaFinanceiro({ pacienteId, profissionalId }) {
  const [pagamentos, setPagamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [novo, setNovo] = useState({ valor: '', data_vencimento: '', metodo_pagamento: 'pix', status: 'pendente' })

  useEffect(() => { carregar() }, [pacienteId])

  async function carregar() {
    const { data } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_vencimento', { ascending: false })
    setPagamentos(data ?? [])
    setCarregando(false)
  }

  async function adicionarCobranca(e) {
    e.preventDefault()
    if (!novo.valor || !novo.data_vencimento) return
    await supabase.from('pagamentos').insert({
      ...novo,
      paciente_id: pacienteId,
      profissional_id: profissionalId,
      valor: Number(novo.valor)
    })
    setNovo({ valor: '', data_vencimento: '', metodo_pagamento: 'pix', status: 'pendente' })
    carregar()
  }

  async function marcarPago(pagId) {
    await supabase.from('pagamentos').update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10) }).eq('id', pagId)
    carregar()
  }

  const statusCor = {
    pendente: 'bg-cream-200 text-graphite-700',
    pago: 'bg-sage-100 text-sage-500',
    atrasado: 'bg-rose-100 text-rose-700',
    cancelado: 'bg-cream-100 text-graphite-300',
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-display text-xl mb-4">Nova cobrança</h2>
        <form onSubmit={adicionarCobranca} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="number" step="0.01" placeholder="Valor (R$)" value={novo.valor} onChange={e => setNovo({ ...novo, valor: e.target.value })} className="input-field" />
          <input type="date" value={novo.data_vencimento} onChange={e => setNovo({ ...novo, data_vencimento: e.target.value })} className="input-field" />
          <select value={novo.metodo_pagamento} onChange={e => setNovo({ ...novo, metodo_pagamento: e.target.value })} className="input-field">
            <option value="pix">Pix</option>
            <option value="cartao">Cartão</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="transferencia">Transferência</option>
            <option value="outro">Outro</option>
          </select>
          <button type="submit" className="btn-primary">Adicionar</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-display text-xl mb-4">Cobranças</h2>
        {carregando ? (
          <p className="text-graphite-300 text-sm">Carregando...</p>
        ) : pagamentos.length === 0 ? (
          <p className="text-graphite-300 text-sm">Nenhuma cobrança registrada.</p>
        ) : (
          <div className="divide-y divide-cream-100">
            {pagamentos.map(p => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-graphite-900">R$ {Number(p.valor).toFixed(2).replace('.', ',')}</p>
                  <p className="text-sm text-graphite-300">
                    Venc. {format(new Date(p.data_vencimento), "dd/MM/yyyy")} · {p.metodo_pagamento}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusCor[p.status] ?? ''}`}>
                    {p.status}
                  </span>
                  {p.status === 'pendente' && (
                    <button onClick={() => marcarPago(p.id)} className="text-xs text-rose-700 hover:underline">
                      Marcar pago
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ====================== ABA PRONTUÁRIO ======================
function AbaProntuario({ pacienteId, profissionalId }) {
  const [evolucoes, setEvolucoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [novaNota, setNovaNota] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [pacienteId])

  async function carregar() {
    const { data } = await supabase
      .from('evolucoes')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_sessao', { ascending: false })
    setEvolucoes(data ?? [])
    setCarregando(false)
  }

  async function salvarEvolucao() {
    if (!novaNota.trim()) return
    setSalvando(true)
    await supabase.from('evolucoes').insert({
      paciente_id: pacienteId,
      profissional_id: profissionalId,
      conteudo: novaNota,
      conteudo_texto_plano: novaNota,
      data_sessao: new Date().toISOString().slice(0, 10)
    })
    setNovaNota('')
    setSalvando(false)
    carregar()
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-display text-xl mb-4">Nova evolução</h2>
        <textarea
          rows={6}
          value={novaNota}
          onChange={e => setNovaNota(e.target.value)}
          placeholder="Registre as observações da sessão..."
          className="input-field resize-none mb-3"
        />
        <button onClick={salvarEvolucao} disabled={salvando} className="btn-primary disabled:opacity-60">
          {salvando ? 'Salvando...' : 'Salvar evolução'}
        </button>
        <p className="text-xs text-graphite-300 mt-3">
          Editor de texto rico e transcrição automática por IA chegam na fase 2.
        </p>
      </div>

      <div className="card">
        <h2 className="font-display text-xl mb-4">Histórico de evoluções</h2>
        {carregando ? (
          <p className="text-graphite-300 text-sm">Carregando...</p>
        ) : evolucoes.length === 0 ? (
          <p className="text-graphite-300 text-sm">Nenhuma evolução registrada.</p>
        ) : (
          <div className="space-y-4">
            {evolucoes.map(ev => (
              <div key={ev.id} className="border border-cream-100 rounded-xl p-4">
                <p className="text-sm text-graphite-300 mb-1">{format(new Date(ev.data_sessao), "dd/MM/yyyy")}</p>
                <p className="text-graphite-900 whitespace-pre-wrap">{ev.conteudo_texto_plano}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ====================== ABA FORMULÁRIOS ======================
function AbaFormularios({ pacienteId, profissionalId }) {
  const [modelos, setModelos] = useState([])
  const [enviados, setEnviados] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { carregar() }, [pacienteId])

  async function carregar() {
    const [{ data: modelosData }, { data: enviadosData }] = await Promise.all([
      supabase.from('modelos_formulario').select('*'),
      supabase.from('formularios_enviados').select('*, modelos_formulario(nome)').eq('paciente_id', pacienteId).order('enviado_em', { ascending: false })
    ])
    setModelos(modelosData ?? [])
    setEnviados(enviadosData ?? [])
    setCarregando(false)
  }

  async function enviarFormulario(modeloId) {
    const token = crypto.randomUUID()
    await supabase.from('formularios_enviados').insert({
      paciente_id: pacienteId,
      profissional_id: profissionalId,
      modelo_id: modeloId,
      link_token: token,
      expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    carregar()
  }

  const statusCor = {
    pendente: 'bg-cream-200 text-graphite-700',
    respondido: 'bg-sage-100 text-sage-500',
    expirado: 'bg-cream-100 text-graphite-300',
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-display text-xl mb-4">Enviar formulário</h2>
        {carregando ? (
          <p className="text-graphite-300 text-sm">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modelos.map(m => (
              <div key={m.id} className="border border-cream-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-graphite-900">{m.nome}</p>
                  <p className="text-sm text-graphite-300">{m.descricao}</p>
                </div>
                <button onClick={() => enviarFormulario(m.id)} className="btn-secondary text-sm shrink-0">Enviar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-display text-xl mb-4">Formulários enviados</h2>
        {enviados.length === 0 ? (
          <p className="text-graphite-300 text-sm">Nenhum formulário enviado ainda.</p>
        ) : (
          <div className="divide-y divide-cream-100">
            {enviados.map(f => (
              <div key={f.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-graphite-900">{f.modelos_formulario?.nome ?? 'Formulário'}</p>
                  <p className="text-sm text-graphite-300">{format(new Date(f.enviado_em), "dd/MM/yyyy")}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusCor[f.status]}`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ====================== ABA CONEXÃO ======================
function AbaConexao({ paciente, setPaciente }) {
  const [copiado, setCopiado] = useState(false)
  const [gerando, setGerando] = useState(false)

  async function gerarCodigo() {
    setGerando(true)
    const { data, error } = await supabase.rpc('gerar_codigo_conexao')
    const codigo = error ? Math.random().toString(36).slice(2, 10).toUpperCase() : data

    const expiraEm = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    await supabase.from('pacientes').update({
      codigo_conexao: codigo,
      codigo_conexao_expira_em: expiraEm
    }).eq('id', paciente.id)

    setPaciente(prev => ({ ...prev, codigo_conexao: codigo, codigo_conexao_expira_em: expiraEm }))
    setGerando(false)
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(paciente.codigo_conexao)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const expirado = paciente.codigo_conexao_expira_em && new Date(paciente.codigo_conexao_expira_em) < new Date()

  return (
    <div className="card">
      <h2 className="font-display text-xl mb-2">Como seu paciente se conecta?</h2>
      <p className="text-graphite-500 text-sm mb-6">
        Envie o link e o código abaixo. Depois do cadastro, o paciente aparece como conectado.
      </p>

      {paciente.conectado ? (
        <div className="bg-sage-100 text-sage-500 rounded-xl p-4 font-medium">
          ✓ Paciente conectado
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-1.5">Link da área do paciente</label>
            <input readOnly value="https://natalia-victoria.app/paciente" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-1.5">Código de conexão</label>
            {paciente.codigo_conexao && !expirado ? (
              <div className="flex items-center gap-2">
                <input readOnly value={paciente.codigo_conexao} className="input-field font-mono tracking-wider" />
                <button onClick={copiarCodigo} className="btn-secondary px-3">
                  {copiado ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            ) : (
              <button onClick={gerarCodigo} disabled={gerando} className="btn-primary w-full disabled:opacity-60">
                {gerando ? 'Gerando...' : 'Gerar código de conexão'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
