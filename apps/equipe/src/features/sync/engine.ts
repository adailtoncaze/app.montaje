import type { SupabaseClient } from '@supabase/supabase-js';
import type { Etapa, StatusEtapa } from '@montaje/core';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { db, type OutboxItem } from '@/db/schema';
import { baixarAlteracoes } from './download';

/**
 * APP-24 — Sync Engine (outbox -> Supabase).
 *
 * Descarrega a fila (outbox) para o Supabase na ordem: metadados -> miniatura -> foto.
 * Idempotente (upsert por id / upload com `upsert: true`) e resiliente: uma falha
 * marca a entrada como `erro` e ela e tentada de novo no proximo ciclo, sem perder
 * nada. O app continua funcionando 100% offline a partir do IndexedDB.
 */

export interface ResultadoSync {
  /** Quantas entradas foram enviadas com sucesso neste ciclo. */
  enviados: number;
  /** Quantas falharam neste ciclo. */
  falhas: number;
  /** Quantas continuam na fila (pendentes + erro) ao final do ciclo. */
  restantes: number;
  /** Quantas seções tiveram status/conformidade atualizados a partir do cartório. */
  atualizadas: number;
  /** `false` quando o ciclo nem rodou (offline, sem sessao, ja em andamento). */
  executou: boolean;
  /** Motivo, quando `executou` for `false`. */
  mensagem?: string;
  /** Aviso quando o envio concluiu mas a descida (status do cartório) falhou. */
  avisoDescida?: string;
}

/** Ordem de envio dentro de um ciclo (status por ultimo: sobe a secao ja completa). */
const PRIORIDADE: Record<OutboxItem['tipo'], number> = {
  item: 1,
  desvio: 2,
  evidencia: 3,
  sigilo: 4,
  status: 9,
};

const MAX_POR_CICLO = 60;

let rodando = false;

export function estaSincronizando(): boolean {
  return rodando;
}

export async function sincronizarTudo(): Promise<ResultadoSync> {
  const contarPendentes = () =>
    db.outbox.where('estado').anyOf('pendente_envio', 'erro').count();

  const restantesAntes = await contarPendentes();

  if (rodando) {
    return {
      enviados: 0,
      falhas: 0,
      restantes: restantesAntes,
      atualizadas: 0,
      executou: false,
      mensagem: 'Sincronização já em andamento.',
    };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      enviados: 0,
      falhas: 0,
      restantes: restantesAntes,
      atualizadas: 0,
      executou: false,
      mensagem: 'Sem conexão com a internet.',
    };
  }
  if (!supabaseConfigurado) {
    return {
      enviados: 0,
      falhas: 0,
      restantes: restantesAntes,
      atualizadas: 0,
      executou: false,
      mensagem: 'Supabase não configurado.',
    };
  }

  const sb = supabase();
  const { data: sessao } = await sb.auth.getSession();
  if (!sessao.session) {
    return {
      enviados: 0,
      falhas: 0,
      restantes: restantesAntes,
      atualizadas: 0,
      executou: false,
      mensagem: 'Sessão não encontrada. Entre novamente.',
    };
  }

  rodando = true;
  let enviados = 0;
  let falhas = 0;
  let atualizadas = 0;
  let avisoDescida: string | undefined;
  try {
    const fila = (
      await db.outbox.where('estado').anyOf('pendente_envio', 'erro').toArray()
    )
      .sort(
        (a, b) =>
          (PRIORIDADE[a.tipo] ?? 5) - (PRIORIDADE[b.tipo] ?? 5) ||
          a.criadoEm - b.criadoEm,
      )
      .slice(0, MAX_POR_CICLO);

    for (const entrada of fila) {
      const atual = await db.outbox.get(entrada.id);
      if (!atual || atual.estado === 'enviado') continue;

      try {
        await db.outbox.update(entrada.id, { estado: 'enviando', atualizadoEm: Date.now() });
        await enviarEntrada(sb, atual);
        await finalizarEnvio(atual);
        enviados += 1;
      } catch (causa) {
        console.error('[sync] falha ao enviar entrada', entrada, causa);
        await registrarErro(atual, causa);
        falhas += 1;
      }
    }

    // Descida: aplica no aparelho aprovacoes/devolucoes feitas pelo cartorio,
    // para a Etapa 2 liberar (ou a correcao aparecer) sem "Baixar dados do dia".
    try {
      atualizadas = await baixarAlteracoes();
    } catch (causa) {
      console.error('[sync] falha ao baixar alteracoes do cartorio', causa);
      avisoDescida = 'Envio concluído, mas não foi possível verificar novidades do cartório.';
    }
  } finally {
    rodando = false;
  }

  return {
    enviados,
    falhas,
    atualizadas,
    avisoDescida,
    restantes: await contarPendentes(),
    executou: true,
  };
}

async function enviarEntrada(sb: SupabaseClient, entrada: OutboxItem): Promise<void> {
  switch (entrada.tipo) {
    case 'item':
      return enviarItem(sb, entrada.refId);
    case 'evidencia':
      return enviarEvidencia(sb, entrada.refId);
    case 'desvio':
      return enviarDesvio(sb, entrada.refId);
    case 'status':
      return enviarSecao(sb, entrada.refId);
    case 'sigilo':
      // No MVP o sigilo do voto vive como item do checklist; nada a enviar aqui.
      return;
    default:
      return;
  }
}

/** Conclui a entrada da fila e marca o registro local como enviado (se ainda valer). */
async function finalizarEnvio(entrada: OutboxItem): Promise<void> {
  await db.transaction(
    'rw',
    [db.outbox, db.itens, db.evidencias, db.desvios, db.sigilo, db.secoes],
    async () => {
      const atual = await db.outbox.get(entrada.id);
      // Se o registro foi reenfileirado durante o envio, mantem pendente.
      if (!atual || atual.estado !== 'enviando') return;
      await db.outbox.update(entrada.id, { estado: 'enviado', atualizadoEm: Date.now() });
      await marcarRegistroEnviado(entrada.tipo, entrada.refId);
    },
  );
}

async function marcarRegistroEnviado(
  tipo: OutboxItem['tipo'],
  refId: string,
): Promise<void> {
  switch (tipo) {
    case 'item':
      await db.itens.update(refId, { syncState: 'enviado', dirty: false });
      return;
    case 'evidencia':
      await db.evidencias.update(refId, { syncState: 'enviado' });
      return;
    case 'desvio':
      await db.desvios.update(refId, { syncState: 'enviado' });
      return;
    case 'sigilo':
      await db.sigilo.update(refId, { syncState: 'enviado' });
      return;
    case 'status':
      await db.secoes.update(refId, { syncState: 'enviado' });
      return;
    default:
      return;
  }
}

async function registrarErro(entrada: OutboxItem, causa: unknown): Promise<void> {
  const mensagem = causa instanceof Error ? causa.message : String(causa);
  await db.transaction('rw', db.outbox, async () => {
    const atual = await db.outbox.get(entrada.id);
    if (!atual || atual.estado !== 'enviando') return;
    await db.outbox.update(entrada.id, {
      estado: 'erro',
      tentativas: atual.tentativas + 1,
      atualizadoEm: Date.now(),
      ultimoErro: mensagem,
    });
  });
}

function falha(contexto: string, message: string): never {
  throw new Error(`${contexto}: ${message}`);
}

// ---------------------------------------------------------------- item

async function enviarItem(sb: SupabaseClient, itemId: string): Promise<void> {
  const item = await db.itens.get(itemId);
  if (!item) return;

  const { error } = await sb
    .from('itens_checklist')
    .update({
      resposta: item.resposta,
      observacao: item.observacao,
      status: item.status,
    })
    .eq('id', itemId);
  if (error) falha(`item ${itemId}`, error.message);
}

// ---------------------------------------------------------------- desvio

async function enviarDesvio(sb: SupabaseClient, desvioId: string): Promise<void> {
  const desvio = await db.desvios.get(desvioId);
  if (!desvio) return;

  const { error } = await sb.from('desvios').upsert(
    {
      id: desvio.id,
      item_id: desvio.item_id,
      motivo: desvio.motivo,
      observacao: desvio.observacao,
      created_at: desvio.created_at,
    },
    { onConflict: 'id' },
  );
  if (error) falha(`desvio ${desvioId}`, error.message);
}

// ---------------------------------------------------------------- evidencia

async function enviarEvidencia(sb: SupabaseClient, evidenciaId: string): Promise<void> {
  const ev = await db.evidencias.get(evidenciaId);
  if (!ev) return;

  // 1) Metadados (a linha e o ponteiro para os arquivos).
  const { error: errLinha } = await sb.from('evidencias').upsert(
    {
      id: ev.id,
      item_id: ev.item_id,
      caminho_foto: ev.caminho_foto,
      caminho_miniatura: ev.caminho_miniatura,
      capturada_em: ev.capturada_em,
      latitude: ev.latitude,
      longitude: ev.longitude,
      autor_id: ev.autor_id,
    },
    { onConflict: 'id' },
  );
  if (errLinha) falha(`evidencia ${evidenciaId}`, errLinha.message);

  // 2) Miniatura (mais leve) e 3) foto completa.
  if (ev.thumbBlob && ev.caminho_miniatura) {
    await subirArquivo(sb, ev.caminho_miniatura, ev.thumbBlob);
  }
  if (ev.blob && ev.caminho_foto) {
    await subirArquivo(sb, ev.caminho_foto, ev.blob);
  }
}

async function subirArquivo(sb: SupabaseClient, caminho: string, blob: Blob): Promise<void> {
  const { error } = await sb.storage
    .from('evidencias')
    .upload(caminho, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) falha(`storage ${caminho}`, error.message);
}

// ---------------------------------------------------------------- secao (status + conformidade)

async function enviarSecao(sb: SupabaseClient, secaoId: string): Promise<void> {
  const secao = await db.secoes.get(secaoId);
  if (!secao) return;

  const { data, error } = await sb
    .from('secoes')
    .select('status_etapa1, status_etapa2, conforme')
    .eq('id', secaoId)
    .returns<
      { status_etapa1: StatusEtapa; status_etapa2: StatusEtapa; conforme: boolean }[]
    >();
  if (error) falha(`secao ${secaoId}`, error.message);
  const remota = data?.[0];
  if (!remota) falha(`secao ${secaoId}`, 'seção não encontrada no servidor');

  await sincronizarEtapa(sb, secaoId, 1, secao.status_etapa1, remota.status_etapa1);
  await sincronizarEtapa(sb, secaoId, 2, secao.status_etapa2, remota.status_etapa2);

  // APP-21: conformidade de sigilo (regra 1) tambem sobe para a secao.
  if (remota.conforme !== secao.conforme) {
    const { error: errConforme } = await sb
      .from('secoes')
      .update({ conforme: secao.conforme })
      .eq('id', secaoId);
    if (errConforme) falha(`conforme ${secaoId}`, errConforme.message);
  }
}

/** Conduz o status de uma etapa ate o valor local, respeitando a maquina do servidor. */
async function sincronizarEtapa(
  sb: SupabaseClient,
  secaoId: string,
  etapa: Etapa,
  local: StatusEtapa,
  remoto: StatusEtapa,
): Promise<void> {
  if (local === remoto) return;
  if (local === 'pendente') return; // a equipe nunca regride
  if (remoto === 'aprovada') return; // nao rebaixa etapa ja aprovada

  if (local === 'em_montagem') {
    if (remoto === 'pendente') await rpcStatus(sb, secaoId, etapa, 'em_montagem');
    return;
  }

  if (local === 'enviada') {
    if (remoto === 'pendente') await rpcStatus(sb, secaoId, etapa, 'em_montagem');
    await rpcStatus(sb, secaoId, etapa, 'enviada');
  }
}

async function rpcStatus(
  sb: SupabaseClient,
  secaoId: string,
  etapa: Etapa,
  novo: StatusEtapa,
): Promise<void> {
  const { error } = await sb.rpc('rpc_alterar_status_etapa', {
    p_secao: secaoId,
    p_etapa: etapa,
    p_novo: novo,
  });
  if (error) falha(`status ${secaoId}/${etapa}->${novo}`, error.message);
}
