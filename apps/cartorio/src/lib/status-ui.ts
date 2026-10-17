import type { StatusEtapa, StatusItem } from '@montaje/core';
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

/** Prioridade de atendimento na lista: o que precisa do cartório vem primeiro. */
export function prioridadeStatus(status: StatusEtapa): number {
  switch (status) {
    case 'enviada':
      return 0;
    case 'correcao_solicitada':
      return 1;
    case 'em_montagem':
      return 2;
    case 'pendente':
      return 3;
    default:
      return 4;
  }
}
