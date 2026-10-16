/** Enums de dominio do MontaJE (espelham os tipos do Postgres em 0001). */

export type Papel = 'equipe' | 'validador' | 'administrador';
export type Vinculo = 'servidor' | 'alvt';

export type StatusEtapa =
  | 'pendente'
  | 'em_montagem'
  | 'enviada'
  | 'aprovada'
  | 'correcao_solicitada';

export type StatusItem = 'pendente' | 'conforme' | 'nao_conforme';

export type TipoItem = 'confirmacao' | 'foto';

export type MotivoDesvio =
  | 'espaco_insuficiente'
  | 'estrutura_local'
  | 'mobiliario'
  | 'outro';

export type Etapa = 1 | 2;

/** Rotulos legiveis para a interface (app e painel). */
export const ROTULO_STATUS_ETAPA: Record<StatusEtapa, string> = {
  pendente: 'Pendente',
  em_montagem: 'Em montagem',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  correcao_solicitada: 'Correção solicitada',
};

export const ROTULO_MOTIVO: Record<MotivoDesvio, string> = {
  espaco_insuficiente: 'Espaço insuficiente',
  estrutura_local: 'Estrutura do local',
  mobiliario: 'Mobiliário',
  outro: 'Outro',
};

export const ROTULO_PAPEL: Record<Papel, string> = {
  equipe: 'Equipe de montagem',
  validador: 'Validador do cartório',
  administrador: 'Administrador do cartório',
};
