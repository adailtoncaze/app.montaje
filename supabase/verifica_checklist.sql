-- ============================================================================
-- verifica_checklist.sql  —  CONFERENCIA (nao faz parte das migrations)
-- Roda depois das migrations 0010/0011, que sincronizam `itens_checklist.nome`
-- com `modelo_checklist`. Serve para confirmar que os textos propagaram sem
-- perder dados de campo (status, respostas, observacoes, fotos, desvios).
--
-- Uso: npx supabase db query --linked --file supabase/verifica_checklist.sql
-- ============================================================================

-- 1) Divergencias entre item e modelo (DEVE SER 0)
select '1) divergencias' as checagem, count(*) as valor
  from itens_checklist i
  join modelo_checklist m on m.id = i.modelo_id
 where i.nome is distinct from m.nome;

-- 2) Totais e integridade dos dados de campo
select '2) itens totais'            as checagem, count(*) as valor from itens_checklist
union all select '3) itens orfaos (modelo_id null)', count(*) from itens_checklist where modelo_id is null
union all select '4) status=conforme',               count(*) from itens_checklist where status = 'conforme'
union all select '5) status=nao_conforme',           count(*) from itens_checklist where status = 'nao_conforme'
union all select '6) com resposta',                  count(*) from itens_checklist where resposta is not null
union all select '7) com observacao',                count(*) from itens_checklist where observacao is not null
union all select '8) evidencias (fotos)',            count(*) from evidencias
union all select '9) desvios',                       count(*) from desvios
union all select '10) validacoes',                   count(*) from validacoes
union all select '11) validacoes com item',          count(*) from validacoes where item_devolvido is not null;

-- 12) Acentuacao: palavras que costumam ficar sem cedilha/til no modelo
-- (a lista deve vir vazia). `~*` casa sem diferenciar maiuscula/minuscula.
select '12) modelo sem acento' as checagem, nome
  from modelo_checklist
 where nome ~* '(espaco|circulacao|mesarios|secao|posicao|adaptacoes|visao|ate o )';

-- 13) Secoes sem nenhum item (informativo: local que nunca entrou no cronograma)
select '13) secoes sem itens' as checagem, count(*) as valor
  from secoes s
 where not exists (select 1 from itens_checklist i where i.secao_id = s.id);

-- 14) Amostra: item e modelo lado a lado (confirmacao visual do texto)
select i.nome as nome_no_item, m.nome as nome_no_modelo, i.status, i.resposta
  from itens_checklist i
  join modelo_checklist m on m.id = i.modelo_id
 order by i.etapa, i.ordem
 limit 5;
