import { useQuery } from '@tanstack/react-query';
import type {
  Cronograma,
  Equipe,
  Etapa,
  Local,
  MembroEquipe,
  Perfil,
  Secao,
  Vinculo,
} from '@montaje/core';
import { emailSintetico } from '@montaje/core';
import { supabase, supabaseDescartavel } from './supabase';

/**
 * Normaliza a matrícula para o formato gravado em `perfis.matricula` (que é o
 * local-part do e-mail sintético `<matrícula>@equipe.local`).
 */
function normalizarMatricula(matricula: string): string {
  return matricula.trim().toLowerCase();
}

/**
 * Camada de cadastro do painel do cartório: equipes e membros, locais com as
 * seções e o cronograma (quem monta qual local em cada dia/etapa).
 *
 * As escritas exigem papel `administrador` — a RLS do banco (`is_admin()`)
 * barra validador. As telas só oferecem estas ações a administradores.
 */

// ------------------------------------------------------------------ tipos

export interface MembroDetalhe extends MembroEquipe {
  perfil: Perfil;
}

export interface EquipeDetalhe extends Equipe {
  membros: MembroDetalhe[];
  /** Nome do líder atual (derivado de `membros_equipe.lider`). */
  liderNome: string | null;
}

export interface LocalCadastro extends Local {
  secoes: Secao[];
}

export interface EscalaDetalhe extends Cronograma {
  equipeNome: string | null;
  localNome: string | null;
  localZona: number | null;
}

export interface CriarLocalInput {
  zona: number;
  nome: string;
  endereco?: string | null;
  /** Números das seções do local. */
  secoes: number[];
}

export interface CriarEscalaInput {
  /** Data no formato `YYYY-MM-DD`. */
  data: string;
  etapa: Etapa;
  equipe_id: string;
  local_id: string;
  ordem: number | null;
}

export interface AtualizarLocalInput {
  id: string;
  zona: number;
  nome: string;
  endereco?: string | null;
}

export interface NovoUsuarioInput {
  nome: string;
  matricula: string;
  codigo: string;
  vinculo: Vinculo;
}

export interface NovoUsuarioResultado {
  /** `perfis.id` do usuário (também o `auth.uid()`). */
  perfilId: string | null;
  /** `true` quando a conta foi criada agora; `false` quando já existia. */
  criado: boolean;
  /** Aviso a exibir ao operador (ex.: confirmação de e-mail pendente). */
  aviso?: string;
}

// ------------------------------------------------------------------ leitura

interface LinhaMembro {
  id: string;
  equipe_id: string;
  perfil_id: string;
  lider: boolean;
  perfil: Perfil | null;
}

interface LinhaEquipe extends Equipe {
  membros: LinhaMembro[] | null;
}

async function listarEquipes(): Promise<EquipeDetalhe[]> {
  const { data, error } = await supabase()
    .from('equipes')
    .select('*, membros:membros_equipe(id, equipe_id, perfil_id, lider, perfil:perfis(*))')
    .order('nome')
    .returns<LinhaEquipe[]>();
  if (error) throw new Error(error.message);

  return (data ?? []).map((linha) => {
    const membros = (linha.membros ?? [])
      .filter((membro): membro is LinhaMembro & { perfil: Perfil } => Boolean(membro.perfil))
      .map<MembroDetalhe>((membro) => ({
        id: membro.id,
        equipe_id: membro.equipe_id,
        perfil_id: membro.perfil_id,
        lider: membro.lider,
        perfil: membro.perfil,
      }))
      .sort((a, b) => Number(b.lider) - Number(a.lider) || a.perfil.nome.localeCompare(b.perfil.nome, 'pt-BR'));

    return {
      ...linha,
      membros,
      liderNome: membros.find((membro) => membro.lider)?.perfil.nome ?? null,
    };
  });
}

interface LinhaLocal extends Local {
  secoes: Secao[] | null;
}

async function listarLocaisCadastro(): Promise<LocalCadastro[]> {
  const { data, error } = await supabase()
    .from('locais')
    .select('*, secoes(*)')
    .order('zona')
    .order('nome')
    .returns<LinhaLocal[]>();
  if (error) throw new Error(error.message);

  return (data ?? []).map((linha) => ({
    ...linha,
    secoes: (linha.secoes ?? []).sort((a, b) => a.numero - b.numero),
  }));
}

interface LinhaEscala extends Cronograma {
  equipe: { nome: string } | null;
  local: { nome: string; zona: number } | null;
}

async function listarCronograma(): Promise<EscalaDetalhe[]> {
  const { data, error } = await supabase()
    .from('cronograma')
    .select('*, equipe:equipes(nome), local:locais(nome, zona)')
    .order('data')
    .order('etapa')
    .order('ordem', { nullsFirst: false })
    .returns<LinhaEscala[]>();
  if (error) throw new Error(error.message);

  return (data ?? []).map((linha) => ({
    id: linha.id,
    data: linha.data,
    etapa: linha.etapa,
    equipe_id: linha.equipe_id,
    local_id: linha.local_id,
    ordem: linha.ordem,
    equipeNome: linha.equipe?.nome ?? null,
    localNome: linha.local?.nome ?? null,
    localZona: linha.local?.zona ?? null,
  }));
}

// ------------------------------------------------------------------ escrita

/** Converte erros comuns do Postgres em mensagens legíveis. */
function traduzirErro(mensagem: string, mensagemDuplicado: string): string {
  const texto = mensagem.toLowerCase();
  if (texto.includes('duplicate key') || texto.includes('23505')) return mensagemDuplicado;
  if (texto.includes('violates row-level security')) {
    return 'Seu perfil não tem permissão para esta ação. Apenas administradores podem cadastrar.';
  }
  return mensagem;
}

export async function criarEquipe(nome: string): Promise<Equipe> {
  const { data, error } = await supabase()
    .from('equipes')
    .insert({ nome: nome.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Equipe;
}

export async function renomearEquipe(id: string, nome: string): Promise<void> {
  const { error } = await supabase()
    .from('equipes')
    .update({ nome: nome.trim() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function excluirEquipe(id: string): Promise<void> {
  const { error } = await supabase().from('equipes').delete().eq('id', id);
  if (error) throw new Error(traduzirErro(error.message, 'Não foi possível excluir a equipe.'));
}

export async function buscarPerfilPorMatricula(matricula: string): Promise<Perfil | null> {
  const { data, error } = await supabase()
    .from('perfis')
    .select('*')
    .eq('matricula', normalizarMatricula(matricula))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Perfil | null) ?? null;
}

export async function adicionarMembro(
  equipeId: string,
  perfilId: string,
  lider = false,
): Promise<void> {
  const { error } = await supabase()
    .from('membros_equipe')
    .insert({ equipe_id: equipeId, perfil_id: perfilId, lider });
  if (error) throw new Error(traduzirErro(error.message, 'Este perfil já faz parte da equipe.'));
}

/**
 * Remove o vínculo de um membro com a equipe (linha em `membros_equipe`).
 * A exclusão é feita na tabela de vínculo — a mesma usada por
 * `adicionarMembro` e `listarEquipes` — e não em `perfis`: excluir o perfil
 * apagava o cadastro da pessoa inteira, esbarrava em FKs `restrict`
 * (ex.: `validacoes.validador_id`) e ainda assim podia falhar em silêncio
 * sob RLS, mantendo o vínculo no banco.
 */
export async function removerMembro(equipeId: string, perfilId: string): Promise<void> {
  const { data, error } = await supabase()
    .from('membros_equipe')
    .delete()
    .eq('equipe_id', equipeId)
    .eq('perfil_id', perfilId)
    .select('id');
  if (error) throw new Error(traduzirErro(error.message, 'Não foi possível remover o membro.'));
  if (!data?.length) {
    throw new Error('Nenhum vínculo removido. Verifique sua permissão de administrador.');
  }
}

/**
 * Define o líder da equipe (no máximo um — índice `um_lider_por_equipe`).
 * Limpa o líder anterior antes de marcar o novo e mantém `equipes.lider_id`
 * em sincronia. `perfilId = null` remove o líder.
 */
export async function definirLider(equipeId: string, perfilId: string | null): Promise<void> {
  const sb = supabase();

  const { error: erroLimpar } = await sb
    .from('membros_equipe')
    .update({ lider: false })
    .eq('equipe_id', equipeId);
  if (erroLimpar) throw new Error(erroLimpar.message);

  if (perfilId) {
    const { error: erroMarcar } = await sb
      .from('membros_equipe')
      .update({ lider: true })
      .eq('equipe_id', equipeId)
      .eq('perfil_id', perfilId);
    if (erroMarcar) throw new Error(erroMarcar.message);
  }

  const { error: erroEquipe } = await sb
    .from('equipes')
    .update({ lider_id: perfilId })
    .eq('id', equipeId);
  if (erroEquipe) throw new Error(erroEquipe.message);
}

export async function criarLocal(input: CriarLocalInput): Promise<Local> {
  const sb = supabase();
  const { data, error } = await sb
    .from('locais')
    .insert({
      zona: input.zona,
      nome: input.nome.trim(),
      endereco: input.endereco?.trim() || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const local = data as Local;

  const numeros = [...new Set(input.secoes)].sort((a, b) => a - b);
  if (numeros.length) {
    const { error: erroSecoes } = await sb
      .from('secoes')
      .insert(numeros.map((numero) => ({ local_id: local.id, numero })));
    if (erroSecoes) {
      // Desfaz o local para não deixar um registro vazio no painel.
      await sb.from('locais').delete().eq('id', local.id);
      throw new Error(traduzirErro(erroSecoes.message, 'Já existe uma seção com este número.'));
    }
  }

  return local;
}

/** Atualiza os dados cadastrais do local (as seções ficam na página do local). */
export async function atualizarLocal(input: AtualizarLocalInput): Promise<void> {
  const { error } = await supabase()
    .from('locais')
    .update({
      zona: input.zona,
      nome: input.nome.trim(),
      endereco: input.endereco?.trim() || null,
    })
    .eq('id', input.id);
  if (error) throw new Error(traduzirErro(error.message, 'Não foi possível atualizar o local.'));
}

export async function adicionarSecao(localId: string, numero: number): Promise<void> {
  const { error } = await supabase()
    .from('secoes')
    .insert({ local_id: localId, numero });
  if (error) {
    throw new Error(traduzirErro(error.message, 'Já existe uma seção com este número neste local.'));
  }
}

/**
 * Apaga no bucket privado 'evidencias' as fotos sob `{secaoId}/` (melhor
 * esforço). A cascata do banco remove as linhas de `evidencias`, mas os
 * arquivos do Storage não são apagados automaticamente.
 */
async function removerFotosDaSecao(secaoId: string): Promise<void> {
  try {
    const sb = supabase();
    const { data: pastas } = await sb.storage.from('evidencias').list(secaoId, { limit: 1000 });

    const caminhos: string[] = [];
    for (const pasta of pastas ?? []) {
      // Placeholders do Storage (ex.: `.emptyFolderPlaceholder`) não são pastas.
      if (pasta.name.startsWith('.')) continue;
      const { data: arquivos } = await sb.storage
        .from('evidencias')
        .list(`${secaoId}/${pasta.name}`, { limit: 1000 });
      for (const arquivo of arquivos ?? []) {
        caminhos.push(`${secaoId}/${pasta.name}/${arquivo.name}`);
      }
    }

    if (caminhos.length) await sb.storage.from('evidencias').remove(caminhos);
  } catch {
    // A seção já saiu do banco; fotos órfãs não podem travar a exclusão.
  }
}

/**
 * Exclui uma seção do local de votação.
 *
 * O banco remove em cascata o checklist (`itens_checklist`), as linhas de
 * `evidencias`, os `desvios`, as `respostas_sigilo` e as `validacoes`
 * (todos com `on delete cascade` em `secoes`). As fotos no bucket seguem
 * em `removerFotosDaSecao`, depois da exclusão: se a limpeza falhar, a
 * seção não "ressuscita".
 */
export async function excluirSecao(localId: string, secaoId: string): Promise<void> {
  const { data, error } = await supabase()
    .from('secoes')
    .delete()
    .eq('id', secaoId)
    .eq('local_id', localId)
    .select('id');
  if (error) throw new Error(traduzirErro(error.message, 'Não foi possível excluir a seção.'));
  // A RLS pode devolver zero linhas em silêncio (perfil sem permissão).
  if (!data?.length) {
    throw new Error('Nenhuma seção removida. Verifique sua permissão de administrador.');
  }

  await removerFotosDaSecao(secaoId);
}

export async function criarEscala(input: CriarEscalaInput): Promise<void> {
  const { error } = await supabase().from('cronograma').insert({
    data: input.data,
    etapa: input.etapa,
    equipe_id: input.equipe_id,
    local_id: input.local_id,
    ordem: input.ordem,
  });
  if (error) {
    throw new Error(
      traduzirErro(
        error.message,
        'Esta equipe já está escalada para este local nesta data e etapa.',
      ),
    );
  }
}

export async function removerEscala(id: string): Promise<void> {
  const { error } = await supabase().from('cronograma').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Atualiza uma escala. Quando a edição troca o local, a linha é recriada
 * (insere a nova antes de remover a antiga) para disparar o trigger
 * `tg_cronograma_materializa` — ele materializa os itens do checklist das
 * seções do novo local, o que um `update` simples não faria.
 */
export async function atualizarEscala(
  id: string,
  input: CriarEscalaInput,
  localAnteriorId: string,
): Promise<void> {
  const sb = supabase();
  const mensagemDuplicado =
    'Já existe uma escala para esta equipe, local, data e etapa.';

  if (input.local_id !== localAnteriorId) {
    const { error: erroInserir } = await sb.from('cronograma').insert({
      data: input.data,
      etapa: input.etapa,
      equipe_id: input.equipe_id,
      local_id: input.local_id,
      ordem: input.ordem,
    });
    if (erroInserir) {
      throw new Error(traduzirErro(erroInserir.message, mensagemDuplicado));
    }
    const { error: erroRemover } = await sb.from('cronograma').delete().eq('id', id);
    if (erroRemover) {
      throw new Error(
        traduzirErro(
          erroRemover.message,
          'A nova escala foi criada, mas a antiga não pôde ser removida. Exclua-a manualmente.',
        ),
      );
    }
    return;
  }

  const { error } = await sb
    .from('cronograma')
    .update({
      data: input.data,
      etapa: input.etapa,
      equipe_id: input.equipe_id,
      ordem: input.ordem,
    })
    .eq('id', id);
  if (error) throw new Error(traduzirErro(error.message, mensagemDuplicado));
}

/** Mensagens do Supabase Auth traduzidas para o operador. */
function traduzirErroAuth(mensagem: string): string {
  const texto = mensagem.toLowerCase();
  if (texto.includes('signups not allowed')) {
    return 'O Supabase está com o cadastro de novos usuários desativado. Ative "Allow new users to sign up" nas configurações de Auth.';
  }
  if (texto.includes('password') && texto.includes('6')) {
    return 'O código precisa ter ao menos 6 caracteres.';
  }
  return mensagem;
}

/**
 * Cria a conta da equipe (e-mail sintético `<matrícula>@equipe.local`) com o
 * código informado. O trigger `tg_auth_novo_usuario` cria a linha em `perfis`.
 * Usa um cliente descartável para não substituir a sessão do painel.
 */
export async function criarUsuarioEquipe(
  input: NovoUsuarioInput,
): Promise<NovoUsuarioResultado> {
  const matricula = normalizarMatricula(input.matricula);
  const { data, error } = await supabaseDescartavel().auth.signUp({
    email: emailSintetico(matricula),
    password: input.codigo,
    options: {
      data: {
        nome: input.nome.trim(),
        matricula,
        papel: 'equipe',
        vinculo: input.vinculo,
      },
    },
  });
  if (error) throw new Error(traduzirErroAuth(error.message));

  // O Supabase devolve sucesso com `identities` vazio quando o e-mail já existe.
  const jaExistia = (data.user?.identities?.length ?? 0) === 0;
  const perfil = await buscarPerfilPorMatricula(matricula).catch(() => null);

  if (jaExistia) {
    if (perfil) {
      return {
        perfilId: perfil.id,
        criado: false,
        aviso: 'Esta matrícula já estava cadastrada — o perfil existente foi vinculado à equipe.',
      };
    }
    throw new Error(
      'Já existe uma conta com esta matrícula, mas o perfil não foi localizado. Verifique no Supabase.',
    );
  }

  if (!data.session) {
    return {
      perfilId: perfil?.id ?? data.user?.id ?? null,
      criado: true,
      aviso:
        'Conta criada, mas o Supabase aguarda a confirmação de e-mail. Desative "Confirm email" nas configurações de Auth para que a equipe consiga entrar.',
    };
  }

  return { perfilId: perfil?.id ?? data.user?.id ?? null, criado: true };
}

// ------------------------------------------------------------------ hooks

export function useEquipes(opcoes?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['equipes'],
    queryFn: listarEquipes,
    enabled: opcoes?.enabled ?? true,
  });
}

export function useLocaisCadastro(opcoes?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['locais-cadastro'],
    queryFn: listarLocaisCadastro,
    enabled: opcoes?.enabled ?? true,
  });
}

export function useCronograma(opcoes?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['cronograma'],
    queryFn: listarCronograma,
    enabled: opcoes?.enabled ?? true,
  });
}
