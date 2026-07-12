create extension if not exists pg_trgm;

create index if not exists idx_responsaveis_ativo
on responsaveis(ativo);

create index if not exists idx_cadastros_criado_em_desc
on cadastros_apoio(criado_em desc);

create index if not exists idx_cadastros_criado_em
on cadastros_apoio(criado_em desc);

create index if not exists idx_cadastros_cidade
on cadastros_apoio(cidade);

create index if not exists idx_cadastros_cidade_criado_em
on cadastros_apoio(cidade, criado_em desc);

create index if not exists idx_cadastros_nome
on cadastros_apoio(nome_completo);

create index if not exists idx_cadastros_nome_trgm
on cadastros_apoio using gin (nome_completo gin_trgm_ops);

create index if not exists idx_cadastros_telefone_normalizado
on cadastros_apoio(telefone_normalizado);

create index if not exists idx_apoios_cadastro_id
on apoios_candidatos(cadastro_id);

create index if not exists idx_apoios_nome_cargo
on apoios_candidatos(nome_pre_candidato, cargo);

create index if not exists idx_pre_candidatos_ordem
on pre_candidatos(ordem);

create index if not exists idx_pre_candidatos_ativo_ordem
on pre_candidatos(ativo, ordem);

create index if not exists idx_admin_users_user_id
on admin_users(user_id);

create index if not exists idx_admin_users_email
on admin_users(email);

create index if not exists idx_admin_users_ativo
on admin_users(ativo);

create index if not exists idx_cadastros_lower_cidade_criado_em
on cadastros_apoio(lower(cidade), criado_em desc);

create or replace function count_distinct_cidades()
returns integer
language sql
stable
as $$
  select count(distinct cidade)::integer
  from cadastros_apoio;
$$;

create or replace function apoios_ranking()
returns table (
  nome_pre_candidato text,
  cargo text,
  total_apoios bigint,
  pre_candidato_id uuid
)
language sql
stable
as $$
  select
    ac.nome_pre_candidato,
    ac.cargo,
    count(*) as total_apoios,
    (array_agg(ac.pre_candidato_id) filter (where ac.pre_candidato_id is not null))[1] as pre_candidato_id
  from apoios_candidatos ac
  group by ac.nome_pre_candidato, ac.cargo
  order by total_apoios desc;
$$;
