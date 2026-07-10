create extension if not exists pgcrypto;

create table if not exists responsaveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  telefone text,
  cidade_base text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index if not exists idx_responsaveis_slug on responsaveis(slug);

create table if not exists pre_candidatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text not null,
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create index if not exists idx_pre_candidatos_ativo on pre_candidatos(ativo);
create index if not exists idx_pre_candidatos_ordem on pre_candidatos(ordem);

create table if not exists cadastros_apoio (
  id uuid primary key default gen_random_uuid(),
  responsavel_id uuid not null references responsaveis(id),
  nome_completo text not null,
  telefone text not null,
  telefone_normalizado text not null,
  cpf text not null,
  cpf_normalizado text not null,
  cidade text not null,
  bairro text not null,
  rua_numero text not null,
  local_votacao text not null,
  observacoes text,
  ip_origem text,
  user_agent text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_cadastros_responsavel on cadastros_apoio(responsavel_id);
create index if not exists idx_cadastros_cidade on cadastros_apoio(cidade);
create index if not exists idx_cadastros_criado_em on cadastros_apoio(criado_em);
create index if not exists idx_cadastros_cpf on cadastros_apoio(cpf_normalizado);
create index if not exists idx_cadastros_telefone on cadastros_apoio(telefone_normalizado);

create unique index if not exists unique_cadastro_cpf_por_responsavel
  on cadastros_apoio(responsavel_id, cpf_normalizado);

create unique index if not exists unique_cadastro_telefone_por_responsavel
  on cadastros_apoio(responsavel_id, telefone_normalizado);

create table if not exists apoios_candidatos (
  id uuid primary key default gen_random_uuid(),
  cadastro_id uuid not null references cadastros_apoio(id) on delete cascade,
  pre_candidato_id uuid references pre_candidatos(id),
  cargo text not null,
  nome_pre_candidato text not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_apoios_cadastro on apoios_candidatos(cadastro_id);
create index if not exists idx_apoios_pre_candidato on apoios_candidatos(pre_candidato_id);

alter table responsaveis enable row level security;
alter table pre_candidatos enable row level security;
alter table cadastros_apoio enable row level security;
alter table apoios_candidatos enable row level security;

drop policy if exists "responsaveis_public_read" on responsaveis;
create policy "responsaveis_public_read"
  on responsaveis
  for select
  using (ativo = true);

drop policy if exists "pre_candidatos_public_read" on pre_candidatos;
create policy "pre_candidatos_public_read"
  on pre_candidatos
  for select
  using (ativo = true);
