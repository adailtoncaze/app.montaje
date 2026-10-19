/**
 * APP-27 — snapshot/backup local.
 *
 * Exporta tudo o que está no aparelho (incluindo as fotos, ainda em memória)
 * para um único arquivo `.json` que a equipe pode guardar ou enviar. Também
 * permite restaurar esse arquivo, substituindo os dados locais — útil quando
 * o navegador perde o IndexedDB ou um aparelho precisa ser trocado em campo.
 */
import type {
  Cronograma,
  LayoutPadrao,
  Local,
  ModeloChecklist,
  Perfil,
  Validacao,
} from '@montaje/core';
import {
  db,
  type DesvioLocal,
  type EvidenciaLocal,
  type ItemLocal,
  type MetaLocal,
  type OutboxItem,
  type SecaoLocal,
  type SigiloLocal,
} from './schema';

const MARCADOR = 'montaje-equipe-backup';
const VERSAO = 1;

/** Evidência sem os binários: fotos viajam como base64 para caber em um JSON. */
type EvidenciaBackup = Omit<EvidenciaLocal, 'blob' | 'thumbBlob'> & {
  blobBase64?: string;
  blobTipo?: string;
  thumbBase64?: string;
  thumbTipo?: string;
};

interface PacoteBackup {
  marcador: typeof MARCADOR;
  versao: number;
  geradoEm: string;
  perfil: Perfil | null;
  dados: {
    locais: Local[];
    secoes: SecaoLocal[];
    cronograma: Cronograma[];
    modeloChecklist: ModeloChecklist[];
    itens: ItemLocal[];
    evidencias: EvidenciaBackup[];
    sigilo: SigiloLocal[];
    desvios: DesvioLocal[];
    validacoes: Validacao[];
    layout: LayoutPadrao[];
    outbox: OutboxItem[];
    meta: MetaLocal[];
  };
}

export interface ResumoBackup {
  arquivo: string;
  bytes: number;
  secoes: number;
  itens: number;
  fotos: number;
  pendentes: number;
}

export interface ResumoAparelho {
  secoes: number;
  itens: number;
  fotos: number;
  pendentes: number;
}

// ---------------------------------------------------------------------------
// Conversão de binários (Blob <-> base64)
// ---------------------------------------------------------------------------

async function blobParaBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binario = '';
  const passo = 0x8000; // fatia para não estourar o limite de argumentos do apply
  for (let i = 0; i < bytes.length; i += passo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + passo));
  }
  return btoa(binario);
}

function base64ParaBlob(base64: string, tipo: string): Blob {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

function nomeDoArquivo(): string {
  const agora = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const data = `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
  const hora = `${p(agora.getHours())}${p(agora.getMinutes())}`;
  return `montaje-backup-${data}-${hora}.json`;
}

function baixarArquivo(nome: string, conteudo: Blob): void {
  const url = URL.createObjectURL(conteudo);
  const ancora = document.createElement('a');
  ancora.href = url;
  ancora.download = nome;
  ancora.rel = 'noopener';
  document.body.appendChild(ancora);
  ancora.click();
  ancora.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

/** Exporta todo o conteúdo local para um arquivo `.json` e dispara o download. */
export async function exportarBackup(): Promise<ResumoBackup> {
  const [
    locais,
    secoes,
    cronograma,
    modeloChecklist,
    itens,
    evidencias,
    sigilo,
    desvios,
    validacoes,
    layout,
    outbox,
    meta,
    perfil,
  ] = await Promise.all([
    db.locais.toArray(),
    db.secoes.toArray(),
    db.cronograma.toArray(),
    db.modeloChecklist.toArray(),
    db.itens.toArray(),
    db.evidencias.toArray(),
    db.sigilo.toArray(),
    db.desvios.toArray(),
    db.validacoes.toArray(),
    db.layout.toArray(),
    db.outbox.toArray(),
    db.meta.toArray(),
    db.perfil.toCollection().first(),
  ]);

  const evidenciasBackup: EvidenciaBackup[] = [];
  for (const evidencia of evidencias) {
    const { blob, thumbBlob, ...resto } = evidencia;
    evidenciasBackup.push({
      ...resto,
      blobBase64: blob ? await blobParaBase64(blob) : undefined,
      blobTipo: blob?.type,
      thumbBase64: thumbBlob ? await blobParaBase64(thumbBlob) : undefined,
      thumbTipo: thumbBlob?.type,
    });
  }

  const geradoEm = new Date().toISOString();
  const pacote: PacoteBackup = {
    marcador: MARCADOR,
    versao: VERSAO,
    geradoEm,
    perfil: perfil ?? null,
    dados: {
      locais,
      secoes,
      cronograma,
      modeloChecklist,
      itens,
      evidencias: evidenciasBackup,
      sigilo,
      desvios,
      validacoes,
      layout,
      outbox,
      meta,
    },
  };

  const conteudo = new Blob([JSON.stringify(pacote)], { type: 'application/json' });
  const arquivo = nomeDoArquivo();
  baixarArquivo(arquivo, conteudo);
  await db.meta.put({ chave: 'ultimo_backup', valor: geradoEm, atualizadoEm: Date.now() });

  return {
    arquivo,
    bytes: conteudo.size,
    secoes: secoes.length,
    itens: itens.length,
    fotos: evidencias.length,
    pendentes: outbox.filter((o) => o.estado !== 'enviado').length,
  };
}

/** Lê um arquivo de backup e substitui os dados locais pelo conteúdo dele. */
export async function restaurarBackup(arquivo: File): Promise<ResumoBackup> {
  const texto = await arquivo.text();

  let pacote: PacoteBackup;
  try {
    pacote = JSON.parse(texto) as PacoteBackup;
  } catch {
    throw new Error('O arquivo não é um backup válido.');
  }

  if (!pacote || pacote.marcador !== MARCADOR) {
    throw new Error('O arquivo não é um backup do MontaJE.');
  }
  if (pacote.versao !== VERSAO) {
    throw new Error(`Backup de versão ${pacote.versao} não é compatível com este app.`);
  }

  const dados = pacote.dados as unknown as Record<string, unknown> | undefined;
  if (!dados || typeof dados !== 'object') {
    throw new Error('O backup não contém dados.');
  }
  for (const campo of ['secoes', 'itens', 'evidencias', 'outbox']) {
    if (!Array.isArray(dados[campo])) {
      throw new Error(`Backup corrompido: campo "${campo}" ausente.`);
    }
  }
  const lista = <T,>(campo: string): T[] =>
    Array.isArray(dados[campo]) ? (dados[campo] as T[]) : [];

  const evidencias: EvidenciaLocal[] = lista<EvidenciaBackup>('evidencias').map((item) => {
    const { blobBase64, blobTipo, thumbBase64, thumbTipo, ...resto } = item;
    return {
      ...resto,
      blob: blobBase64 ? base64ParaBlob(blobBase64, blobTipo || 'image/jpeg') : undefined,
      thumbBlob: thumbBase64
        ? base64ParaBlob(thumbBase64, thumbTipo || 'image/jpeg')
        : undefined,
    };
  });

  await db.transaction(
    'rw',
    [
      db.locais,
      db.secoes,
      db.cronograma,
      db.modeloChecklist,
      db.itens,
      db.evidencias,
      db.sigilo,
      db.desvios,
      db.validacoes,
      db.layout,
      db.outbox,
      db.meta,
    ],
    async () => {
      // Não apaga o perfil: a sessão do aparelho continua valendo após restaurar.
      await Promise.all([
        db.locais.clear(),
        db.secoes.clear(),
        db.cronograma.clear(),
        db.modeloChecklist.clear(),
        db.itens.clear(),
        db.evidencias.clear(),
        db.sigilo.clear(),
        db.desvios.clear(),
        db.validacoes.clear(),
        db.layout.clear(),
        db.outbox.clear(),
        db.meta.clear(),
      ]);

      await db.locais.bulkPut(lista<Local>('locais'));
      await db.secoes.bulkPut(lista<SecaoLocal>('secoes'));
      await db.cronograma.bulkPut(lista<Cronograma>('cronograma'));
      await db.modeloChecklist.bulkPut(lista<ModeloChecklist>('modeloChecklist'));
      await db.itens.bulkPut(lista<ItemLocal>('itens'));
      await db.evidencias.bulkPut(evidencias);
      await db.sigilo.bulkPut(lista<SigiloLocal>('sigilo'));
      await db.desvios.bulkPut(lista<DesvioLocal>('desvios'));
      await db.validacoes.bulkPut(lista<Validacao>('validacoes'));
      await db.layout.bulkPut(lista<LayoutPadrao>('layout'));
      await db.outbox.bulkPut(lista<OutboxItem>('outbox'));
      await db.meta.bulkPut(lista<MetaLocal>('meta'));
    },
  );

  await db.meta.put({
    chave: 'ultimo_backup',
    valor: new Date().toISOString(),
    atualizadoEm: Date.now(),
  });

  const outbox = lista<OutboxItem>('outbox');
  return {
    arquivo: arquivo.name,
    bytes: arquivo.size,
    secoes: lista<SecaoLocal>('secoes').length,
    itens: lista<ItemLocal>('itens').length,
    fotos: evidencias.length,
    pendentes: outbox.filter((o) => o.estado !== 'enviado').length,
  };
}

/** Data/hora do último backup gravado no aparelho (ou null). */
export async function ultimoBackup(): Promise<string | null> {
  const meta = await db.meta.get('ultimo_backup');
  return (meta?.valor as string) ?? null;
}

/** Contagem rápida do que existe no aparelho, para orientar o backup. */
export async function resumoDoAparelho(): Promise<ResumoAparelho> {
  const [secoes, itens, fotos, pendentes] = await Promise.all([
    db.secoes.count(),
    db.itens.count(),
    db.evidencias.count(),
    db.outbox.where('estado').anyOf('pendente_envio', 'enviando', 'erro').count(),
  ]);
  return { secoes, itens, fotos, pendentes };
}
