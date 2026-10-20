-- ============================================================================
-- 0006_seed_checklist_modelo.sql
-- Checklist modelo inicial (secao 8 do PRD): 4 fotos obrigatorias + confirmacoes
--
-- Os `id` sao fixos e vieram do ambiente em uso: `itens_checklist.modelo_id`
-- referencia estas linhas, entao mudar o UUID orfanaria os itens ja
-- materializados. Textos revisados (acentuacao e redacao).
-- ============================================================================

-- 4 fotos obrigatorias (fixas)
insert into modelo_checklist (id, etapa, nome, tipo, exige_foto, foto_numero, ordem) values
 ('4eea3ffe-4934-4649-987c-bc46fdcb306a', 1, 'Foto 1 - Entrada da seção, com os cartazes externos',         'foto', true, 1, 1),
 ('2c9385de-1028-492b-a97f-0505cfeb813c', 1, 'Foto 2 - Mesa dos mesários e cartazes internos',              'foto', true, 2, 2),
 ('1e38b01c-c486-4d11-96c6-39fdcf310bda', 1, 'Foto 3 - Interior da seção (ambiente e local da cabine/urna)', 'foto', true, 3, 3),
 ('6a08d2d6-9fd2-4d17-8ce6-7eead90a491f', 2, 'Foto 4 - Urna instalada, com o sigilo preservado',             'foto', true, 4, 1);

-- Confirmacoes Etapa 1
insert into modelo_checklist (id, etapa, nome, tipo, exige_foto, ordem) values
 ('f59e860f-f891-4128-9cc6-1efa1f8cb6f3', 1, 'Há cadeiras para os fiscais de partido, na quantidade prevista?',                                          'confirmacao', false, 4),
 ('599703e1-9157-4346-9476-72320dd2d9b9', 1, 'A mesa dos mesários está na posição do layout oficial?',                                                   'confirmacao', false, 5),
 ('d3912e93-ca61-40e0-80cc-133d3d23414b', 1, 'Todos os cartazes da lista estão afixados (externos na entrada, internos atrás da mesa)?',                 'confirmacao', false, 6),
 ('50bbbde6-a2ff-4006-b357-33186db01cd7', 1, 'Existe espaço para circulação de cadeirante até o local da urna?',                                         'confirmacao', false, 7),
 ('2413ca24-456b-4817-a6e9-df93c68d89d6', 1, 'O local reservado a cabine e a urna segue o layout e fica fora da visão de portas, janelas e fila?',        'confirmacao', false, 8),
 ('348a1c50-dc64-4d8f-9052-0688efb0d511', 1, 'A seção seguiu o layout sem adaptações? (se "não", abre registro de desvio)',                              'confirmacao', false, 9);

-- Confirmacoes Etapa 2
insert into modelo_checklist (id, etapa, nome, tipo, exige_foto, ordem) values
 ('0ba5291a-2eee-4f9b-8657-f2209750f4e2', 2, 'A tela e o teclado da Urna ficam fora da visão de portas, janelas, fila, mesários e fiscais?', 'confirmacao', false, 2),
 ('3ac92bd1-51ae-4667-9396-16865c9c07c7', 2, 'A urna foi instalada na posição definida e aprovada na Etapa 1?',                            'confirmacao', false, 3);
