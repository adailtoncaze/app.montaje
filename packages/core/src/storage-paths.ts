/**
 * Convencao unica de caminho no bucket privado 'evidencias'.
 * Path: {secao_id}/{item_id}/{timestamp}.jpg  e  .../thumb.jpg
 *
 * A primeira pasta e o UUID da secao para permitir RLS no Storage.
 */

export function caminhoFoto(secaoId: string, itemId: string, ts: number): string {
  return `${secaoId}/${itemId}/${ts}.jpg`;
}

export function caminhoThumb(secaoId: string, itemId: string, ts: number): string {
  return `${secaoId}/${itemId}/${ts}.thumb.jpg`;
}

/** Extrai o secao_id (primeira pasta) de um caminho do bucket. */
export function secaoDoCaminho(path: string): string | null {
  const partes = path.split('/');
  if (partes.length < 2) return null;
  return partes[0] ?? null;
}
