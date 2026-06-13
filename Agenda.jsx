import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, X } from 'lucide-react'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'

const cores = {
  lavanda: '#D8C4F0',
  rose: '#D19793',
  sage: '#CCC7AE',
  cream: '#EED5B7',
  bloqueio: '#8A9090',
}

export default function Agenda() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [sessoes, setSessoes] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [novaSessao, setNovaSessao] = useState(null)
  const calendarRef = useRef(null)

  useEffect(() => {
    if (profile?.id) {
      carregarSessoes()
      carregarPacientes()
    }
  }, [profile?.id])

  useEffect(() => {
    const pacienteIdParam = searchParams.get('paciente')
    if (pacienteIdParam) {
      abrirModal({
        startStr: new Date().toISOString(),
        endStr: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }, pacienteIdParam)
    }
  }, [searchParams])

  async function carregarSessoes() {
    const { data } = await supabase
      .from('sessoes')
      .select('*, pacientes(nome_completo)')
      .eq('profissional_id', profile.id)

    const eventos = (data ?? []).map(s => ({
      id: s.id,
      title: s.status === 'bloqueio'
        ? (s.titulo || 'Horário bloqueado')
        : (s.pacientes?.nome_completo ?? 'Sessão'),
      start: s.data_inicio,
      end: s.data_fim,
      backgroundColor: s.status === 'bloqueio' ? cores.bloqueio : (cores[s.cor] ?? cores.lavanda),
      borderColor: 'transparent',
      extendedProps: { ...s }
    }))
    setSessoes(eventos)
  }

  async function carregarPacientes() {
    const { data } = await supabase
      .from('pacientes')
      .select('id, nome_completo')
      .eq('profissional_id', profile.id)
      .eq('status', 'ativo')
      .order('nome_completo')
    setPacientes(data ?? [])
  }

  function abrirModal(info, pacienteIdPreSelecionado = null) {
    setNovaSessao({
      paciente_id: pacienteIdPreSelecionado ?? '',
      data: info.startStr.slice(0, 10),
      hora: info.startStr.slice(11, 16) || '09:00',
      duracao: 60,
      tipo: 'presencial',
      cor: 'lavanda',
      notas: '',
      tipo_evento: 'sessao' // 'sessao' | 'bloqueio'
    })
    setModalAberto(true)
  }

  async function handleSalvarSessao(e) {
    e.preventDefault()
    const dataInicio = new Date(`${novaSessao.data}T${novaSessao.hora}`)
    const dataFim = new Date(dataInicio.getTime() + novaSessao.duracao * 60000)

    const payload = {
      profissional_id: profile.id,
      paciente_id: novaSessao.tipo_evento === 'bloqueio' ? null : novaSessao.paciente_id,
      titulo: novaSessao.tipo_evento === 'bloqueio' ? 'Horário bloqueado' : null,
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      tipo: novaSessao.tipo,
      status: novaSessao.tipo_evento === 'bloqueio' ? 'bloqueio' : 'agendada',
      cor: novaSessao.cor,
      notas: novaSessao.notas,
    }

    const { error } = await supabase.from('sessoes').insert(payload)
    if (!error) {
      setModalAberto(false)
      carregarSessoes()
    }
  }

  async function handleEventoClick(info) {
    if (confirm(`Excluir "${info.event.title}"?`)) {
      await supabase.from('sessoes').delete().eq('id', info.event.id)
      carregarSessoes()
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-graphite-900">Agenda</h1>
          <p className="text-graphite-500 mt-1">Gerencie sessões e bloqueios de horário</p>
        </div>
        <button onClick={() => abrirModal({ startStr: new Date().toISOString() })} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Agendar
        </button>
      </div>

      <div className="card">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={ptBrLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={sessoes}
          selectable
          select={(info) => abrirModal(info)}
          eventClick={handleEventoClick}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          buttonText={{ today: 'hoje', month: 'mês', week: 'semana', day: 'dia' }}
        />
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-graphite-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <h2 className="font-display text-xl">Agendar sessão</h2>
              <button onClick={() => setModalAberto(false)} className="text-graphite-300 hover:text-graphite-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarSessao} className="p-6 space-y-4">
              <div className="flex gap-2 bg-cream-100 rounded-xl p-1">
                {[
                  { id: 'sessao', label: 'Agendar sessão' },
                  { id: 'bloqueio', label: 'Bloquear horário' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setNovaSessao(prev => ({ ...prev, tipo_evento: id }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      novaSessao.tipo_evento === id ? 'bg-white text-rose-500 shadow-sm' : 'text-graphite-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {novaSessao.tipo_evento === 'sessao' && (
                <div>
                  <label className="block text-sm font-medium text-graphite-700 mb-1.5">Paciente</label>
                  <select required value={novaSessao.paciente_id} onChange={e => setNovaSessao({ ...novaSessao, paciente_id: e.target.value })} className="input-field">
                    <option value="">Selecione...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-graphite-700 mb-1.5">Data</label>
                  <input type="date" required value={novaSessao.data} onChange={e => setNovaSessao({ ...novaSessao, data: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite-700 mb-1.5">Hora</label>
                  <input type="time" required value={novaSessao.hora} onChange={e => setNovaSessao({ ...novaSessao, hora: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-graphite-700 mb-1.5">Duração (min)</label>
                  <select value={novaSessao.duracao} onChange={e => setNovaSessao({ ...novaSessao, duracao: Number(e.target.value) })} className="input-field">
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={50}>50 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h30</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
                {novaSessao.tipo_evento === 'sessao' && (
                  <div>
                    <label className="block text-sm font-medium text-graphite-700 mb-1.5">Tipo</label>
                    <select value={novaSessao.tipo} onChange={e => setNovaSessao({ ...novaSessao, tipo: e.target.value })} className="input-field">
                      <option value="presencial">Presencial</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                )}
              </div>

              {novaSessao.tipo_evento === 'sessao' && (
                <div>
                  <label className="block text-sm font-medium text-graphite-700 mb-1.5">Cor</label>
                  <div className="flex gap-2">
                    {Object.entries(cores).filter(([k]) => k !== 'bloqueio').map(([nome, hex]) => (
                      <button
                        key={nome}
                        type="button"
                        onClick={() => setNovaSessao({ ...novaSessao, cor: nome })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${novaSessao.cor === nome ? 'scale-110 border-graphite-700' : 'border-transparent'}`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-1.5">Notas</label>
                <textarea rows={2} value={novaSessao.notas} onChange={e => setNovaSessao({ ...novaSessao, notas: e.target.value })} className="input-field resize-none" />
              </div>

              <button type="submit" className="btn-primary w-full">
                {novaSessao.tipo_evento === 'bloqueio' ? 'Bloquear horário' : 'Criar sessão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
