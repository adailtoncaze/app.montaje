import Dexie, { type Table } from 'dexie';
import type {
  Cronograma,
  Desvio,
  Evidencia,
  ItemChecklist,
  LayoutPadrao,
  Local,
  ModeloChecklist,
  Perfil,
  RespostaSigilo,
  Secao,
  Validacao,
} from '@montaje/core';

/** Estado de sincronizacao local de um registro ou arquivo. */
export type SyncState = 'pendente_envio' | 'enviando' | 'enviado' | 'erro';

/** Registros locais = linha do servidor + estado de sincronizacao. */
export type SecaoLocal = Secao & { syncState: SyncState };
export type ItemLocal = ItemChecklist & { syncState: SyncState; dirty?: boolean };
export type SigiloLocal = RespostaSigilo & { syncState: SyncState };
export type DesvioLocal = Desvio & { syncState: SyncState };
export type EvidenciaLocal = Evidencia & {
  syncState: SyncState;
  blob?: Blob;
  thumbBlob?: Blob;
};

/** Fila de envio (outbox) — o coração do modo offline. */
export interface OutboxItem {
  id: string;
  tipo: 'item' | 'evidencia' | 'sigilo' | 'desvio' | 'status';
  refId: string;
  estado: SyncState;
  tentativas: number;
  criadoEm: number;
  atualizadoEm: number;
}

export interface MetaLocal {
  chave: string;
  valor: unknown;
  atualizadoEm: number;
}

/**
 * Banco local (IndexedDB). Fonte da verdade em campo; a rede apenas sincroniza.
 */
export class MontajeDB extends Dexie {
  perfil!: Table<Perfil, string>;
  locais!: Table<Local, string>;
  secoes!: Table<SecaoLocal, string>;
  cronograma!: Table<Cronograma, string>;
  modeloChecklist!: Table<ModeloChecklist, string>;
  itens!: Table<ItemLocal, string>;
  evidencias!: Table<EvidenciaLocal, string>;
  sigilo!: Table<SigiloLocal, string>;
  desvios!: Table<DesvioLocal, string>;
  validacoes!: Table<Validacao, string>;
  layout!: Table<LayoutPadrao, string>;
  outbox!: Table<OutboxItem, string>;
  meta!: Table<MetaLocal, string>;

  constructor() {
    super('montaje');
    this.version(1).stores({
      perfil: 'id',
      locais: 'id, zona',
      secoes: 'id, local_id, status_etapa1, status_etapa2',
      cronograma: 'id, data, equipe_id, local_id',
      modeloChecklist: 'id, etapa, ordem',
      itens: 'id, secao_id, etapa, status, syncState',
      evidencias: 'id, item_id, syncState',
      sigilo: 'id, secao_id, syncState',
      desvios: 'id, item_id, syncState',
      validacoes: 'id, secao_id, etapa, data',
      layout: 'id, ativo',
      outbox: 'id, tipo, refId, estado',
      meta: 'chave',
    });
  }
}

export const db = new MontajeDB();
