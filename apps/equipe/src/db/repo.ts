import {
  db,
  type DesvioLocal,
  type EvidenciaLocal,
  type ItemLocal,
  type OutboxItem,
  type SyncState,
} from './schema';
import {
  caminhoFoto,
  caminhoThumb,
  type Etapa,
  type MotivoDesvio,
  type Secao,
  type StatusItem,
} from '@montaje/core';
import { novoId } from '@/lib/id';

/** Repositorio local (IndexedDB). Toda escrita em campo passa por aqui. */

export async function salvarPerfil(perfil: Parameters<typeof db.perfil.put>[0]) {
  return db.perfil.put(perfil);
}

export async function lerPerfil() {
  return db.perfil.toCollection().first();
}

export async function listarSecoes(): Promise<Secao[]> {
  return db.secoes.toArray();
}

export async function obterSecao(id: string) {
  return db.secoes.get(id);
}

export async function itensDaSecao(secaoId: string, etapa?: 1 | 2): Promise<ItemLocal[]> {
  const colecao = db.itens.where('secao_id').equals(secaoId);
  const itens = await colecao.toArray();
  return etapa ? itens.filter((i) => i.etapa === etapa) : itens;
}

/** Grava a resposta de um item e enfileira o envio (RF-E22). */
export async function responderItem(
  itemId: string,
  resposta: boolean | null,
  observacao?: string | null,
): Promise<void> {
  const atual = await db.itens.get(itemId);
  if (!atual) throw new Error('Item nao encontrado');

  let status: StatusItem = atual.status;
  if (resposta === true) status = 'conforme';
  if (resposta === false) status = 'nao_conforme';

  await db.transaction('rw', db.itens, db.outbox, async () => {
    await db.itens.update(itemId, {
      resposta,
      observacao: observacao ?? atual.observacao,
      status,
      syncState: 'pendente_envio',
      updated_at: new Date().toISOString(),
    });
    await enfileirar('item', itemId);
  });
}

/** Enfileira um registro para envio (idempotente por refId+tipo). */
export async function enfileirar(tipo: OutboxItem['tipo'], refId: string): Promise<void> {
  const chave = `${tipo}:${refId}`;
  const existente = await db.outbox.get(chave);
  const agora = Date.now();
  const registro: OutboxItem = existente ?? {
    id: chave,
    tipo,
    refId,
    estado: 'pendente_envio',
    tentativas: 0,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  registro.estado = 'pendente_envio';
  registro.atualizadoEm = agora;
  await db.outbox.put(registro);
}

export async function proximoDaFila(): Promise<OutboxItem | undefined> {
  return db.outbox
    .where('estado')
    .anyOf('pendente_envio', 'erro')
    .sortBy('criadoEm')
    .then((itens) => itens[0]);
}

export async function marcarFila(id: string, estado: SyncState): Promise<void> {
  await db.outbox.update(id, { estado, atualizadoEm: Date.now() });
}

export async function contarPendentes(): Promise<number> {
  return db.outbox.where('estado').anyOf('pendente_envio', 'enviando', 'erro').count();
}

/**
 * APP-12/APP-16 — grava (ou substitui) a foto de um item, marca o item como conforme
 * e enfileira o envio. O blob e a miniatura ficam no IndexedDB ate a sincronizacao.
 */
export async function salvarFotoDoItem(
  itemId: string,
  secaoId: string,
  dados: {
    blob: Blob;
    thumbBlob: Blob;
    capturadaEm: string;
    latitude: number | null;
    longitude: number | null;
    autorId: string | null;
  },
): Promise<void> {
  const agora = new Date().toISOString();
  const id = novoId();
  const ts = Date.now();

  const evidencia: EvidenciaLocal = {
    id,
    item_id: itemId,
    caminho_foto: caminhoFoto(secaoId, itemId, ts),
    caminho_miniatura: caminhoThumb(secaoId, itemId, ts),
    capturada_em: dados.capturadaEm,
    latitude: dados.latitude,
    longitude: dados.longitude,
    autor_id: dados.autorId,
    created_at: agora,
    updated_at: agora,
    syncState: 'pendente_envio',
    blob: dados.blob,
    thumbBlob: dados.thumbBlob,
  };

  await db.transaction('rw', db.itens, db.evidencias, db.outbox, async () => {
    // Uma foto por item: remove a anterior (e sua entrada na fila).
    const anteriores = await db.evidencias.where('item_id').equals(itemId).toArray();
    for (const a of anteriores) {
      await db.evidencias.delete(a.id);
      await db.outbox.delete(`evidencia:${a.id}`);
    }

    await db.evidencias.put(evidencia);
    await db.itens.update(itemId, {
      status: 'conforme',
      syncState: 'pendente_envio',
      updated_at: agora,
    });
    await enfileirar('evidencia', id);
    await enfileirar('item', itemId);
  });
}

/** Remove a foto do item e devolve o item para pendente. */
export async function removerFotoDoItem(itemId: string): Promise<void> {
  const agora = new Date().toISOString();
  await db.transaction('rw', db.itens, db.evidencias, db.outbox, async () => {
    const anteriores = await db.evidencias.where('item_id').equals(itemId).toArray();
    for (const a of anteriores) {
      await db.evidencias.delete(a.id);
      await db.outbox.delete(`evidencia:${a.id}`);
    }
    await db.itens.update(itemId, {
      status: 'pendente',
      syncState: 'pendente_envio',
      updated_at: agora,
    });
    await enfileirar('item', itemId);
  });
}

/**
 * Move a secao para 'em_montagem' na primeira interacao da etapa (RF-E08).
 * Nao regride a etapa se ela ja saiu de 'pendente'.
 */
export async function marcarEmMontagem(secaoId: string, etapa: Etapa): Promise<void> {
  const secao = await db.secoes.get(secaoId);
  if (!secao) return;

  const atual = etapa === 1 ? secao.status_etapa1 : secao.status_etapa2;
  if (atual !== 'pendente') return;

  const agora = new Date().toISOString();
  await db.transaction('rw', db.secoes, db.outbox, async () => {
    await db.secoes.update(secaoId, {
      ...(etapa === 1
        ? { status_etapa1: 'em_montagem' as const }
        : { status_etapa2: 'em_montagem' as const }),
      syncState: 'pendente_envio',
      updated_at: agora,
    });
    await enfileirar('status', secaoId);
  });
}

/**
 * APP-22 — grava (ou atualiza) o desvio de um item. Um item tem no maximo um desvio.
 * A observacao e obrigatoria quando o motivo for 'outro' (validado no formulario e no banco).
 */
export async function salvarDesvio(
  itemId: string,
  motivo: MotivoDesvio,
  observacao: string | null,
): Promise<void> {
  const existente = await db.desvios.where('item_id').equals(itemId).first();
  const agora = new Date().toISOString();

  const desvio: DesvioLocal = {
    id: existente?.id ?? novoId(),
    item_id: itemId,
    motivo,
    observacao,
    created_at: existente?.created_at ?? agora,
    syncState: 'pendente_envio',
  };

  await db.transaction('rw', db.desvios, db.outbox, async () => {
    await db.desvios.put(desvio);
    await enfileirar('desvio', desvio.id);
    await enfileirar('item', itemId);
  });
}

/** Remove o desvio do item (ex.: quando a resposta volta a ser "Sim"). */
export async function removerDesvio(itemId: string): Promise<void> {
  const existente = await db.desvios.where('item_id').equals(itemId).first();
  if (!existente) return;

  await db.transaction('rw', db.desvios, db.outbox, async () => {
    await db.desvios.delete(existente.id);
    await db.outbox.delete(`desvio:${existente.id}`);
  });
}

/**
 * APP-18 — marca a etapa como enviada e enfileira o status para o cartorio.
 * A checagem de pendencias (fotos/respostas) e feita antes, na tela de resumo.
 */
export async function enviarEtapa(secaoId: string, etapa: Etapa): Promise<void> {
  const agora = new Date().toISOString();
  await db.transaction('rw', db.secoes, db.outbox, async () => {
    await db.secoes.update(secaoId, {
      ...(etapa === 1
        ? { status_etapa1: 'enviada' as const }
        : { status_etapa2: 'enviada' as const }),
      syncState: 'pendente_envio',
      updated_at: agora,
    });
    await enfileirar('status', secaoId);
  });
}

export async function limparTudo(): Promise<void> {
  await Promise.all([
    db.perfil.clear(),
    db.locais.clear(),
    db.secoes.clear(),
    db.cronograma.clear(),
    db.itens.clear(),
    db.evidencias.clear(),
    db.sigilo.clear(),
    db.desvios.clear(),
    db.validacoes.clear(),
    db.outbox.clear(),
  ]);
}
