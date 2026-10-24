-- ============================================================================
-- 0004_rls.sql
-- Row Level Security por perfil (equipe / validador / administrador)
-- ============================================================================

alter table perfis           enable row level security;
alter table equipes          enable row level security;
alter table membros_equipe   enable row level security;
alter table locais           enable row level security;
alter table secoes           enable row level security;
alter table layout_padrao    enable row level security;
alter table modelo_checklist enable row level security;
alter table cronograma       enable row level security;
alter table itens_checklist  enable row level security;
alter table evidencias       enable row level security;
alter table respostas_sigilo enable row level security;
alter table desvios          enable row level security;
alter table validacoes       enable row level security;

-- ---------- perfis ----------
create policy perfis_select on perfis for select
  using (id = auth.uid() or is_cartorio());
create policy perfis_admin on perfis for all
  using (is_admin()) with check (is_admin());

-- ---------- equipes ----------
create policy equipes_select on equipes for select
  using (is_cartorio() or id in (select minhas_equipes()));
create policy equipes_admin on equipes for all
  using (is_admin()) with check (is_admin());

-- ---------- membros_equipe ----------
create policy membros_select on membros_equipe for select
  using (is_cartorio() or perfil_id = auth.uid()
         or equipe_id in (select minhas_equipes()));
create policy membros_admin on membros_equipe for all
  using (is_admin()) with check (is_admin());

-- ---------- locais ----------
create policy locais_select on locais for select
  using (is_cartorio() or exists (
    select 1 from cronograma c
    where c.local_id = locais.id and c.equipe_id in (select minhas_equipes())
  ));
create policy locais_admin on locais for all
  using (is_admin()) with check (is_admin());

-- ---------- secoes ----------
create policy secoes_select on secoes for select
  using (is_cartorio() or pode_ver_secao(id));
create policy secoes_update_equipe on secoes for update
  using (pode_ver_secao(id) or is_cartorio()) with check (pode_ver_secao(id) or is_cartorio());
create policy secoes_admin on secoes for all
  using (is_admin()) with check (is_admin());

-- ---------- layout_padrao / modelo_checklist (leitura para autenticados) ----------
create policy layout_select on layout_padrao for select
  using (auth.uid() is not null);
create policy layout_admin on layout_padrao for all
  using (is_admin()) with check (is_admin());

create policy modelo_select on modelo_checklist for select
  using (auth.uid() is not null);
create policy modelo_admin on modelo_checklist for all
  using (is_admin()) with check (is_admin());

-- ---------- cronograma ----------
create policy crono_select on cronograma for select
  using (is_cartorio() or equipe_id in (select minhas_equipes()));
create policy crono_admin on cronograma for all
  using (is_admin()) with check (is_admin());

-- ---------- itens_checklist ----------
create policy itens_select on itens_checklist for select
  using (is_cartorio() or pode_ver_secao(secao_id));
create policy itens_equipe on itens_checklist for all
  using (pode_ver_secao(secao_id)) with check (pode_ver_secao(secao_id));
create policy itens_admin on itens_checklist for all
  using (is_admin()) with check (is_admin());

-- ---------- evidencias ----------
create policy evid_select on evidencias for select
  using (is_cartorio() or pode_ver_item(item_id));
create policy evid_equipe on evidencias for all
  using (pode_ver_item(item_id)) with check (pode_ver_item(item_id));
create policy evid_admin on evidencias for all
  using (is_admin()) with check (is_admin());

-- ---------- respostas_sigilo ----------
create policy sigilo_select on respostas_sigilo for select
  using (is_cartorio() or pode_ver_secao(secao_id));
create policy sigilo_equipe on respostas_sigilo for all
  using (pode_ver_secao(secao_id)) with check (pode_ver_secao(secao_id));
create policy sigilo_admin on respostas_sigilo for all
  using (is_admin()) with check (is_admin());

-- ---------- desvios ----------
create policy desvios_select on desvios for select
  using (is_cartorio() or pode_ver_item(item_id));
create policy desvios_equipe on desvios for all
  using (pode_ver_item(item_id)) with check (pode_ver_item(item_id));
create policy desvios_admin on desvios for all
  using (is_admin()) with check (is_admin());

-- ---------- validacoes ----------
create policy valid_select on validacoes for select
  using (is_cartorio() or pode_ver_secao(secao_id));
create policy valid_insert_cartorio on validacoes for insert
  with check (is_cartorio() and validador_id = auth.uid());
create policy valid_update_cartorio on validacoes for update
  using (is_cartorio()) with check (is_cartorio());
create policy valid_admin on validacoes for all
  using (is_admin()) with check (is_admin());
