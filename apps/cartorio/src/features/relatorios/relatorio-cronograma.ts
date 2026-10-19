import type { Etapa, Secao, StatusEtapa, Vinculo } from '@montaje/core';
import type { EquipeDetalhe, EscalaDetalhe, LocalCadastro, MembroDetalhe } from '@/lib/cadastros';
import { dataLocal } from '@/lib/datas';
import { situacaoSecao, type SituacaoSecao } from '@/lib/status-ui';

/**
 * Modelo do relatório de cronograma de montagem.
 *
 * Consolida as três fontes do painel — cronograma (escalas), equipes (com
 * membros) e locais (com seções) — em um documento único, agrupado por dia e
 * por etapa, com as escalas ordenadas pelo campo `ordem` de visita (sem ordem
 * vão para o fim, desempatando por zona e nome do local).
 *
 * A montagem é pura (sem rede): os dados chegam pelos hooks de
 * `lib/cadastros`, o que mantém o relatório testável e reutilizável.
 */

/** Rótulos das etapas, mesmos nomes das abas do detalhe da seção. */
export const ROTULO_ETAPA: Record<Etapa, string> = {
  1: 'Etapa 1 — Montagem',
  2: 'Etapa 2 — Sigilo do voto',
};

const ROTULO_VINCULO: Record<Vinculo, string> = {
  servidor: 'Servidor',
  alvt: 'ALVT',
};

/** "Servidor" / "ALVT". */
export function rotuloVinculo(vinculo: Vinculo): string {
  return ROTULO_VINCULO[vinculo];
}

const FORMATO_DIA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** "Quinta-feira, 23 de outubro de 2026" (com ano, para o documento impresso). */
export function rotuloDia(iso: string): string {
  const texto = FORMATO_DIA.format(dataLocal(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ------------------------------------------------------------------ tipos

export interface MembroRelatorio {
  nome: string;
  matricula: string;
  vinculo: Vinculo;
  lider: boolean;
}

export interface SecaoRelatorio {
  numero: number;
  etapa1: StatusEtapa;
  etapa2: StatusEtapa;
  situacao: SituacaoSecao;
  /** Sigilo do voto conferido na montagem (`secoes.conforme`). */
  conforme: boolean;
}

export interface EquipeRelatorio {
  id: string;
  nome: string;
  lider: string | null;
  membros: MembroRelatorio[];
  totalEscalas: number;
  /** Datas únicas atendidas, em ordem. */
  datas: string[];
  /** Locais atendidos, em ordem de zona. */
  locais: string[];
  etapas: Etapa[];
}

export interface EscalaRelatorio {
  /** Id da linha em `cronograma` (chave estável do React). */
  id: string;
  ordem: number | null;
  local: { nome: string; zona: number; endereco: string | null };
  equipe: { nome: string; lider: string | null; membros: MembroRelatorio[] };
  secoes: SecaoRelatorio[];
}

export interface BlocoEtapaRelatorio {
  etapa: Etapa;
  escalas: EscalaRelatorio[];
}

export interface DiaRelatorio {
  data: string;
  rotulo: string;
  etapas: BlocoEtapaRelatorio[];
  totalEscalas: number;
}

export interface VisitaLocal {
  data: string;
  etapa: Etapa;
  equipe: string;
  ordem: number | null;
}

export interface LocalRelatorio {
  id: string;
  zona: number;
  nome: string;
  endereco: string | null;
  secoes: SecaoRelatorio[];
  visitas: VisitaLocal[];
}

export interface TotaisRelatorio {
  dias: number;
  escalas: number;
  etapa1: number;
  etapa2: number;
  equipes: number;
  locais: number;
  secoes: number;
}

export interface RelatorioCronograma {
  /** Intervalo real coberto pelas escalas do filtro (ou o filtro, se vazio). */
  periodo: { de: string | null; ate: string | null };
  totais: TotaisRelatorio;
  dias: DiaRelatorio[];
  equipes: EquipeRelatorio[];
  locais: LocalRelatorio[];
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

/** Diz se há algum filtro de período/equipe/etapa aplicado ao relatório. */
export function filtroAtivo(filtro: FiltroRelatorio): boolean {
  return (
    filtro.de !== '' ||
    filtro.ate !== '' ||
    filtro.equipeId !== 'todas' ||
    filtro.etapa !== 'todas'
  );
}

// ------------------------------------------------------------------ conversão

function paraMembro(membro: MembroDetalhe): MembroRelatorio {
  return {
    nome: membro.perfil.nome,
    matricula: membro.perfil.matricula,
    vinculo: membro.perfil.vinculo,
    lider: membro.lider,
  };
}

function paraSecao(secao: Secao): SecaoRelatorio {
  return {
    numero: secao.numero,
    etapa1: secao.status_etapa1,
    etapa2: secao.status_etapa2,
    situacao: situacaoSecao(secao),
    conforme: secao.conforme,
  };
}

/** Descrição de um membro para as linhas compactas do relatório. */
export function descreverMembro(membro: MembroRelatorio): string {
  const papel = membro.lider ? ' · líder' : '';
  return `${membro.nome} (${membro.matricula} · ${rotuloVinculo(membro.vinculo)}${papel})`;
}

/** Ordena escalas por `ordem` (sem ordem no fim), depois zona e nome do local. */
function compararEscala(a: EscalaRelatorio, b: EscalaRelatorio): number {
  const ordemA = a.ordem ?? Number.MAX_SAFE_INTEGER;
  const ordemB = b.ordem ?? Number.MAX_SAFE_INTEGER;
  if (ordemA !== ordemB) return ordemA - ordemB;
  if (a.local.zona !== b.local.zona) return a.local.zona - b.local.zona;
  return a.local.nome.localeCompare(b.local.nome, 'pt-BR');
}

// ------------------------------------------------------------------ montagem

/**
 * Monta o relatório a partir do filtro e das três listas do painel.
 * Entradas que não existem mais (equipe/local removidos) aparecem com rótulo
 * de "não cadastrado" em vez de sumir do documento.
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

  const paraEscala = (escala: EscalaDetalhe): EscalaRelatorio => {
    const equipe = equipesPorId.get(escala.equipe_id);
    const local = locaisPorId.get(escala.local_id);
    return {
      id: escala.id,
      ordem: escala.ordem,
      local: {
        nome: local?.nome ?? escala.localNome ?? 'Local não cadastrado',
        zona: local?.zona ?? escala.localZona ?? 0,
        endereco: local?.endereco ?? null,
      },
      equipe: {
        nome: equipe?.nome ?? escala.equipeNome ?? 'Equipe não cadastrada',
        lider: equipe?.liderNome ?? null,
        membros: equipe ? equipe.membros.map(paraMembro) : [],
      },
      secoes: local ? local.secoes.map(paraSecao) : [],
    };
  };

  // Dia -> etapa -> escalas ordenadas pela ordem de visita.
  const porDia = new Map<string, Map<Etapa, EscalaRelatorio[]>>();
  for (const escala of selecionadas) {
    const etapasDoDia = porDia.get(escala.data);
    if (etapasDoDia) {
      const lista = etapasDoDia.get(escala.etapa);
      if (lista) lista.push(paraEscala(escala));
      else etapasDoDia.set(escala.etapa, [paraEscala(escala)]);
    } else {
      porDia.set(escala.data, new Map([[escala.etapa, [paraEscala(escala)]]]));
    }
  }

  const dias: DiaRelatorio[] = [...porDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, etapasDoDia]) => {
      const blocos: BlocoEtapaRelatorio[] = [];
      let totalEscalas = 0;
      for (const etapa of [1, 2] as const) {
        const lista = etapasDoDia.get(etapa);
        if (!lista) continue;
        const ordenadas = [...lista].sort(compararEscala);
        blocos.push({ etapa, escalas: ordenadas });
        totalEscalas += ordenadas.length;
      }
      return { data, rotulo: rotuloDia(data), etapas: blocos, totalEscalas };
    });

  // Equipes consolidadas: escalam, membros e locais que atendem no período.
  const equipesRelatorio = new Map<string, EquipeRelatorio>();
  const locaisRelatorio = new Map<string, LocalRelatorio>();
  let etapa1 = 0;

  for (const escala of selecionadas) {
    if (escala.etapa === 1) etapa1 += 1;

    const equipe = equipesPorId.get(escala.equipe_id);
    const local = locaisPorId.get(escala.local_id);
    const nomeEquipe = equipe?.nome ?? escala.equipeNome ?? 'Equipe não cadastrada';
    const nomeLocal = local
      ? `Zona ${local.zona} · ${local.nome}`
      : escala.localNome
        ? `Local não cadastrado · ${escala.localNome}`
        : 'Local não cadastrado';

    let equipeRelatorio = equipesRelatorio.get(escala.equipe_id);
    if (!equipeRelatorio) {
      equipeRelatorio = {
        id: escala.equipe_id,
        nome: nomeEquipe,
        lider: equipe?.liderNome ?? null,
        membros: equipe ? equipe.membros.map(paraMembro) : [],
        totalEscalas: 0,
        datas: [],
        locais: [],
        etapas: [],
      };
      equipesRelatorio.set(escala.equipe_id, equipeRelatorio);
    }
    equipeRelatorio.totalEscalas += 1;
    if (!equipeRelatorio.datas.includes(escala.data)) equipeRelatorio.datas.push(escala.data);
    if (!equipeRelatorio.locais.includes(nomeLocal)) equipeRelatorio.locais.push(nomeLocal);
    if (!equipeRelatorio.etapas.includes(escala.etapa)) equipeRelatorio.etapas.push(escala.etapa);

    let localRelatorio = locaisRelatorio.get(escala.local_id);
    if (!localRelatorio) {
      localRelatorio = {
        id: escala.local_id,
        zona: local?.zona ?? escala.localZona ?? 0,
        nome: local?.nome ?? escala.localNome ?? 'Local não cadastrado',
        endereco: local?.endereco ?? null,
        secoes: local ? local.secoes.map(paraSecao) : [],
        visitas: [],
      };
      locaisRelatorio.set(escala.local_id, localRelatorio);
    }
    localRelatorio.visitas.push({
      data: escala.data,
      etapa: escala.etapa,
      equipe: nomeEquipe,
      ordem: escala.ordem,
    });
  }

  /**
   * Locais vêm na ordem da primeira visita (data, etapa e campo `ordem`), que
   * é a sequência real de atendimento; zona e nome desempatam.
   */
  const compararLocais = (a: LocalRelatorio, b: LocalRelatorio): number => {
    const primeiraA = a.visitas[0];
    const primeiraB = b.visitas[0];
    if (primeiraA && primeiraB) {
      const ordemA = primeiraA.ordem ?? Number.MAX_SAFE_INTEGER;
      const ordemB = primeiraB.ordem ?? Number.MAX_SAFE_INTEGER;
      return (
        primeiraA.data.localeCompare(primeiraB.data) ||
        primeiraA.etapa - primeiraB.etapa ||
        ordemA - ordemB
      );
    }
    return a.zona - b.zona || a.nome.localeCompare(b.nome, 'pt-BR');
  };

  const equipesOrdenadas = [...equipesRelatorio.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR'),
  );

  for (const equipe of equipesOrdenadas) {
    equipe.datas.sort();
    equipe.locais.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    equipe.etapas.sort();
  }

  const locaisOrdenados = [...locaisRelatorio.values()];
  for (const local of locaisOrdenados) {
    local.visitas.sort(
      (a, b) =>
        a.data.localeCompare(b.data) ||
        a.etapa - b.etapa ||
        (a.ordem ?? Number.MAX_SAFE_INTEGER) - (b.ordem ?? Number.MAX_SAFE_INTEGER),
    );
  }
  locaisOrdenados.sort(compararLocais);

  const datas = selecionadas.map((escala) => escala.data).sort();
  const periodo = {
    de: datas[0] ?? (filtro.de || null),
    ate: datas[datas.length - 1] ?? (filtro.ate || null),
  };

  return {
    periodo,
    totais: {
      dias: dias.length,
      escalas: selecionadas.length,
      etapa1,
      etapa2: selecionadas.length - etapa1,
      equipes: equipesOrdenadas.length,
      locais: locaisOrdenados.length,
      secoes: locaisOrdenados.reduce((soma, local) => soma + local.secoes.length, 0),
    },
    dias,
    equipes: equipesOrdenadas,
    locais: locaisOrdenados,
  };
}
