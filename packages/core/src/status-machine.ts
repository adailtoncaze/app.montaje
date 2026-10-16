import type { Etapa, StatusEtapa } from './enums';

/**
 * Maquina de status de cada etapa da secao.
 *
 *   pendente -> em_montagem -> enviada -> aprovada
 *                                        \-> correcao_solicitada -> enviada
 *
 * Estas sao as transicoes que a EQUIPE pode disparar. As transicoes de
 * 'enviada' para 'aprovada'/'correcao_solicitada' sao do cartorio (validacoes).
 * A mesma regra existe no banco em `rpc_alterar_status_etapa`.
 */

const TRANSICOES_EQUIPE: Record<StatusEtapa, StatusEtapa[]> = {
  pendente: ['em_montagem'],
  em_montagem: ['enviada'],
  enviada: [],
  aprovada: [],
  correcao_solicitada: ['enviada'],
};

export function transicaoValida(de: StatusEtapa, para: StatusEtapa): boolean {
  return TRANSICOES_EQUIPE[de].includes(para);
}

/** Retorna o proximo status que a equipe pode atingir, ou null. */
export function proximoStatus(de: StatusEtapa): StatusEtapa | null {
  return TRANSICOES_EQUIPE[de][0] ?? null;
}

/** A Etapa 2 so pode iniciar quando a Etapa 1 estiver aprovada (regra 5). */
export function etapaLiberada(etapa: Etapa, statusEtapa1: StatusEtapa): boolean {
  if (etapa === 1) return true;
  return statusEtapa1 === 'aprovada';
}

/** Motivo de bloqueio da Etapa 2, para exibir na tela (RF-E30). */
export function motivoBloqueioEtapa2(statusEtapa1: StatusEtapa): string | null {
  switch (statusEtapa1) {
    case 'aprovada':
      return null;
    case 'correcao_solicitada':
      return 'Etapa 1 com correção solicitada pelo cartório. Corrija e reenvie.';
    case 'enviada':
      return 'Aguardando validação da Etapa 1 pelo cartório.';
    default:
      return 'Conclua e envie a Etapa 1 primeiro.';
  }
}

/** A secao so fica aprovada quando as duas etapas estiverem aprovadas (regra 9). */
export function secaoAprovada(
  statusEtapa1: StatusEtapa,
  statusEtapa2: StatusEtapa,
): boolean {
  return statusEtapa1 === 'aprovada' && statusEtapa2 === 'aprovada';
}

/** Uma secao esta "em andamento" enquanto alguma etapa nao chegou a aprovada. */
export function secaoEmAndamento(
  statusEtapa1: StatusEtapa,
  statusEtapa2: StatusEtapa,
): boolean {
  return !secaoAprovada(statusEtapa1, statusEtapa2);
}
