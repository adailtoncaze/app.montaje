import type { Secao, StatusEtapa, StatusItem } from '@montaje/core';
import type { TomSelo } from '@montaje/ui';

/** Mapeia o status da etapa para o tom visual (design system do Teams). */
export function tomStatusEtapa(status: StatusEtapa): TomSelo {
  switch (status) {
    case 'aprovada':
      return 'ok';
    case 'enviada':
      return 'marca';
    case 'correcao_solicitada':
      return 'erro';
    case 'em_montagem':
      return 'alerta';
    default:
      return 'neutro';
  }
}

export function tomStatusItem(status: StatusItem): TomSelo {
  switch (status) {
    case 'conforme':
      return 'ok';
    case 'nao_conforme':
      return 'erro';
    default:
      return 'neutro';
  }
}

export const ROTULO_STATUS_ITEM: Record<StatusItem, string> = {
  pendente: 'Pendente',
  conforme: 'Conforme',
  nao_conforme: 'Não conforme',
};

/**
 * Situação agregada da seção (as duas etapas juntas), para o cartório priorizar
 * o que precisa de ação: validação pendente -> correção -> em andamento -> concluída.
 */
export type SituacaoSecao = 'aguardando' | 'correcao' | 'em_andamento' | 'concluida';

export function situacaoSecao(
  secao: Pick<Secao, 'status_etapa1' | 'status_etapa2'>,
): SituacaoSecao {
  const { status_etapa1: e1, status_etapa2: e2 } = secao;
  if (e1 === 'aprovada' && e2 === 'aprovada') return 'concluida';
  if (e1 === 'enviada' || e2 === 'enviada') return 'aguardando';
  if (e1 === 'correcao_solicitada' || e2 === 'correcao_solicitada') return 'correcao';
  return 'em_andamento';
}

export const ROTULO_SITUACAO: Record<SituacaoSecao, string> = {
  aguardando: 'Aguardando validação',
  correcao: 'Correção solicitada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

export function tomSituacao(situacao: SituacaoSecao): TomSelo {
  switch (situacao) {
    case 'aguardando':
      return 'marca';
    case 'correcao':
      return 'erro';
    case 'concluida':
      return 'ok';
    default:
      return 'alerta';
  }
}

export function prioridadeSituacao(situacao: SituacaoSecao): number {
  switch (situacao) {
    case 'aguardando':
      return 0;
    case 'correcao':
      return 1;
    case 'em_andamento':
      return 2;
    default:
      return 3;
  }
}

/** A "pior" situação entre duas (a que exige ação mais urgente). */
export function piorSituacao(a: SituacaoSecao, b: SituacaoSecao): SituacaoSecao {
  return prioridadeSituacao(a) <= prioridadeSituacao(b) ? a : b;
}
