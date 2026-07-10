-- 1. Primeiro crie o usuario no Supabase Auth pelo painel:
-- Authentication > Users > Add user

-- 2. Copie o UUID do usuario criado.

-- 3. Depois rode:
insert into admin_users (user_id, email, nome, role, ativo)
values (
  'COLE_AQUI_O_UUID_DO_USUARIO_AUTH',
  'SEU_EMAIL_ADMIN_AQUI',
  'Administrador',
  'super_admin',
  true
)
on conflict (email) do update set
  user_id = excluded.user_id,
  nome = excluded.nome,
  role = excluded.role,
  ativo = excluded.ativo;
