import imageCompression from 'browser-image-compression';

/**
 * APP-12 — pipeline de imagem das evidencias.
 *
 * Foto principal: no maximo 1280px no maior lado, JPEG ~70% e alvo de ate 250KB.
 * Miniatura: 320px, usada nas listas e na previa rapida.
 *
 * A recomprenssao tambem normaliza o formato (JPEG) e descarta os metadados EXIF,
 * reduzindo o tamanho e expondo menos informacao do aparelho.
 */

export const FOTO_LADO_MAX = 1280;
export const FOTO_QUALIDADE = 0.7;
export const FOTO_BYTES_MAX = 250 * 1024;
export const MINIATURA_LADO_MAX = 320;

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

/** Executa o pipeline completo: compressao + miniatura + dimensoes. */
export async function processarFoto(origem: Blob): Promise<FotoProcessada> {
  const [blob, thumb] = await Promise.all([comprimirFoto(origem), gerarMiniatura(origem)]);
  const { largura, altura } = await medir(blob);
  return { blob, thumb, bytes: blob.size, largura, altura };
}
