-- ============================================================================
-- 0011_corrigir_texto_cadeirante.sql
-- Corrige acentuacao remanescente em um item de confirmacao (Etapa 1):
--   "Existe espaco para circulacao de cadeirante ate o local da urna?"
--   -> "Existe espaço para circulação de cadeirante até o local da urna?"
--
-- Atualiza o MODELO (fonte) e propaga aos itens ja materializados, casando por
-- `modelo_id`. So o campo `nome` muda: status, resposta, observacao, evidencias
-- e desvios ficam intactos (mesma regra da 0010).
-- ============================================================================

-- 1) Modelo (fonte): identifica pelo texto atual, restrito a etapa 1/confirmacao.
update modelo_checklist
   set nome = 'Existe espaço para circulação de cadeirante até o local da urna?'
 where etapa = 1
   and tipo = 'confirmacao'
   and nome = 'Existe espaco para circulação de cadeirante ate o local da urna?';

-- 2) Itens ja materializados: sincroniza pelo modelo corrigido.
update itens_checklist i
   set nome = m.nome
  from modelo_checklist m
 where i.modelo_id = m.id
   and i.nome is distinct from m.nome;

-- ---------- verificacao (deve retornar 0 linhas) ----------
-- select nome from modelo_checklist where nome ~* '(espaco|circulacao|ate )';
-- select count(*) from itens_checklist i
--   join modelo_checklist m on m.id = i.modelo_id
--  where i.nome is distinct from m.nome;
