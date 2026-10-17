import { useQuery } from '@tanstack/react-query';
import type {
  Desvio,
  Evidencia,
  ItemChecklist,
  RespostaSigilo,
  Secao,
  Validacao,
  ValidacaoInput,
} from '@montaje/core';
import { supabase } from './supabase';

/**
 * Camada de acesso a dados do painel do cartório.
 *
 * Diferente do app da equipe (offline, IndexedDB), o painel é online: lê e escreve
 * direto no Supabase. A RLS já libera leitura para `is_cartorio()` e a escrita de
 * validações exige `validador_id = auth.uid()`.
 */

export interface LocalResumo {
  id: string;
  zona: number;
  nome: string;
}

export type SecaoComLocal = Secao & { local: LocalResumo | null };

export interface SecaoResumo extends SecaoComLocal {
  /** Total de itens das duas etapas. */
  totalItens: number;
  /** Itens da Etapa 1 já respondidos (status <> pendente). */
  itensConcluidos: number;
  /**Quantidade de evidências (fotos) da seção. */
  fotos: number;
}

export interface ValidacaoComAutor extends Validacao {
  validadorNome: string | null;
}

export interface SecaoDetalhe {
  secao: SecaoComLocal;
  itens: ItemChecklist[];
  evidenciasPorItem: Record<string, Evidencia[]>;
  desvioPorItem: Record<string, Desvio>;
  sigilo: RespostaSigilo[];
  /** caminho no bucket -> URL assinada temporária. */
  urls: Record<string, string>;
  validacoes: ValidacaoComAutor[];
  /** Nomes das equipes escaladas para o local (via cronograma). */
  equipes: string[];
}

// ------------------------------------------------------------------ paginação

interface RespostaPaginada<T> {
  data: T[] | null;
  error: { message: string } | null;
}

const TAMANHO_PAGINA = 1000;

/**
 * Percorre todas as páginas de uma consulta. O PostgREST devolve no máximo 1000
 * linhas por padrão, então agregados do painel (todas as seções) precisam paginar.
 */
async function buscarTudo<T>(
  pagina: (de: number, ate: number) => PromiseLike<RespostaPaginada<T>>,
): Promise<T[]> {
  const tudo: T[] = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data, error } = await pagina(de, de + TAMANHO_PAGINA - 1);
    if (error) throw new Error(error.message);
    const linha = data ?? [];
    tudo.push(...linha);
    if (linha.length < TAMANHO_PAGINA) break;
  }
  return tudo;
}

// ------------------------------------------------------------------ leitura

interface ItemResumo {
  id: string;
  secao_id: string;
  etapa: number;
  status: string;
}

export async function listarSecoes(): Promise<SecaoResumo[]> {
  const sb = supabase();

  const [secoesRes, itens, evidencias] = await Promise.all([
    sb
      .from('secoes')
      .select('*, local:locais(id, zona, nome)')
      .order('numero')
      .returns<SecaoComLocal[]>(),
    buscarTudo<ItemResumo>((de, ate) =>
      sb
        .from('itens_checklist')
        .select('id, secao_id, etapa, status')
        .order('id')
        .range(de, ate)
        .returns<ItemResumo[]>(),
    ),
    buscarTudo<{ item_id: string }>((de, ate) =>
      sb.from('evidencias').select('item_id').order('id').range(de, ate).returns<{ item_id: string }[]>(),
    ),
  ]);

  if (secoesRes.error) throw new Error(secoesRes.error.message);

  const secoes = secoesRes.data ?? [];

  const secaoDoItem = new Map<string, string>();
  const total = new Map<string, number>();
  const concluidos = new Map<string, number>();

  for (const item of itens) {
    secaoDoItem.set(item.id, item.secao_id);
    total.set(item.secao_id, (total.get(item.secao_id) ?? 0) + 1);
    if (item.etapa === 1 && item.status !== 'pendente') {
      concluidos.set(item.secao_id, (concluidos.get(item.secao_id) ?? 0) + 1);
    }
  }

  const fotos = new Map<string, number>();
  for (const ev of evidencias) {
    const secaoId = secaoDoItem.get(ev.item_id);
    if (secaoId) fotos.set(secaoId, (fotos.get(secaoId) ?? 0) + 1);
  }

  return secoes.map((secao) => ({
    ...secao,
    totalItens: total.get(secao.id) ?? 0,
    itensConcluidos: concluidos.get(secao.id) ?? 0,
    fotos: fotos.get(secao.id) ?? 0,
  }));
}

export async function obterSecao(secaoId: string): Promise<SecaoDetalhe> {
  const sb = supabase();

  const { data, error } = await sb
    .from('secoes')
    .select('*, local:locais(id, zona, nome)')
    .eq('id', secaoId)
    .single();
  if (error) throw new Error(error.message);
  const secao = data as SecaoComLocal;

  const { data: itensData, error: errItens } = await sb
    .from('itens_checklist')
    .select('*')
    .eq('secao_id', secaoId)
    .order('etapa')
    .order('ordem')
    .returns<ItemChecklist[]>();
  if (errItens) throw new Error(errItens.message);
  const itens = itensData ?? [];
  const ids = itens.map((item) => item.id);

  const [evidencias, desvios, sigilo, validacoes, equipes] = await Promise.all([
    buscarEvidencias(ids),
    buscarDesvios(ids),
    buscarSigilo(secaoId),
    buscarValidacoes(secaoId),
    buscarEquipes(secao.local_id),
  ]);

  const evidenciasPorItem: Record<string, Evidencia[]> = {};
  for (const ev of evidencias) {
    (evidenciasPorItem[ev.item_id] ??= []).push(ev);
  }

  const desvioPorItem: Record<string, Desvio> = {};
  for (const desvio of desvios) {
    desvioPorItem[desvio.item_id] = desvio;
  }

  const caminhos = evidencias
    .flatMap((ev) => [ev.caminho_miniatura, ev.caminho_foto])
    .filter((caminho): caminho is string => Boolean(caminho));
  const urls = await assinarCaminhos(caminhos);

  return { secao, itens, evidenciasPorItem, desvioPorItem, sigilo, urls, validacoes, equipes };
}

async function buscarEvidencias(itemIds: string[]): Promise<Evidencia[]> {
  if (!itemIds.length) return [];
  const { data, error } = await supabase()
    .from('evidencias')
    .select('*')
    .in('item_id', itemIds)
    .returns<Evidencia[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function buscarDesvios(itemIds: string[]): Promise<Desvio[]> {
  if (!itemIds.length) return [];
  const { data, error } = await supabase()
    .from('desvios')
    .select('*')
    .in('item_id', itemIds)
    .returns<Desvio[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function buscarSigilo(secaoId: string): Promise<RespostaSigilo[]> {
  const { data, error } = await supabase()
    .from('respostas_sigilo')
    .select('*')
    .eq('secao_id', secaoId)
    .returns<RespostaSigilo[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function buscarValidacoes(secaoId: string): Promise<ValidacaoComAutor[]> {
  const { data, error } = await supabase()
    .from('validacoes')
    .select('*, validador:perfis(nome)')
    .eq('secao_id', secaoId)
    .order('data', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((linha: Record<string, unknown>) => ({
    ...(linha as unknown as Validacao),
    validadorNome:
      (linha.validador as { nome?: string } | null | undefined)?.nome ?? null,
  }));
}

async function buscarEquipes(localId: string): Promise<string[]> {
  const { data } = await supabase()
    .from('cronograma')
    .select('equipe:equipes(nome)')
    .eq('local_id', localId);
  const nomes = new Set<string>();
  for (const linha of data ?? []) {
    const nome = (linha as { equipe?: { nome?: string } | null }).equipe?.nome;
    if (nome) nomes.add(nome);
  }
  return [...nomes];
}

async function assinarCaminhos(caminhos: string[]): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  if (!caminhos.length) return urls;

  const { data, error } = await supabase()
    .storage.from('evidencias')
    .createSignedUrls(caminhos, 3600);
  if (error) return urls;

  for (const assinada of data ?? []) {
    if (assinada.path && assinada.signedUrl) urls[assinada.path] = assinada.signedUrl;
  }
  return urls;
}

// ------------------------------------------------------------------ escrita

/** Registra a validação. O trigger do banco aplica o status na seção. */
export async function validarSecao(
  input: ValidacaoInput,
  validadorId: string,
): Promise<void> {
  const { error } = await supabase()
    .from('validacoes')
    .insert({
      secao_id: input.secao_id,
      validador_id: validadorId,
      etapa: input.etapa,
      status: input.status,
      comentario: input.comentario?.trim() || null,
      item_devolvido: input.item_devolvido || null,
    });
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------ hooks

export function useSecoes() {
  return useQuery({ queryKey: ['secoes'], queryFn: listarSecoes });
}

export function useSecao(secaoId: string) {
  return useQuery({
    queryKey: ['secao', secaoId],
    queryFn: () => obterSecao(secaoId),
    enabled: Boolean(secaoId),
  });
}
