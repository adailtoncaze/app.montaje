-- ============================================================================
-- 0001_extensions_e_enums.sql
-- Extensoes e tipos de dominio do MontaJE
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- Papeis e vinculos de usuario
create type papel_usuario   as enum ('equipe', 'validador', 'administrador');
create type vinculo_usuario as enum ('servidor', 'alvt');

-- Status de cada etapa da secao (maquina de status)
create type status_etapa
  as enum ('pendente','em_montagem','enviada','aprovada','correcao_solicitada');

-- Status de um item do checklist
create type status_item as enum ('pendente','conforme','nao_conforme');

-- Tipo de item do modelo de checklist
create type tipo_item as enum ('confirmacao','foto');

-- Motivos de desvio (RF-E20)
create type motivo_desvio
  as enum ('espaco_insuficiente','estrutura_local','mobiliario','outro');
