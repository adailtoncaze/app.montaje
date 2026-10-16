import { supabase } from '@/lib/supabase';
import { db } from '@/db/schema';
import type {
  Cronograma,
  Desvio,
  Evidencia,
  ItemChecklist,
  LayoutPadrao,
  Local,
  ModeloChecklist,
  RespostaSigilo,
  Secao,
  Validacao,
} from '@montaje/core';

export interface ResultadoDownload {
  locais: number;
  secoes: number;
  itens: number;
  incompleto: boolean;
  avisos: string[];
  em: string;
}

function unicos<T>(valores: T[]): T[] {
  return [...new Set(valores)];
}

/**
 * APP-06 / APP-07 — Baixa previamente os dados da equipe para uso offline:
 * cronograma, locais, secoes, itens do checklist, modelo, layout, validacoes,
 * desvios, respostas de sigilo e metadados das evidencias.
 *
 * Deve ser executado com internet, antes de sair para campo (RF-E05/RF-E31).
 */
export async function baixarDadosDoDia(): Promise<ResultadoDownload> {
  const sb = supabase();
  const avisos: string[] = [];
  const em = new Date().toISOString();

  // 1) Cronograma (a RLS ja limita as equipes do usuario)
  const { data: cronograma, error: errCrono } = await sb
    .from('cronograma')
    .select('*')
    .returns<Cronograma[]>();
  if (errCrono) throw errCrono;

  const localIds = unicos(cronograma.map((c) => c.local_id));
  if (localIds.length === 0) {
    return {
      locais: 0,
      secoes: 0,
      itens: 0,
      incompleto: true,
      avisos: ['Nenhum cronograma atribuído à sua equipe. Fale com o cartório.'],
      em,
    };
  }

  // 2) Dados de referencia em paralelo
  const [locaisRes, modeloRes, layoutRes] = await Promise.all([
    sb.from('locais').select('*').in('id', localIds).returns<Local[]>(),
    sb
      .from('modelo_checklist')
      .select('*')
      .eq('ativo', true)
      .returns<ModeloChecklist[]>(),
    sb.from('layout_padrao').select('*').eq('ativo', true).returns<LayoutPadrao[]>(),
  ]);
  if (locaisRes.error) throw locaisRes.error;
  if (modeloRes.error) throw modeloRes.error;
  if (layoutRes.error) throw layoutRes.error;

  const modelo = modeloRes.data ?? [];
  if (modelo.length === 0) {
    avisos.push('O cartório ainda não definiu o checklist de montagem.');
  }

  // 3) Secoes dos locais
  const { data: secoes, error: errSecoes } = await sb
    .from('secoes')
    .select('*')
    .in('local_id', localIds)
    .returns<Secao[]>();
  if (errSecoes) throw errSecoes;
  const secaoIds = secoes.map((s) => s.id);

  // 4) Itens do checklist das secoes
  let itens: ItemChecklist[] = [];
  if (secaoIds.length > 0) {
    const { data, error } = await sb
      .from('itens_checklist')
      .select('*')
      .in('secao_id', secaoIds)
      .returns<ItemChecklist[]>();
    if (error) throw error;
    itens = data ?? [];
  }

  // 4b) Garante a materializacao das secoes sem itens
  const secoesSemItens = secoes.filter((s) => !itens.some((i) => i.secao_id === s.id));
  if (secoesSemItens.length > 0) {
    await Promise.all(
      secoesSemItens.map((s) => sb.rpc('rpc_materializar_secao', { p_secao: s.id })),
    );
    const { data, error } = await sb
      .from('itens_checklist')
      .select('*')
      .in('secao_id', secaoIds)
      .returns<ItemChecklist[]>();
    if (!error) itens = data ?? itens;
  }

  // 5) Dados ja enviados: validacoes, desvios, sigilo e metadados de evidencias
  const validRes = await sb
    .from('validacoes')
    .select('*')
    .in('secao_id', secaoIds)
    .returns<Validacao[]>();
  if (validRes.error) throw validRes.error;

  const sigiloRes = secaoIds.length
    ? await sb
        .from('respostas_sigilo')
        .select('*')
        .in('secao_id', secaoIds)
        .returns<RespostaSigilo[]>()
    : ({ data: [] as RespostaSigilo[], error: null } as const);

  const itemIds = itens.map((i) => i.id);
  const desviosRes = itemIds.length
    ? await sb.from('desvios').select('*').in('item_id', itemIds).returns<Desvio[]>()
    : ({ data: [] as Desvio[], error: null } as const);
  const evidenciasRes = itemIds.length
    ? await sb.from('evidencias').select('*').in('item_id', itemIds).returns<Evidencia[]>()
    : ({ data: [] as Evidencia[], error: null } as const);

  const sigilo = sigiloRes.data ?? [];
  const desvios = desviosRes.data ?? [];
  const evidencias = evidenciasRes.data ?? [];

  // 6) Grava tudo no IndexedDB (fonte da verdade local)
  await db.transaction(
    'rw',
    [db.locais, db.secoes, db.cronograma, db.modeloChecklist, db.itens,
     db.validacoes, db.sigilo, db.desvios, db.evidencias, db.layout, db.meta],
    async () => {
      await db.locais.bulkPut(locaisRes.data ?? []);
      await db.secoes.bulkPut(secoes.map((s) => ({ ...s, syncState: 'enviado' as const })));
      await db.cronograma.bulkPut(cronograma);
      await db.modeloChecklist.bulkPut(modelo);
      // Nao sobrescreve o que o usuario ja preencheu e ainda nao enviou
      for (const item of itens) {
        const local = await db.itens.get(item.id);
        if (local && (local.syncState === 'pendente_envio' || local.syncState === 'erro')) {
          continue;
        }
        await db.itens.put({ ...item, syncState: 'enviado' });
      }
      await db.validacoes.bulkPut(validRes.data ?? []);
      await db.sigilo.bulkPut(sigilo.map((r) => ({ ...r, syncState: 'enviado' as const })));
      await db.desvios.bulkPut(desvios.map((d) => ({ ...d, syncState: 'enviado' as const })));
      // Evidencias: nunca sobrescreve a foto capturada no aparelho e ainda nao enviada
      // (que carrega o blob) nem duplica, para o mesmo item, um registro do servidor
      // sem binario — isso faria a previa "sumir mesmo tendo sido salva".
      for (const evidencia of evidencias) {
        const locais = await db.evidencias.where('item_id').equals(evidencia.item_id).toArray();
        const temLocalPendente = locais.some(
          (l) => l.syncState === 'pendente_envio' || l.syncState === 'erro',
        );
        if (temLocalPendente) continue;

        for (const local of locais) {
          if (local.id !== evidencia.id) await db.evidencias.delete(local.id);
        }
        const existente = await db.evidencias.get(evidencia.id);
        await db.evidencias.put({
          ...evidencia,
          blob: existente?.blob,
          thumbBlob: existente?.thumbBlob,
          syncState: 'enviado' as const,
        });
      }
      if (layoutRes.data?.[0]) await db.layout.put(layoutRes.data[0]);
      await db.meta.put({ chave: 'ultima_sincronizacao', valor: em, atualizadoEm: Date.now() });
    },
  );

  // 7) APP-07: checagem de completude
  const secoesSemItensDepois = secoes.filter((s) => !itens.some((i) => i.secao_id === s.id));
  if (secoesSemItensDepois.length > 0) {
    avisos.push(
      `${secoesSemItensDepois.length} seção(ões) sem itens de checklist. Download incompleto.`,
    );
  }

  return {
    locais: locaisRes.data?.length ?? 0,
    secoes: secoes.length,
    itens: itens.length,
    incompleto: avisos.length > 0,
    avisos,
    em,
  };
}

export async function ultimaSincronizacao(): Promise<string | null> {
  const meta = await db.meta.get('ultima_sincronizacao');
  return (meta?.valor as string) ?? null;
}
