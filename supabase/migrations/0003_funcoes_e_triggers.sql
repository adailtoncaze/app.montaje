-- ============================================================================
-- 0003_funcoes_e_triggers.sql
-- updated_at, helpers de autorizacao, materializacao do checklist,
-- maquina de status, sigilo eliminatório e aplicacao de validacoes
-- ============================================================================

-- ---------- updated_at automatico ----------
create or replace function public.fc_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger tg_touch before update on perfis
  for each row execute function public.fc_touch();
create trigger tg_touch before update on equipes
  for each row execute function public.fc_touch();
create trigger tg_touch before update on secoes
  for each row execute function public.fc_touch();
create trigger tg_touch before update on itens_checklist
  for each row execute function public.fc_touch();
create trigger tg_touch before update on evidencias
  for each row execute function public.fc_touch();
create trigger tg_touch before update on respostas_sigilo
  for each row execute function public.fc_touch();

-- ---------- Helpers de autorizacao (SECURITY DEFINER evita recursao de RLS) ----------
create or replace function public.is_cartorio() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfis
    where id = auth.uid() and papel in ('validador','administrador')
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfis where id = auth.uid() and papel = 'administrador'
  );
$$;

create or replace function public.minhas_equipes() returns setof uuid
language sql stable security definer set search_path = public as $$
  select equipe_id from membros_equipe where perfil_id = auth.uid();
$$;

create or replace function public.pode_ver_secao(p_secao uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from secoes s
    join cronograma c      on c.local_id  = s.local_id
    join membros_equipe m  on m.equipe_id = c.equipe_id
    where s.id = p_secao and m.perfil_id = auth.uid()
  );
$$;

create or replace function public.pode_ver_item(p_item uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.pode_ver_secao(i.secao_id)
  from itens_checklist i where i.id = p_item;
$$;

-- ---------- Materializacao do checklist por secao ----------
create or replace function public.fc_materializar_itens(p_secao uuid) returns void
language sql security definer set search_path = public as $$
  insert into itens_checklist (secao_id, modelo_id, etapa, tipo, nome, foto_numero, ordem)
  select p_secao, mc.id, mc.etapa, mc.tipo, mc.nome, mc.foto_numero, mc.ordem
  from modelo_checklist mc
  where mc.ativo
  on conflict (secao_id, modelo_id) do nothing;
$$;

-- Ao inserir no cronograma, materializa os itens de todas as secoes do local
create or replace function public.tg_mat_por_cronograma() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into itens_checklist (secao_id, modelo_id, etapa, tipo, nome, foto_numero, ordem)
  select s.id, mc.id, mc.etapa, mc.tipo, mc.nome, mc.foto_numero, mc.ordem
  from secoes s
  cross join modelo_checklist mc
  where s.local_id = new.local_id and mc.ativo
  on conflict (secao_id, modelo_id) do nothing;
  return new;
end $$;

create trigger tg_cronograma_materializa
  after insert on cronograma
  for each row execute function public.tg_mat_por_cronograma();

-- Secao criada depois de ja existir cronograma para o local
create or replace function public.tg_mat_por_secao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from cronograma c where c.local_id = new.local_id) then
    perform public.fc_materializar_itens(new.id);
  end if;
  return new;
end $$;

create trigger tg_secao_materializa
  after insert on secoes
  for each row execute function public.tg_mat_por_secao();

-- ---------- Maquina de status da etapa ----------
create or replace function public.rpc_alterar_status_etapa(
  p_secao uuid, p_etapa smallint, p_novo status_etapa
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_atual status_etapa;
  v_outra status_etapa;
begin
  if p_etapa not in (1,2) then
    raise exception 'etapa invalida';
  end if;
  if not public.pode_ver_secao(p_secao) then
    raise exception 'sem permissao para esta secao';
  end if;

  select case when p_etapa = 1 then status_etapa1 else status_etapa2 end,
         case when p_etapa = 1 then status_etapa2 else status_etapa1 end
    into v_atual, v_outra
  from secoes where id = p_secao;

  -- Etapa 2 liberada independentemente da Etapa 1

  -- Transicoes permitidas para a equipe
  if not (
       (v_atual = 'pendente'              and p_novo = 'em_montagem')
    or (v_atual = 'em_montagem'           and p_novo = 'enviada')
    or (v_atual = 'correcao_solicitada'   and p_novo = 'enviada')
  ) then
    raise exception 'transicao invalida: % -> %', v_atual, p_novo;
  end if;

  if p_etapa = 1 then
    update secoes set status_etapa1 = p_novo where id = p_secao;
  else
    update secoes set status_etapa2 = p_novo where id = p_secao;
  end if;
end $$;

-- ---------- Sigilo eliminatório (regra 1) ----------
create or replace function public.tg_sigilo_nao_conforme() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.resposta = false then
    update secoes set conforme = false where id = new.secao_id;
  end if;
  return new;
end $$;

create trigger tg_sigilo_marca
  after insert or update on respostas_sigilo
  for each row execute function public.tg_sigilo_nao_conforme();

-- ---------- Validacao do cartorio aplica status na secao ----------
create or replace function public.tg_validacao_aplica() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.etapa = 1 then
    update secoes set status_etapa1 = new.status where id = new.secao_id;
  else
    update secoes set status_etapa2 = new.status where id = new.secao_id;
  end if;
  return new;
end $$;

create trigger tg_validacao_aplica_status
  after insert on validacoes
  for each row execute function public.tg_validacao_aplica();
