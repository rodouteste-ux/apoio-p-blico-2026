# Pre-campanha 2026 - Cadastro de Apoio

Aplicacao front-end integrada com Supabase no banco e Vercel API Routes no backend.

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

Configure estas variaveis localmente e na Vercel:

```env
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEFAULT_RESPONSAVEL_ID=
```

Explicacao:

- `VITE_*` sao expostas ao front-end.
- `SUPABASE_SERVICE_ROLE_KEY` e somente backend.
- `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o front-end.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve usar prefixo `VITE_`.
- `.env.local` nunca deve ser commitado.
- `DEFAULT_RESPONSAVEL_ID` e opcional. Se ficar vazio, o backend usa o primeiro responsavel ativo.

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
5. Execute [`supabase/performance.sql`](./supabase/performance.sql) para garantir os indices de busca, paginacao e auth.
6. Execute [`supabase/dashboard_rpc.sql`](./supabase/dashboard_rpc.sql) para reduzir as chamadas do dashboard admin.
7. Execute [`supabase/update-cadastro-lideranca.sql`](./supabase/update-cadastro-lideranca.sql) para habilitar lideranca, cidade de moradia e local de votacao opcional.
8. Crie o usuario admin em `Authentication > Users`.
9. Execute [`supabase/admin-example.sql`](./supabase/admin-example.sql) preenchendo o UUID e o e-mail corretos.
10. Para diagnosticar producao, execute [`supabase/check-production.sql`](./supabase/check-production.sql).

O banco precisa ter:

- pelo menos 1 registro ativo em `responsaveis`
- pelo menos 1 registro ativo em `pre_candidatos`
- um registro em `admin_users` com `user_id` igual ao UUID do usuario em Supabase Auth
- `admin_users.ativo = true` para liberar o painel

Se alguma tabela nao existir, rode novamente:

1. [`supabase/schema.sql`](./supabase/schema.sql)
2. [`supabase/seed.sql`](./supabase/seed.sql)
3. [`supabase/performance.sql`](./supabase/performance.sql)
4. [`supabase/dashboard_rpc.sql`](./supabase/dashboard_rpc.sql)
5. [`supabase/update-cadastro-lideranca.sql`](./supabase/update-cadastro-lideranca.sql)

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

- `GET /api/cadastro-publico`
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
- filtro por `cidade`, `cidade_moradia` e `lideranca_slug`
- busca por `nome_completo`
- busca por `telefone_normalizado`
- carregamento de apoios por `cadastro_id`
- listagem de pre-candidatos por `ativo` e `ordem`
- lookup administrativo por `user_id`, `email` e `ativo`

Se o banco ja existe, rode [`supabase/performance.sql`](./supabase/performance.sql) no SQL Editor do Supabase. O arquivo usa `create index if not exists`, entao pode ser executado sem recriar tabelas. Rode tambem [`supabase/dashboard_rpc.sql`](./supabase/dashboard_rpc.sql) para habilitar a RPC `get_admin_dashboard_metrics`; se ela nao existir, a API usa fallback automatico.

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
4. Confira `http://localhost:3000/api/cadastro-publico`.
   - deve retornar `{ "ativo": true, "pre_candidatos": [...] }`
   - esta e a chamada usada pelo formulario publico
5. Confira `http://localhost:3000/api/cadastro-config`.
   - deve retornar `{ "ativo": true }` se houver responsavel interno ativo
6. Confira `http://localhost:3000/api/pre-candidatos`.
   - deve retornar apenas candidatos ativos, ordenados por `ordem`
7. Envie um cadastro real sem CPF.
8. Confirme que `lideranca_nome` e obrigatorio no formulario.
9. Confirme que `local_votacao` pode ficar vazio.
10. Se repetir WhatsApp para o mesmo responsavel, a API deve retornar:

```json
{
  "error": "Este telefone ja foi cadastrado anteriormente."
}
```

## Como testar o admin

1. Rode `npx vercel dev`.
2. Abra `http://localhost:3000/login`.
3. Tente um login com senha errada.
4. A tela deve mostrar `E-mail ou senha inválidos, ou usuário não confirmado.`.
5. Tente um usuario nao confirmado.
6. A tela deve mostrar `E-mail ou senha inválidos, ou usuário não confirmado.`.
7. Entre com o usuario criado no Supabase Auth.
8. Se o usuario nao estiver em `admin_users`, o acesso deve ser negado.
9. Abra `http://localhost:3000/admin`.
10. Abra `http://localhost:3000/admin/cadastros`.
    - a lista deve abrir com paginacao real
    - a busca deve usar debounce
    - CPF nao deve aparecer
    - o filtro por lideranca deve funcionar
    - o ranking "Cadastros por lideranca" deve aparecer
    - erro deve exibir mensagem amigavel e botao de tentar novamente
11. Abra `http://localhost:3000/admin/pre-candidatos`.
    - deve listar ativos e inativos
    - deve permitir criar, editar, ativar, desativar e alterar ordem
12. Chame `http://localhost:3000/api/admin/me` sem token.
    - deve retornar `401` com `Token ausente.`
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

## Deploy Vercel

Configure na Vercel exatamente com estes nomes:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEFAULT_RESPONSAVEL_ID`

Valores esperados:

- `VITE_API_URL`: normalmente vazio, para usar a mesma origem do site
- `VITE_SUPABASE_URL`: Project URL do Supabase
- `SUPABASE_URL`: o mesmo Project URL do Supabase
- `VITE_SUPABASE_ANON_KEY`: Publishable key / anon key do Supabase
- `SUPABASE_ANON_KEY`: a mesma Publishable key / anon key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role secret do Supabase
- `DEFAULT_RESPONSAVEL_ID`: id da tabela `responsaveis`; se vazio, usa o primeiro responsavel ativo

Mantenha `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente do servidor.

## Dominio e preview do WhatsApp

As metatags Open Graph e Twitter Card apontam para `https://cadastro-apoio-2026.vercel.app/og-image.png`.
O favicon usa os arquivos `public/favicon.svg`, `public/favicon.ico` e `public/apple-touch-icon.png`, todos com tema Brasil.

Para mudar o dominio na Vercel:

1. Ir em Vercel > Project > Settings > Domains.
2. Adicionar dominio personalizado.
3. Exemplos: `cadastroapoio2026.com.br`, `apoio2026.com.br`, `pre2026.com.br`.
4. Configurar o DNS conforme a Vercel pedir.
5. Depois atualizar `og:url` e `og:image` em `src/routes/__root.tsx` para a URL absoluta do dominio final.

O nome do projeto pode ser ajustado em Vercel > Project Settings > General > Project Name.
O dominio `.vercel.app` depende de disponibilidade; para uma apresentacao mais profissional, use um dominio comprado.
O WhatsApp pode manter preview antigo em cache por algum tempo. Para testar a atualizacao, envie `https://cadastro-apoio-2026.vercel.app/?v=3` ou aguarde o cache atualizar.

Cuidados importantes:

- Marque as variaveis para `Production` e tambem para `Preview` se estiver testando URLs de preview.
- Depois de alterar variaveis na Vercel, faca Redeploy.
- Nao crie variaveis com nomes como `API URL` ou `Publishable key`; os nomes precisam ser exatamente os esperados pelo codigo.
- Nao use `VITE_` na service role.
- Se `/api/cadastro-publico` retornar `Configuração do servidor incompleta.`, confira a lista `missing` no JSON.
- Se `/api/cadastro-publico` retornar `Nenhum responsável ativo configurado.`, confira `responsaveis` no Supabase.
- Se `/api/admin/me` retornar `Usuário sem permissão administrativa.`, confira `admin_users.user_id`.

## Build

```bash
npm run build
```
