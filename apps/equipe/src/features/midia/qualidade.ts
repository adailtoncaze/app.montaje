/**
 * APP-15 — checagem de qualidade da evidencia.
 *
 * Antes de gravar, a foto e analisada em uma versao reduzida (256px) para
 * detectar os problemas que mais inutilizam a evidencia em campo: foto escura,
 * estourada (clara demais) ou borrada/fora de foco.
 *
 * A analise NUNCA bloqueia: em qualquer falha (navegador sem suporte, canvas
 * indisponivel, timeout) ela devolve `ok`, deixando o fluxo normal seguir. E os
 * limiares sao conservadores de proposito — preferimos deixar passar uma foto
 * duvidosa a incomodar com falso positivo no meio da montagem.
 */

/** Maior lado da imagem reduzida usada na analise. */
const LADO_ANALISE = 256;
/** Abaixo deste brilho medio (0-255) a foto e considerada escura. */
export const LIMIAR_ESCURO = 42;
/** Acima desta fracao de pixels totalmente estourados a foto e clara demais. */
export const LIMIAR_ESTOURO = 0.45;
/** Abaixo desta variancia do laplaciano a foto e considerada borrada. */
export const LIMIAR_NITIDEZ = 30;
/** Limite de tempo da analise — acima disso seguimos sem checar. */
const TIMEOUT_MS = 8_000;

export type ProblemaFoto = 'escura' | 'clara' | 'borrada';

export interface QualidadeFoto {
  /** `true` quando nenhum problema foi detectado (ou a analise foi ignorada). */
  ok: boolean;
  problemas: ProblemaFoto[];
  /** Brilho medio (0-255). `-1` quando a analise nao rodou. */
  brilho: number;
  /** Variancia do laplaciano (nitidez). `-1` quando a analise nao rodou. */
  nitidez: number;
}

/** Texto de cada problema, para compor a mensagem exibida na tela. */
export const ROTULO_PROBLEMA: Record<ProblemaFoto, string> = {
  escura: 'muito escura',
  clara: 'clara demais (partes estouradas)',
  borrada: 'borrada ou fora de foco',
};

const NEUTRO: QualidadeFoto = { ok: true, problemas: [], brilho: -1, nitidez: -1 };

/** Corrida contra o relogio — a analise nao pode travar a tela. */
function comLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(() => reject(new Error('analise excedeu o tempo')), ms);
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

/** Decodifica a imagem ja reduzida ao maior lado da analise. */
async function decodificarReduzido(origem: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('decodificacao de imagem nao suportada');
  }
  let bitmap = await createImageBitmap(origem, {
    resizeWidth: LADO_ANALISE,
    resizeQuality: 'low',
  });
  if (Math.max(bitmap.width, bitmap.height) > LADO_ANALISE) {
    const maior = Math.max(bitmap.width, bitmap.height);
    const escala = LADO_ANALISE / maior;
    const largura = Math.max(1, Math.round(bitmap.width * escala));
    const altura = Math.max(1, Math.round(bitmap.height * escala));
    bitmap.close();
    bitmap = await createImageBitmap(origem, {
      resizeWidth: largura,
      resizeHeight: altura,
      resizeQuality: 'low',
    });
  }
  return bitmap;
}

/**
 * Mede brilho, estouro e nitidez de um bitmap ja reduzido.
 *
 * Nitidez = variancia do laplaciano sobre a luminancia (metrica classica de
 * foco): quanto mais baixa, mais borrada a imagem.
 */
function analisarBitmap(bitmap: ImageBitmap): QualidadeFoto {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const contexto = canvas.getContext('2d', { willReadFrequently: true });
  if (!contexto) return NEUTRO;

  contexto.drawImage(bitmap, 0, 0);
  const { width, height } = canvas;
  const dados = contexto.getImageData(0, 0, width, height).data;

  // Libera a memoria do canvas antes dos calculos.
  canvas.width = 0;
  canvas.height = 0;

  if (width < 3 || height < 3) return NEUTRO;

  const total = width * height;
  const cinza = new Float32Array(total);
  let somaBrilho = 0;
  let estourados = 0;

  for (let i = 0; i < total; i += 1) {
    const p = i * 4;
    const r = dados[p];
    const g = dados[p + 1];
    const b = dados[p + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    cinza[i] = luma;
    somaBrilho += luma;
    if (r >= 250 && g >= 250 && b >= 250) estourados += 1;
  }

  const brilho = somaBrilho / total;
  const fracaoEstouro = estourados / total;

  let somaLaplace = 0;
  let somaLaplace2 = 0;
  let contados = 0;
  for (let y = 1; y < height - 1; y += 1) {
    const linha = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const i = linha + x;
      const laplace =
        4 * cinza[i] - cinza[i - 1] - cinza[i + 1] - cinza[i - width] - cinza[i + width];
      somaLaplace += laplace;
      somaLaplace2 += laplace * laplace;
      contados += 1;
    }
  }

  const mediaLaplace = contados ? somaLaplace / contados : 0;
  const nitidez = contados ? somaLaplace2 / contados - mediaLaplace * mediaLaplace : 0;

  // Reporta so o problema mais evidente, para a mensagem nao virar um combo.
  const problemas: ProblemaFoto[] = [];
  if (brilho < LIMIAR_ESCURO) {
    problemas.push('escura');
  } else if (fracaoEstouro > LIMIAR_ESTOURO) {
    problemas.push('clara');
  } else if (nitidez < LIMIAR_NITIDEZ) {
    problemas.push('borrada');
  }

  return { ok: problemas.length === 0, problemas, brilho, nitidez };
}

/**
 * Avalia a qualidade da foto. Sempre resolve (nunca lanca): quando nao e
 * possivel analisar, devolve `ok` para nao bloquear o salvamento.
 */
export async function avaliarQualidade(origem: Blob): Promise<QualidadeFoto> {
  try {
    const bitmap = await comLimite(decodificarReduzido(origem), TIMEOUT_MS);
    try {
      return analisarBitmap(bitmap);
    } finally {
      bitmap.close();
    }
  } catch (causa) {
    console.warn('[qualidade] analise ignorada.', causa);
    return NEUTRO;
  }
}
