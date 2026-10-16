/**
 * APP-12 — pipeline de imagem das evidencias.
 *
 * Foto principal: no maximo 1280px no maior lado, JPEG ~70% e alvo de ate 250KB.
 * Miniatura: 320px, usada nas listas e na previa rapida.
 *
 * Por que nao usamos mais o `browser-image-compression`:
 * decodificar a foto em tamanho original (12MP+) estoura a memoria de celulares
 * modestos — no iOS a lib ainda passa por `FileReader`/dataURL, o que agrava.
 * Aqui pedimos ao proprio navegador para decodificar JA reduzido
 * (`createImageBitmap` com `resizeWidth`/`resizeHeight`), que e o caminho de menor
 * consumo. Se ainda assim falhar, guardamos o arquivo original: a evidencia nunca
 * pode ser perdida.
 */

export const FOTO_LADO_MAX = 1280;
export const FOTO_QUALIDADE = 0.7;
export const FOTO_BYTES_MAX = 250 * 1024;
export const MINIATURA_LADO_MAX = 320;
/** Limite de tempo para a decodificacao — acima disso seguimos com o original. */
export const COMPRESSAO_TIMEOUT_MS = 25_000;

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

/**
 * Corrida contra o relogio: se a promessa nao resolver em `ms`, rejeita para que o
 * chamador possa cair no plano B (guardar o original) em vez de travar a tela.
 */
function comLimite<T>(promessa: Promise<T>, ms: number, rotulo: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(() => reject(new Error(`${rotulo} excedeu ${ms}ms`)), ms);
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

/** Maior lado reduzido para `ladoMax`, preservando a proporcao (sem ampliar). */
function alvoPorMaiorLado(largura: number, altura: number, ladoMax: number) {
  const maior = Math.max(largura, altura);
  const escala = maior > ladoMax ? ladoMax / maior : 1;
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}

/**
 * Decodifica a imagem ja no tamanho final. O `resize` no `createImageBitmap` faz o
 * navegador diminuir durante a decodificacao — e o que evita o "memoria insuficiente"
 * com fotos de camera (12MP+).
 */
async function decodificarReduzido(origem: Blob, ladoMax: number): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('Decodificacao de imagem nao suportada neste navegador');
  }

  // Primeira tentativa: limita a largura (cobre fotos deitadas, o caso comum).
  let bitmap = await createImageBitmap(origem, {
    resizeWidth: ladoMax,
    resizeQuality: 'high',
  });

  // Se o maior lado ainda passa do limite, a foto era retrato: refaz pelo maior lado.
  if (Math.max(bitmap.width, bitmap.height) > ladoMax) {
    const { largura, altura } = alvoPorMaiorLado(bitmap.width, bitmap.height, ladoMax);
    bitmap.close();
    bitmap = await createImageBitmap(origem, {
      resizeWidth: largura,
      resizeHeight: altura,
      resizeQuality: 'high',
    });
  }

  return bitmap;
}

/** Desenha o bitmap em um canvas e exporta como JPEG na qualidade pedida. */
async function bitmapParaJpeg(bitmap: ImageBitmap, qualidade: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Canvas 2D indisponivel');

  // JPEG nao tem canal alfa: pinta o fundo de branco para nao sair preto.
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolver) =>
    canvas.toBlob(resolver, 'image/jpeg', qualidade),
  );

  // Libera a memoria do canvas o quanto antes.
  canvas.width = 0;
  canvas.height = 0;

  if (!blob) throw new Error('Falha ao gerar o JPEG');
  return blob;
}

/** Reencoda a partir do bitmap reduzindo a qualidade ate caber no alvo de bytes. */
async function jpegNoAlvo(bitmap: ImageBitmap, bytesMax: number): Promise<Blob> {
  let qualidade = FOTO_QUALIDADE;
  let blob = await bitmapParaJpeg(bitmap, qualidade);
  while (blob.size > bytesMax && qualidade > 0.4) {
    qualidade = Math.max(0.4, qualidade - 0.12);
    blob = await bitmapParaJpeg(bitmap, qualidade);
  }
  return blob;
}

/**
 * Executa o pipeline completo: compressao + miniatura + dimensoes.
 *
 * A miniatura e gerada a partir da imagem ja reduzida (menos memoria no celular).
 * Cada etapa tem plano B: se a compressao falhar/travar usamos o original; se a
 * miniatura falhar usamos a propria imagem principal.
 */
export async function processarFoto(origem: Blob): Promise<FotoProcessada> {
  let blob: Blob;
  let largura = 0;
  let altura = 0;

  try {
    const bitmap = await comLimite(
      decodificarReduzido(origem, FOTO_LADO_MAX),
      COMPRESSAO_TIMEOUT_MS,
      'Compressao',
    );
    largura = bitmap.width;
    altura = bitmap.height;
    try {
      blob = await jpegNoAlvo(bitmap, FOTO_BYTES_MAX);
    } finally {
      bitmap.close();
    }
  } catch (causa) {
    console.warn('[compressao] falha ao comprimir; guardando o arquivo original.', causa);
    blob = origem;
  }

  let thumb: Blob;
  try {
    const miniatura = await comLimite(
      decodificarReduzido(blob, MINIATURA_LADO_MAX),
      COMPRESSAO_TIMEOUT_MS,
      'Miniatura',
    );
    try {
      thumb = await bitmapParaJpeg(miniatura, FOTO_QUALIDADE);
    } finally {
      miniatura.close();
    }
  } catch (causa) {
    console.warn('[compressao] falha ao gerar miniatura; usando a imagem principal.', causa);
    thumb = blob;
  }

  return { blob, thumb, bytes: blob.size, largura, altura };
}
