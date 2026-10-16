-- ============================================================================
-- 0007_usuario_perfil.sql
-- Cria automaticamente a linha em `perfis` quando um usuario e criado em
-- auth.users. Os dados vem do raw_user_meta_data (nome, matricula, papel,
-- vinculo). Assim o login por matricula + codigo encontra o perfil.
-- ============================================================================

create or replace function public.fc_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_papel   papel_usuario;
  v_vinculo vinculo_usuario;
  v_matricula text;
begin
  v_matricula := coalesce(
    nullif(new.raw_user_meta_data->>'matricula', ''),
    split_part(new.email, '@', 1)
  );

  begin
    v_papel := coalesce(
      nullif(new.raw_user_meta_data->>'papel', '')::papel_usuario,
      'equipe'
    );
  exception when others then
    v_papel := 'equipe';
  end;

  begin
    v_vinculo := coalesce(
      nullif(new.raw_user_meta_data->>'vinculo', '')::vinculo_usuario,
      'servidor'
    );
  exception when others then
    v_vinculo := 'servidor';
  end;

  insert into public.perfis (id, nome, matricula, papel, vinculo)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), v_matricula),
    v_matricula,
    v_papel,
    v_vinculo
  )
  on conflict (id) do nothing;

  return new;
end $$;

create trigger tg_auth_novo_usuario
  after insert on auth.users
  for each row execute function public.fc_novo_usuario();
