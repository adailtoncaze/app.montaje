-- ============================================================================
-- 0002_tabelas.sql
-- Modelo de dados do MontaJE (13 tabelas)
-- ============================================================================

-- ---------- perfis ----------
create table perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  matricula   text not null unique,
  papel       papel_usuario   not null default 'equipe',
  vinculo     vinculo_usuario not null default 'servidor',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- equipes ----------
create table equipes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  lider_id   uuid references perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- membros_equipe ----------
create table membros_equipe (
  id        uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes(id) on delete cascade,
  perfil_id uuid not null references perfis(id)  on delete cascade,
  lider     boolean not null default false,
  unique (equipe_id, perfil_id)
);
-- RF-C21: no maximo um lider por equipe
create unique index um_lider_por_equipe on membros_equipe (equipe_id) where lider;

-- ---------- locais ----------
create table locais (
  id       uuid primary key default gen_random_uuid(),
  zona     integer not null,
  nome     text not null,
  endereco text
);

-- ---------- secoes ----------
create table secoes (
  id            uuid primary key default gen_random_uuid(),
  local_id      uuid not null references locais(id) on delete cascade,
  numero        integer not null,
  status_etapa1 status_etapa not null default 'pendente',
  status_etapa2 status_etapa not null default 'pendente',
  conforme      boolean not null default true,
  updated_at    timestamptz not null default now(),
  unique (local_id, numero)
);

-- ---------- layout_padrao (imagem do TSE) ----------
create table layout_padrao (
  id             uuid primary key default gen_random_uuid(),
  caminho_imagem text not null,
  versao         integer not null default 1,
  ativo          boolean not null default true,
  created_at     timestamptz not null default now()
);
create unique index um_layout_ativo on layout_padrao (ativo) where ativo;

-- ---------- modelo_checklist (template criado pelo cartorio) ----------
create table modelo_checklist (
  id          uuid primary key default gen_random_uuid(),
  etapa       smallint not null check (etapa in (1,2)),
  nome        text not null,
  tipo        tipo_item not null default 'confirmacao',
  exige_foto  boolean not null default false,
  foto_numero smallint check (foto_numero between 1 and 4),  -- 4 fotos fixas
  ordem       smallint not null,
  ativo       boolean not null default true
);

-- ---------- cronograma ----------
create table cronograma (
  id        uuid primary key default gen_random_uuid(),
  data      date not null,
  etapa     smallint not null check (etapa in (1,2)),
  equipe_id uuid not null references equipes(id) on delete cascade,
  local_id  uuid not null references locais(id)  on delete cascade,
  ordem     smallint,
  unique (data, etapa, equipe_id, local_id)
);
create index cronograma_equipe_data on cronograma (equipe_id, data);

-- ---------- itens_checklist (materializado por secao) ----------
create table itens_checklist (
  id          uuid primary key default gen_random_uuid(),
  secao_id    uuid not null references secoes(id) on delete cascade,
  modelo_id   uuid references modelo_checklist(id) on delete set null,
  etapa       smallint not null check (etapa in (1,2)),
  tipo        tipo_item not null default 'confirmacao',
  nome        text not null,
  foto_numero smallint,
  ordem       smallint,
  status      status_item not null default 'pendente',
  resposta    boolean,                 -- confirmacao sim/nao
  observacao  text,
  updated_at  timestamptz not null default now(),
  unique (secao_id, modelo_id)
);
create index itens_secao_etapa on itens_checklist (secao_id, etapa);

-- ---------- evidencias (fotos; id gerado no cliente) ----------
create table evidencias (
  id                uuid primary key,             -- UUID do cliente (idempotencia)
  item_id           uuid not null references itens_checklist(id) on delete cascade,
  caminho_foto      text,
  caminho_miniatura text,
  capturada_em      timestamptz,
  latitude          double precision,
  longitude         double precision,
  autor_id          uuid references perfis(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index evidencias_item on evidencias (item_id);

-- ---------- respostas_sigilo ----------
create table respostas_sigilo (
  id         uuid primary key default gen_random_uuid(),
  secao_id   uuid not null references secoes(id) on delete cascade,
  pergunta   text not null,
  critica    boolean not null default false,      -- pergunta critica (Etapa 2)
  resposta   boolean,
  autor_id   uuid references perfis(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (secao_id, pergunta)
);
create index sigilo_secao on respostas_sigilo (secao_id);

-- ---------- desvios ----------
create table desvios (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references itens_checklist(id) on delete cascade,
  motivo     motivo_desvio not null,
  observacao text,
  created_at timestamptz not null default now(),
  constraint desvio_outro_exige_obs          -- RF-E21
    check (motivo <> 'outro' or length(btrim(coalesce(observacao,''))) > 0)
);
create index desvios_item on desvios (item_id);

-- ---------- validacoes ----------
create table validacoes (
  id             uuid primary key default gen_random_uuid(),
  secao_id       uuid not null references secoes(id) on delete cascade,
  validador_id   uuid not null references perfis(id) on delete restrict,
  etapa          smallint not null check (etapa in (1,2)),
  status         status_etapa not null
                   check (status in ('aprovada','correcao_solicitada')),
  comentario     text,
  item_devolvido uuid references itens_checklist(id) on delete set null,
  data           timestamptz not null default now(),
  constraint devolucao_exige_item_comentario  -- RF-C11
    check (status <> 'correcao_solicitada'
           or (item_devolvido is not null
               and length(btrim(coalesce(comentario,''))) > 0))
);
create index validacoes_secao on validacoes (secao_id, etapa, data desc);
