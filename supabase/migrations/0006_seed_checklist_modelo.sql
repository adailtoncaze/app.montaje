-- ============================================================================
-- 0006_seed_checklist_modelo.sql
-- Checklist modelo inicial (secao 8 do PRD): 4 fotos obrigatorias + confirmacoes
-- ============================================================================

-- 4 fotos obrigatorias (fixas)
insert into modelo_checklist (etapa, nome, tipo, exige_foto, foto_numero, ordem) values
 (1,'Foto 1 - Entrada da secao, com os cartazes externos',              'foto', true, 1, 1),
 (1,'Foto 2 - Mesa dos mesarios e fiscais, com cartazes internos',      'foto', true, 2, 2),
 (1,'Foto 3 - Interior da secao (ambiente e local da cabine/urna)',     'foto', true, 3, 3),
 (2,'Foto 4 - Urna instalada, com o sigilo preservado',                 'foto', true, 4, 1);

-- Confirmacoes Etapa 1
insert into modelo_checklist (etapa, nome, tipo, exige_foto, ordem) values
 (1,'Ha cadeiras para os fiscais de partido, na quantidade prevista?',  'confirmacao', false, 4),
 (1,'A mesa dos mesarios esta na posicao do layout oficial?',           'confirmacao', false, 5),
 (1,'Todos os cartazes da lista estao afixados (externos na entrada, internos atras da mesa)?','confirmacao', false, 6),
 (1,'Existe espaco para circulacao de cadeirante ate o local da urna?', 'confirmacao', false, 7),
 (1,'O local reservado a cabine e a urna segue o layout e fica fora da visao de portas, janelas e fila?','confirmacao', false, 8),
 (1,'A secao seguiu o layout sem adaptacoes? (se "nao", abre registro de desvio)','confirmacao', false, 9);

-- Confirmacoes Etapa 2
insert into modelo_checklist (etapa, nome, tipo, exige_foto, ordem) values
 (2,'A tela e o teclado da urna ficam fora da visao de portas, janelas, fila, mesarios e fiscais?','confirmacao', false, 2),
 (2,'A urna foi instalada na posicao definida e aprovada na Etapa 1?',  'confirmacao', false, 3);
