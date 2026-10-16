# Sprint 0 — Contrato congelado (MontaJE)

Este documento registra o schema, as políticas de acesso e as regras que o **app da equipe** e o
**painel do cartório** compartilham. Congelado antes do desenvolvimento das telas.

## 1. Autenticação

| Perfil | Identificador | Senha |
| --- | --- | --- |
| Equipe | `matricula` → e-mail sintético `<matricula>@equipe.local` | código gerado pelo cartório (redefinível) |
| Validador / Administrador | e-mail real ou mesma convenção de matrícula | senha própria |

- `perfis.id` = `auth.uid()`.
- Sessão persistida no aparelho; expiração folgada (a definir antes de 22/10).
- Sem cadastro aberto.

## 2. Storage (bucket privado `evidencias`)

Caminho: `{secao_id}/{item_id}/{timestamp}.jpg` e `.../thumb.jpg`.

> **Mudança em relação ao PRD §11:** o PRD previa `zona-secao/item/timestamp.jpg`. Para permitir
> RLS no Storage, a primeira pasta passa a ser o **UUID da seção**. A etiqueta legível
> (`zona-secao`) fica nos dados, não no path.

Acesso somente por URL assinada, respeitando o papel (autor, equipe dona e cartório).

## 3. Protocolo de sincronização (app ↔ servidor)

1. IDs gerados no cliente (UUID v4) → upsert idempotente (`onConflict: id`).
2. Ordem obrigatória: **metadata → miniaturas → fotos completas**.
3. `updated_at` em toda tabela mutável → resolução *last-write-wins*.
4. Devoluções do cartório chegam em `validacoes` (`status`, `item_devolvido`, `comentario`) e
   marcam o item local como `dirty` para reenvio parcial.
5. Falha nunca apaga dado local; retry com backoff exponencial.

## 4. Máquina de status (por etapa)

```
pendente → em_montagem → enviada → aprovada
                                  ↘ correcao_solicitada → enviada
```

- `rpc_alterar_status_etapa(secao, etapa, novo)` valida as transições no servidor.
- **Etapa 2 só libera com a Etapa 1 aprovada** (regra 5).
- A seção só fica `aprovada` quando as duas etapas estiverem aprovadas (regra 9).

## 5. Regras aplicadas no banco

| Regra | Onde |
| --- | --- |
| Sigilo eliminatório (qualquer "não" ⇒ `conforme = false`) | trigger `tg_sigilo_marca` |
| Desvio "outro" exige observação | constraint `desvio_outro_exige_obs` |
| Devolução exige item + comentário | constraint `devolucao_exige_item_comentario` |
| Um líder por equipe | índice `um_lider_por_equipe` |
| Materialização do checklist por seção | triggers `tg_cronograma_materializa`, `tg_secao_materializa` |

## 6. RLS (resumo)

- **Equipe:** somente seções dos locais atribuídos à sua equipe no `cronograma`; lê validações dessas seções.
- **Validador:** lê tudo e cria validações.
- **Administrador:** tudo, mais `perfis`, `equipes`, `membros_equipe`, `layout_padrao`, `modelo_checklist`, `cronograma`.
- Helpers `SECURITY DEFINER`: `is_cartorio()`, `is_admin()`, `minhas_equipes()`, `pode_ver_secao()`, `pode_ver_item()`.

## 7. Modelo de dados (13 tabelas)

`perfis`, `equipes`, `membros_equipe`, `locais`, `secoes`, `layout_padrao`, `modelo_checklist`,
`cronograma`, `itens_checklist`, `evidencias`, `respostas_sigilo`, `desvios`, `validacoes`.

## 8. Pendências que afetam o schema

1. Confirmar o path do Storage com `secao_id` (necessário para RLS).
2. Perguntas de sigilo ficam como constantes em `packages/core` (não viram tabela no MVP).
3. Horário limite de validação da Etapa 1/Etapa 2 (afeta a tela de validação, não o schema).
