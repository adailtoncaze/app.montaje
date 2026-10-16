-- Seed de demonstracao (opcional). NAO aplicar em producao.
-- Cria 1 zona, 1 local e 2 secoes de exemplo para testes locais.
-- A criacao de usuarios/equipes/cronograma e feita pelo painel do cartorio.

insert into locais (id, zona, nome, endereco) values
  ('11111111-1111-1111-1111-111111111111', 1, 'Escola Municipal Exemplo', 'Rua Exemplo, 100');

insert into secoes (local_id, numero) values
  ('11111111-1111-1111-1111-111111111111', 101),
  ('11111111-1111-1111-1111-111111111111', 102);
