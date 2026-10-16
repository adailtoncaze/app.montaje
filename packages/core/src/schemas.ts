import { z } from 'zod';

/** Schemas de validacao compartilhados entre app e painel. */

export const zPapel = z.enum(['equipe', 'validador', 'administrador']);
export const zVinculo = z.enum(['servidor', 'alvt']);
export const zEtapa = z.union([z.literal(1), z.literal(2)]);
export const zMotivoDesvio = z.enum([
  'espaco_insuficiente',
  'estrutura_local',
  'mobiliario',
  'outro',
]);

/** Login da equipe: matricula + codigo (RF-E01). */
export const zLoginEquipe = z.object({
  matricula: z
    .string()
    .trim()
    .min(3, 'Informe a matrícula')
    .regex(/^[0-9A-Za-z._-]+$/, 'Matrícula inválida'),
  codigo: z.string().min(4, 'Informe o código'),
});

/** Desvio (RF-E20/E21). */
export const zDesvio = z
  .object({
    item_id: z.string().uuid(),
    motivo: zMotivoDesvio,
    observacao: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (d) => d.motivo !== 'outro' || (d.observacao && d.observacao.length > 0),
    { message: 'Observação é obrigatória quando o motivo for "Outro"', path: ['observacao'] },
  );

/** Resposta de sigilo. */
export const zRespostaSigilo = z.object({
  secao_id: z.string().uuid(),
  pergunta: z.string().min(1),
  critica: z.boolean().default(false),
  resposta: z.boolean(),
});

/** Validacao do cartorio (RF-C11). */
export const zValidacao = z
  .object({
    secao_id: z.string().uuid(),
    etapa: zEtapa,
    status: z.enum(['aprovada', 'correcao_solicitada']),
    item_devolvido: z.string().uuid().optional().nullable(),
    comentario: z.string().trim().max(1000).optional().nullable(),
  })
  .refine(
    (v) =>
      v.status !== 'correcao_solicitada' ||
      (!!v.item_devolvido && !!v.comentario && v.comentario.length > 0),
    { message: 'Devolução exige o item e um comentário', path: ['comentario'] },
  );

/** Login do cartorio. */
export const zLoginCartorio = z.object({
  identificador: z.string().trim().min(3, 'Informe e-mail ou matrícula'),
  senha: z.string().min(6, 'Informe a senha'),
});

/** E-mail sintetico a partir da matricula (arquitetura do PRD). */
export function emailSintetico(matricula: string): string {
  return `${matricula.trim().toLowerCase()}@equipe.local`;
}

export type LoginEquipe = z.infer<typeof zLoginEquipe>;
export type DesvioInput = z.infer<typeof zDesvio>;
export type ValidacaoInput = z.infer<typeof zValidacao>;
export type LoginCartorio = z.infer<typeof zLoginCartorio>;
