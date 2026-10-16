# Deploy na Vercel

O monorepo tem **dois apps**, cada um vira um **projeto** separado na Vercel:

| App | Projeto sugerido | Root Directory | Workspace |
| --- | --- | --- | --- |
| PWA da equipe | `montaje-equipe` | `apps/equipe` | `@montaje/equipe` |
| Painel do cartório | `montaje-cartorio` | `apps/cartorio` | `@montaje/cartorio` |

A configuração de build de cada app já está versionada em `apps/*/vercel.json`
(instalação a partir da raiz, build do workspace, *rewrites* de SPA e headers da PWA).

## Pré-requisitos

- Conta na [Vercel](https://vercel.com).
- O código no **GitHub/GitLab/Bitbucket** (recomendado) ou a Vercel CLI.
- Os valores de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ver `.env.local` na raiz).

## 1) Publicar o repositório no Git

O repositório local já existe. Configure o autor e faça o primeiro commit (o repo ainda não tinha
`user.name`/`user.email`):

```bash
git config user.name  "Seu Nome"
git config user.email "seu@email.com"

git add -A
git commit -m "chore: apps, design system Teams, PWA e config de deploy"

# crie um repositório vazio no GitHub e aponte para ele:
git remote add origin https://github.com/SEU-USUARIO/app.montaje.git
git branch -M main
git push -u origin main
```

## 2) Importar os dois projetos

Para **cada** app, no painel da Vercel: **Add New → Project → importe o repositório**.

### Projeto `montaje-equipe`
- **Project Name:** `montaje-equipe`
- **Root Directory:** `apps/equipe`
- **Include source files outside of the Root Directory in the Build Step:** **ativar** ✅
  (é o que dá acesso a `packages/core` e `packages/ui`)
- **Framework Preset:** Vite (detectado automaticamente)
- **Build / Install / Output:** deixe como está — vêm do `apps/equipe/vercel.json`
- **Environment Variables** (marque Production, Preview e Development):
  - `VITE_SUPABASE_URL` = valor do `.env.local`
  - `VITE_SUPABASE_ANON_KEY` = valor do `.env.local`
- **Deploy**

### Projeto `montaje-cartorio`
Igual, trocando:
- **Project Name:** `montaje-cartorio`
- **Root Directory:** `apps/cartorio`
- As mesmas variáveis de ambiente.

> ⚠️ **A opção "Include source files outside of the Root Directory in the Build Step" é obrigatória**
> nos dois projetos, porque cada app importa os pacotes locais `@montaje/core` e `@montaje/ui`.

## 3) Variáveis de ambiente

São lidas em **tempo de build** (o Vite embute no bundle). Se você trocar depois, é preciso
**redeploy**. Onde pegar os valores: o `.env.local` na raiz do monorepo (ou o painel do Supabase →
*Project Settings → API*).

| Variável | Exemplo |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` |

## 4) Validar

- O app da equipe fica em `https://montaje-equipe.vercel.app`.
- **Deep links** funcionam (ex.: `/locais/<id>`) graças aos *rewrites* de SPA.
- Como o deploy é **HTTPS**, o **botão de instalar a PWA** aparece no celular
  (Chrome/Edge Android) e no desktop.
- No iPhone/iPad, instale por *Compartilhar → Adicionar à Tela de Início*.

## Alternativa: Vercel CLI

Útil para deploys manuais. Depois de criar os projetos pelo painel (passo 2), linke e faça deploy:

```bash
npm i -g vercel
vercel login

# PWA da equipe
npm run deploy -w @montaje/equipe

# painel do cartório
npm run deploy -w @montaje/cartorio
```

Cada script roda `npx vercel --prod` com o diretório de trabalho do respectivo app (a CLI reconhece
o monorepo e respeita a Root Directory configurada). Na primeira vez, responda às perguntas para
linkar ao projeto já existente.

## Observações

- **Supabase Auth (redirects):** o login atual é por **matrícula** (e-mail sintético) e não usa
  confirmação por e-mail, então não há URL de callback para configurar. Se um dia adicionar login
  social, cadastre a URL da Vercel em *Supabase → Authentication → URL Configuration*.
- **Domínio próprio:** pode adicionar em *Project → Settings → Domains*.
- **Cache da PWA:** `sw.js` é servido com `Cache-Control: no-cache` para que as atualizações
  cheguem; os assets com hash têm cache longo.
