-- ============================================================================
-- 0010_sincronizar_textos_itens.sql
-- Propaga para `itens_checklist` os textos ja corrigidos em `modelo_checklist`.
--
-- Contexto:
--   `fc_materializar_itens` so faz INSERT ... ON CONFLICT DO NOTHING: o texto
--   do item e uma COPIA do modelo feita no momento da materializacao. Corrigir
--   o modelo nao alcanca os itens ja materializados — este script sincroniza.
--
-- Escopo (deliberadamente minimo):
--   * Atualiza apenas o campo `nome` — e texto de exibicao.
--   * Nunca toca em status, resposta, observacao: sao resultado de campo.
--   * Nunca apaga nem insere linha: o `id` do item e referenciado por
--     `evidencias.item_id`, `desvios.item_id` e `validacoes.item_devolvido`,
--     entao o vinculo e o historico ficam intactos.
--   * Casa por `modelo_id` (chave estavel), nunca por texto — o texto e
--     justamente o que muda.
--   * Itens com `modelo_id is null` (modelo apagado, `on delete set null`) sao
--     ignorados: nao ha fonte confiavel para reescreve-los.
-- ============================================================================

-- Idempotente: so toca nas linhas realmente divergentes. Rodar de novo nao
-- altera nada (o `where` fica vazio) e nao bumpa `updated_at` a toa.
update itens_checklist i
   set nome = m.nome
  from modelo_checklist m
 where i.modelo_id = m.id
   and i.nome is distinct from m.nome;

-- ---------- verificacao (deve retornar 0 linhas) ----------
-- select i.id, i.nome as nome_no_item, m.nome as nome_no_modelo
--   from itens_checklist i
--   join modelo_checklist m on m.id = i.modelo_id
--  where i.nome is distinct from m.nome;
