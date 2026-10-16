import imageCompression from 'browser-image-compression';

/**
 * APP-12 — pipeline de imagem das evidencias.
 *
 * Foto principal: no maximo 1280px no maior lado, JPEG ~70% e alvo de ate 250KB.
 * Miniatura: 320px, usada nas listas e na previa rapida.
 *
 * A recomprenssao tambem normaliza o formato (JPEG) e descarta os metadados EXIF,
 * reduzindo o tamanho e expondo menos informacao do aparelho.
 *
 * Regra de ouro: nunca perder a evidencia. Se a compressao falhar ou demorar demais
 * (aparelho antigo, formato exotico, pouca memoria), guardamos a foto original.
 */

export const FOTO_LADO_MAX = 1280;
export const FOTO_QUALIDADE = 0.7;
export const FOTO_BYTES_MAX = 250 * 1024;
export const MINIATURA_LADO_MAX = 320;
/** Limite de tempo para a compressao — acima disso seguimos com o original. */
export const COMPRESSAO_TIMEOUT_MS = 25_000;

/**
 * Corrida contra o relogio: se a promessa nao resolver em `ms`, rejeita para que o
 * chamador possa cair no plano B (guardar o original) em vez de travar a tela.
 */
function comLimite<T>(promessa: Promise<T>, ms: number, rotulo: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(
      () => reject(new Error(`${rotulo} excedeu ${ms}ms`)),
      ms,
    );
    promessa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(temporizador);
        reject(erro);
      },
    );
  });
}

export interface FotoProcessada {
  /** Imagem principal comprimida (JPEG). */
  blob: Blob;
  /** Miniatura para listas e previa rapida (JPEG). */
  thumb: Blob;
  /** Tamanho, em bytes, da imagem principal. */
  bytes: number;
  largura: number;
  altura: number;
}

function comoArquivo(origem: Blob, nome: string): File {
  if (origem instanceof File) return origem;
  return new File([origem], nome, { type: origem.type || 'image/jpeg' });
}

/** Comprime o original para ate 1280px, JPEG ~70% e ~250KB. */
export async function comprimirFoto(origem: Blob): Promise<File> {
  return imageCompression(comoArquivo(origem, 'foto.jpg'), {
    maxWidthOrHeight: FOTO_LADO_MAX,
    initialQuality: FOTO_QUALIDADE,
    maxSizeMB: FOTO_BYTES_MAX / (1024 * 1024),
    fileType: 'image/jpeg',
    useWebWorker: false,
    maxIteration: 12,
  });
}

/** Gera a miniatura de 320px. */
export async function gerarMiniatura(origem: Blob): Promise<File> {
  return imageCompression(comoArquivo(origem, 'miniatura.jpg'), {
    maxWidthOrHeight: MINIATURA_LADO_MAX,
    initialQuality: FOTO_QUALIDADE,
    fileType: 'image/jpeg',
    useWebWorker: false,
  });
}

async function medir(blob: Blob): Promise<{ largura: number; altura: number }> {
  try {
    const bitmap = await createImageBitmap(blob);
    const dimensoes = { largura: bitmap.width, altura: bitmap.height };
    bitmap.close();
    return dimensoes;
  } catch {
    return { largura: 0, altura: 0 };
  }
}

/**
 * Executa o pipeline completo: compressao + miniatura + dimensoes.
 *
 * A miniatura e gerada a partir da imagem ja reduzida (menos memoria no celular) e
 * cada etapa tem plano B: se a compressao falhar/travar usamos o original; se a
 * miniatura falhar usamos a propria imagem principal.
 */
export async function processarFoto(origem: Blob): Promise<FotoProcessada> {
  let blob: Blob;
  try {
    blob = await comLimite(comprimirFoto(origem), COMPRESSAO_TIMEOUT_MS, 'Compressao');
  } catch (causa) {
    console.warn('[compressao] falha ao comprimir; guardando o arquivo original.', causa);
    blob = origem;
  }

  let thumb: Blob;
  try {
    thumb = await comLimite(gerarMiniatura(blob), COMPRESSAO_TIMEOUT_MS, 'Miniatura');
  } catch (causa) {
    console.warn('[compressao] falha ao gerar miniatura; usando a imagem principal.', causa);
    thumb = blob;
  }

  const { largura, altura } = await medir(blob);
  return { blob, thumb, bytes: blob.size, largura, altura };
}
