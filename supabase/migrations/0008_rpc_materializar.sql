-- ============================================================================
-- 0008_rpc_materializar.sql
-- RPC para o app garantir que os itens do checklist de uma secao existam.
-- Protegido por permissao (equipe dona da secao ou cartorio).
-- ============================================================================

create or replace function public.rpc_materializar_secao(p_secao uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.pode_ver_secao(p_secao) or public.is_cartorio()) then
    raise exception 'sem permissao para esta secao';
  end if;
  perform public.fc_materializar_itens(p_secao);
end $$;

-- A materializacao interna nao deve ser chamavel diretamente pelo cliente.
revoke execute on function public.fc_materializar_itens(uuid) from public;
grant  execute on function public.rpc_materializar_secao(uuid) to authenticated;
