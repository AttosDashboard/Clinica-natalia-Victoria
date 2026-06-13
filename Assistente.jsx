import { Sparkles, Lock } from 'lucide-react'

export default function Assistente() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-graphite-900">Assistente IA</h1>
        <p className="text-graphite-500 mt-1">Chat clínico com contexto do paciente e supervisão</p>
      </div>

      <div className="card text-center py-16">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles size={28} className="text-rose-500" />
        </div>
        <h2 className="font-display text-2xl mb-2">Chegando na fase 2</h2>
        <p className="text-graphite-500 max-w-md mx-auto mb-1">
          O assistente de IA com contexto clínico, escolha de abordagem terapêutica e
          histórico de conversas está planejado para a próxima etapa do desenvolvimento.
        </p>
        <p className="text-sm text-graphite-300 flex items-center justify-center gap-1.5 mt-4">
          <Lock size={14} />
          Estrutura de banco de dados já preparada para esta funcionalidade
        </p>
      </div>
    </div>
  )
}
