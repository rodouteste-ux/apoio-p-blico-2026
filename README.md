# Pre-campanha 2026 - Cadastro de Apoio

Aplicacao front-end criada com Lovable e integrada com Supabase no banco e Vercel API Routes no backend.

## Stack

- Vite
- React 19
- TanStack Router / TanStack Start
- React Hook Form + Zod
- Supabase Auth + Supabase Database
- Vercel API Routes

## Instalar dependencias

```bash
npm install
```

## Variaveis de ambiente

Use o arquivo `.env.example` como base:

```env
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Explicacao:

- `VITE_*` sao expostas ao front-end.
- `SUPABASE_SERVICE_ROLE_KEY` e somente backend.
- `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o front-end.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve usar prefixo `VITE_`.
- `.env.local` nunca deve ser commitado.

## Rodar localmente

`npm run dev` sobe apenas o front-end.

```bash
npm run dev
```

Para testar front-end + API routes use `vercel dev`:

```bash
npx vercel dev
```

Para `vercel dev`:

- deixe `VITE_API_URL=` vazio
- mantenha `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- se executar `schema.sql`, `seed.sql` ou `admin-example.sql`, reinicie o `vercel dev`
- as rotas devem responder na mesma origem, por exemplo `http://localhost:3000/api/pre-candidatos`

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute [`supabase/schema.sql`](./supabase/schema.sql).
4. Depois execute [`supabase/seed.sql`](./supabase/seed.sql).
5. Crie o usuario admin em `Authentication > Users`.
6. Execute [`supabase/admin-example.sql`](./supabase/admin-example.sql) preenchendo o UUID e o e-mail corretos.

## Estrutura principal

- Rota publica do formulario: `/cadastro`
- O slug do responsavel nao aparece mais na URL publica.
- O responsavel e resolvido internamente no backend.
- Rota de login admin: `/login`
- Rotas protegidas do painel:
  - `/admin`
  - `/admin/cadastros`
  - `/admin/pre-candidatos`

## Endpoints principais

Publicos:

- `GET /api/cadastro-config`
- `GET /api/responsaveis/:slug`
- `GET /api/pre-candidatos`
- `POST /api/cadastros`

Protegidos:

- `GET /api/admin/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/cadastros`
- `GET /api/admin/pre-candidatos`
- `POST /api/admin/pre-candidatos`
- `PUT /api/admin/pre-candidatos/:id`
- `PATCH /api/admin/pre-candidatos/:id/status`
- `PATCH /api/admin/pre-candidatos/:id/ordem`

## Banco de dados

Tabelas principais:

- `responsaveis`
- `pre_candidatos`
- `cadastros_apoio`
- `apoios_candidatos`
- `admin_users`

O schema inclui indices para melhorar performance de:

- paginacao por `criado_em`
- filtro por `cidade`
- busca por `nome_completo`
- busca por `telefone_normalizado`
- carregamento de apoios por `cadastro_id`
- listagem de pre-candidatos por `ativo` e `ordem`
- lookup administrativo por `user_id`, `email` e `ativo`

## Como criar usuario admin

1. No Supabase, abra `Authentication > Users`.
2. Crie o usuario administrativo com e-mail e senha.
3. Copie o `user_id` gerado no Auth.
4. Execute no SQL Editor o arquivo [`supabase/admin-example.sql`](./supabase/admin-example.sql) ou rode:

```sql
insert into admin_users (user_id, email, nome, role, ativo)
values (
  'UUID_DO_USUARIO_AUTH',
  'admin@exemplo.com',
  'Administrador',
  'super_admin',
  true
)
on conflict (email) do update set
  user_id = excluded.user_id,
  nome = excluded.nome,
  role = excluded.role,
  ativo = excluded.ativo;
```

Roles previstas:

- `super_admin`
- `admin`
- `visualizador`

Somente usuarios com `ativo = true` podem acessar o painel.

Fluxo esperado do login admin:

1. O front autentica com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. O `access_token` retornado pelo Supabase e enviado para `GET /api/admin/me`.
3. O backend valida o token com `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
4. O backend consulta `admin_users` com `SUPABASE_SERVICE_ROLE_KEY`.
5. Se `admin_users.ativo = true`, o painel e liberado.

## Como testar o formulario publico

1. Rode `npx vercel dev`.
2. Abra `http://localhost:3000/cadastro`.
3. Verifique se o carregamento e rapido.
4. Confira `http://localhost:3000/api/cadastro-config`.
   - deve retornar `{ "ativo": true }` se houver responsavel interno ativo
5. Confira `http://localhost:3000/api/pre-candidatos`.
   - deve retornar apenas candidatos ativos, ordenados por `ordem`
6. Envie um cadastro real.
7. Se repetir CPF ou WhatsApp para o mesmo responsavel, a API deve retornar:

```json
{
  "error": "Este cadastro ja foi registrado anteriormente."
}
```

## Como testar o admin

1. Rode `npx vercel dev`.
2. Abra `http://localhost:3000/login`.
3. Tente um login com senha errada.
4. A tela deve mostrar `E-mail ou senha invalidos.`.
5. Tente um usuario nao confirmado.
6. A tela deve mostrar `Confirme seu e-mail antes de acessar.`.
7. Entre com o usuario criado no Supabase Auth.
8. Se o usuario nao estiver em `admin_users`, o acesso deve ser negado.
9. Abra `http://localhost:3000/admin`.
10. Abra `http://localhost:3000/admin/cadastros`.
    - a lista deve abrir com paginacao real
    - a busca deve usar debounce
    - erro deve exibir mensagem amigavel e botao de tentar novamente
11. Abra `http://localhost:3000/admin/pre-candidatos`.
    - deve listar ativos e inativos
    - deve permitir criar, editar, ativar, desativar e alterar ordem
12. Chame `http://localhost:3000/api/admin/me` sem token.
    - deve retornar `401` com `Token de autenticacao nao informado.`
13. Chame `http://localhost:3000/api/admin/me` com token valido.
    - deve retornar o objeto `user`

## Como testar pre-candidatos refletindo no formulario

1. No painel admin, abra `/admin/pre-candidatos`.
2. Desative um candidato.
3. Reabra `/cadastro`.
4. O candidato desativado nao deve aparecer.
5. Edite nome ou cargo de um candidato.
6. Reabra `/cadastro`.
7. As alteracoes devem aparecer no formulario.

## Deploy na Vercel

Configure na Vercel:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Mantenha `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente do servidor.

## Build

```bash
npm run build
```
