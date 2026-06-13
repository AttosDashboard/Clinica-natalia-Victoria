import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ClipboardList, Star, Users, Plus, X } from 'lucide-react'

export default function Formularios() {
  const { profile } = useAuth()
  const [modelos, setModelos] = useState([])
  const [filtro, setFiltro] = useState('todos') // todos | meus | sistema | comunidade
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [novoModelo, setNovoModelo] = useState({ nome: '', descricao: '', perguntas: [''] })

  useEffect(() => {
    if (profile?.id) carregar()
  }, [profile?.id])

  async function carregar() {
    const { data } = await supabase.from('modelos_formulario').select('*').order('created_at', { ascending: false })
    setModelos(data ?? [])
    setCarregando(false)
  }

  const filtrados = modelos.filter(m => {
    if (filtro === 'meus') return m.profissional_id === profile.id
    if (filtro === 'sistema') return m.profissional_id === null
    if (filtro === 'comunidade') return m.publico && m.profissional_id !== null && m.profissional_id !== profile.id
    return true
  })

  function addPergunta() {
    setNovoModelo(prev => ({ ...prev, perguntas: [...prev.perguntas, ''] }))
  }

  function updatePergunta(idx, valor) {
    setNovoModelo(prev => {
      const perguntas = [...prev.perguntas]
      perguntas[idx] = valor
      return { ...prev, perguntas }
    })
  }

  async function salvarModelo(e) {
    e.preventDefault()
    const perguntasFormatadas = novoModelo.perguntas
      .filter(p => p.trim())
      .map((texto, i) => ({ id: `q${i + 1}`, tipo: 'texto', texto }))

    await supabase.from('modelos_formulario').insert({
      profissional_id: profile.id,
      nome: novoModelo.nome,
      descricao: novoModelo.descricao,
      categoria: 'geral',
      perguntas: perguntasFormatadas,
      publico: false
    })

    setNovoModelo({ nome: '', descricao: '', perguntas: [''] })
    setModalAberto(false)
    carregar()
  }

  const tagInfo = {
    sistema: { label: 'Sintropia', icon: Star, cor: 'text-rose-500' }, // placeholder ícone
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl text-graphite-900">Forms e Anamnese</h1>
        <button onClick={() => setModalAberto(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Criar modelo
        </button>
      </div>
      <p className="text-graphite-500 mb-6">
        Crie, envie e acompanhe formulários, anamneses e questionários para pacientes em um só lugar. 💗
      </p>

      <div className="flex gap-2 bg-cream-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { id: 'todos', label: 'Todas' },
          { id: 'meus', label: 'Meus modelos' },
          { id: 'sistema', label: 'Modelos padrão' },
          { id: 'comunidade', label: 'Comunidade' },
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

      {carregando ? (
        <p className="text-graphite-300 text-center py-12">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList size={32} className="text-graphite-300 mx-auto mb-3" />
          <p className="text-graphite-500">Nenhum modelo encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtrados.map(m => (
            <div key={m.id} className="card">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  m.profissional_id === null ? 'bg-rose-100 text-rose-700' :
                  m.publico ? 'bg-sage-100 text-sage-500' : 'bg-cream-200 text-graphite-700'
                }`}>
                  {m.profissional_id === null ? <Star size={18} /> : m.publico ? <Users size={18} /> : <ClipboardList size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-graphite-900">{m.nome}</p>
                  <p className="text-sm text-graphite-300 line-clamp-2">{m.descricao}</p>
                  <p className="text-xs text-graphite-300 mt-1">{(m.perguntas ?? []).length} perguntas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-graphite-300 mt-6">
        Para enviar um formulário a um paciente específico, acesse o perfil do paciente e abra a aba "Forms".
      </p>

      {modalAberto && (
        <div className="fixed inset-0 bg-graphite-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <h2 className="font-display text-xl">Criar modelo de formulário</h2>
              <button onClick={() => setModalAberto(false)} className="text-graphite-300 hover:text-graphite-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={salvarModelo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-1.5">Nome do modelo</label>
                <input type="text" required value={novoModelo.nome} onChange={e => setNovoModelo({ ...novoModelo, nome: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-1.5">Descrição</label>
                <input type="text" value={novoModelo.descricao} onChange={e => setNovoModelo({ ...novoModelo, descricao: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-1.5">Perguntas</label>
                <div className="space-y-2">
                  {novoModelo.perguntas.map((p, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Pergunta ${idx + 1}`}
                      value={p}
                      onChange={e => updatePergunta(idx, e.target.value)}
                      className="input-field"
                    />
                  ))}
                </div>
                <button type="button" onClick={addPergunta} className="text-sm text-rose-700 hover:underline mt-2">
                  + Adicionar pergunta
                </button>
              </div>
              <button type="submit" className="btn-primary w-full">Salvar modelo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
