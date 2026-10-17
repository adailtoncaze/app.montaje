import { useCallback, useEffect, useState } from 'react';
import { sincronizarTudo, type ResultadoSync } from './engine';

/**
 * APP-24 — dispara o envio automaticamente:
 *  - ao abrir o app (com sessão);
 *  - sempre que o aparelho volta a ficar online;
 *  - quando o app volta ao primeiro plano (troca de aba/janela);
 *  - periodicamente, enquanto o app estiver aberto.
 *
 * A fila (outbox) nunca perde dados: falhas apenas ficam marcadas para novo envio.
 * O mesmo ciclo também puxa do cartório as aprovações/devoluções (Etapa 2 libera
 * e correções aparecem sem exigir "Baixar dados do dia").
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
    const aoFocar = () => {
      if (document.visibilityState === 'visible') void sincronizarAgora();
    };

    window.addEventListener('online', aoVoltarOnline);
    document.addEventListener('visibilitychange', aoFocar);
    window.addEventListener('focus', aoFocar);
    const timer = window.setInterval(aoVoltarOnline, INTERVALO_MS);
    return () => {
      window.removeEventListener('online', aoVoltarOnline);
      document.removeEventListener('visibilitychange', aoFocar);
      window.removeEventListener('focus', aoFocar);
      window.clearInterval(timer);
    };
  }, [sincronizarAgora]);

  return { sincronizando, ultimo, sincronizarAgora };
}
