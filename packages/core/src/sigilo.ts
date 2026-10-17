import type { Etapa } from './enums';

/**
 * Perguntas de sigilo do voto (secao 8.2 do PRD).
 * Ficam como constantes compartilhadas (nao viram tabela no MVP).
 * `critica: true` marca a pergunta eliminatória da Etapa 2 (regra 1).
 */

export interface PerguntaSigilo {
  id: string;
  etapa: Etapa;
  texto: string;
  critica: boolean;
}

export const PERGUNTAS_SIGILO: PerguntaSigilo[] = [
  {
    id: 'sigilo-e2-tela-teclado',
    etapa: 2,
    texto:
      'A tela e o teclado da urna ficam fora da visão de portas, janelas, fila, mesários e fiscais?',
    critica: true,
  },
  {
    id: 'sigilo-e2-posicao',
    etapa: 2,
    texto: 'A urna foi instalada na posição definida e aprovada na Etapa 1?',
    critica: true,
  },
];

export function perguntasDaEtapa(etapa: Etapa): PerguntaSigilo[] {
  return PERGUNTAS_SIGILO.filter((p) => p.etapa === etapa);
}

/** Normaliza o texto de uma pergunta para comparacao (sem acento, minusculo, espacos). */
export function normalizarPergunta(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * APP-21 — identifica se o nome de um item do checklist corresponde a uma pergunta
 * de sigilo do voto. As perguntas vivem como constantes; o checklist e semeado com
 * exatamente o mesmo texto, entao a comparacao e normalizada (acento/caixa/espaco).
 */
export function perguntaDeSigilo(nome: string): PerguntaSigilo | undefined {
  const alvo = normalizarPergunta(nome);
  return PERGUNTAS_SIGILO.find((p) => normalizarPergunta(p.texto) === alvo);
}

/** Nomes exatos (normalizados) das perguntas de sigilo, para filtros no cliente. */
export const NOMES_SIGILO_NORMALIZADOS: string[] = PERGUNTAS_SIGILO.map((p) =>
  normalizarPergunta(p.texto),
);

/** Regra 1: qualquer resposta "nao" numa pergunta de sigilo torna a secao nao conforme. */
export function sigiloConforme(
  respostas: Array<{ critica: boolean; resposta: boolean | null }>,
): boolean {
  return respostas.every((r) => r.resposta !== false);
}
