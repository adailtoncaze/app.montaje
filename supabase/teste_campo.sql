-- ============================================================================
-- teste_campo.sql  —  CENARIO DE TESTE (nao faz parte das migrations)
-- Cole no SQL Editor do Supabase para criar dados de teste e poder usar o app.
-- Ajuste a matricula 'admin' se o seu usuario tiver outra matricula.
--
-- Cria: 1 equipe (admin como lider) + 1 local + 2 secoes + cronograma de hoje.
-- O trigger do cronograma materializa os itens do checklist automaticamente.
-- ============================================================================

-- 1) Equipe
insert into public.equipes (id, nome)
values ('22222222-2222-2222-2222-222222222222', 'Equipe Teste')
on conflict (id) do nothing;

-- 2) Admin como membro e lider da equipe
insert into public.membros_equipe (equipe_id, perfil_id, lider)
select '22222222-2222-2222-2222-222222222222', p.id, true
from public.perfis p
where p.matricula = 'admin'
on conflict (equipe_id, perfil_id) do nothing;

update public.equipes
set lider_id = (select id from public.perfis where matricula = 'admin')
where id = '22222222-2222-2222-2222-222222222222';

-- 3) Local de votacao
insert into public.locais (id, zona, nome, endereco)
values ('11111111-1111-1111-1111-111111111111', 1, 'Escola Municipal Exemplo', 'Rua Exemplo, 100')
on conflict (id) do nothing;

-- 4) Secoes
insert into public.secoes (local_id, numero) values
  ('11111111-1111-1111-1111-111111111111', 101),
  ('11111111-1111-1111-1111-111111111111', 102)
on conflict (local_id, numero) do nothing;

-- 5) Cronograma de hoje (Etapa 1) — dispara a materializacao dos itens
insert into public.cronograma (data, etapa, equipe_id, local_id, ordem)
values (current_date, 1, '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111', 1)
on conflict (data, etapa, equipe_id, local_id) do nothing;

-- 5b) Cronograma de amanha (Etapa 2), para testar o bloqueio/liberacao
insert into public.cronograma (data, etapa, equipe_id, local_id, ordem)
values (current_date + 1, 2, '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111', 1)
on conflict (data, etapa, equipe_id, local_id) do nothing;

-- 6) Seguranca: garante os itens mesmo se o cronograma ja existia
select public.fc_materializar_itens(s.id)
from public.secoes s
where s.local_id = '11111111-1111-1111-1111-111111111111';

-- 7) Conferencia
select s.numero as secao, count(i.id) as itens
from public.secoes s
left join public.itens_checklist i on i.secao_id = s.id
where s.local_id = '11111111-1111-1111-1111-111111111111'
group by s.numero
order by s.numero;
