# Pre-campanha 2026 - Cadastro de Apoio

Aplicacao front-end criada com Lovable e integrada com Supabase no banco e Vercel API Routes no backend.

## Stack

- Vite
- React 19
- TanStack Router / TanStack Start
- React Hook Form + Zod
- Supabase
- Vercel API Routes

## Instalar dependencias

```bash
npm install
```

## Rodar localmente

```bash
npm run dev
```

O front usa `VITE_API_URL` opcionalmente. Em desenvolvimento local, voce pode deixar vazio para consumir `/api` no mesmo dominio quando estiver rodando em ambiente compativel com as rotas da Vercel.

## Rodar localmente com Vercel Dev

```bash
npx vercel dev
```

Para `vercel dev`:

- deixe `VITE_API_URL=` vazio no `.env.local`
- mantenha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- se voce executar `schema.sql` ou `seed.sql`, reinicie o `vercel dev`
- as rotas devem responder na mesma origem, por exemplo `http://localhost:3000/api/pre-candidatos`

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o arquivo [`supabase/schema.sql`](./supabase/schema.sql).
4. Depois execute [`supabase/seed.sql`](./supabase/seed.sql).

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
- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no client.
- As API Routes usam `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

## Deploy na Vercel

1. Importe o projeto na Vercel.
2. Configure as variaveis acima no painel do projeto.
3. Garanta que `SUPABASE_SERVICE_ROLE_KEY` exista apenas no ambiente do servidor.
4. Faça o deploy.

## Endpoints

- `POST /api/cadastros`
  - Recebe o formulario publico, valida CPF/telefone, verifica duplicidade por CPF e WhatsApp por responsavel, salva no Supabase e registra os apoios selecionados.
- `GET /api/responsaveis/:slug`
  - Valida se o slug do responsavel existe e esta ativo.
- `GET /api/pre-candidatos`
  - Retorna os pre-candidatos ativos ordenados.
- `GET /api/admin/dashboard`
  - Retorna metricas reais do painel administrativo.
- `GET /api/admin/cadastros`
  - Retorna a lista real de cadastros com filtros de busca e cidade.

## Fluxo de banco

- `responsaveis`: identifica o dono do link publico por slug.
- `pre_candidatos`: lista exibida no formulario.
- `cadastros_apoio`: dados pessoais do apoiador.
- `apoios_candidatos`: relacao entre cadastro e pre-candidatos apoiados.

RLS foi habilitado nas tabelas. A leitura publica ficou restrita ao minimo necessario e os inserts de cadastros passam pela API.

## Seguranca

- O front nao envia `service role`.
- O backend usa `SUPABASE_SERVICE_ROLE_KEY` apenas em `api/_lib/supabase.ts`.
- Os endpoints admin ainda precisam de autenticacao real antes de producao.
- Mesmo sem auth implementada agora, o CPF nao e retornado completo nos endpoints admin.

## Build

```bash
npm run build
```
