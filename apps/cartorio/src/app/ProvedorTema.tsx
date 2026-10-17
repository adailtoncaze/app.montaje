import { useEffect, type ReactNode } from 'react';
import { aplicarTema, useTemaStore } from '@/lib/tema';

export function ProvedorTema({ children }: { children: ReactNode }) {
  const tema = useTemaStore((s) => s.tema);

  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  useEffect(() => {
    if (tema !== 'sistema') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const ouvirMudanca = () => aplicarTema('sistema');
    media.addEventListener('change', ouvirMudanca);
    return () => media.removeEventListener('change', ouvirMudanca);
  }, [tema]);

  return <>{children}</>;
}
