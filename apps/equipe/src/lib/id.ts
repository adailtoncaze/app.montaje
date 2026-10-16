/**
 * Gera um UUID v4 para registros criados no aparelho (chave de idempotencia do sync).
 *
 * Usa `crypto.randomUUID()` quando disponivel (contexto seguro: HTTPS ou localhost) e
 * cai para um gerador manual em HTTP na LAN, onde essa API nao existe.
 */
export function novoId(): string {
  const cripto = globalThis.crypto;
  if (cripto && typeof cripto.randomUUID === 'function') {
    return cripto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (cripto && typeof cripto.getRandomValues === 'function') {
    cripto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  // Ajusta os bits de versao (4) e variante (10xx).
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
