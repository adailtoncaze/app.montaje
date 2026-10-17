/** Utilitários de data para o cronograma (sempre no fuso local). */

/** Data de hoje no formato `YYYY-MM-DD`, sem deslocar pelo fuso. */
export function hojeLocal(): string {
  const agora = new Date();
  const deslocamento = agora.getTimezoneOffset() * 60_000;
  return new Date(agora.getTime() - deslocamento).toISOString().slice(0, 10);
}

/** Interpreta `YYYY-MM-DD` como data local (meia-noite). */
export function dataLocal(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1);
}

const FORMATO_LONGO = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const FORMATO_CURTO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** "sábado, 17 de outubro" (capitalizado). */
export function formatarDiaLongo(iso: string): string {
  const texto = FORMATO_LONGO.format(dataLocal(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "17/10/2026". */
export function formatarDataCurta(iso: string): string {
  return FORMATO_CURTO.format(dataLocal(iso));
}

/** Dia relativo à data de hoje. */
export function diasAteHoje(iso: string): number {
  const dia = dataLocal(iso).getTime();
  const hoje = dataLocal(hojeLocal()).getTime();
  return Math.round((dia - hoje) / 86_400_000);
}
