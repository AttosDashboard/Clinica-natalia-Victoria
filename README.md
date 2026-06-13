# Clínica Natalia Victoria — Sistema de Gestão Clínica

Sistema de gestão para psicólogos, inspirado no Sintropia.psi. Construído com React + Vite + Supabase + Tailwind v4.

## Status atual (Fase 1)

✅ Autenticação (login/cadastro)
✅ Dashboard ("Ritmo da clínica")
✅ Módulo de Pacientes (cadastro, busca, perfil completo)
✅ Agenda (FullCalendar - sessões, bloqueios, recorrência básica)
✅ Financeiro (cobranças por paciente, despesas, central financeira)
✅ Prontuários/Evoluções (registro de notas por sessão)
✅ Forms e Anamnese (modelos + envio + acompanhamento)
✅ Conexão com área do paciente (geração de código)
⏳ Assistente IA "LUMA" — estrutura de banco pronta, interface fase 2

## Identidade visual

Paleta bege/cinza/rose (cream, rose, sage, graphite), tipografia serifada
(Cormorant Garamond) para títulos + sans-serif para corpo.

## Setup

### 1. Criar projeto no Supabase

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/schema.sql`
   (cria todas as tabelas, RLS, triggers e modelos padrão de formulário)
3. Em **Settings > API**, copie a `URL` e a `anon public key`

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

### 4. Build de produção

```bash
npm run build
```

O output vai para `dist/`. Pode ser hospedado no Vercel, Netlify, etc
(mesmo fluxo que o Attos Assessoria).

## Estrutura

```
src/
  contexts/AuthContext.jsx   - autenticação Supabase
  lib/supabase.js            - cliente Supabase
  components/layout/         - sidebar e layout geral
  pages/
    Login.jsx
    Dashboard.jsx
    Pacientes.jsx            - listagem
    PacienteDetalhe.jsx       - cadastro + abas (sessões, financeiro,
                                prontuário, forms, conexão)
    Agenda.jsx                - FullCalendar
    Financeiro.jsx            - central financeira
    Prontuarios.jsx           - visão geral de evoluções
    Formularios.jsx           - modelos de anamnese
    Assistente.jsx            - placeholder LUMA (fase 2)
supabase/
  schema.sql                  - schema completo do banco
```

## Fase 2 (próximos passos)

- Assistente IA (LUMA): chat com contexto do paciente, escolha de
  abordagem terapêutica, histórico de conversas (tabelas conversas_ia
  e mensagens_ia já criadas)
- Editor de texto rico para prontuários (TipTap)
- Transcrição de áudio das sessões + evolução gerada por IA
- Portal do paciente (rota separada /paciente, usando codigo_conexao)
- Cartão Diário (tarefas do paciente) - tabela tarefas_paciente já criada
- Integração Google Calendar / Google Meet
- Lembretes via WhatsApp
- Gestão de pacotes/créditos (tabela pacotes já criada, falta UI)
- Recorrência completa de sessões (criação em lote)
