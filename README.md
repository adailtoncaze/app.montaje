# MontaJE — Padronização das Seções Eleitorais

Monorepo do **MontaJE** (versão 1.1 / 2º turno das Eleições Gerais de 2026).
Substitui o app MontaJE anterior como aplicação nova, sem migração de dados.

## Estrutura

```
app.montaje/
├─ apps/
│  ├─ equipe/      # PWA da equipe de montagem (mobile)
│  └─ cartorio/    # Painel do cartório (web/desktop)
├─ packages/
│  ├─ core/        # Contrato compartilhado: tipos, enums, schemas zod, regras
│  └─ ui/          # Design system (Fluent 2 / Teams): tema + componentes
├─ supabase/
│  ├─ migrations/  # SQL: enums, tabelas, funções/triggers, RLS, storage, seed
│  └─ seed.sql
└─ docs/           # Planos de desenvolvimento
```

## Requisitos

- Node.js >= 20 (testado no 24)
- npm >= 10 (workspaces)
- Supabase CLI (opcional, para rodar o banco local): `npm i -g supabase`

## Primeiros passos

```bash
npm install                 # instala todos os workspaces
cp .env.example .env.local  # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

npm run dev:equipe          # PWA da equipe (mobile)
npm run dev:cartorio        # painel do cartório
npm run typecheck           # checagem de tipos em todos os workspaces
```

> O `.env` / `.env.local` fica na **raiz** do monorepo. Os apps estão configurados com
> `envDir` apontando para a raiz, então ambos leem o mesmo arquivo. Ao alterar o `.env`,
> reinicie o servidor (`Ctrl+C` e subir de novo).

## Banco de dados (Supabase)

O projeto usa o **Supabase hospedado** (plano gratuito, região São Paulo). Não é necessário
Docker. As migrations ficam em `supabase/migrations`.

```bash
# 1) autenticar na CLI (abre o navegador) — só uma vez
supabase login

# 2) vincular ao projeto hospedado (peça o project-ref e a senha do banco no painel)
supabase link --project-ref SEU_PROJECT_REF

# 3) conferir o que será aplicado e depois aplicar
npm run supabase:push:dry
npm run supabase:push

# 4) gerar os tipos do banco (opcional; NÃO sobrescreve os tipos de domínio)
npm run supabase:types
```

> `supabase start` (banco local) exige Docker e **não** é necessário neste projeto.
> Os tipos de domínio continuam em `packages/core/src/database.types.ts`; o arquivo
> gerado é separado (`database.generated.ts`) para tipos do client Supabase.

### Cenário de teste

`supabase/teste_campo.sql` cria dados de teste (1 equipe com o admin, 1 local, 2 seções e
cronograma dos dois dias). Cole no **SQL Editor** do painel para poder usar o app.

As migrations, em ordem:

1. `0001_extensions_e_enums.sql` — extensões e tipos (`papel_usuario`, `status_etapa`, ...)
2. `0002_tabelas.sql` — as 13 tabelas do modelo de dados
3. `0003_funcoes_e_triggers.sql` — helpers de autorização, materialização do checklist, máquina de status, sigilo
4. `0004_rls.sql` — Row Level Security por perfil
5. `0005_storage.sql` — bucket privado `evidencias` + políticas
6. `0006_seed_checklist_modelo.sql` — checklist modelo (4 fotos + confirmações)
7. `0007_usuario_perfil.sql` — cria `perfis` automaticamente ao criar usuário em `auth.users`
8. `0008_rpc_materializar.sql` — RPC que garante os itens do checklist por seção

## Contrato congelado (Sprint 0)

O `packages/core` é a **fonte única** das regras usadas pelo app e pelo painel:
status de etapa, sigilo eliminatório, caminhos do Storage e schemas de validação.
Detalhes em [`docs/PLANO-sprint0-contrato.md`](docs/PLANO-sprint0-contrato.md).

## Design system (Microsoft Teams)

O visual dos dois apps segue as **cores do design system do Microsoft Teams** (tema claro), com a cor
de marca roxa **`#5B5FC7`** aplicada no `theme-color`, no painel e no ícone/manifesto do app da equipe.
Cada app usa sua própria stack de UI:

- **App da equipe (`apps/equipe`) — Fluent UI React v9 (Fluent 2)**:
  - `packages/ui` expõe o provedor de tema e os componentes reutilizáveis:
    - `ProvedorMontaje` — `FluentProvider` com o tema do Teams (`teamsLightTheme` / `teamsDarkTheme`) e o hook `useTema`.
    - `Botao`, `Campo`, `Cartao`, `Medalhao`, `Selo`, `Aviso`, `EstadoVazio`, `CabecalhoApp`, `BarraProgresso`.
  - **Responsividade** para **celular e tablet**. Pontos de quebra em `@montaje/ui`
    (`pontoTablet` 720px, `pontoDesktop` 1080px, `pontoAmplo` 1440px) usados via `@media` nas `makeStyles`
    (listas: 1 coluna no celular → 2 a partir de 720px → 3 a partir de 1080px).
  - **Tokens** (cores, tipografia, espaçamento, raio, sombra) vêm de `@fluentui/react-components`
    (`tokens`) via `makeStyles`. Sem CSS utilitário. Ícones de `@fluentui/react-icons`.
  - A árvore é envolvida por `<ProvedorMontaje>` (ver `apps/equipe/src/main.tsx`).
- **Painel do cartório (`apps/cartorio`) — shadcn/ui + Tailwind CSS v4**:
  - Os utilitários do shadcn (`bg-background`, `bg-primary`, `border-border`, …) são mapeados para os
    **tokens de cor do Teams** em `apps/cartorio/src/styles/index.css` (bloco `@theme inline`).
  - Componentes em `apps/cartorio/src/components/ui` (Button, Card, Badge, Select, Tabs, …).
  - Ícones de `lucide-react`. Não usa `@montaje/ui` nem Fluent.

> O **app da equipe** segue em Fluent UI + `@montaje/ui` (sem CSS utilitário). O **painel do cartório**
> usa shadcn/ui + Tailwind v4 com os tokens do Teams — não misture as duas stacks dentro do mesmo app.

## Fluxo de campo (app da equipe)

Navegação: **Meus locais → Local → Seções do local → Etapa**. O checklist é preenchido por
etapa, com fotos e confirmações, tudo **offline** (IndexedDB é a fonte da verdade).

- **Checklist da etapa** (`src/features/secoes/ChecklistEtapa.tsx`): lista os itens da etapa
  (fotos e confirmações), com barra de progresso e status. A **Etapa 2** só abre depois da
  aprovação da Etapa 1; caso contrário mostra o motivo do bloqueio.
- **Fotos** (`ItemFoto.tsx`): a foto é tirada **na hora** pela câmera do app (com fallback para
  `<input capture="environment">`), com aviso **"Não fotografe pessoas"** e opção de
  **Refazer/Remover** antes do envio. A câmera **exige o aparelho na horizontal**: em pé o disparo
  fica travado (com aviso de girar e um atalho de emergência), e fotos verticais vêm da galeria caem
  no aviso de qualidade (`vertical`). Guarda data/hora e, quando disponível, a **geolocalização**
  (até 8s; se falhar, a foto é salva mesmo assim).
- **Compressão** (`src/features/midia/compressao.ts`): imagem principal em até **1920px**,
  **JPEG ~80%** e alvo de **≤600KB** (piso de qualidade 50% — prioriza detalhe da evidência),
  mais uma **miniatura de 320px**. A recompressão também
  remove o EXIF. A biblioteca de compressão é carregada **sob demanda** (só ao tirar a primeira
  foto), para não pesar no primeiro acesso pelo celular.
- **Confirmações** (`ItemConfirmacao.tsx`): **Sim/Não** + observação opcional. Responder move a
  seção de `pendente` para `em_montagem`.
- **Desvio** (APP-22, em `ItemConfirmacao.tsx`): ao responder **Não**, o app permite registrar o
  **motivo** (espaço insuficiente, estrutura do local, mobiliário ou outro) + observação —
  obrigatória quando o motivo for "Outro". Voltar a resposta para "Sim" remove o desvio.
- **Resumo e envio** (`ResumoEtapa.tsx`): o envio da etapa fica **bloqueado** enquanto houver
  fotos ou confirmações pendentes (lista o que falta). Mostra o comentário quando o cartório
  pede **correção** e permite reenviar.
- **Referência da Etapa 1** (APP-20, `ReferenciaEtapa1.tsx`): na Etapa 2, mostra as fotos da
  Etapa 1 para comparação antes de registrar a foto 4.
- Cada foto/registro vira uma linha local com **UUID gerado no aparelho** (idempotência do sync) e
  entra na **fila de envio** (outbox). O envio em si é dos tickets APP-23/24.

## Instalação (PWA)

O app da equipe é uma PWA (`vite-plugin-pwa`, service worker com *auto update*) e agora tem um
**fluxo de instalação** próprio:

- `src/features/pwa/useInstalarPWA.ts` — hook que captura o `beforeinstallprompt`
  (Chrome/Edge no **desktop** e **Android**), detecta o modo instalado e o iOS.
- `CartaoInstalar` (em **Ajustes**) — botão **Instalar o app**; no iPhone/iPad mostra as
  instruções (*Compartilhar → Adicionar à Tela de Início*).
- `FaixaInstalar` — convite dispensável no topo da lista de locais, enquanto o app não estiver
  instalado.

### Ícones

O Chrome exige ícones **PNG 192×192 e 512×512** no manifest. Ícones apenas em SVG são lidos como
`0x0` e **não** habilitam a instalação. Eles são gerados a partir de `apps/equipe/public/icone.svg`:

- `pwa-192x192.png`, `pwa-512x512.png`, `pwa-64x64.png`
- `maskable-icon-512x512.png` (zona segura do Android)
- `apple-touch-icon-180x180.png` (iOS)

Para regerar (se o ícone mudar):

```bash
npm run gerar-icones -w @montaje/equipe
```

### Como testar a instalação

O prompt só aparece em **contexto seguro (HTTPS)** ou em **localhost**:

- **Desktop:** `npm run build -w @montaje/equipe` e depois `npm run preview -w @montaje/equipe`.
  Em `http://localhost:4173`, o Chrome/Edge mostra o ícone de instalação na barra de endereço.
- **Celular/tablet:** é preciso **HTTPS** — use o **deploy na Vercel** ou um túnel
  (ex.: `cloudflared tunnel --url http://localhost:4173`). Abrir por `http://10.0.0.x` **não**
  mostra o prompt: sem contexto seguro o service worker não registra.

> O service worker fica desativado no `vite dev` (`devOptions.enabled = false`). Para validar o
> fluxo de instalação, use o build de produção (`preview`) ou o deploy.

## Deploy (Vercel)

Cada app vira um projeto na Vercel (Root Directory `apps/equipe` e `apps/cartorio`). A configuração
de build já está versionada em `apps/*/vercel.json`. Passo a passo completo (incluindo variáveis de
ambiente e a opção obrigatória de monorepo) em
[`docs/DEPLOY-vercel.md`](docs/DEPLOY-vercel.md).

```bash
# depois de linkar os projetos (veja o guia)
npm run deploy:equipe     # PWA da equipe
npm run deploy:cartorio   # painel do cartório
```

## Documentação

- [`docs/PLANO-app-equipe.md`](docs/PLANO-app-equipe.md) — plano e backlog do app mobile
- [`docs/PLANO-sprint0-contrato.md`](docs/PLANO-sprint0-contrato.md) — schema, RLS e regras
- [`docs/DEPLOY-vercel.md`](docs/DEPLOY-vercel.md) — deploy dos apps na Vercel
