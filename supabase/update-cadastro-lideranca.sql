alter table cadastros_apoio
add column if not exists lideranca_nome text;

alter table cadastros_apoio
add column if not exists lideranca_slug text;

alter table cadastros_apoio
add column if not exists cidade_moradia text;

alter table cadastros_apoio
add column if not exists cidade_votacao text;

alter table cadastros_apoio
alter column local_votacao drop not null;

alter table cadastros_apoio
alter column cpf drop not null;

alter table cadastros_apoio
alter column cpf_normalizado drop not null;

drop index if exists unique_cadastro_cpf_por_responsavel;

create index if not exists idx_cadastros_lideranca_nome
on cadastros_apoio(lideranca_nome);

create index if not exists idx_cadastros_lideranca_slug
on cadastros_apoio(lideranca_slug);

create index if not exists idx_cadastros_cidade_moradia
on cadastros_apoio(cidade_moradia);

create index if not exists idx_cadastros_cidade_votacao
on cadastros_apoio(cidade_votacao);
