-- ============================================================
-- CLÍNICA NATALIA VICTORIA - SCHEMA SUPABASE
-- Sistema de gestão clínica (inspirado em Sintropia.psi)
-- ============================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extensão do auth.users do Supabase)
-- ============================================================
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome_completo text not null,
  email text not null,
  telefone text,
  crp text, -- registro profissional
  foto_url text,
  abordagem_terapeutica text, -- ex: TCC, Psicanálise, etc
  cor_tema text default '#D19793', -- rose padrão da paleta
  modo_instagram boolean default false, -- oculta dados sigilosos
  dark_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. PACIENTES
-- ============================================================
create table pacientes (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  nome_completo text not null,
  apelido text,
  email text,
  telefone text,
  cpf text,
  data_nascimento date,
  endereco text,
  contato_emergencia_nome text,
  contato_emergencia_telefone text,
  status text default 'ativo' check (status in ('ativo', 'inativo', 'pausado')),
  observacoes_gerais text,
  foto_url text,
  -- vinculação de casal
  paciente_vinculado_id uuid references pacientes(id),
  -- conexão da área do paciente
  codigo_conexao text,
  codigo_conexao_expira_em timestamptz,
  conectado boolean default false,
  conectado_em timestamptz,
  -- valor padrão da sessão
  valor_sessao_padrao numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_pacientes_profissional on pacientes(profissional_id);
create index idx_pacientes_status on pacientes(status);
create index idx_pacientes_codigo_conexao on pacientes(codigo_conexao);

-- ============================================================
-- 3. AGENDAMENTOS / SESSÕES
-- ============================================================
create table sessoes (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade,
  titulo text, -- usado em bloqueios sem paciente
  data_inicio timestamptz not null,
  data_fim timestamptz not null,
  tipo text default 'presencial' check (tipo in ('presencial', 'online')),
  status text default 'agendada' check (status in ('agendada', 'realizada', 'cancelada', 'faltou', 'bloqueio')),
  cor text default 'lavanda',
  notas text,
  google_meet_link text,
  -- recorrência
  recorrencia_tipo text check (recorrencia_tipo in ('nenhuma', 'semanal', 'quinzenal', 'mensal')),
  recorrencia_fim_data date,
  recorrencia_fim_quantidade integer,
  recorrencia_grupo_id uuid, -- agrupa sessões da mesma recorrência
  -- financeiro
  valor_sessao numeric(10,2),
  pacote_id uuid, -- referência a pacotes (criado abaixo)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sessoes_profissional on sessoes(profissional_id);
create index idx_sessoes_paciente on sessoes(paciente_id);
create index idx_sessoes_data on sessoes(data_inicio);

-- ============================================================
-- 4. PACOTES E CRÉDITOS
-- ============================================================
create table pacotes (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  tipo text default 'sessoes' check (tipo in ('sessoes', 'mensal', 'creditos')),
  nome text not null,
  quantidade_total integer,
  quantidade_usada integer default 0,
  valor_total numeric(10,2),
  data_inicio date,
  data_fim date,
  status text default 'ativo' check (status in ('ativo', 'finalizado', 'cancelado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_pacotes_paciente on pacotes(paciente_id);

alter table sessoes add constraint fk_sessoes_pacote
  foreign key (pacote_id) references pacotes(id) on delete set null;

-- ============================================================
-- 5. FINANCEIRO - PAGAMENTOS
-- ============================================================
create table pagamentos (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  sessao_id uuid references sessoes(id) on delete set null,
  valor numeric(10,2) not null,
  status text default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  metodo_pagamento text check (metodo_pagamento in ('pix', 'cartao', 'dinheiro', 'transferencia', 'outro')),
  data_vencimento date,
  data_pagamento date,
  comprovante_url text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_pagamentos_paciente on pagamentos(paciente_id);
create index idx_pagamentos_status on pagamentos(status);
create index idx_pagamentos_vencimento on pagamentos(data_vencimento);

-- ============================================================
-- 6. FINANCEIRO - DESPESAS DO CONSULTÓRIO
-- ============================================================
create table despesas (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  descricao text not null,
  categoria text,
  valor numeric(10,2) not null,
  data_vencimento date not null,
  data_pagamento date,
  status text default 'pendente' check (status in ('pendente', 'pago', 'atrasado')),
  recorrente boolean default false,
  recorrencia_tipo text check (recorrencia_tipo in ('mensal', 'semanal', 'anual')),
  tags text[],
  comprovante_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_despesas_profissional on despesas(profissional_id);
create index idx_despesas_vencimento on despesas(data_vencimento);

-- ============================================================
-- 7. PRONTUÁRIOS / EVOLUÇÕES
-- ============================================================
create table evolucoes (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  sessao_id uuid references sessoes(id) on delete set null,
  conteudo text, -- HTML do editor rico (Quill/TipTap)
  conteudo_texto_plano text, -- versão simples para busca
  -- IA / transcrição
  transcricao_audio text,
  audio_url text,
  gerado_por_ia boolean default false,
  data_sessao date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_evolucoes_paciente on evolucoes(paciente_id);
create index idx_evolucoes_data on evolucoes(data_sessao);

-- ============================================================
-- 8. FORMS / ANAMNESE - MODELOS
-- ============================================================
create table modelos_formulario (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade, -- null = modelo padrão do sistema
  nome text not null,
  descricao text,
  categoria text default 'geral' check (categoria in ('geral', 'criancas_adolescentes', 'comunidade', 'padrao')),
  perguntas jsonb not null default '[]', -- array de {id, tipo, texto, opcoes}
  publico boolean default false, -- visível na comunidade
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 9. FORMS / ANAMNESE - ENVIOS E RESPOSTAS
-- ============================================================
create table formularios_enviados (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  modelo_id uuid references modelos_formulario(id) on delete set null,
  status text default 'pendente' check (status in ('pendente', 'respondido', 'expirado')),
  link_token text unique,
  respostas jsonb,
  enviado_em timestamptz default now(),
  respondido_em timestamptz,
  expira_em timestamptz
);

create index idx_formularios_paciente on formularios_enviados(paciente_id);
create index idx_formularios_token on formularios_enviados(link_token);

-- ============================================================
-- 10. CARTÃO DIÁRIO / TAREFAS DO PACIENTE
-- ============================================================
create table tarefas_paciente (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete cascade not null,
  titulo text not null,
  descricao text,
  tipo_elemento text default 'checkbox' check (tipo_elemento in ('checkbox', 'escala', 'texto', 'humor')),
  configuracao jsonb default '{}',
  data_referencia date not null default current_date,
  concluida boolean default false,
  resposta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_tarefas_paciente on tarefas_paciente(paciente_id);
create index idx_tarefas_data on tarefas_paciente(data_referencia);

-- ============================================================
-- 11. LUMA - CONVERSAS COM IA (fase 2, mas já estruturado)
-- ============================================================
create table conversas_ia (
  id uuid primary key default uuid_generate_v4(),
  profissional_id uuid references profiles(id) on delete cascade not null,
  paciente_id uuid references pacientes(id) on delete set null,
  titulo text default 'Nova conversa',
  abordagem_terapeutica text,
  arquivada boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table mensagens_ia (
  id uuid primary key default uuid_generate_v4(),
  conversa_id uuid references conversas_ia(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  conteudo text not null,
  created_at timestamptz default now()
);

create index idx_mensagens_conversa on mensagens_ia(conversa_id);

-- ============================================================
-- 12. BLOQUEIOS DE HORÁRIO / FÉRIAS
-- (reutiliza tabela sessoes com status='bloqueio')

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table profiles enable row level security;
alter table pacientes enable row level security;
alter table sessoes enable row level security;
alter table pacotes enable row level security;
alter table pagamentos enable row level security;
alter table despesas enable row level security;
alter table evolucoes enable row level security;
alter table modelos_formulario enable row level security;
alter table formularios_enviados enable row level security;
alter table tarefas_paciente enable row level security;
alter table conversas_ia enable row level security;
alter table mensagens_ia enable row level security;

-- Profiles: usuário só vê/edita o próprio perfil
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- Pacientes: apenas o profissional dono
create policy "pacientes_all_own" on pacientes for all using (auth.uid() = profissional_id);

-- Sessões
create policy "sessoes_all_own" on sessoes for all using (auth.uid() = profissional_id);

-- Pacotes
create policy "pacotes_all_own" on pacotes for all using (auth.uid() = profissional_id);

-- Pagamentos
create policy "pagamentos_all_own" on pagamentos for all using (auth.uid() = profissional_id);

-- Despesas
create policy "despesas_all_own" on despesas for all using (auth.uid() = profissional_id);

-- Evoluções
create policy "evolucoes_all_own" on evolucoes for all using (auth.uid() = profissional_id);

-- Modelos de formulário: próprios + públicos do sistema (profissional_id null) + comunidade
create policy "modelos_select" on modelos_formulario for select
  using (profissional_id is null or profissional_id = auth.uid() or publico = true);
create policy "modelos_all_own" on modelos_formulario for all
  using (profissional_id = auth.uid());

-- Formulários enviados
create policy "formularios_all_own" on formularios_enviados for all using (auth.uid() = profissional_id);

-- Tarefas
create policy "tarefas_all_own" on tarefas_paciente for all using (auth.uid() = profissional_id);

-- IA
create policy "conversas_all_own" on conversas_ia for all using (auth.uid() = profissional_id);
create policy "mensagens_all_own" on mensagens_ia for all
  using (
    conversa_id in (select id from conversas_ia where profissional_id = auth.uid())
  );

-- ============================================================
-- FUNÇÃO: gerar código de conexão do paciente
-- ============================================================
create or replace function gerar_codigo_conexao()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_pacientes_updated before update on pacientes
  for each row execute function set_updated_at();
create trigger trg_sessoes_updated before update on sessoes
  for each row execute function set_updated_at();
create trigger trg_pacotes_updated before update on pacotes
  for each row execute function set_updated_at();
create trigger trg_pagamentos_updated before update on pagamentos
  for each row execute function set_updated_at();
create trigger trg_despesas_updated before update on despesas
  for each row execute function set_updated_at();
create trigger trg_evolucoes_updated before update on evolucoes
  for each row execute function set_updated_at();
create trigger trg_tarefas_updated before update on tarefas_paciente
  for each row execute function set_updated_at();
create trigger trg_conversas_updated before update on conversas_ia
  for each row execute function set_updated_at();

-- ============================================================
-- SEED: Modelos de formulário padrão do sistema
-- ============================================================
insert into modelos_formulario (profissional_id, nome, descricao, categoria, perguntas, publico) values
(null, 'Modelo Padrão - Anamnese Geral', 'Anamnese inicial padrão para novos pacientes', 'padrao',
  '[
    {"id": "q1", "tipo": "texto", "texto": "Qual o motivo que te trouxe à terapia?"},
    {"id": "q2", "tipo": "texto", "texto": "Você já realizou acompanhamento psicológico ou psiquiátrico anteriormente?"},
    {"id": "q3", "tipo": "texto", "texto": "Faz uso de algum medicamento atualmente?"},
    {"id": "q4", "tipo": "escala", "texto": "Como você avalia sua qualidade de sono atualmente?", "opcoes": {"min": 1, "max": 5}},
    {"id": "q5", "tipo": "texto", "texto": "Possui histórico familiar de transtornos psicológicos ou psiquiátricos?"}
  ]'::jsonb, true),
(null, 'Modelo Crianças/Adolescentes', 'Anamnese voltada para atendimento infantojuvenil', 'criancas_adolescentes',
  '[
    {"id": "q1", "tipo": "texto", "texto": "Como é o relacionamento da criança/adolescente com a família?"},
    {"id": "q2", "tipo": "texto", "texto": "Como está o desempenho escolar?"},
    {"id": "q3", "tipo": "texto", "texto": "Houve alguma mudança recente significativa na rotina (mudança de escola, separação dos pais, etc)?"},
    {"id": "q4", "tipo": "escala", "texto": "Como você avalia o humor da criança/adolescente no dia a dia?", "opcoes": {"min": 1, "max": 5}}
  ]'::jsonb, true);
