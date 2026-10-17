import { useCallback, useEffect, useState } from 'react';
import { sincronizarTudo, type ResultadoSync } from './engine';

/**
 * APP-24 — dispara o envio automaticamente:
 *  - ao abrir o app (com sessão);
 *  - sempre que o aparelho volta a ficar online;
 *  - periodicamente, enquanto o app estiver aberto.
 *
 * A fila (outbox) nunca perde dados: falhas apenas ficam marcadas para novo envio.
 */
const INTERVALO_MS = 60_000;

export function useSyncEngine() {
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimo, setUltimo] = useState<ResultadoSync | null>(null);

  const sincronizarAgora = useCallback(async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizarTudo();
      setUltimo(resultado);
      return resultado;
    } finally {
      setSincronizando(false);
    }
  }, []);

  useEffect(() => {
    void sincronizarAgora();

    const aoVoltarOnline = () => void sincronizarAgora();
    window.addEventListener('online', aoVoltarOnline);
    const timer = window.setInterval(aoVoltarOnline, INTERVALO_MS);
    return () => {
      window.removeEventListener('online', aoVoltarOnline);
      window.clearInterval(timer);
    };
  }, [sincronizarAgora]);

  return { sincronizando, ultimo, sincronizarAgora };
}
