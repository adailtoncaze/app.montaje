import { db, type ItemLocal, type OutboxItem, type SyncState } from './schema';
import type { Secao, StatusItem } from '@montaje/core';

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
