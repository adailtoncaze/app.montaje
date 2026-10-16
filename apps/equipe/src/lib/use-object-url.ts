import { useEffect, useState } from 'react';

/**
 * Cria uma URL de objeto para um Blob guardado no IndexedDB e a revoga ao trocar/desmontar.
 * Usado para exibir as fotos e miniaturas sem precisar de servidor.
 */
export function useObjectUrl(blob?: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const criada = URL.createObjectURL(blob);
    setUrl(criada);
    return () => URL.revokeObjectURL(criada);
  }, [blob]);

  return url;
}
