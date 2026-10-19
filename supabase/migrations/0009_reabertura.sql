-- ============================================================================
-- 0009_reabertura.sql
-- Reabertura de etapa aprovada pelo cartorio (regra de negocio)
--
-- Regra:
--   * Somente o cartorio (validador/administrador) reabre — quem aprova
--     e quem desfaz a aprovacao.
--   * Origem permitida: apenas etapa com status 'aprovada'.
--   * Destino: 'correcao_solicitada' — a equipe revisa o checklist
--     inteiro e reenvia pelo fluxo de correcao existente. Checklist,
--     fotos e respostas sao preservados; nada e apagado.
--   * Motivo e obrigatorio e fica gravado em 'validacoes' com status
--     'reabertura' (auditoria distinta de uma devolucao pontual).
--   * Reabrir a Etapa 1 reabre automaticamente a Etapa 2 (regra 5),
--     exceto quando a Etapa 2 ainda nem comecou ('pendente').
-- ============================================================================

-- A tabela de auditoria ganha o proprio dominio de status: 'reabertura' e
-- um registro de decisao do cartorio, nao um status de secao (enum
-- status_etapa nao deve receber valores de validacao).
alter table validacoes drop constraint if exists validacoes_status_check;
alter table validacoes drop constraint if exists devolucao_exige_item_comentario;

create type status_validacao as enum ('aprovada', 'correcao_solicitada', 'reabertura');

alter table validacoes
  alter column status type status_validacao
  using (status::text::status_validacao);

alter table validacoes add constraint devolucao_exige_item_comentario
  check (status <> 'correcao_solicitada'
         or (item_devolvido is not null
             and length(btrim(coalesce(comentario,''))) > 0));

-- O trigger passa a mapear 'reabertura' -> 'correcao_solicitada' na secao
-- (qualquer decisao que nao seja 'aprovada' devolve a etapa para correcao).
create or replace function public.tg_validacao_aplica() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.etapa = 1 then
    update secoes
       set status_etapa1 = case when new.status = 'aprovada'
                                then 'aprovada'::status_etapa
                                else 'correcao_solicitada'::status_etapa end
     where id = new.secao_id;
  else
    update secoes
       set status_etapa2 = case when new.status = 'aprovada'
                                then 'aprovada'::status_etapa
                                else 'correcao_solicitada'::status_etapa end
     where id = new.secao_id;
  end if;
  return new;
end $$;

-- ---------- RPC de reabertura ----------
create or replace function public.rpc_reabrir_etapa(
  p_secao uuid,
  p_etapa smallint,
  p_motivo text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_etapa1 status_etapa;
  v_etapa2 status_etapa;
begin
  if p_etapa not in (1, 2) then
    raise exception 'etapa invalida';
  end if;
  if not public.is_cartorio() then
    raise exception 'Sem permissao: apenas o cartorio pode reabrir etapas';
  end if;
  if length(btrim(coalesce(p_motivo, ''))) < 5 then
    raise exception 'Informe o motivo da reabertura';
  end if;

  select status_etapa1, status_etapa2
    into v_etapa1, v_etapa2
  from secoes
  where id = p_secao;

  if not found then
    raise exception 'Secao nao encontrada';
  end if;

  if p_etapa = 1 then
    if v_etapa1 <> 'aprovada' then
      raise exception 'Apenas a Etapa 1 aprovada pode ser reaberta (status atual: %)', v_etapa1;
    end if;
  else
    if v_etapa2 <> 'aprovada' then
      raise exception 'Apenas a Etapa 2 aprovada pode ser reaberta (status atual: %)', v_etapa2;
    end if;
    if v_etapa1 <> 'aprovada' then
      raise exception 'Reabra a Etapa 1 antes da Etapa 2';
    end if;
  end if;

  -- Auditoria: quem, quando e por que. O status 'reabertura' distingue no
  -- historico uma reaprovacao pendente de uma devolucao pontual.
  insert into validacoes (secao_id, validador_id, etapa, status, comentario)
  values (p_secao, auth.uid(), p_etapa, 'reabertura', btrim(p_motivo));

  -- Regra 5: reabrir a Etapa 1 invalida a Etapa 2, se ela ja tiver comecado.
  if p_etapa = 1 and v_etapa2 <> 'pendente' then
    insert into validacoes (secao_id, validador_id, etapa, status, comentario)
    values (p_secao, auth.uid(), 2, 'reabertura',
            'Reabertura automatica da Etapa 1: ' || btrim(p_motivo));
  end if;
end $$;
