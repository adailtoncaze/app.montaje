# Plano de Desenvolvimento — App da Equipe de Montagem (MontaJE · PWA)

Backlog por dia, derivado do PRD v1.1. Alvo: campo em 23/10 (Etapa 1) e 24/10 (Etapa 2);
teste em campo em 21/10; freeze do app em 22/10.

## Premissas

- Hoje: 16/10/2026. ~5 dias úteis de build até o teste.
- Meta: preencher uma seção em até 10 min, 100% offline em campo, sem perda de dados.
- Regra de corte: exportações/filtros do painel são descartáveis; o app não é.

## Stack

React 18 + TypeScript + Vite + `vite-plugin-pwa`; `react-router-dom`; `zustand`;
`@tanstack/react-query`; `dexie` (IndexedDB); `react-hook-form` + `zod`;
`@supabase/supabase-js` v2; `browser-image-compression`; design system **Fluent 2 / Microsoft Teams**
(`@fluentui/react-components`) via `packages/ui`.

## Arquitetura (camadas)

```
UI (telas) → Hooks de domínio → Repositórios (Dexie) → Sync Engine → Supabase
                                └── câmera / compressão / geo
```

IndexedDB é a fonte da verdade em campo; a rede apenas sincroniza.

> **Mudança de navegação em relação ao PRD v1.1:** o app não lista mais "seções" direto.
> A unidade de trabalho passa a ser o **local de votação**, definido no **cronograma** da equipe
> (tabela `cronograma`: `data`, `etapa`, `equipe_id`, `local_id`, `ordem`). O fluxo é
> **Meus locais → Local → Seções do local → Etapa**. O cronograma do cartório é quem define
> *quais locais* cada equipe deve montar em cada dia. Internamente o checklist continua por
> seção; muda apenas a entrada/navegação no app.

## Mapa de telas

1. Login (matrícula + código) — RF-E01/E02
2. Meus locais de votação (lista dos locais da equipe definidos no cronograma) — RF-E04/E29
2b. Detalhe do local → seções do local
3. Detalhe da seção (2 etapas; Etapa 2 bloqueada) — RF-E29/E30
4. Layout de referência — RF-E06
5. Checklist Etapa 1 — RF-E08/E33
6. Captura de foto — RF-E10/E12/E14/E16
7. Desvio — RF-E20/E21
8. Checklist Etapa 2 + referência aprovada — RF-E32
9. Sigilo do voto — RF-E17/E18/E19
10. Resumo/envio da etapa — RF-E07/E09
11. Fila/sincronização — RF-E22–E25
12. Validação do cartório / reenvio parcial — RF-E26/E27
13. Configurações + instalação PWA — RF-E03

## Backlog (tickets)

| ID | Ticket | Deps | Pts |
| --- | --- | --- | --- |
| APP-01 | Setup monorepo, Vite + TS + PWA, design system (Fluent 2/Teams), lint | — | P |
| APP-02 | Dexie schema + repositórios CRUD locais | APP-01 | P |
| APP-03 | Cliente Supabase + `core` (zod + máquina de status) | Sprint 0 | P |
| APP-04 | Tela de login (matrícula + código) + instalar app | APP-03 | P |
| APP-05 | Sessão persistente + revalidação silenciosa + fallback offline | APP-04 | P |
| APP-06 | "Baixar dados do dia" (cronograma, locais, seções, checklist, layout, aprovações) | APP-02/03 | G |
| APP-07 | Validação de completude do download | APP-06 | P |
| APP-08 | Lista de locais de votação da equipe (definidos no cronograma, progresso) | APP-06 | P |
| APP-08b | Detalhe do local (seções do local, status das 2 etapas) | APP-08 | P |
| APP-09 | Detalhe da seção (2 etapas; bloqueio da Etapa 2) | APP-08b | P |
| APP-10 | Visualizador do layout de referência | APP-06 | P |
| APP-11 | Câmera só captura + aviso "não fotografar pessoas" | APP-09 | P |
| APP-12 | Compressão 1920px/JPEG80%/≤600KB + miniatura 320px | APP-11 | G |
| APP-13 | Timestamp + geolocalização por foto | APP-12 | P |
| APP-14 | Refazer antes de confirmar + orientação paisagem | APP-12 | P |
| APP-15 | Checagem de qualidade (escura/borrada) | APP-12 | P |
| APP-16 | Checklist Etapa 1 + fotos 1–3 | APP-10/12 | G |
| APP-17 | Confirmações Etapa 1 + posição urna/cabine | APP-16 | P |
| APP-18 | Resumo + bloqueio de envio sem fotos/respostas | APP-16 | P |
| APP-19 | Desbloqueio condicionado à aprovação da Etapa 1 | APP-18 | P |
| APP-20 | Etapa 2: foto 4 + referência da Etapa 1 | APP-19 | G |
| APP-21 | Verificação de sigilo (não ⇒ não conforme + desvio) | APP-20 | P |
| APP-22 | Registro de desvio (motivo, observação, fotos) | APP-21 | P |
| APP-23 | Outbox + estados por item/seção | APP-18 | G |
| APP-24 | Sync Engine (metadata→thumb→foto, retry, idempotência) | APP-23 | G |
| APP-25 | Tela de fila + "sincronizar agora" | APP-24 | P |
| APP-26 | Validação do cartório: devolução + reenvio parcial | APP-24 | G |
| APP-27 | `storage.persist()` + snapshot/backup local | APP-24 | P |
| APP-28 | Acessibilidade sob sol (contraste/alvos/textos) | APP-08 | P |
| APP-29 | Manifest/ícones + instalação + QR code | APP-01 | P |
| APP-30 | Teste em campo (1 equipe, 1 local sem sinal, 2 celulares) | todos | G |
| APP-31 | Correções do campo + freeze | APP-30 | G |

## Sequenciamento

```
16/10  Sprint0 (DB/RLS) ── E0 fundação ─ E1 acesso
17/10  carga CSV/154    ── E2 dados do dia
18/10  E3 mídia ── E4 Etapa 1
19/10  E5 Etapa 2 + sigilo          (painel em paralelo)
20/10  E6 offline + sync
21/10  APP-30 teste em campo
22/10  APP-31 correções + FREEZE
23/10  suporte Etapa 1   ·   24/10 suporte Etapa 2   ·   25/10 consulta
```

Caminho crítico: APP-03 → APP-06 → APP-11/12 → APP-16 → APP-20 → APP-23/24 → APP-30.

## Regra de corte

Se em 22/10 o app não estiver íntegro: usar checklist de papel na Etapa 1 e priorizar a Etapa 2
(sigilo do voto) no app. Cortar APP-15 e APP-28 antes de cortar o sync.
