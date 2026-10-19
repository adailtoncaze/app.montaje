/**
 * Conteúdo do manual da equipe de campo.
 *
 * O texto fica aqui, como dados estruturados, para ser exibido tanto no app da
 * equipe (Fluent) quanto no painel do cartório (Tailwind) sem duplicar a
 * redação. Cada app decide como renderizar cada tipo de bloco.
 */

export type BlocoManual =
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'lista'; itens: string[]; ordenada?: boolean }
  | { tipo: 'destaque'; texto: string }
  | {
      tipo: 'tabela';
      colunas: [string, string];
      linhas: { situacao: string; acao: string }[];
    };

export interface SecaoManual {
  id: string;
  titulo: string;
  blocos: BlocoManual[];
}

export interface Manual {
  titulo: string;
  resumo: string;
  secoes: SecaoManual[];
}

export interface SegmentoTexto {
  texto: string;
  negrito: boolean;
}

/**
 * Divide um texto com marcações `**negrito**` em segmentos, para os
 * renderizadores aplicarem destaque sem precisar de uma lib de markdown.
 */
export function segmentosNegrito(texto: string): SegmentoTexto[] {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((parte) => parte.length > 0)
    .map((parte) =>
      parte.startsWith('**') && parte.endsWith('**')
        ? { texto: parte.slice(2, -2), negrito: true }
        : { texto: parte, negrito: false },
    );
}

export const MANUAL_EQUIPE_CAMPO: Manual = {
  titulo: 'Manual da equipe de campo',
  resumo:
    'Guia rápido para montar as seções e registrar as evidências pelo app. Vale para celular e tablet e funciona sem internet. Meta: concluir uma seção em até 10 minutos.',
  secoes: [
    {
      id: 'antes-de-sair',
      titulo: '1. Antes de sair (com internet)',
      blocos: [
        {
          tipo: 'lista',
          ordenada: true,
          itens: [
            'Abra o app e entre com **matrícula** e **código** do cartório.',
            'Ajustes → **Baixar dados do dia**. Espere terminar. Se aparecer "Download incompleto", avise o cartório.',
            'Confira **Locais**: devem aparecer os locais da sua equipe.',
            'Vai usar no sol? Ajustes → **Uso sob o sol** (melhora a leitura).',
            'Recomendado: Ajustes → **Salvar backup no aparelho** e guarde o arquivo.',
          ],
        },
        {
          tipo: 'destaque',
          texto:
            'Sem "Baixar dados do dia" a seção não abre. Faça isso antes de perder o sinal.',
        },
      ],
    },
    {
      id: 'no-local',
      titulo: '2. No local — passo a passo',
      blocos: [
        {
          tipo: 'lista',
          ordenada: true,
          itens: [
            '**Locais** → toque no local.',
            'Toque na seção (ex.: Seção 12).',
            'Faça a **Etapa 1** primeiro.',
            'Em cada item: **Foto** → "Tirar foto" → enquadre → confirmar; ou **Confirmação** → "Sim" / "Não".',
            'No fim: **Revisar e enviar** → **Enviar etapa**.',
          ],
        },
        {
          tipo: 'destaque',
          texto: 'A Etapa 2 só libera depois que o cartório aprovar a Etapa 1.',
        },
      ],
    },
    {
      id: 'etapa-1',
      titulo: '3. Etapa 1 — Layout, cartazes e posição da urna (fotos 1 a 3)',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Confira o modelo em **Ajustes → Modelos de montagem** e fotografe o ambiente conforme o arranjo.',
        },
      ],
    },
    {
      id: 'etapa-2',
      titulo: '4. Etapa 2 — Instalação da urna e sigilo do voto (foto 4)',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Responda as perguntas eliminatórias do **Sigilo do voto**. Qualquer "Não" deixa a seção **não conforme** e exige **Registrar desvio** no item.',
        },
      ],
    },
    {
      id: 'fotos',
      titulo: '5. Fotos — rápido',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            '**Não fotografe pessoas** — enquadre só o ambiente (cartazes, mesa, urna/cabine).',
            'Foto escura, estourada ou borrada: o app avisa → **Refazer** ou **Salvar assim mesmo**.',
            'A localização (GPS) é opcional e não bloqueia nada.',
          ],
        },
      ],
    },
    {
      id: 'enviar',
      titulo: '6. Enviar',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'O app **envia sozinho** quando houver sinal; a aba **Envio** mostra o que está na fila.',
            'Se algo ficar "Com falha", toque em **Sincronizar agora** com internet.',
            'Não precisa esperar o envio terminar para ir ao próximo local.',
          ],
        },
      ],
    },
    {
      id: 'problemas',
      titulo: '7. Se algo der errado',
      blocos: [
        {
          tipo: 'tabela',
          colunas: ['Situação', 'O que fazer'],
          linhas: [
            {
              situacao: '"Nenhum local definido"',
              acao: 'Ajustes → **Baixar dados do dia** (com internet).',
            },
            { situacao: 'Ficou sem internet', acao: 'Continue normalmente; o envio acontece depois.' },
            { situacao: 'Foto escura ou borrada', acao: '**Refazer** a foto.' },
            {
              situacao: '"Correção solicitada" pelo cartório',
              acao: 'Abra a seção → item com etiqueta **Corrigir** → ajuste e reenvie.',
            },
            { situacao: 'Respondeu "Não" no sigilo', acao: '**Registrar desvio** no item.' },
            {
              situacao: 'App fechou ou travou',
              acao: 'Reabra; os dados já ficam salvos no aparelho.',
            },
            {
              situacao: 'Vai trocar de aparelho',
              acao: 'Ajustes → **Salvar backup** → **Restaurar backup** no outro.',
            },
          ],
        },
      ],
    },
    {
      id: 'regras-de-ouro',
      titulo: '8. Regras de ouro',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            '**Nunca** use "Apagar dados locais" em campo.',
            '**Não** saia do local com itens pendentes.',
            'Antes de enviar, confira o **Resumo**: pendências e não conformes.',
            'Ao ar livre, mantenha o **Modo sol** ligado.',
          ],
        },
      ],
    },
    {
      id: 'deu-problema',
      titulo: '9. Deu problema?',
      blocos: [
        {
          tipo: 'paragrafo',
          texto: 'Anote local, seção, o que aconteceu e a hora, e avise o cartório.',
        },
        {
          tipo: 'lista',
          itens: [
            'Local / seção: ______________________',
            'Hora: __________',
            'O que aconteceu: ____________________________________________',
          ],
        },
      ],
    },
  ],
};
