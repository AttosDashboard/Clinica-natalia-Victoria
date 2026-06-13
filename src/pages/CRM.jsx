import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, Search, UserPlus } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const statusOptions = [
  { value: 'novo_lead', label: 'Novo Lead' },
  { value: 'contato_feito', label: 'Contato Feito' },
  { value: 'avaliacao_agendada', label: 'Avaliação Agendada' },
  { value: 'primeira_sessao', label: 'Primeira Sessão' },
  { value: 'perdido', label: 'Perdido' },
]

const formInicial = {
  nome: '',
  telefone: '',
  email: '',
  origem: '',
  estado: '',
  cidade: '',
  valor_estimado: '',
  status: 'novo_lead',
  observacoes: '',
  motivo_perda: '',
  ultimo_contato: '',
}

function CardLead({ lead, fmt, abrirEditar, excluirLead, converterPaciente }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-cream-50 border border-cream-200 rounded-xl p-3 cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between gap-2">
        <div>
          <p className="font-medium text-graphite-900">{lead.nome}</p>
          <p className="text-xs text-graphite-500 mt-1">{lead.telefone || 'Sem telefone'}</p>
          <p className="text-xs text-graphite-300 mt-1">{lead.origem || 'Sem origem'}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              abrirEditar(lead)
            }}
            className="text-graphite-300 hover:text-rose-700"
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              excluirLead(lead.id)
            }}
            className="text-graphite-300 hover:text-rose-700"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="font-semibold text-graphite-900 mt-3">
        {fmt(lead.valor_estimado)}
      </p>

      {lead.status !== 'perdido' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            converterPaciente(lead)
          }}
          className="mt-3 w-full text-xs bg-sage-100 text-sage-500 rounded-lg px-3 py-2 font-medium hover:bg-sage-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <UserPlus size={14} />
          Converter em paciente
        </button>
      )}
    </div>
  )
}

function ColunaKanban({ coluna, leads, fmt, abrirEditar, excluirLead, converterPaciente }) {
  const { setNodeRef, isOver } = useDroppable({
    id: coluna.value,
  })

  const totalColuna = leads.reduce((acc, lead) => acc + Number(lead.valor_estimado || 0), 0)

  return (
    <div
      ref={setNodeRef}
      className={`card min-h-[460px] transition-colors ${isOver ? 'ring-2 ring-rose-300 bg-rose-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-graphite-900">{coluna.label}</h3>
          <p className="text-xs text-graphite-300">
            {leads.length} lead(s) · {fmt(totalColuna)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <p className="text-xs text-graphite-300">Arraste leads para esta etapa.</p>
        ) : (
          leads.map((lead) => (
            <CardLead
              key={lead.id}
              lead={lead}
              fmt={fmt}
              abrirEditar={abrirEditar}
              excluirLead={excluirLead}
              converterPaciente={converterPaciente}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function CRM() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formInicial)
  const [carregando, setCarregando] = useState(true)
  const [visualizacao, setVisualizacao] = useState('kanban')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (profile?.id) carregarLeads()
  }, [profile?.id])

  async function carregarLeads() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('profissional_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar leads:', error)
    }

    setLeads(data ?? [])
    setCarregando(false)
  }

  function abrirNovo() {
    setEditando(null)
    setForm(formInicial)
    setModal(true)
  }

  function abrirEditar(lead) {
    setEditando(lead)
    setForm({
      nome: lead.nome ?? '',
      telefone: lead.telefone ?? '',
      email: lead.email ?? '',
      origem: lead.origem ?? '',
      estado: lead.estado ?? '',
      cidade: lead.cidade ?? '',
      valor_estimado: lead.valor_estimado ?? '',
      status: lead.status ?? 'novo_lead',
      observacoes: lead.observacoes ?? '',
      motivo_perda: lead.motivo_perda ?? '',
      ultimo_contato: lead.ultimo_contato ?? '',
    })
    setModal(true)
  }

  async function salvarLead(e) {
    e.preventDefault()

    const payload = {
      nome: form.nome,
      telefone: form.telefone || null,
      email: form.email || null,
      origem: form.origem || null,
      estado: form.estado || null,
      cidade: form.cidade || null,
      valor_estimado: Number(form.valor_estimado || 0),
      status: form.status,
      observacoes: form.observacoes || null,
      motivo_perda: form.motivo_perda || null,
      ultimo_contato: form.ultimo_contato || null,
      profissional_id: profile.id,
    }

    const result = editando
      ? await supabase.from('leads').update(payload).eq('id', editando.id)
      : await supabase.from('leads').insert(payload)

    if (result.error) {
      alert(`Erro ao salvar lead: ${result.error.message}`)
      return
    }

    setModal(false)
    setEditando(null)
    setForm(formInicial)
    carregarLeads()
  }

  async function excluirLead(id) {
    if (!confirm('Excluir este lead?')) return

    const { error } = await supabase.from('leads').delete().eq('id', id)

    if (error) {
      alert(`Erro ao excluir lead: ${error.message}`)
      return
    }

    carregarLeads()
  }

  async function mudarStatus(id, status) {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert(`Erro ao mudar status: ${error.message}`)
      return
    }

    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    )
  }

  async function converterPaciente(lead) {
    if (!confirm(`Converter ${lead.nome} em paciente?`)) return

    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        nome_completo: lead.nome,
        email: lead.email || null,
        telefone: lead.telefone || null,
        status: 'ativo',
        profissional_id: profile.id,
        endereco: [lead.cidade, lead.estado].filter(Boolean).join(' / ') || null,
        valor_sessao_padrao: lead.valor_estimado || null,
        observacoes_gerais: `Convertido automaticamente do CRM. Origem: ${lead.origem || 'Não informada'}. Observações: ${lead.observacoes || 'Sem observações.'}`,
      })
      .select()
      .single()

    if (error) {
      alert(`Erro ao converter lead: ${error.message}`)
      return
    }

    await supabase.from('leads').delete().eq('id', lead.id)

    setLeads((prev) => prev.filter((item) => item.id !== lead.id))
    navigate(`/pacientes/${data.id}`)
  }

  function handleDragEnd(event) {
    const { active, over } = event

    if (!over) return

    const leadId = active.id
    const novoStatus = over.id

    const lead = leads.find((item) => item.id === leadId)

    if (!lead || lead.status === novoStatus) return

    mudarStatus(leadId, novoStatus)
  }

  const leadsFiltrados = leads.filter((lead) => {
    const termo = busca.toLowerCase()

    return (
      lead.nome?.toLowerCase().includes(termo) ||
      lead.telefone?.toLowerCase().includes(termo) ||
      lead.email?.toLowerCase().includes(termo) ||
      lead.origem?.toLowerCase().includes(termo) ||
      lead.cidade?.toLowerCase().includes(termo) ||
      lead.estado?.toLowerCase().includes(termo)
    )
  })

  const totalEstimado = leadsFiltrados.reduce(
    (acc, lead) => acc + Number(lead.valor_estimado || 0),
    0
  )

  const fechados = leads.filter((l) => l.status === 'fechou').length
  const perdidos = leads.filter((l) => l.status === 'perdido').length
  const taxaConversao = leads.length > 0 ? ((fechados / leads.length) * 100).toFixed(1) : '0.0'

  function fmt(valor) {
    return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-graphite-900">CRM</h1>
          <p className="text-graphite-500 mt-1">
            Gerencie leads e oportunidades da clínica
          </p>
        </div>

        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Novo lead
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-graphite-500">Leads ativos</p>
          <p className="text-2xl font-semibold text-graphite-900">
            {leadsFiltrados.length}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-graphite-500">Valor do pipeline</p>
          <p className="text-2xl font-semibold text-graphite-900">
            {fmt(totalEstimado)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-graphite-500">Perdidos</p>
          <p className="text-2xl font-semibold text-graphite-900">{perdidos}</p>
        </div>

        <div className="card">
          <p className="text-sm text-graphite-500">Conversão</p>
          <p className="text-2xl font-semibold text-graphite-900">{taxaConversao}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="card flex-1">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-graphite-300" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, telefone, e-mail, origem, cidade ou estado..."
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex bg-cream-100 rounded-xl p-1">
          <button
            onClick={() => setVisualizacao('kanban')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              visualizacao === 'kanban'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-graphite-500'
            }`}
          >
            Kanban
          </button>

          <button
            onClick={() => setVisualizacao('lista')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              visualizacao === 'lista'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-graphite-500'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="card">
          <p className="text-sm text-graphite-300">Carregando leads...</p>
        </div>
      ) : visualizacao === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {statusOptions.map((coluna) => (
              <ColunaKanban
                key={coluna.value}
                coluna={coluna}
                leads={leadsFiltrados.filter((lead) => lead.status === coluna.value)}
                fmt={fmt}
                abrirEditar={abrirEditar}
                excluirLead={excluirLead}
                converterPaciente={converterPaciente}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="card">
          {leadsFiltrados.length === 0 ? (
            <p className="text-sm text-graphite-300">Nenhum lead cadastrado.</p>
          ) : (
            <div className="divide-y divide-cream-100">
              {leadsFiltrados.map((lead) => (
                <div
                  key={lead.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-graphite-900">{lead.nome}</p>
                    <p className="text-sm text-graphite-500">
                      {lead.telefone || 'Sem telefone'} · {lead.origem || 'Sem origem'}
                    </p>
                    <p className="text-xs text-graphite-300 mt-1">
                      {lead.cidade || 'Cidade não informada'} / {lead.estado || 'UF'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-graphite-900">
                        {fmt(lead.valor_estimado)}
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-cream-200 text-graphite-700">
                        {statusOptions.find((s) => s.value === lead.status)?.label ?? lead.status}
                      </span>
                    </div>

                    <button
                      onClick={() => converterPaciente(lead)}
                      className="text-sage-500 hover:text-sage-700 text-xs font-medium"
                    >
                      Converter
                    </button>

                    <button
                      onClick={() => abrirEditar(lead)}
                      className="text-graphite-300 hover:text-rose-700"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => excluirLead(lead.id)}
                      className="text-graphite-300 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={salvarLead}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4"
          >
            <h2 className="font-display text-2xl text-graphite-900">
              {editando ? 'Editar lead' : 'Novo lead'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />

              <input
                className="input"
                placeholder="Telefone/WhatsApp"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />

              <input
                className="input"
                placeholder="E-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <select
                className="input"
                value={form.origem}
                onChange={(e) => setForm({ ...form, origem: e.target.value })}
              >
                <option value="">Origem</option>
                <option value="Instagram">Instagram</option>
                <option value="Indicação">Indicação</option>
                <option value="Google">Google</option>
                <option value="Site">Site</option>
                <option value="Tráfego pago">Tráfego pago</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Outro">Outro</option>
              </select>

              <input
                className="input"
                placeholder="Estado"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              />

              <input
                className="input"
                placeholder="Cidade"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              />

              <input
                className="input"
                placeholder="Valor estimado"
                type="number"
                value={form.valor_estimado}
                onChange={(e) =>
                  setForm({ ...form, valor_estimado: e.target.value })
                }
              />

              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <input
                className="input"
                type="date"
                value={form.ultimo_contato}
                onChange={(e) =>
                  setForm({ ...form, ultimo_contato: e.target.value })
                }
              />
            </div>

            <textarea
              className="input min-h-24"
              placeholder="Observações"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />

            {form.status === 'perdido' && (
              <textarea
                className="input min-h-20"
                placeholder="Motivo da perda"
                value={form.motivo_perda}
                onChange={(e) =>
                  setForm({ ...form, motivo_perda: e.target.value })
                }
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>

              <button type="submit" className="btn-primary">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}