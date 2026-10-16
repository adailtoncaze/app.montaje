import type { StatusEtapa } from '@montaje/core';
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
