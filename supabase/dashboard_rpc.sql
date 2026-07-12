create or replace function get_admin_dashboard_metrics(p_start_of_day timestamptz)
returns table (
  total_cadastros bigint,
  cadastros_hoje bigint,
  total_cidades bigint,
  total_apoios bigint,
  responsaveis_ativos bigint,
  pre_candidatos_ativos bigint,
  pre_candidatos_inativos bigint
)
language sql
stable
as $$
  select
    (select count(*) from cadastros_apoio) as total_cadastros,
    (select count(*) from cadastros_apoio where criado_em >= p_start_of_day) as cadastros_hoje,
    (select count(distinct cidade) from cadastros_apoio) as total_cidades,
    (select count(*) from apoios_candidatos) as total_apoios,
    (select count(*) from responsaveis where ativo = true) as responsaveis_ativos,
    (select count(*) from pre_candidatos where ativo = true) as pre_candidatos_ativos,
    (select count(*) from pre_candidatos where ativo = false) as pre_candidatos_inativos;
$$;
