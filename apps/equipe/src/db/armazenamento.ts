/**
 * APP-27 — armazenamento persistente.
 *
 * Em campo o IndexedDB é a única cópia do checklist, das respostas e das fotos
 * que ainda não subiram. Por padrão o navegador pode descartar esse banco sob
 * pressão de espaço; `navigator.storage.persist()` pede que os dados sejam
 * preservados até que o usuário os apague.
 */

export interface EstadoArmazenamento {
  /** O navegador expõe a Storage API (persistência/estimativa). */
  suportado: boolean;
  /** Os dados já estão protegidos contra descarte automático. */
  persistido: boolean;
  /** Espaço ocupado pelo app, em bytes (null quando indisponível). */
  usoBytes: number | null;
  /** Cota aproximada do navegador, em bytes (null quando indisponível). */
  cotaBytes: number | null;
}

function gerenciador(): StorageManager | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.storage ?? null;
}

/**
 * Pede ao navegador que não descarte os dados locais. É idempotente e segura de
 * chamar em vários pontos (abertura do app, download do dia, Ajustes): se já
 * estiver protegido, apenas confirma.
 */
export async function solicitarArmazenamentoPersistente(): Promise<boolean> {
  const storage = gerenciador();
  if (!storage?.persist) return false;
  try {
    if (storage.persisted && (await storage.persisted())) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

/** Lê o estado atual da persistência e a estimativa de uso/cota. */
export async function estadoDoArmazenamento(): Promise<EstadoArmazenamento> {
  const storage = gerenciador();
  if (!storage) {
    return { suportado: false, persistido: false, usoBytes: null, cotaBytes: null };
  }

  const persistido = storage.persisted
    ? await storage.persisted().catch(() => false)
    : false;

  let usoBytes: number | null = null;
  let cotaBytes: number | null = null;
  if (storage.estimate) {
    try {
      const { usage, quota } = await storage.estimate();
      usoBytes = usage ?? null;
      cotaBytes = quota ?? null;
    } catch {
      // Estimativa indisponível em alguns navegadores — segue sem os números.
    }
  }

  return { suportado: true, persistido, usoBytes, cotaBytes };
}

/** Formata bytes para leitura humana (ex.: "12,4 MB"). */
export function formatarBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const unidades = ['KB', 'MB', 'GB', 'TB'];
  let valor = bytes / 1024;
  let indice = 0;
  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${unidades[indice]}`;
}
