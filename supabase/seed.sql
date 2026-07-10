insert into responsaveis (nome, slug, cidade_base, ativo)
values ('Djavan Damasceno Xavier', 'djavan-damasceno-xavier', 'Tobias Barreto', true)
on conflict (slug) do update
set nome = excluded.nome,
    cidade_base = excluded.cidade_base,
    ativo = excluded.ativo;

insert into pre_candidatos (nome, cargo, ativo, ordem)
select 'Valmir de Francisquinho', 'Governador do Estado', true, 1
where not exists (
  select 1 from pre_candidatos where nome = 'Valmir de Francisquinho' and cargo = 'Governador do Estado'
);

insert into pre_candidatos (nome, cargo, ativo, ordem)
select 'Nome do candidato', 'Primeiro Senador', true, 2
where not exists (
  select 1 from pre_candidatos where nome = 'Nome do candidato' and cargo = 'Primeiro Senador'
);

insert into pre_candidatos (nome, cargo, ativo, ordem)
select 'Nome do candidato', 'Segundo Senador', true, 3
where not exists (
  select 1 from pre_candidatos where nome = 'Nome do candidato' and cargo = 'Segundo Senador'
);

insert into pre_candidatos (nome, cargo, ativo, ordem)
select 'Nome do candidato', 'Deputado Federal', true, 4
where not exists (
  select 1 from pre_candidatos where nome = 'Nome do candidato' and cargo = 'Deputado Federal'
);

insert into pre_candidatos (nome, cargo, ativo, ordem)
select 'Nome do candidato', 'Deputado Estadual', true, 5
where not exists (
  select 1 from pre_candidatos where nome = 'Nome do candidato' and cargo = 'Deputado Estadual'
);

-- Exemplo para liberar um usuario no painel admin depois de cria-lo no Supabase Auth:
-- Veja tambem o arquivo supabase/admin-example.sql
-- insert into admin_users (user_id, email, nome, role, ativo)
-- values (
--   'UUID_DO_USUARIO_AUTH',
--   'admin@exemplo.com',
--   'Administrador',
--   'super_admin',
--   true
-- );
