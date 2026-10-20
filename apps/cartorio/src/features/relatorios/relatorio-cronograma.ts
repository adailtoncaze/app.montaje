import type { Etapa } from '@montaje/core';
import type { EquipeDetalhe, EscalaDetalhe, LocalCadastro } from '@/lib/cadastros';
import { dataLocal, formatarDataCurta } from '@/lib/datas';

/**
 * Modelo puro do documento "Cronograma de Montagem de Seção" (Gestão →
 * Relatórios), na mesma estrutura em que o PDF é impresso: equipe → etapa →
 * dia, com as escalas de cada dia ordenadas pelo campo `ordem` de visita
 * (sem ordem no fim, desempatando por zona e nome do local).
 *
 * A montagem é pura (sem rede): os dados chegam pelos hooks de
 * `lib/cadastros`, o que mantém o modelo testável e o gerador de PDF
 * (`gerar-pdf-cronograma.ts`) apenas de apresentação.
 */

/** Rótulos das etapas, mesmos nomes das abas do detalhe da seção. */
export const ROTULO_ETAPA: Record<Etapa, string> = {
  1: 'Etapa 1 — Montagem',
  2: 'Etapa 2 — Instalação da Urna',
};

/** Tipo de atividade da etapa, usado no título do documento. */
const TIPO_ATIVIDADE: Record<Etapa, string> = {
  1: 'Montagem',
  2: 'Instalação da Urna',
};

/**
 * Título do documento: "Cronograma de Montagem" ou "Cronograma de Instalação
 * da Urna", conforme a etapa filtrada. Sem filtro de etapa, as duas aparecem
 * no mesmo documento e o título volta ao genérico.
 */
export function tituloDocumento(etapa: 'todas' | Etapa): string {
  return etapa === 'todas' ? 'Cronograma de Montagem de Seção' : `Cronograma de ${TIPO_ATIVIDADE[etapa]}`;
}

const FORMATO_DIA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** "Sexta-feira, 02 de outubro de 2026" (cabeçalho de dia no documento). */
export function rotuloDia(iso: string): string {
  const texto = FORMATO_DIA.format(dataLocal(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "17/10/2026 a 24/10/2026" (ou apenas o limite que existir). */
export function rotuloPeriodo(periodo: { de: string | null; ate: string | null }): string {
  const { de, ate } = periodo;
  if (de && ate) {
    return de === ate
      ? formatarDataCurta(de)
      : `${formatarDataCurta(de)} a ${formatarDataCurta(ate)}`;
  }
  if (de) return `a partir de ${formatarDataCurta(de)}`;
  if (ate) return `até ${formatarDataCurta(ate)}`;
  return 'Sem período';
}

// ------------------------------------------------------------------ tipos

export interface MembroRelatorio {
  nome: string;
  lider: boolean;
}

export interface EscalaDocumento {
  /** Id da linha em `cronograma` (chave estável do React). */
  id: string;
  ordem: number | null;
  local: { nome: string; zona: number; endereco: string | null };
  /** Números das seções cadastradas no local, em ordem crescente. */
  secoes: number[];
  /** Quantidade de seções cadastradas no local. */
  qtdSecoes: number;
}

export interface DiaDocumento {
  data: string;
  rotulo: string;
  escalas: EscalaDocumento[];
}

export interface EtapaDocumento {
  etapa: Etapa;
  dias: DiaDocumento[];
}

export interface EquipeDocumento {
  id: string;
  nome: string;
  membros: MembroRelatorio[];
  etapas: EtapaDocumento[];
  totalEscalas: number;
}

export interface TotaisRelatorio {
  escalas: number;
  equipes: number;
  locais: number;
  secoes: number;
  etapa1: number;
  etapa2: number;
}

export interface RelatorioCronograma {
  /** Intervalo real coberto pelas escalas do filtro (ou o filtro, se vazio). */
  periodo: { de: string | null; ate: string | null };
  /** Zonas eleitorais presentes no recorte, em ordem crescente. */
  zonas: number[];
  /** Etapa filtrada (`'todas'` = documento com as duas etapas). */
  etapa: 'todas' | Etapa;
  totais: TotaisRelatorio;
  /** Equipes em ordem alfabética, cada uma com etapas e dias. */
  equipes: EquipeDocumento[];
}

export interface FiltroRelatorio {
  /** Data inicial `YYYY-MM-DD` (vazio = sem limite). */
  de: string;
  /** Data final `YYYY-MM-DD` (vazio = sem limite). */
  ate: string;
  /** Id da equipe ou `'todas'`. */
  equipeId: string;
  etapa: 'todas' | Etapa;
}

export const FILTRO_PADRAO: FiltroRelatorio = {
  de: '',
  ate: '',
  equipeId: 'todas',
  etapa: 'todas',
};

/** Diz se há algum filtro de período/equipe/etapa aplicado ao documento. */
export function filtroAtivo(filtro: FiltroRelatorio): boolean {
  return (
    filtro.de !== '' ||
    filtro.ate !== '' ||
    filtro.equipeId !== 'todas' ||
    filtro.etapa !== 'todas'
  );
}

// ------------------------------------------------------------------ montagem

/** Ordena escalas por `ordem` (sem ordem no fim), depois zona e nome do local. */
function compararEscala(a: EscalaDocumento, b: EscalaDocumento): number {
  const ordemA = a.ordem ?? Number.MAX_SAFE_INTEGER;
  const ordemB = b.ordem ?? Number.MAX_SAFE_INTEGER;
  if (ordemA !== ordemB) return ordemA - ordemB;
  if (a.local.zona !== b.local.zona) return a.local.zona - b.local.zona;
  return a.local.nome.localeCompare(b.local.nome, 'pt-BR');
}

/**
 * Monta o documento a partir do filtro e das três listas do painel.
 * Escalas de equipes ou locais removidos aparecem com rótulo de "não
 * cadastrado" em vez de sumir do cronograma.
 */
export function montarRelatorio(
  filtro: FiltroRelatorio,
  escalas: EscalaDetalhe[],
  equipes: EquipeDetalhe[],
  locais: LocalCadastro[],
): RelatorioCronograma {
  const equipesPorId = new Map(equipes.map((equipe) => [equipe.id, equipe]));
  const locaisPorId = new Map(locais.map((local) => [local.id, local]));

  const selecionadas = escalas.filter((escala) => {
    if (filtro.equipeId !== 'todas' && escala.equipe_id !== filtro.equipeId) return false;
    if (filtro.etapa !== 'todas' && escala.etapa !== filtro.etapa) return false;
    if (filtro.de && escala.data < filtro.de) return false;
    if (filtro.ate && escala.data > filtro.ate) return false;
    return true;
  });

  const paraEscala = (escala: EscalaDetalhe): EscalaDocumento => {
    const local = locaisPorId.get(escala.local_id);
    const secoes = (local?.secoes ?? []).map((secao) => secao.numero);
    return {
      id: escala.id,
      ordem: escala.ordem,
      local: {
        nome: local?.nome ?? escala.localNome ?? 'Local não cadastrado',
        zona: local?.zona ?? escala.localZona ?? 0,
        endereco: local?.endereco ?? null,
      },
      secoes,
      qtdSecoes: secoes.length,
    };
  };

  // Equipe -> etapa -> dia -> escalas ordenadas pela ordem de visita.
  const porEquipe = new Map<string, EscalaDetalhe[]>();
  for (const escala of selecionadas) {
    const lista = porEquipe.get(escala.equipe_id);
    if (lista) lista.push(escala);
    else porEquipe.set(escala.equipe_id, [escala]);
  }

  const equipesDocumento: EquipeDocumento[] = [...porEquipe.entries()]
    .map(([equipeId, lista]) => {
      const equipe = equipesPorId.get(equipeId);

      const etapas: EtapaDocumento[] = [];
      for (const etapa of [1, 2] as const) {
        const daEtapa = lista.filter((escala) => escala.etapa === etapa);
        if (daEtapa.length === 0) continue;

        const porData = new Map<string, EscalaDetalhe[]>();
        for (const escala of daEtapa) {
          const doDia = porData.get(escala.data);
          if (doDia) doDia.push(escala);
          else porData.set(escala.data, [escala]);
        }

        const dias: DiaDocumento[] = [...porData.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([data, escalasDoDia]) => ({
            data,
            rotulo: rotuloDia(data),
            escalas: escalasDoDia.map(paraEscala).sort(compararEscala),
          }));
        etapas.push({ etapa, dias });
      }

      return {
        id: equipeId,
        nome: equipe?.nome ?? lista[0].equipeNome ?? 'Equipe não cadastrada',
        membros: equipe?.membros.map((membro) => ({
          nome: membro.perfil.nome,
          lider: membro.lider,
        })) ?? [],
        etapas,
        totalEscalas: lista.length,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const locaisIds = new Set(selecionadas.map((escala) => escala.local_id));
  let etapa1 = 0;
  let secoes = 0;
  const zonas = new Set<number>();
  for (const escala of selecionadas) {
    if (escala.etapa === 1) etapa1 += 1;
  }
  for (const localId of locaisIds) {
    const local = locaisPorId.get(localId);
    if (local) {
      secoes += local.secoes.length;
      if (local.zona > 0) zonas.add(local.zona);
    } else {
      const escala = selecionadas.find((item) => item.local_id === localId);
      if (escala?.localZona) zonas.add(escala.localZona);
    }
  }

  const datas = selecionadas.map((escala) => escala.data).sort();
  const periodo = {
    de: datas[0] ?? (filtro.de || null),
    ate: datas[datas.length - 1] ?? (filtro.ate || null),
  };

  return {
    periodo,
    zonas: [...zonas].sort((a, b) => a - b),
    etapa: filtro.etapa,
    totais: {
      escalas: selecionadas.length,
      equipes: equipesDocumento.length,
      locais: locaisIds.size,
      secoes,
      etapa1,
      etapa2: selecionadas.length - etapa1,
    },
    equipes: equipesDocumento,
  };
}
