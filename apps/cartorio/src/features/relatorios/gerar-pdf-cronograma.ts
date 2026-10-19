import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarDataCurta, hojeLocal } from '@/lib/datas';
import {
  ROTULO_ETAPA,
  rotuloPeriodo,
  type DiaDocumento,
  type EquipeDocumento,
  type EtapaDocumento,
  type MembroRelatorio,
  type RelatorioCronograma,
} from './relatorio-cronograma';

/**
 * Geração do PDF "Cronograma de Montagem de Seção" (Gestão → Relatórios).
 *
 * O documento segue o layout do modelo oficial do cartório (A4 paisagem):
 * cabeçalho institucional, título centralizado, e — por equipe, que começa em
 * uma folha nova — membros e as tabelas de cada etapa/dia na ordem de visita.
 * As colunas são apenas campos existentes no sistema: sequência, local com
 * endereço, quantidade de seções, tipo de atividade e data. Horário, origem e
 * município do modelo ficam de fora até haver cadastro para eles.
 *
 * Rodapé com emissão e paginação é carimbado em todas as folhas ao final, quando
 * o total de páginas é conhecido.
 */

// -------------------------------------------------------- layout (mm, A4 paisagem)

const LARGURA = 297;
const MARGEM_LATERAL = 12;
/** Topo de conteúdo nas folhas de continuação (abaixo do cabeçalho). */
const TOPO_PADRAO = 26;
/** Topo de conteúdo na primeira folha, sob o título. */
const TOPO_TITULO = 46;
/** Limite inferior do conteúdo (o rodapé ocupa a faixa abaixo dele). */
const BASE = 194;

const TINTA_ESCURA: [number, number, number] = [17, 24, 39];
const TINTA_CINZA: [number, number, number] = [107, 114, 128];

const TITULO_DOCUMENTO = 'Cronograma de Montagem de Seção';
const ORGAO = 'Poder Judiciário';
const CORTE = 'Tribunal Regional Eleitoral da Paraíba';
const SISTEMA =
  'MontaJE - Sistema de Gerenciamento de Cronograma de Montagem e Recolhimento';
const ELEICOES = 'Eleições: 2026 · 1º Turno';

const FORMATO_RODAPE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "19/10/2026 00:38" — sem a vírgula que o Intl insere entre data e hora. */
function formatarEmissao(data: Date): string {
  return FORMATO_RODAPE.format(data).replace(',', '');
}

interface Estado {
  /** Linha vertical corrente (topo da próxima peça de conteúdo). */
  y: number;
  /** Última folha em que o cabeçalho institucional já foi desenhado. */
  cabecalhoNaPagina: number;
}

// ------------------------------------------------------------------ utilitários

/** "Zona 1 · Período: 02/10/2026 a 24/10/2026" (só o que o recorte tem). */
function subtituloRelatorio(relatorio: RelatorioCronograma): string {
  const partes: string[] = [];
  const { zonas, periodo } = relatorio;
  if (zonas.length === 1) partes.push(`Zona ${zonas[0]}`);
  else if (zonas.length > 1) {
    partes.push(`Zonas ${zonas.slice(0, -1).join(', ')} e ${zonas[zonas.length - 1]}`);
  }
  if (periodo.de || periodo.ate) partes.push(`Período: ${rotuloPeriodo(periodo)}`);
  return partes.join(' · ');
}

/** Cabeçalho institucional, uma vez por folha (guardado pelo número da folha). */
function desenharCabecalho(doc: jsPDF, estado: Estado, pagina: number): void {
  if (estado.cabecalhoNaPagina === pagina) return;
  estado.cabecalhoNaPagina = pagina;
  doc.setPage(pagina);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TINTA_ESCURA);
  doc.text(ORGAO, MARGEM_LATERAL, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(CORTE, MARGEM_LATERAL, 17.2);

  doc.setFontSize(7.5);
  doc.setTextColor(...TINTA_CINZA);
  doc.text(SISTEMA, MARGEM_LATERAL, 20.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TINTA_ESCURA);
  doc.text(ELEICOES, LARGURA - MARGEM_LATERAL, 13, { align: 'right' });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(MARGEM_LATERAL, 23, LARGURA - MARGEM_LATERAL, 23);
}

/** Quebra de folha garantindo o cabeçalho e o topo padrão de conteúdo. */
function novaFolha(doc: jsPDF, estado: Estado): void {
  doc.addPage('a4', 'landscape');
  estado.y = TOPO_PADRAO;
  desenharCabecalho(doc, estado, doc.getCurrentPageInfo().pageNumber);
}

/** Avança para a próxima folha se `mm` abaixo de `estado.y` não couber. */
function garantirEspaco(doc: jsPDF, estado: Estado, mm: number): void {
  if (estado.y + mm <= BASE) return;
  novaFolha(doc, estado);
}

/** Rodapé de todas as folhas: emissão e paginação (total conhecido só no fim). */
function desenharRodape(doc: jsPDF, emitidoEm: Date): void {
  const total = doc.getNumberOfPages();
  const emissao = formatarEmissao(emitidoEm);
  for (let pagina = 1; pagina <= total; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.line(MARGEM_LATERAL, 197, LARGURA - MARGEM_LATERAL, 197);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TINTA_CINZA);
    doc.text(`MontaJE · Emitido em ${emissao}`, MARGEM_LATERAL, 202);
    doc.text(`Página ${pagina} de ${total}`, LARGURA - MARGEM_LATERAL, 202, {
      align: 'right',
    });
  }
}

// ------------------------------------------------------------------ blocos

function desenharMembros(doc: jsPDF, estado: Estado, membros: MembroRelatorio[]): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TINTA_ESCURA);
  doc.text('Membros:', MARGEM_LATERAL, estado.y);
  estado.y += 4.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (membros.length === 0) {
    doc.setTextColor(...TINTA_CINZA);
    doc.text('Sem membros cadastrados.', MARGEM_LATERAL + 2, estado.y);
    doc.setTextColor(...TINTA_ESCURA);
    estado.y += 4.4;
    return;
  }

  for (const membro of membros) {
    garantirEspaco(doc, estado, 4.4);
    const rotulo = membro.lider ? `${membro.nome} (Líder)` : membro.nome;
    doc.text(`• ${rotulo}`, MARGEM_LATERAL + 2, estado.y);
    estado.y += 4.4;
  }
}

function desenharTabelaDoDia(
  doc: jsPDF,
  estado: Estado,
  dia: DiaDocumento,
  etapa: EtapaDocumento,
): void {
  autoTable(doc, {
    startY: estado.y,
    theme: 'grid',
    // Uma linha (local + endereço) nunca é partida ao meio entre folhas.
    rowPageBreak: 'avoid',
    head: [['Seq.', 'Local de votação', 'Qtd. seções', 'Tipo de atividade', 'Data']],
    body: dia.escalas.map((escala) => [
      escala.ordem != null ? String(escala.ordem) : '—',
      escala.local.endereco
        ? `${escala.local.nome}\n${escala.local.endereco}`
        : escala.local.nome,
      String(escala.qtdSecoes),
      ROTULO_ETAPA[etapa.etapa],
      formatarDataCurta(dia.data),
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 1.2, right: 1.5, bottom: 1.2, left: 1.5 },
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      textColor: TINTA_ESCURA,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [244, 244, 245],
      fontStyle: 'bold',
      textColor: TINTA_ESCURA,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 169 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 46 },
      4: { cellWidth: 24, halign: 'center' },
    },
    margin: { top: TOPO_PADRAO, bottom: 16, left: MARGEM_LATERAL, right: MARGEM_LATERAL },
    didDrawPage: () => {
      desenharCabecalho(doc, estado, doc.getCurrentPageInfo().pageNumber);
    },
  });

  const ultimo = (
    doc as unknown as { lastAutoTable?: { finalY: number } }
  ).lastAutoTable;
  estado.y = (ultimo?.finalY ?? estado.y) + 6;
}

function desenharEtapa(doc: jsPDF, estado: Estado, bloco: EtapaDocumento): void {
  // Cabeçalho da etapa + primeiro dia + cabeçalho de tabela: evita folha órfã.
  garantirEspaco(doc, estado, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TINTA_ESCURA);
  doc.text(ROTULO_ETAPA[bloco.etapa], MARGEM_LATERAL, estado.y);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(MARGEM_LATERAL, estado.y + 2, LARGURA - MARGEM_LATERAL, estado.y + 2);
  estado.y += 8;

  for (const dia of bloco.dias) {
    // Título do dia + cabeçalho + ao menos uma linha da tabela.
    garantirEspaco(doc, estado, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...TINTA_ESCURA);
    doc.text(dia.rotulo, MARGEM_LATERAL, estado.y);
    estado.y += 5.5;
    desenharTabelaDoDia(doc, estado, dia, bloco);
  }
  estado.y += 3;
}

function desenharEquipe(doc: jsPDF, estado: Estado, equipe: EquipeDocumento): void {
  // Título + "Membros:" + lista inteira: a equipe nunca começa na última linha.
  garantirEspaco(doc, estado, 16 + Math.max(equipe.membros.length, 1) * 4.4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TINTA_ESCURA);
  doc.text(`Equipe: ${equipe.nome}`, MARGEM_LATERAL, estado.y);
  estado.y += 7;

  desenharMembros(doc, estado, equipe.membros);
  estado.y += 4;

  for (const bloco of equipe.etapas) {
    desenharEtapa(doc, estado, bloco);
  }
}

// ------------------------------------------------------------------ público

/** Nome do arquivo baixado: `cronograma-montagem_<de>_a_<ate>.pdf`. */
export function nomeArquivoCronograma(periodo: {
  de: string | null;
  ate: string | null;
}): string {
  const { de, ate } = periodo;
  const intervalo = de && ate ? `${de}_a_${ate}` : (de ?? ate ?? hojeLocal());
  return `cronograma-montagem_${intervalo}.pdf`;
}

/** Monta o documento pronto para download (não altera a página). */
export function montarPdfCronograma(
  relatorio: RelatorioCronograma,
  emitidoEm: Date = new Date(),
): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const estado: Estado = { y: TOPO_TITULO, cabecalhoNaPagina: 0 };
  const subtitulo = subtituloRelatorio(relatorio);

  doc.setProperties({
    title: TITULO_DOCUMENTO,
    subject: subtitulo || 'Cronograma de montagem',
    author: 'MontaJE',
    creator: 'MontaJE',
  });

  desenharCabecalho(doc, estado, 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...TINTA_ESCURA);
  doc.text(TITULO_DOCUMENTO, LARGURA / 2, 34, { align: 'center' });

  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TINTA_CINZA);
    doc.text(subtitulo, LARGURA / 2, 40, { align: 'center' });
  }
  doc.setTextColor(...TINTA_ESCURA);

  if (relatorio.equipes.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TINTA_CINZA);
    doc.text('Nenhuma escala no recorte selecionado.', LARGURA / 2, 60, {
      align: 'center',
    });
    doc.setTextColor(...TINTA_ESCURA);
  }

  relatorio.equipes.forEach((equipe, indice) => {
    // Cada equipe começa em folha nova: a seção é impressa e distribuída à parte.
    if (indice > 0) novaFolha(doc, estado);
    desenharEquipe(doc, estado, equipe);
  });

  desenharRodape(doc, emitidoEm);
  return doc;
}

/** Monta o PDF e dispara o download no navegador; devolve o nome do arquivo. */
export function baixarPdfCronograma(relatorio: RelatorioCronograma): string {
  const nome = nomeArquivoCronograma(relatorio.periodo);
  montarPdfCronograma(relatorio).save(nome);
  return nome;
}
