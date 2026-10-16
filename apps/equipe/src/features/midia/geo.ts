/** APP-13 — geolocalizacao por foto (best-effort, nao bloqueia a captura). */

export interface Coordenada {
  latitude: number;
  longitude: number;
}

/**
 * Tenta obter a posicao atual em ate 8s. Se o GPS estiver desligado, a permissao
 * for negada ou o aparelho estiver sem sinal, retorna `null` — a foto ainda e salva.
 */
export async function obterLocalizacao(): Promise<Coordenada | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return null;

  return new Promise<Coordenada | null>((resolve) => {
    let resolvido = false;
    const terminar = (valor: Coordenada | null) => {
      if (resolvido) return;
      resolvido = true;
      resolve(valor);
    };

    const temporizador = setTimeout(() => terminar(null), 8000);

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        clearTimeout(temporizador);
        terminar({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        });
      },
      () => {
        clearTimeout(temporizador);
        terminar(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}
